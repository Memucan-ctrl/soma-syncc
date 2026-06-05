/**
 * SomaSync — Dashboard Page
 * Main dashboard layout combining MetricCards, CourseRoster, ChatWorkspace, and GitVisualizer.
 */

import { motion } from "framer-motion";
import MetricCards from "../components/MetricCards";
import CourseRoster from "../components/CourseRoster";
import ChatWorkspace from "../components/ChatWorkspace";
import GitVisualizer from "../components/GitVisualizer";

export default function Dashboard() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      {/* ─── Page Header ─────────────────────────────────────────────── */}
      <div>
        <motion.h1
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-2xl font-bold text-slate-50"
        >
          Command Center
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="text-sm text-slate-500 mt-1"
        >
          Welcome back. Here's your learning intelligence at a glance.
        </motion.p>
      </div>

      {/* ─── Metric Cards Row ────────────────────────────────────────── */}
      <MetricCards />

      {/* ─── Split View: Roster + Chat ───────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left: Course Roster + Recommendations */}
        <div className="lg:col-span-5">
          <CourseRoster />
        </div>

        {/* Right: Chat Workspace */}
        <div className="lg:col-span-7">
          <ChatWorkspace />
        </div>
      </div>

      {/* ─── Git Visualizer ──────────────────────────────────────────── */}
      <div>
        <motion.h2
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-lg font-semibold text-slate-200 mb-4"
        >
          Recent Commit Activity
        </motion.h2>
        <GitVisualizer />
      </div>
    </motion.div>
  );
}
