/**
 * SomaSync — Weekly Intelligence Card
 * Fetches weekly learning recommendations from AI, with graceful local fallback.
 */

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Sparkles, Loader2, Calendar, Check, AlertCircle, RefreshCw } from "lucide-react";
import { fetchWeeklySummary, fetchAiStudyPlan, saveTimetableEvents } from "../services/api";
import MarkdownRenderer from "./MarkdownRenderer";

const SUMMARY_CACHE_KEY = "somasync_weekly_summary_cache";

/**
 * Generate a local study intelligence summary from course and event data
 * when the AI API is unavailable. This ensures the card always shows useful info.
 */
function generateLocalSummary(courses, events) {
  const courseCount = courses?.length || 0;
  const eventCount = events?.length || 0;
  const now = Date.now();

  // Find courses with low progress
  const lowProgress = (courses || [])
    .filter((c) => (c.progress || 0) < 50 && !c.fullname?.toLowerCase().includes("survey"))
    .sort((a, b) => (a.progress || 0) - (b.progress || 0));

  // Find urgent deadlines
  const urgentEvents = (events || []).filter((e) => {
    const diff = (e.timesort * 1000 - now) / (1000 * 60 * 60);
    return diff > 0 && diff < 72;
  });

  const avgProgress = courseCount > 0
    ? Math.round(courses.reduce((sum, c) => sum + (c.progress || 0), 0) / courseCount)
    : 0;

  let md = `### 📊 Weekly Study Overview\n\n`;
  md += `You're managing **${courseCount} courses** with **${eventCount} upcoming deadlines**.\n\n`;

  if (avgProgress > 0) {
    md += `Your average course progress is **${avgProgress}%**`;
    if (avgProgress >= 70) md += ` — great work, keep it up! 🎯\n\n`;
    else if (avgProgress >= 40) md += ` — solid progress, keep pushing! 💪\n\n`;
    else md += ` — there's room to improve, focus on catching up this week. 📈\n\n`;
  }

  if (urgentEvents.length > 0) {
    md += `#### ⚡ Priority Deadlines\n`;
    urgentEvents.slice(0, 3).forEach((e) => {
      const hrs = Math.round((e.timesort * 1000 - now) / (1000 * 60 * 60));
      md += `- **${e.name?.substring(0, 60)}** — ${hrs < 24 ? `${hrs}h left` : `${Math.round(hrs / 24)} days left`}\n`;
    });
    md += `\n`;
  }

  if (lowProgress.length > 0) {
    md += `#### 💡 Focus Areas\n`;
    lowProgress.slice(0, 3).forEach((c) => {
      const name = c.shortname?.split("M26")?.[0] || c.fullname?.substring(0, 40);
      md += `- **${name}** — ${Math.round(c.progress || 0)}% progress\n`;
    });
    md += `\n`;
  }

  md += `> Use **Flashcards** for active recall and the **Study Planner** to organize your week.`;

  return md;
}

