/**
 * SomaSync — Mobile Bottom Navigation (v2 — Theme-Aware, Polished)
 * iOS/Android-style bottom tab bar for mobile users.
 */

import { motion, AnimatePresence } from "framer-motion";
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
  Settings,
} from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useTheme } from "../contexts/ThemeContext";

const mainTabs = [
  { id: "home", label: "Home", icon: LayoutDashboard },
  { id: "ai", label: "AI", icon: Sparkles },
  { id: "moodle", label: "Study", icon: Layers },
  { id: "flashcards", label: "Cards", icon: BookOpen },
  { id: "timetable", label: "Planner", icon: CalendarClock },
];

export default function MobileNav({ activeTab, onTabChange, profile, onLogout, isAdmin = false, settings = {} }) {
  const [moreOpen, setMoreOpen] = useState(false);
  const filteredTabs = mainTabs.filter((tab) => {
    if (tab.id === "ai") return settings.aiEnabled !== false;
    if (tab.id === "flashcards") return settings.flashcardsEnabled !== false;
    if (tab.id === "timetable") return settings.timetableEnabled !== false;
    return true;
  });
  const { theme, toggleTheme } = useTheme();
  const sheetRef = useRef(null);

  // Close more menu when clicking outside
  useEffect(() => {
    if (!moreOpen) return;
    const handler = (e) => {
      if (sheetRef.current && !sheetRef.current.contains(e.target)) {
        setMoreOpen(false);
      }
    };
    // Delay to avoid immediate close from the same click
    const timeout = setTimeout(() => {
      document.addEventListener("click", handler);
    }, 100);
    return () => {
      clearTimeout(timeout);
      document.removeEventListener("click", handler);
    };
  }, [moreOpen]);

  const handleTabChange = (id) => {
    onTabChange(id);
    setMoreOpen(false);
  };

  const isMoreActive = moreOpen || ["git", "admin"].includes(activeTab);

  return (
    <>
      {/* More Menu Overlay */}
      <AnimatePresence>
        {moreOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[90]"
            style={{ background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)" }}
            onClick={() => setMoreOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* More Menu Sheet */}
      <AnimatePresence>
        {moreOpen && (
          <motion.div
            ref={sheetRef}
            initial={{ y: "100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed bottom-[68px] left-3 right-3 z-[91] rounded-2xl border border-[var(--color-border-subtle)] p-4 space-y-1 shadow-2xl"
            style={{ background: "var(--color-base-900)" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drag indicator */}
            <div className="flex justify-center mb-2">
              <div className="w-8 h-1 rounded-full bg-[var(--color-base-500)]" />
            </div>

            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-[var(--color-text-primary)]">More Options</span>
              <button
                onClick={() => setMoreOpen(false)}
                className="p-1.5 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {settings.devTrackerEnabled !== false && (
              <button
                onClick={() => handleTabChange("git")}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                  activeTab === "git"
                    ? "bg-[rgba(99,102,241,0.1)] text-[var(--color-primary-light)]"
                    : "text-[var(--color-text-secondary)] hover:bg-[rgba(99,102,241,0.04)]"
                }`}
              >
                <GitBranch size={18} />
                DevTracker
              </button>
            )}

            <button
              onClick={() => handleTabChange("admin")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                activeTab === "admin"
                  ? "bg-[rgba(99,102,241,0.1)] text-[var(--color-primary-light)]"
                  : "text-[var(--color-text-secondary)] hover:bg-[rgba(99,102,241,0.04)]"
              }`}
            >
              <Shield size={18} />
              Admin Panel
            </button>

            <div className="border-t border-[var(--color-border-subtle)] my-2" />

            <button
              onClick={() => { toggleTheme(); }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-[var(--color-text-secondary)] hover:bg-[rgba(99,102,241,0.04)] transition-all cursor-pointer"
            >
              {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
              {theme === "dark" ? "Light Mode" : "Dark Mode"}
              <span className="ml-auto text-[10px] text-[var(--color-text-muted)] capitalize">{theme}</span>
            </button>

            {profile && (
              <div className="pt-2 mt-1 border-t border-[var(--color-border-subtle)]">
                <div className="flex items-center justify-between px-4 py-2.5">
                  <div>
                    <p className="text-xs font-medium text-[var(--color-text-primary)]">
                      {profile?.lastname?.split(" ")?.[0] || "Student"}
                    </p>
                    <p className="text-[10px] text-[var(--color-text-muted)]">Digital School</p>
                  </div>
                  <button
                    onClick={onLogout}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-[var(--color-accent-rose)] hover:bg-red-500/10 transition-all cursor-pointer"
                  >
                    <LogOut size={14} />
                    Logout
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom Tab Bar */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-[100] flex md:hidden border-t border-[var(--color-border-subtle)]"
        style={{
          background: "var(--color-base-900)",
          paddingBottom: "env(safe-area-inset-bottom, 0px)",
        }}
      >
        {filteredTabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className="flex-1 flex flex-col items-center justify-center py-2 pt-2.5 gap-0.5 relative transition-colors cursor-pointer"
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
              <motion.div
                animate={{ scale: isActive ? 1 : 1 }}
                whileTap={{ scale: 0.85 }}
              >
                <Icon size={20} strokeWidth={isActive ? 2.2 : 1.5} />
              </motion.div>
              <span className={`text-[9px] font-semibold tracking-wide ${isActive ? "text-[var(--color-primary-light)]" : ""}`}>
                {tab.label}
              </span>
            </button>
          );
        })}

        {/* More button */}
        <button
          onClick={(e) => { e.stopPropagation(); setMoreOpen(!moreOpen); }}
          className="flex-1 flex flex-col items-center justify-center py-2 pt-2.5 gap-0.5 transition-colors cursor-pointer"
          style={{ color: isMoreActive ? "var(--color-primary-light)" : "var(--color-text-muted)" }}
        >
          {isMoreActive && !moreOpen && (
            <motion.div
              layoutId="mobile-tab-indicator"
              className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-[3px] rounded-b-full"
              style={{ background: "var(--color-primary)" }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
            />
          )}
          <motion.div whileTap={{ scale: 0.85 }}>
            <MoreHorizontal size={20} strokeWidth={1.5} />
          </motion.div>
          <span className={`text-[9px] font-semibold tracking-wide ${isMoreActive ? "text-[var(--color-primary-light)]" : ""}`}>
            More
          </span>
        </button>
      </nav>
    </>
  );
}
