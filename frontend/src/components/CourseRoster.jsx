/**
 * SomaSync — Course Roster (v2 — Live Moodle Data)
 * Displays enrolled courses with real progress data from Zetech Moodle.
 */

import { motion } from "framer-motion";
import { BookMarked, ExternalLink, RefreshCw } from "lucide-react";

const courseColors = [
  "#6366F1", "#22D3EE", "#34D399", "#A78BFA",
  "#FB7185", "#FBBF24", "#818CF8", "#F472B6",
  "#2DD4BF", "#F87171", "#60A5FA", "#4ADE80",
];

function Skeleton({ className }) {
  return <div className={`skeleton ${className}`} />;
}

function formatDate(ts) {
  if (!ts) return "";
  const d = new Date(ts * 1000);
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export default function CourseRoster({ courses, loading, onRefetch }) {
  if (loading) {
    return (
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-3 w-16" />
        </div>
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: "rgba(17,21,36,0.5)" }}>
              <Skeleton className="w-1 h-10 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-3 w-3/4" />
                <Skeleton className="h-2 w-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Filter to show active, non-hidden courses
  const activeCourses = (courses || [])
    .filter((c) => !c.hidden)
    .sort((a, b) => (b.lastaccess || 0) - (a.lastaccess || 0));

  return (
    <div className="card p-5 h-full">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-[var(--color-text-primary)] flex items-center gap-2">
          <BookMarked size={15} className="text-[var(--color-primary)]" />
          My Courses
        </h2>
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-[var(--color-text-muted)]">
            {activeCourses.length} active
          </span>
          {onRefetch && (
            <button
              onClick={onRefetch}
              className="p-1 rounded-md hover:bg-[rgba(99,102,241,0.1)] transition-colors cursor-pointer"
            >
              <RefreshCw size={12} className="text-[var(--color-text-muted)]" />
            </button>
          )}
        </div>
      </div>

      <div className="space-y-2 overflow-y-auto" style={{ maxHeight: "calc(100vh - 440px)" }}>
        {activeCourses.map((course, i) => {
          const color = courseColors[i % courseColors.length];
          const progress = course.progress || 0;

          return (
            <motion.div
              key={course.id}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04, duration: 0.35 }}
              className="group flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all"
              style={{ background: "rgba(17, 21, 36, 0.5)" }}
            >
              <div
                className="w-1 self-stretch rounded-full flex-shrink-0"
                style={{ background: color }}
              />

              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-[var(--color-text-primary)] truncate mb-1 group-hover:text-[var(--color-primary-light)] transition-colors">
                  {course.displayname || course.fullname}
                </p>

                <div className="flex items-center gap-2">
                  <div className="progress-bar flex-1">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 0.8, delay: i * 0.05, ease: [0.4, 0, 0.2, 1] }}
                      className="progress-bar-fill"
                      style={{ background: `linear-gradient(90deg, ${color}, ${color}99)` }}
                    />
                  </div>
                  <span className="text-[10px] text-[var(--color-text-muted)] font-mono w-8 text-right">
                    {Math.round(progress)}%
                  </span>
                </div>

                {course.shortname && (
                  <p className="text-[10px] text-[var(--color-text-muted)] mt-1 truncate">
                    {course.shortname}
                    {course.lastaccess ? ` · Last accessed ${formatDate(course.lastaccess)}` : ""}
                  </p>
                )}
              </div>

              <a
                href={`https://elearning.zetech.ac.ke/course/view.php?id=${course.id}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="opacity-0 group-hover:opacity-100 transition-opacity p-1"
              >
                <ExternalLink size={12} className="text-[var(--color-text-muted)]" />
              </a>
            </motion.div>
          );
        })}

        {activeCourses.length === 0 && (
          <div className="text-center py-8">
            <p className="text-sm text-[var(--color-text-muted)]">No courses found</p>
          </div>
        )}
      </div>
    </div>
  );
}
