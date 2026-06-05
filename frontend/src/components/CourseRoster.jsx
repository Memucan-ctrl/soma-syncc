/**
 * SomaSync — Course Roster with AI Recommendations
 * Left panel of the split view: courses with progress bars and smart suggestions.
 */

import { motion } from "framer-motion";
import { BookMarked, AlertTriangle, Lightbulb, Target, ArrowRight } from "lucide-react";
import { mockCourses, mockRecommendations } from "../data/mockData";

const urgencyStyles = {
  critical: { bg: "rgba(251, 113, 133, 0.1)", border: "rgba(251, 113, 133, 0.3)", color: "#FB7185", icon: AlertTriangle },
  high: { bg: "rgba(251, 191, 36, 0.1)", border: "rgba(251, 191, 36, 0.3)", color: "#FBBF24", icon: Target },
  low: { bg: "rgba(52, 211, 153, 0.1)", border: "rgba(52, 211, 153, 0.3)", color: "#34D399", icon: Lightbulb },
};

export default function CourseRoster() {
  return (
    <div className="space-y-5">
      {/* ─── Course List ─────────────────────────────────────────────── */}
      <div className="glass-card p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
            <BookMarked size={16} className="text-cyan-400" />
            Course Roster
          </h2>
          <span className="text-xs text-slate-500">{mockCourses.length} enrolled</span>
        </div>

        <div className="space-y-3">
          {mockCourses.map((course, i) => (
            <motion.div
              key={course.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.06, duration: 0.4 }}
              whileHover={{ x: 4 }}
              className="group flex items-center gap-4 p-3 rounded-xl cursor-pointer transition-colors"
              style={{ background: "rgba(14, 20, 37, 0.5)" }}
            >
              {/* Color marker */}
              <div
                className="w-1 h-10 rounded-full flex-shrink-0"
                style={{ background: course.color }}
              />

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className="text-[10px] font-bold tracking-wider px-1.5 py-0.5 rounded"
                    style={{
                      background: `${course.color}15`,
                      color: course.color,
                    }}
                  >
                    {course.shortname}
                  </span>
                  <span className="text-xs text-slate-300 truncate">
                    {course.fullname}
                  </span>
                </div>

                {/* Progress bar */}
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${course.progress}%` }}
                      transition={{ duration: 1, delay: i * 0.1, ease: [0.4, 0, 0.2, 1] }}
                      className="h-full rounded-full"
                      style={{ background: `linear-gradient(90deg, ${course.color}, ${course.color}88)` }}
                    />
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono w-8 text-right">
                    {course.progress}%
                  </span>
                </div>
              </div>

              {/* Grade badge */}
              <div
                className="text-xs font-bold px-2 py-1 rounded-lg opacity-80 group-hover:opacity-100 transition-opacity"
                style={{
                  background: "rgba(34, 211, 238, 0.08)",
                  color: "#22D3EE",
                }}
              >
                {course.grade}
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* ─── AI Recommendations ──────────────────────────────────────── */}
      <div className="glass-card p-5">
        <h2 className="text-sm font-semibold text-slate-200 flex items-center gap-2 mb-4">
          <Lightbulb size={16} className="text-amber-400" />
          AI Recommendations
        </h2>

        <div className="space-y-3">
          {mockRecommendations.map((rec, i) => {
            const style = urgencyStyles[rec.urgency];
            const Icon = style.icon;
            return (
              <motion.div
                key={rec.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + i * 0.08 }}
                className="p-3 rounded-xl cursor-pointer group transition-all"
                style={{
                  background: style.bg,
                  border: `1px solid ${style.border}`,
                }}
              >
                <div className="flex items-start gap-3">
                  <Icon size={14} style={{ color: style.color }} className="mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-200 mb-1">
                      {rec.title}
                    </p>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      {rec.description}
                    </p>
                  </div>
                  <ArrowRight
                    size={14}
                    className="text-slate-600 group-hover:text-slate-300 transition-colors flex-shrink-0 mt-0.5"
                  />
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
