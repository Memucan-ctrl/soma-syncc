/**
 * SomaSync — Home Page (formerly Dashboard)
 * Layout: Greeting → Metric Cards (top) → Courses + Events (middle) → FAB to open AI
 */

import { useState } from "react";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import MetricCards from "../components/MetricCards";
import CourseRoster from "../components/CourseRoster";
import UpcomingEvents from "../components/UpcomingEvents";
import ChatWorkspace from "../components/ChatWorkspace";

export default function Home({ profile, courses, events, loading }) {
  const firstName = profile?.lastname?.split(" ")?.[0] || "there";
  const [aiOpen, setAiOpen] = useState(false);

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col gap-6 min-h-[calc(100vh-64px)]"
      >
        {/* ─── Greeting ────────────────────────────────────────────────── */}
        <div>
          <motion.h1
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-xl font-semibold text-[var(--color-text-primary)]"
          >
            Welcome back, {firstName}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-sm text-[var(--color-text-muted)] mt-1"
          >
            {profile ? "Your Academic Dashboard" : "Loading your learning data..."}
          </motion.p>
        </div>

        {/* ─── Metric Cards (Top) ──────────────────────────────────────── */}
        <MetricCards courses={courses} events={events} loading={loading} />

        {/* ─── Analytics Split (Middle) ────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 flex-1">
          <CourseRoster courses={courses} loading={loading} />
          <UpcomingEvents events={events} loading={loading} />
        </div>
      </motion.div>

      {/* ─── Floating AI Action Button ─────────────────────────────────── */}
      <motion.button
        whileHover={{ scale: 1.08, boxShadow: "0 0 30px rgba(99, 102, 241, 0.3)" }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setAiOpen(true)}
        className="fixed bottom-6 right-8 z-50 flex items-center gap-2.5 px-5 py-3.5 rounded-2xl text-white font-semibold text-sm cursor-pointer shadow-xl"
        style={{
          background: "linear-gradient(135deg, #6366F1, #818CF8)",
          boxShadow: "0 8px 32px rgba(99, 102, 241, 0.35)",
        }}
      >
        <Sparkles size={18} className="animate-pulse" />
        SomaSync AI
      </motion.button>

      {/* ─── Full-Screen AI Workspace Overlay ──────────────────────────── */}
      <ChatWorkspace isOpen={aiOpen} onClose={() => setAiOpen(false)} />
    </>
  );
}