export default function WeeklyIntelligenceCard({ courses, events, onOpenTab }) {
  const [summary, setSummary] = useState("");
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [genSuccess, setGenSuccess] = useState(false);
  const [isLocalFallback, setIsLocalFallback] = useState(false);

  // Load summary from cache or fetch from API, with local fallback
  useEffect(() => {
    if (!courses || courses.length === 0) return;

    const cached = sessionStorage.getItem(SUMMARY_CACHE_KEY);
    if (cached) {
      setSummary(cached);
      return;
    }

    const loadSummary = async () => {
      setLoading(true);
      try {
        const cleanCourses = courses.map((c) => ({
          id: c.id,
          fullname: c.fullname,
          shortname: c.shortname,
          progress: c.progress,
        }));
        const cleanEvents = (events || []).map((e) => ({
          id: e.id,
          name: e.name,
          timesort: e.timesort,
        }));

        const res = await fetchWeeklySummary(cleanCourses, cleanEvents);
        setSummary(res.summary);
        setIsLocalFallback(false);
        sessionStorage.setItem(SUMMARY_CACHE_KEY, res.summary);
      } catch (err) {
        // Gracefully fallback to local summary
        console.warn("[WeeklyIntelligence] API unavailable, using local summary:", err.message);
        const localSummary = generateLocalSummary(courses, events);
        setSummary(localSummary);
        setIsLocalFallback(true);
      } finally {
        setLoading(false);
      }
    };

    loadSummary();
  }, [courses, events]);

  const handleRetry = async () => {
    setLoading(true);
    setIsLocalFallback(false);
    sessionStorage.removeItem(SUMMARY_CACHE_KEY);
    try {
      const cleanCourses = courses.map((c) => ({
        id: c.id, fullname: c.fullname, shortname: c.shortname, progress: c.progress,
      }));
      const cleanEvents = (events || []).map((e) => ({
        id: e.id, name: e.name, timesort: e.timesort,
      }));
      const res = await fetchWeeklySummary(cleanCourses, cleanEvents);
      setSummary(res.summary);
      setIsLocalFallback(false);
      sessionStorage.setItem(SUMMARY_CACHE_KEY, res.summary);
    } catch {
      const localSummary = generateLocalSummary(courses, events);
      setSummary(localSummary);
      setIsLocalFallback(true);
    } finally {
      setLoading(false);
    }
  };

  const handleGeneratePlan = async () => {
    setGenerating(true);
    setGenSuccess(false);
    try {
      const cleanCourses = courses.map((c) => ({
        id: c.id, fullname: c.fullname, shortname: c.shortname, progress: c.progress,
      }));
      const cleanEvents = (events || []).map((e) => ({
        id: e.id, name: e.name, timesort: e.timesort,
      }));

      const res = await fetchAiStudyPlan(cleanCourses, cleanEvents);
      if (res && res.events) {
        localStorage.setItem("somasync_study_planner", JSON.stringify(res.events));
        try {
          await saveTimetableEvents(res.events);
        } catch (syncErr) {
          console.warn("[WeeklyIntelligence] Failed to sync generated plan to backend:", syncErr);
        }
        setGenSuccess(true);
        setTimeout(() => {
          if (onOpenTab) onOpenTab("timetable");
        }, 1500);
      }
    } catch (err) {
      console.warn("[WeeklyIntelligence] Study plan generation failed:", err.message);
      // Still navigate to timetable with existing events
      if (onOpenTab) onOpenTab("timetable");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="card p-5 relative overflow-hidden border border-[var(--color-border-subtle)]">
      {/* Glow background */}
      <div
        className="absolute top-0 right-0 w-48 h-48 pointer-events-none opacity-20"
        style={{
          background: "radial-gradient(circle, rgba(99, 102, 241, 0.12) 0%, transparent 70%)",
          filter: "blur(30px)",
        }}
      />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 relative z-10">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[rgba(99,102,241,0.08)] flex items-center justify-center text-[var(--color-primary-light)]">
            <Sparkles size={16} />
          </div>
          <div>
            <h3 className="text-xs font-bold text-[var(--color-text-primary)]">
              Study Intelligence
              {isLocalFallback && (
                <span className="ml-2 text-[9px] font-medium text-[var(--color-text-muted)] normal-case">
                  (Offline)
                </span>
              )}
            </h3>
            <p className="text-[10px] text-[var(--color-text-muted)] mt-0.5">
              Personalized insights based on your Moodle activity
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {isLocalFallback && (
            <button
              onClick={handleRetry}
              disabled={loading}
              className="flex items-center gap-1 px-3 py-2 rounded-xl text-[10px] font-semibold border border-[var(--color-border-subtle)] text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] transition-all cursor-pointer disabled:opacity-30"
            >
              <RefreshCw size={11} className={loading ? "animate-spin" : ""} />
              Retry AI
            </button>
          )}
          <button
            onClick={handleGeneratePlan}
            disabled={generating || !courses || courses.length === 0}
            className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed hover:opacity-90"
            style={{ background: "linear-gradient(135deg, #6366F1, #818CF8)" }}
          >
            {generating ? (
              <Loader2 size={13} className="animate-spin" />
            ) : genSuccess ? (
              <Check size={13} />
            ) : (
              <Calendar size={13} />
            )}
            {generating
              ? "Scheduling..."
              : genSuccess
              ? "Plan Generated!"
              : "Generate Study Plan"}
          </button>
        </div>
      </div>

      <div className="relative z-10">
        {loading ? (
          <div className="space-y-2 py-2">
            <div className="h-3 w-3/4 skeleton rounded" />
            <div className="h-3 w-1/2 skeleton rounded" />
            <div className="h-3 w-5/6 skeleton rounded" />
          </div>
        ) : (
          <div className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
            <MarkdownRenderer content={summary} />
          </div>
        )}
      </div>
    </div>
  );
}
