/**
 * SomaSync — Sidebar Navigation (v3 — Theme Toggle + Admin)
 */

import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  GitBranch,
  Layers,
  CalendarClock,
  ChevronLeft,
  ChevronRight,
  LogOut,
  BookOpen,
  Sparkles,
  Shield,
  Sun,
  Moon,
} from "lucide-react";
import { useTheme } from "../contexts/ThemeContext";

const navItems = [
  { id: "home", label: "Home", icon: LayoutDashboard },
  { id: "ai", label: "SomaSync AI", icon: Sparkles },
  { id: "moodle", label: "Study Lab", icon: Layers },
  { id: "git", label: "DevTracker", icon: GitBranch },
  { id: "flashcards", label: "Flashcards", icon: BookOpen },
  { id: "timetable", label: "Study Planner", icon: CalendarClock },
];

export default function Sidebar({ activeTab, onTabChange, profile, onLogout, collapsed, onToggleCollapse, isAdmin = false, settings = {} }) {
  const { theme, toggleTheme } = useTheme();
  const firstName = profile?.lastname?.split(" ")?.[0] || "Student";

  const filteredItems = navItems.filter((item) => {
    if (item.id === "ai") return settings.aiEnabled !== false;
    if (item.id === "flashcards") return settings.flashcardsEnabled !== false;
    if (item.id === "git") return settings.devTrackerEnabled !== false;
    if (item.id === "timetable") return settings.timetableEnabled !== false;
    return true;
  });

  return (
    <motion.aside
      animate={{ width: collapsed ? 68 : 240 }}
      transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
      className="fixed left-0 top-0 h-screen z-50 hidden md:flex flex-col"
      style={{
        background: "var(--color-base-900)",
        borderRight: "1px solid var(--color-border-subtle)",
      }}
    >
      {/* ─── Logo ──────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 px-4 py-5 min-h-[68px]">
        <img
          src="/logo.png"
          className="flex-shrink-0 w-9 h-9 object-contain"
          alt="SomaSync Logo"
        />
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.15 }}
            >
              <h1 className="text-base font-bold tracking-tight text-[var(--color-text-primary)]">
                SomaSync
              </h1>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ─── Status ────────────────────────────────────────────────── */}
      <AnimatePresence>
        {!collapsed && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="px-4 mb-5"
          >
            <div
              className="status-badge"
              style={{
                background: "rgba(52, 211, 153, 0.08)",
                border: "1px solid rgba(52, 211, 153, 0.15)",
                color: "var(--color-accent-emerald)",
              }}
            >
              <span
                className="pulse-dot"
                style={{ background: "var(--color-accent-emerald)", boxShadow: "0 0 6px var(--color-accent-emerald)" }}
              />
              Connected · Live Sync
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Nav ───────────────────────────────────────────────────── */}
      <nav className="flex-1 px-3 space-y-0.5">
        {filteredItems.map((item) => {
          const isActive = activeTab === item.id;
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`nav-item ${isActive ? "nav-item-active" : ""}`}
            >
              <Icon size={17} strokeWidth={isActive ? 2.2 : 1.5} />
              <AnimatePresence>
                {!collapsed && (
                  <motion.span
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: "auto" }}
                    exit={{ opacity: 0, width: 0 }}
                    className="whitespace-nowrap overflow-hidden"
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
          );
        })}

        {/* Admin nav item */}
        <button
          onClick={() => onTabChange("admin")}
          className={`nav-item ${activeTab === "admin" ? "nav-item-active" : ""}`}
        >
          <Shield size={17} strokeWidth={activeTab === "admin" ? 2.2 : 1.5} />
          <AnimatePresence>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: "auto" }}
                exit={{ opacity: 0, width: 0 }}
                className="whitespace-nowrap overflow-hidden flex items-center gap-2"
              >
                Admin Panel
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </nav>

      {/* ─── Footer ────────────────────────────────────────────────── */}
      <div className="px-3 pb-4 space-y-1">
        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="nav-item group"
          title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
        >
          <motion.div
            key={theme}
            initial={{ rotate: -90, opacity: 0 }}
            animate={{ rotate: 0, opacity: 1 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            {theme === "dark" ? <Sun size={17} strokeWidth={1.5} /> : <Moon size={17} strokeWidth={1.5} />}
          </motion.div>
          <AnimatePresence>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: "auto" }}
                exit={{ opacity: 0, width: 0 }}
                className="whitespace-nowrap overflow-hidden"
              >
                {theme === "dark" ? "Light Mode" : "Dark Mode"}
              </motion.span>
            )}
          </AnimatePresence>
        </button>

        {!collapsed && profile ? (
          <div className="px-3 py-3 mb-2 rounded-xl flex items-center justify-between gap-2" style={{ background: "rgba(99, 102, 241, 0.05)" }}>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-[var(--color-text-primary)] truncate">
                {firstName}
              </p>
              <p className="text-[10px] text-[var(--color-text-muted)] truncate">
                Digital School
              </p>
            </div>
            <button
              onClick={onLogout}
              title="Logout"
              className="flex-shrink-0 p-1.5 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-accent-rose)] hover:bg-red-500/10 transition-all cursor-pointer"
            >
              <LogOut size={14} />
            </button>
          </div>
        ) : collapsed && profile ? (
          <button
            onClick={onLogout}
            title="Logout"
            className="w-full flex items-center justify-center py-2.5 mb-2 rounded-xl text-[var(--color-text-muted)] hover:text-[var(--color-accent-rose)] hover:bg-red-500/10 transition-all cursor-pointer"
          >
            <LogOut size={16} />
          </button>
        ) : null}
        <button
          onClick={onToggleCollapse}
          className="w-full flex items-center justify-center py-2 rounded-xl text-[var(--color-text-muted)] hover:text-[var(--color-primary-light)] transition-colors cursor-pointer"
        >
          {collapsed ? <ChevronRight size={15} /> : <ChevronLeft size={15} />}
        </button>
      </div>
    </motion.aside>
  );
}
