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
import { Shield, AlertTriangle, LogOut } from "lucide-react";
import { fetchAdminSettings } from "./services/api";
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

function MaintenancePage({ onLogout }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-5" style={{ background: "var(--color-base-950)" }}>
      {/* Glow effect */}
      <div
        className="fixed top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] pointer-events-none opacity-25 animate-pulse"
        style={{
          background: "radial-gradient(circle, rgba(245, 158, 11, 0.15) 0%, transparent 70%)",
          filter: "blur(50px)",
        }}
      />
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="card p-8 text-center max-w-md w-full space-y-6 relative z-10 border-amber-500/20"
      >
        <div className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center bg-amber-500/10 border border-amber-500/20 text-amber-500">
          <AlertTriangle size={32} />
        </div>
        
        <div className="space-y-2">
          <h2 className="text-xl font-extrabold tracking-tight text-[var(--color-text-primary)]">
            System Under Maintenance
          </h2>
          <p className="text-xs text-[var(--color-text-muted)] leading-relaxed">
            SomaSync is currently undergoing scheduled upgrades to improve our AI study planner, flashcards, and overall performance.
          </p>
          <p className="text-xs text-[var(--color-text-muted)] leading-relaxed">
            We apologize for the inconvenience and will be back online shortly!
          </p>
        </div>

        <div className="pt-4 border-t border-[var(--color-border-subtle)] flex flex-col gap-3">
          <p className="text-[10px] text-[var(--color-text-muted)] font-medium uppercase tracking-wider">
            Are you a staff member or administrator?
          </p>
          <button
            onClick={onLogout}
            className="w-full py-2.5 rounded-xl text-xs font-semibold border border-[var(--color-border-subtle)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:border-[var(--color-border-hover)] bg-[var(--color-base-900)] hover:bg-[var(--color-base-850)] transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <LogOut size={14} />
            Log Out & Switch Account
          </button>
        </div>
      </motion.div>
    </div>
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

  const [settings, setSettings] = useState(() => {
    try {
      return {
        aiEnabled: true,
        flashcardsEnabled: true,
        ocrEnabled: true,
        devTrackerEnabled: true,
        timetableEnabled: true,
        maintenanceMode: false,
        ...JSON.parse(localStorage.getItem("somasync_admin_settings") || "{}")
      };
    } catch {
      return {
        aiEnabled: true,
        flashcardsEnabled: true,
        ocrEnabled: true,
        devTrackerEnabled: true,
        timetableEnabled: true,
        maintenanceMode: false,
      };
    }
  });

  // Fetch settings on mount
  useEffect(() => {
    fetchAdminSettings()
      .then((flags) => {
        const mapped = {
          aiEnabled: flags.ai_enabled,
          flashcardsEnabled: flags.flashcards_enabled,
          ocrEnabled: flags.ocr_enabled,
          devTrackerEnabled: flags.dev_tracker_enabled,
          timetableEnabled: flags.timetable_enabled,
          maintenanceMode: flags.maintenance_mode,
        };
        localStorage.setItem("somasync_admin_settings", JSON.stringify(mapped));
        setSettings(mapped);
      })
      .catch((err) => console.warn("[App] Could not fetch settings:", err));
  }, []);

  // Listen for storage events (e.g. settings saved in Admin.jsx)
  useEffect(() => {
    const handleStorage = () => {
      try {
        const local = JSON.parse(localStorage.getItem("somasync_admin_settings") || "{}");
        setSettings((prev) => ({ ...prev, ...local }));
      } catch (e) {
        console.warn(e);
      }
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

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
    ? ["admin", ...ADMIN_USERS].map((u) => u.toLowerCase()).includes(profile.username.toLowerCase())
    : false) || localStorage.getItem("somasync_admin_authorized") === "true";

  // Tab Guards: redirect if active tab is disabled
  useEffect(() => {
    if (activeTab === "ai" && settings.aiEnabled === false) {
      setActiveTab("home");
    } else if (activeTab === "flashcards" && settings.flashcardsEnabled === false) {
      setActiveTab("home");
    } else if (activeTab === "git" && settings.devTrackerEnabled === false) {
      setActiveTab("home");
    } else if (activeTab === "timetable" && settings.timetableEnabled === false) {
      setActiveTab("home");
    }
  }, [activeTab, settings]);

  // Maintenance bypass / check
  if (settings.maintenanceMode && !isAdmin) {
    return <MaintenancePage onLogout={onLogout} />;
  }

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
          settings={settings}
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
          settings={settings}
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
