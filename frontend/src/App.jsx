/**
 * SomaSync — Root Application (v3)
 * Shell with responsive sidebar/mobile nav, theme support, admin route.
 */

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Sidebar from "./components/Sidebar";
import MobileNav from "./components/MobileNav";
import Home from "./pages/Dashboard";
import Login from "./pages/Login";
import AssetManager from "./pages/AssetManager";
import GitVisualizer from "./components/GitVisualizer";
import Flashcards from "./pages/Flashcards";
import Timetable from "./pages/Timetable";
import ChatWorkspace from "./components/ChatWorkspace";
import Admin from "./pages/Admin";
import { useProfile, useMyCourses, useUpcomingEvents } from "./hooks/useMoodle";
import { Shield } from "lucide-react";
import "./App.css";

// Admin users — add Moodle usernames here
const ADMIN_USERS = ["BSE-01-0040/2024"];

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);
  return isMobile;
}

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

function AdminPasswordGate() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (password === "somasync2026") {
      localStorage.setItem("somasync_admin_authorized", "true");
      window.location.reload();
    } else {
      setError("Invalid administrator password.");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col items-center justify-center min-h-[60vh]"
    >
      <div className="card p-8 text-center max-w-sm w-full space-y-5">
        <div className="w-12 h-12 rounded-2xl mx-auto flex items-center justify-center bg-[rgba(99,102,241,0.08)] border border-[rgba(99,102,241,0.15)] text-[var(--color-primary-light)]">
          <Shield size={20} />
        </div>
        <div>
          <h2 className="text-base font-bold text-[var(--color-text-primary)]">Staff Portal Access</h2>
          <p className="text-xs text-[var(--color-text-muted)] mt-1.5 leading-relaxed">
            Please enter the administrator password to unlock the admin panel.
          </p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4 w-full">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Admin password"
            className="w-full text-xs py-2.5 px-4 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-base-950)] text-[var(--color-text-primary)] outline-none focus:border-[var(--color-primary-light)] transition-colors placeholder:text-[var(--color-text-muted)]"
            autoFocus
          />
          {error && (
            <p className="text-[10px] text-[var(--color-accent-rose)] font-semibold">{error}</p>
          )}
          <button
            type="submit"
            className="w-full py-2.5 rounded-xl text-xs font-semibold text-white cursor-pointer hover:opacity-95 transition-all"
            style={{ background: "linear-gradient(135deg, #6366F1, #818CF8)" }}
          >
            Authenticate
          </button>
        </form>
      </div>
    </motion.div>
  );
}

function AuthenticatedApp({ onLogout }) {
  const [activeTab, setActiveTab] = useState(() => {
    const pending = localStorage.getItem("somasync_pending_tab");
    if (pending) {
      localStorage.removeItem("somasync_pending_tab");
      return pending;
    }
    return "home";
  });
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [pendingAiAction, setPendingAiAction] = useState(null);
  const isMobile = useIsMobile();

  // Scroll to top when tab changes
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [activeTab]);

  // ─── Live data hooks ────────────────────────────────────────────
  const { data: profileData } = useProfile();
  const { data: coursesData, loading: coursesLoading } = useMyCourses();
  const { data: eventsData, loading: eventsLoading } = useUpcomingEvents();

  const profile = profileData?.profile;
  const courses = coursesData?.courses;
  const events = eventsData?.events;
  const loading = coursesLoading || eventsLoading;

  const isAdmin = (profile?.username
    ? ADMIN_USERS.map((u) => u.toLowerCase()).includes(profile.username.toLowerCase())
    : false) || localStorage.getItem("somasync_admin_authorized") === "true";

  const handleSendToAi = (query, text, filename) => {
    setPendingAiAction({ query, text, filename });
    setActiveTab("ai");
  };

  const pages = {
    home: (
      <Home
        profile={profile}
        courses={courses}
        events={events}
        loading={loading}
        onOpenAi={() => setActiveTab("ai")}
        onSendToAi={handleSendToAi}
        onOpenTab={setActiveTab}
      />
    ),
    ai: (
      <ChatWorkspace
        isPage={true}
        pendingAiAction={pendingAiAction}
        clearPendingAiAction={() => setPendingAiAction(null)}
      />
    ),
    moodle: <AssetManager />,
    git: <GitVisualizer />,
    flashcards: <Flashcards />,
    timetable: <Timetable />,
    admin: isAdmin ? <Admin /> : (
      <AdminPasswordGate />
    ),
  };

  return (
    <div className="flex min-h-screen" style={{ background: "var(--color-base-950)" }}>
      {/* Desktop Sidebar */}
      {!isMobile && (
        <Sidebar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          profile={profile}
          onLogout={onLogout}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          isAdmin={isAdmin}
        />
      )}

      <main
        className="flex-1 transition-all duration-300 ease-in-out"
        style={{
          marginLeft: isMobile ? 0 : (sidebarCollapsed ? 68 : 240),
          padding: isMobile ? "16px 16px 80px 16px" : "28px 32px",
        }}
      >
        {/* Subtle ambient glow */}
        <div
          className="fixed top-0 right-0 w-[500px] h-[500px] pointer-events-none opacity-30 hidden md:block"
          style={{
            background: "radial-gradient(circle at 80% 15%, rgba(99, 102, 241, 0.06) 0%, transparent 55%)",
            filter: "blur(60px)",
          }}
        />

        <div className="relative z-10">
          {pages[activeTab] || pages.home}
        </div>
      </main>

      {/* Mobile Bottom Nav */}
      {isMobile && (
        <MobileNav
          activeTab={activeTab}
          onTabChange={setActiveTab}
          profile={profile}
          onLogout={onLogout}
          isAdmin={isAdmin}
        />
      )}
    </div>
  );
}

export default function App() {
  const [token, setToken] = useState(() => localStorage.getItem("somasync_token"));

  // Check URL query parameters for admin/staff bypass
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("admin") === "true" || params.get("staff") === "true") {
      localStorage.setItem("somasync_admin_authorized", "true");
      const url = new URL(window.location.href);
      url.searchParams.delete("admin");
      url.searchParams.delete("staff");
      window.history.replaceState({}, document.title, url.pathname + url.search);
      window.location.reload();
      return;
    }

    const handleHash = () => {
      const hash = window.location.hash.toLowerCase();
      if (hash === "#admin" || hash === "#/admin") {
        localStorage.setItem("somasync_pending_tab", "admin");
        window.location.hash = ""; // Clear hash
        window.location.reload();
      }
    };
    handleHash();
    window.addEventListener("hashchange", handleHash);
    return () => window.removeEventListener("hashchange", handleHash);
  }, []);

  const handleLoginSuccess = (newToken, profile) => {
    localStorage.setItem("somasync_token", newToken);
    localStorage.setItem("somasync_profile", JSON.stringify(profile));
    setToken(newToken);
  };

  const handleLogout = () => {
    localStorage.removeItem("somasync_token");
    localStorage.removeItem("somasync_profile");
    localStorage.removeItem("somasync_admin_authorized");
    setToken(null);
  };

  if (!token) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  return <AuthenticatedApp onLogout={handleLogout} />;
}
