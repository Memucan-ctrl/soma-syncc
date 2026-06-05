/**
 * SomaSync — Metric Cards (v2 — Live Data)
 * Top row: Enrolled Courses, Upcoming Deadlines, Study Progress, Notifications
 */

import { motion } from "framer-motion";
import { BookOpen, CalendarClock, TrendingUp, Bell } from "lucide-react";

function Skeleton({ className }) {
  return <div className={`skeleton ${className}`} />;
}

export default function MetricCards({ courses, events, loading }) {
  const courseCount = courses?.length || 0;
  const activeCourses = courses?.filter((c) => !c.hidden && !c.completed)?.length || 0;
  const eventCount = events?.length || 0;
  const nextEvent = events?.[0];

  const avgProgress = courses?.length
    ? Math.round(
        courses.reduce((sum, c) => sum + (c.progress || 0), 0) / courses.length
      )
    : 0;

  const nextDeadlineText = nextEvent
    ? (() => {
        const diff = (nextEvent.timesort * 1000 - Date.now()) / 1000;
        const days = Math.floor(diff / 86400);
        const hours = Math.floor((diff % 86400) / 3600);
        if (days > 0) return `${days}d ${hours}h`;
        if (hours > 0) return `${hours}h`;
        return "Soon";
      })()
    : "—";

  const cards = [
    {
      icon: BookOpen,
      label: "Enrolled Courses",
      value: loading ? null : `${activeCourses}`,
      sub: loading ? null : `${courseCount} total · ${courses?.filter((c) => c.completed)?.length || 0} completed`,
      accent: "#6366F1",
      bgAccent: "rgba(99, 102, 241, 0.1)",
    },
    {
      icon: CalendarClock,
      label: "Next Deadline",
      value: loading ? null : nextDeadlineText,
      sub: loading ? null : (nextEvent?.name?.substring(0, 45) || "No upcoming events"),
      accent: "#FB7185",
      bgAccent: "rgba(251, 113, 133, 0.1)",
    },
    {
      icon: TrendingUp,
      label: "Avg. Progress",
      value: loading ? null : `${avgProgress}%`,
      sub: loading ? null : "Across all enrolled courses",
      accent: "#34D399",
      bgAccent: "rgba(52, 211, 153, 0.1)",
    },
    {
      icon: Bell,
      label: "Due Events",
      value: loading ? null : `${eventCount}`,
      sub: loading ? null : "Upcoming deadlines & tasks",
      accent: "#FBBF24",
      bgAccent: "rgba(251, 191, 36, 0.1)",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, i) => {
        const Icon = card.icon;
        return (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06, duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
            className="metric-card"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg" style={{ background: card.bgAccent }}>
                <Icon size={16} style={{ color: card.accent }} />
              </div>
              <span className="text-[11px] font-medium text-[var(--color-text-muted)] uppercase tracking-wider">
                {card.label}
              </span>
            </div>
            {loading ? (
              <>
                <Skeleton className="h-7 w-20 mb-2" />
                <Skeleton className="h-3 w-36" />
              </>
            ) : (
              <>
                <p className="text-2xl font-bold text-[var(--color-text-primary)] mb-1">{card.value}</p>
                <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed truncate">{card.sub}</p>
              </>
            )}
          </motion.div>
        );
      })}
    </div>
  );
}
