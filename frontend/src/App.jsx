/**
 * SomaSync — Root Application
 * Layout shell with sidebar + routed content area.
 */

import { useState } from "react";
import { motion } from "framer-motion";
import Sidebar from "./components/Sidebar";
import Dashboard from "./pages/Dashboard";
import "./App.css";

// Placeholder pages for non-dashboard views
function PlaceholderPage({ title, description }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col items-center justify-center min-h-[60vh]"
    >
      <div className="glass-card p-12 text-center max-w-md">
        <h2 className="text-xl font-bold text-slate-100 mb-3">{title}</h2>
        <p className="text-sm text-slate-400 leading-relaxed">{description}</p>
        <div className="mt-6 text-[10px] font-mono text-slate-600 tracking-wider uppercase">
          Module loading...
        </div>
      </div>
    </motion.div>
  );
}

const pages = {
  dashboard: <Dashboard />,
  moodle: (
    <PlaceholderPage
      title="Moodle Sync Bridge"
      description="Live connection to Zetech University's Moodle LMS. Syncing courses, assignments, and grades in real-time."
    />
  ),
  git: (
    <PlaceholderPage
      title="Git Workflow Visualizer"
      description="Full-screen interactive commit tree mapping your code contributions to syllabus milestones."
    />
  ),
  flashcards: (
    <PlaceholderPage
      title="AI Flashcards"
      description="3D flipping flashcards generated from your course materials using Gemini AI and OCR-processed syllabi."
    />
  ),
  timetable: (
    <PlaceholderPage
      title="Smart Timetable"
      description="AI-optimized weekly schedule combining your Moodle calendar, study goals, and deadline predictions."
    />
  ),
};

export default function App() {
  const [activeTab, setActiveTab] = useState("dashboard");

  return (
    <div className="flex min-h-screen" style={{ background: "#0B0F19" }}>
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Main content area — offset by sidebar width */}
      <main
        className="flex-1 transition-all duration-300 ease-in-out"
        style={{ marginLeft: 260, padding: "32px 36px" }}
      >
        {/* Ambient gradient glow */}
        <div
          className="fixed top-0 right-0 w-[600px] h-[600px] pointer-events-none"
          style={{
            background: "radial-gradient(circle at 80% 20%, rgba(34, 211, 238, 0.04) 0%, transparent 60%)",
            filter: "blur(40px)",
          }}
        />
        <div
          className="fixed bottom-0 left-[260px] w-[500px] h-[500px] pointer-events-none"
          style={{
            background: "radial-gradient(circle at 20% 80%, rgba(59, 130, 246, 0.03) 0%, transparent 60%)",
            filter: "blur(50px)",
          }}
        />

        {/* Routed content */}
        <div className="relative z-10">
          {pages[activeTab] || pages.dashboard}
        </div>
      </main>
    </div>
  );
}
