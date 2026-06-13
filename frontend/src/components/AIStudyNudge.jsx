/**
 * SomaSync — AI Study Nudge
 * Contextual study recommendations based on deadlines, flashcard scores, and study history.
 */

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Brain, Lightbulb, Target, Clock, X, Sparkles } from "lucide-react";

const NUDGE_CACHE_KEY = "somasync_study_nudge";
const NUDGE_DISMISS_KEY = "somasync_nudge_dismissed";

function generateNudge(courses, events) {
  const nudges = [];
  const now = Date.now();

  // Check upcoming deadlines
  if (events?.length > 0) {
    const urgent = events.filter((e) => {
      const diff = (e.timesort * 1000 - now) / (1000 * 60 * 60);
      return diff > 0 && diff < 48;
    });

    if (urgent.length > 0) {
      nudges.push({
        id: "urgent-deadline",
        icon: Clock,
        color: "#FB7185",
        bg: "rgba(251,113,133,0.06)",
        borderColor: "rgba(251,113,133,0.15)",
        title: `${urgent.length} deadline${urgent.length > 1 ? "s" : ""} in the next 48 hours`,
        description: `"${urgent[0].name?.substring(0, 50)}" — Would you like AI to create a focused study plan?`,
        action: "Generate Study Plan",
        priority: 3,
      });
    }

    const upcoming = events.filter((e) => {
      const diff = (e.timesort * 1000 - now) / (1000 * 60 * 60);
      return diff >= 48 && diff < 168; // 2-7 days
    });

    if (upcoming.length > 0) {
      nudges.push({
        id: "upcoming-events",
        icon: Target,
        color: "#FBBF24",
        bg: "rgba(251,191,36,0.06)",
        borderColor: "rgba(251,191,36,0.15)",
        title: `${upcoming.length} task${upcoming.length > 1 ? "s" : ""} due this week`,
        description: "Stay ahead — start preparing early for better outcomes.",
        action: "View Deadlines",
        priority: 2,
      });
    }
  }

  // Check flashcard study gaps
  try {
    const flashcardCache = JSON.parse(localStorage.getItem("somasync_flashcards_cache") || "{}");
    const courseIds = Object.keys(flashcardCache);
    if (courseIds.length > 0 && courses?.length > 0) {
      const oldestStudy = courseIds.reduce((oldest, id) => {
        const ts = flashcardCache[id]?.generatedAt || 0;
        return ts < oldest.ts ? { id, ts } : oldest;
      }, { id: null, ts: Infinity });

      const daysSinceStudy = Math.floor((now - oldestStudy.ts) / (1000 * 60 * 60 * 24));
      if (daysSinceStudy >= 3) {
        const course = courses.find((c) => c.id === parseInt(oldestStudy.id));
        nudges.push({
          id: "spaced-repetition",
          icon: Brain,
          color: "#6366F1",
          bg: "rgba(99,102,241,0.06)",
          borderColor: "rgba(99,102,241,0.15)",
          title: "Spaced repetition reminder",
          description: course
            ? `You haven't reviewed "${course.shortname?.split("M26")?.[0]}" flashcards in ${daysSinceStudy} days — optimal recall window closing.`
            : `Some flashcard decks haven't been reviewed in ${daysSinceStudy} days.`,
          action: "Review Flashcards",
          priority: 1,
        });
      }
    }
  } catch {}

  // Check study planner usage
  try {
    const planner = JSON.parse(localStorage.getItem("somasync_study_planner") || "{}");
    const totalEvents = Object.values(planner).reduce((s, d) => s + (d?.length || 0), 0);
    if (totalEvents === 0 && courses?.length > 0) {
      nudges.push({
        id: "empty-planner",
        icon: Lightbulb,
        color: "#22D3EE",
        bg: "rgba(34,211,238,0.06)",
        borderColor: "rgba(34,211,238,0.15)",
        title: "Set up your study schedule",
        description: "Students with a structured study plan retain 40% more information. Let AI build one from your deadlines.",
        action: "Open Planner",
        priority: 1,
      });
    }
  } catch {}

  // Always have at least a motivational nudge
  if (nudges.length === 0) {
    nudges.push({
      id: "motivational",
      icon: Sparkles,
      color: "#34D399",
      bg: "rgba(52,211,153,0.06)",
      borderColor: "rgba(52,211,153,0.15)",
      title: "You're on track!",
      description: "Keep up the great work. Use AI flashcards and the Study Lab to deepen your understanding.",
      action: null,
      priority: 0,
    });
  }

  // Sort by priority (highest first) and return top nudge
  nudges.sort((a, b) => b.priority - a.priority);
  return nudges[0];
}

export default function AIStudyNudge({ courses, events, onOpenTab }) {
  const [nudge, setNudge] = useState(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Check if dismissed recently (within 2 hours)
    try {
      const dismissedAt = localStorage.getItem(NUDGE_DISMISS_KEY);
      if (dismissedAt && Date.now() - parseInt(dismissedAt) < 2 * 60 * 60 * 1000) {
        setDismissed(true);
        return;
      }
    } catch {}

    const generated = generateNudge(courses, events);
    setNudge(generated);
  }, [courses, events]);

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem(NUDGE_DISMISS_KEY, String(Date.now()));
  };

  const handleAction = () => {
    if (!nudge?.action || !onOpenTab) return;
    switch (nudge.id) {
      case "urgent-deadline":
      case "upcoming-events":
        onOpenTab("timetable");
        break;
      case "spaced-repetition":
        onOpenTab("flashcards");
        break;
      case "empty-planner":
        onOpenTab("timetable");
        break;
      default:
        break;
    }
  };

  if (dismissed || !nudge) return null;

  const Icon = nudge.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.4, delay: 0.5 }}
      className="rounded-2xl p-4 border relative overflow-hidden"
      style={{ background: nudge.bg, borderColor: nudge.borderColor }}
    >
      <button
        onClick={handleDismiss}
        className="absolute top-3 right-3 p-1 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-all cursor-pointer"
      >
        <X size={14} />
      </button>

      <div className="flex items-start gap-3">
        <div className="p-2 rounded-xl flex-shrink-0" style={{ background: `${nudge.color}15` }}>
          <Icon size={18} style={{ color: nudge.color }} />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-xs font-bold text-[var(--color-text-primary)] mb-0.5">{nudge.title}</h4>
          <p className="text-[11px] text-[var(--color-text-secondary)] leading-relaxed">{nudge.description}</p>
          {nudge.action && (
            <button
              onClick={handleAction}
              className="mt-2 text-[10px] font-bold uppercase tracking-wider cursor-pointer transition-all hover:opacity-80"
              style={{ color: nudge.color }}
            >
              {nudge.action} →
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
