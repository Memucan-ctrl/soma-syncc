/**
 * SomaSync — Weekly Intelligence Card
 * Fetches weekly learning recommendations from AI and allows generating study planner events.
 */

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Loader2, Calendar, Check, AlertCircle } from "lucide-react";
import { fetchWeeklySummary, fetchAiStudyPlan } from "../services/api";
import MarkdownRenderer from "./MarkdownRenderer";

const SUMMARY_CACHE_KEY = "somasync_weekly_summary_cache";

export default function WeeklyIntelligenceCard({ courses, events, onOpenTab }) {
  const [summary, setSummary] = useState("");
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [genSuccess, setGenSuccess] = useState(false);
  const [error, setError] = useState(null);

  // Load summary from cache or fetch from API
  useEffect(() => {
    if (!courses || courses.length === 0) return;

    const cached = sessionStorage.getItem(SUMMARY_CACHE_KEY);
    if (cached) {
      setSummary(cached);
      return;
    }

    const loadSummary = async () => {
      setLoading(true);
      setError(null);
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
        sessionStorage.setItem(SUMMARY_CACHE_KEY, res.summary);
      } catch (err) {
        setError("Could not load study recommendations.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadSummary();
  }, [courses, events]);

  const handleGeneratePlan = async () => {
    setGenerating(true);
    setGenSuccess(false);
    setError(null);
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

      const res = await fetchAiStudyPlan(cleanCourses, cleanEvents);
      if (res && res.events) {
        localStorage.setItem("somasync_study_planner", JSON.stringify(res.events));
        setGenSuccess(true);
        setTimeout(() => {
          if (onOpenTab) onOpenTab("timetable");
        }, 1500);
      }
    } catch (err) {
      setError("Failed to generate study plan.");
      console.error(err);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="card p-5 relative overflow-hidden bg-[rgba(17,21,36,0.4)] border border-[var(--color-border-subtle)]">
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
            <h3 className="text-xs font-bold text-[var(--color-text-primary)]">AI Study Intelligence</h3>
            <p className="text-[10px] text-[var(--color-text-muted)] mt-0.5">
              Personalized strategy and planner generation based on Moodle activity
            </p>
          </div>
        </div>

        <button
          onClick={handleGeneratePlan}
          disabled={generating || !courses || courses.length === 0}
          className="flex-shrink-0 flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed hover:opacity-90"
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
            : "Generate AI Study Plan"}
        </button>
      </div>

      <div className="relative z-10">
        {loading ? (
          <div className="space-y-2 py-2">
            <div className="h-3 w-3/4 skeleton rounded" />
            <div className="h-3 w-1/2 skeleton rounded" />
            <div className="h-3 w-5/6 skeleton rounded" />
          </div>
        ) : error ? (
          <div className="text-xs text-[var(--color-accent-rose)] flex items-center gap-1.5 py-1.5">
            <AlertCircle size={14} />
            {error}
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
