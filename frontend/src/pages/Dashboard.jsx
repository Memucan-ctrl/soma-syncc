/**
 * SomaSync — Home Page (formerly Dashboard)
 * Layout: Greeting → Metric Cards (top) → Courses + Events (middle) → Chat (bottom)
 */

import { motion } from "framer-motion";
import MetricCards from "../components/MetricCards";
import CourseRoster from "../components/CourseRoster";
import UpcomingEvents from "../components/UpcomingEvents";
import ChatBar from "../components/ChatWorkspace";

export default function Home({ profile, courses, events, loading }) {
  const firstName = profile?.lastname?.split(" ")?.[0] || "there";

  return (
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

      {/* ─── Chat Bar (Bottom) ───────────────────────────────────────── */}
      <div className="sticky bottom-0 z-20 pb-2">
        <ChatBar />
      </div>
    </motion.div>
  );
}
