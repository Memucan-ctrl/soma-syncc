/**
 * SomaSync — Upcoming Events Panel
 * Shows live calendar/deadline data from Moodle.
 */

import { motion } from "framer-motion";
import { CalendarClock, Clock, ArrowUpRight } from "lucide-react";

function Skeleton({ className }) {
  return <div className={`skeleton ${className}`} />;
}

function formatEventTime(timestamp) {
  if (!timestamp) return "";
  const d = new Date(timestamp * 1000);
  const now = new Date();
  const diffMs = d - now;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

  if (diffMs < 0) return "Overdue";
  if (diffDays === 0) return `${diffHours}h left`;
  if (diffDays === 1) return `Tomorrow`;
  if (diffDays < 7) return `${diffDays} days`;
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

function getUrgencyColor(timestamp) {
  if (!timestamp) return "var(--color-text-muted)";
  const diffMs = timestamp * 1000 - Date.now();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  if (diffDays < 0) return "#FB7185";
  if (diffDays < 1) return "#FB7185";
  if (diffDays < 3) return "#FBBF24";
  return "#34D399";
}

export default function UpcomingEvents({ events, loading }) {
  if (loading) {
    return (
      <div className="card p-5 h-full">
        <div className="flex items-center gap-2 mb-4">
          <Skeleton className="h-4 w-36" />
        </div>
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="p-3 rounded-xl" style={{ background: "var(--color-surface-raised)" }}>
              <Skeleton className="h-3 w-3/4 mb-2" />
              <Skeleton className="h-2 w-1/2" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const eventList = events || [];

  return (
    <div className="card p-5 h-full">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-[var(--color-text-primary)] flex items-center gap-2">
          <CalendarClock size={15} className="text-[var(--color-accent-amber)]" />
          Upcoming Deadlines
        </h2>
        <span className="text-[11px] text-[var(--color-text-muted)]">
          {eventList.length} events
        </span>
      </div>

      <div className="space-y-2 overflow-y-auto" style={{ maxHeight: "calc(100vh - 440px)" }}>
        {eventList.slice(0, 12).map((event, i) => {
          const urgencyColor = getUrgencyColor(event.timesort);
          const courseName = event.course?.shortname || event.course?.fullname || "";
          return (
            <motion.div
              key={event.id || i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04, duration: 0.3 }}
              className="group p-3 rounded-xl transition-all cursor-pointer"
              style={{ background: "var(--color-surface-raised)" }}
            >
              <div className="flex items-start gap-3">
                <div
                  className="w-1 self-stretch rounded-full flex-shrink-0 mt-0.5"
                  style={{ background: urgencyColor }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-[var(--color-text-primary)] mb-1 truncate group-hover:text-[var(--color-primary-light)] transition-colors">
                    {event.name}
                  </p>
                  <div className="flex items-center gap-2 flex-wrap">
                    {courseName && (
                      <span className="text-[10px] text-[var(--color-text-muted)]">
                        {courseName}
                      </span>
                    )}
                    <span className="flex items-center gap-1 text-[10px] font-medium" style={{ color: urgencyColor }}>
                      <Clock size={9} />
                      {formatEventTime(event.timesort)}
                    </span>
                  </div>
                </div>
                {event.url && (
                  <a
                    href={event.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1"
                  >
                    <ArrowUpRight size={12} className="text-[var(--color-text-muted)]" />
                  </a>
                )}
              </div>
            </motion.div>
          );
        })}

        {eventList.length === 0 && (
          <div className="text-center py-8">
            <CalendarClock size={24} className="mx-auto mb-2 text-[var(--color-text-muted)]" />
            <p className="text-sm text-[var(--color-text-muted)]">No upcoming events</p>
            <p className="text-[11px] text-[var(--color-text-muted)] mt-1">Your schedule is clear!</p>
          </div>
        )}
      </div>
    </div>
  );
}
