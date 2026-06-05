/**
 * SomaSync — Root Application (v2)
 * Shell with sidebar + content area, live data fetching from Moodle.
 */

import { useState } from "react";
import { motion } from "framer-motion";
import Sidebar from "./components/Sidebar";
import Home from "./pages/Dashboard";
import Login from "./pages/Login";
import MoodleSync from "./pages/MoodleSync";
import GitVisualizer from "./components/GitVisualizer";
import Flashcards from "./pages/Flashcards";
import Timetable from "./pages/Timetable";
import { useProfile, useMyCourses, useUpcomingEvents } from "./hooks/useMoodle";
import "./App.css";

function PlaceholderPage({ title, description }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col items-center justify-center min-h-[60vh]"
    >
      <div className="card p-10 text-center max-w-sm">
        <h2 className="text-lg font-semibold text-[var(--color-text-primary)] mb-2">{title}</h2>
        <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">{description}</p>
        <div className="mt-5 text-[10px] font-medium text-[var(--color-text-muted)] tracking-wider uppercase">
          Coming soon
        </div>
      </div>
    </motion.div>
  );
}

function AuthenticatedApp({ onLogout }) {
  const [activeTab, setActiveTab] = useState("home");

  // ─── Live data hooks ────────────────────────────────────────────
  const { data: profileData } = useProfile();
  const { data: coursesData, loading: coursesLoading } = useMyCourses();
  const { data: eventsData, loading: eventsLoading } = useUpcomingEvents();

  const profile = profileData?.profile;
  const courses = coursesData?.courses;
  const events = eventsData?.events;
  const loading = coursesLoading || eventsLoading;

  const pages = {
    home: (
      <Home
        profile={profile}
        courses={courses}
        events={events}
        loading={loading}
      />
    ),
    moodle: <MoodleSync />,
    git: <GitVisualizer />,
    flashcards: <Flashcards />,
    timetable: <Timetable />,
  };

  return (
    <div className="flex min-h-screen" style={{ background: "var(--color-base-950)" }}>
      <Sidebar 
        activeTab={activeTab} 
        onTabChange={setActiveTab} 
        profile={profile} 
        onLogout={onLogout}
      />

      <main
        className="flex-1 transition-all duration-300 ease-in-out"
        style={{ marginLeft: 240, padding: "28px 32px" }}
      >
        {/* Subtle ambient glow */}
        <div
          className="fixed top-0 right-0 w-[500px] h-[500px] pointer-events-none opacity-30"
          style={{
            background: "radial-gradient(circle at 80% 15%, rgba(99, 102, 241, 0.06) 0%, transparent 55%)",
            filter: "blur(60px)",
          }}
        />

        <div className="relative z-10">
          {pages[activeTab] || pages.home}
        </div>
      </main>
    </div>
  );
}

export default function App() {
  const [token, setToken] = useState(() => localStorage.getItem("somasync_token"));

  const handleLoginSuccess = (newToken, profile) => {
    localStorage.setItem("somasync_token", newToken);
    localStorage.setItem("somasync_profile", JSON.stringify(profile));
    setToken(newToken);
  };

  const handleLogout = () => {
    localStorage.removeItem("somasync_token");
    localStorage.removeItem("somasync_profile");
    setToken(null);
  };

  if (!token) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  return <AuthenticatedApp onLogout={handleLogout} />;
}
