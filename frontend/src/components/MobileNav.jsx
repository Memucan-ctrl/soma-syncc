/**
 * SomaSync — Mobile Bottom Navigation
 * iOS/Android-style bottom tab bar for mobile users.
 */

import { motion } from "framer-motion";
import {
  LayoutDashboard,
  Sparkles,
  Layers,
  BookOpen,
  CalendarClock,
  MoreHorizontal,
  GitBranch,
  Shield,
  Sun,
  Moon,
  LogOut,
  X,
} from "lucide-react";
import { useState } from "react";
import { useTheme } from "../contexts/ThemeContext";

const mainTabs = [
  { id: "home", label: "Home", icon: LayoutDashboard },
  { id: "ai", label: "AI", icon: Sparkles },
  { id: "moodle", label: "Study", icon: Layers },
  { id: "flashcards", label: "Cards", icon: BookOpen },
  { id: "timetable", label: "Planner", icon: CalendarClock },
];

export default function MobileNav({ activeTab, onTabChange, profile, onLogout, isAdmin = false }) {
  const [moreOpen, setMoreOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();

  const handleTabChange = (id) => {
    onTabChange(id);
    setMoreOpen(false);
  };

  return (
    <>
      {/* More Menu Overlay */}
      {moreOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[90]"
          style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}
          onClick={() => setMoreOpen(false)}
        />
      )}

      {/* More Menu Sheet */}
      {moreOpen && (
        <motion.div
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", damping: 28, stiffness: 300 }}
          className="fixed bottom-[68px] left-0 right-0 z-[91] rounded-t-2xl border-t border-[var(--color-border-subtle)] p-4 space-y-1"
          style={{ background: "var(--color-base-900)" }}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-[var(--color-text-primary)]">More Options</span>
            <button
              onClick={() => setMoreOpen(false)}
              className="p-1.5 rounded-lg text-[var(--color-text-muted)] hover:text-white transition-colors"
            >
              <X size={16} />
            </button>
          </div>

          <button
            onClick={() => handleTabChange("git")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
              activeTab === "git"
                ? "bg-[rgba(99,102,241,0.1)] text-[var(--color-primary-light)]"
                : "text-[var(--color-text-secondary)] hover:bg-[rgba(255,255,255,0.03)]"
            }`}
          >
            <GitBranch size={18} />
            DevTracker
          </button>

          {isAdmin && (
            <button
              onClick={() => handleTabChange("admin")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                activeTab === "admin"
                  ? "bg-[rgba(99,102,241,0.1)] text-[var(--color-primary-light)]"
                  : "text-[var(--color-text-secondary)] hover:bg-[rgba(255,255,255,0.03)]"
              }`}
            >
              <Shield size={18} />
              Admin Panel
            </button>
          )}

          <button
            onClick={toggleTheme}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-[var(--color-text-secondary)] hover:bg-[rgba(255,255,255,0.03)] transition-all"
          >
            {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
            {theme === "dark" ? "Light Mode" : "Dark Mode"}
          </button>

          {profile && (
            <div className="pt-2 mt-2 border-t border-[var(--color-border-subtle)]">
              <div className="flex items-center justify-between px-4 py-2">
                <div>
                  <p className="text-xs font-medium text-[var(--color-text-primary)]">
                    {profile?.lastname?.split(" ")?.[0] || "Student"}
                  </p>
                  <p className="text-[10px] text-[var(--color-text-muted)]">Digital School</p>
                </div>
                <button
                  onClick={onLogout}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-[var(--color-accent-rose)] hover:bg-red-500/10 transition-all"
                >
                  <LogOut size={14} />
                  Logout
                </button>
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* Bottom Tab Bar */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-[100] flex md:hidden border-t border-[var(--color-border-subtle)]"
        style={{
          background: "var(--color-base-900)",
          paddingBottom: "env(safe-area-inset-bottom, 0px)",
        }}
      >
        {mainTabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className="flex-1 flex flex-col items-center justify-center py-2 pt-2.5 gap-0.5 relative transition-colors"
              style={{ color: isActive ? "var(--color-primary-light)" : "var(--color-text-muted)" }}
            >
              {isActive && (
                <motion.div
                  layoutId="mobile-tab-indicator"
                  className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-[3px] rounded-b-full"
                  style={{ background: "var(--color-primary)" }}
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <Icon size={20} strokeWidth={isActive ? 2.2 : 1.5} />
              <span className="text-[9px] font-semibold tracking-wide">{tab.label}</span>
            </button>
          );
        })}

        {/* More button */}
        <button
          onClick={() => setMoreOpen(!moreOpen)}
          className="flex-1 flex flex-col items-center justify-center py-2 pt-2.5 gap-0.5 transition-colors"
          style={{ color: moreOpen || ["git", "admin"].includes(activeTab) ? "var(--color-primary-light)" : "var(--color-text-muted)" }}
        >
          <MoreHorizontal size={20} strokeWidth={1.5} />
          <span className="text-[9px] font-semibold tracking-wide">More</span>
        </button>
      </nav>
    </>
  );
}
