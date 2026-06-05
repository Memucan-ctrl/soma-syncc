/**
 * SomaSync — Sidebar Navigation (v2 — Premium Design)
 */

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  RefreshCw,
  GitBranch,
  Layers,
  CalendarClock,
  Settings,
  ChevronLeft,
  ChevronRight,
  Zap,
  LogOut,
  BookOpen,
} from "lucide-react";

const navItems = [
  { id: "home", label: "Home", icon: LayoutDashboard },
  { id: "moodle", label: "Asset Manager", icon: Layers },
  { id: "git", label: "Git Visualizer", icon: GitBranch },
  { id: "flashcards", label: "Flashcards", icon: BookOpen },
  { id: "timetable", label: "Timetable", icon: CalendarClock },
];

export default function Sidebar({ activeTab, onTabChange, profile, onLogout }) {
  const [collapsed, setCollapsed] = useState(false);

  const firstName = profile?.lastname?.split(" ")?.[0] || "Student";

  return (
    <motion.aside
      animate={{ width: collapsed ? 68 : 240 }}
      transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
      className="fixed left-0 top-0 h-screen z-50 flex flex-col"
      style={{
        background: "var(--color-base-900)",
        borderRight: "1px solid var(--color-border-subtle)",
      }}
    >
      {/* ─── Logo ──────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 px-4 py-5 min-h-[68px]">
        <div
          className="flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: "linear-gradient(135deg, #6366F1, #818CF8)" }}
        >
          <Zap size={18} className="text-white" />
        </div>
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
              Live · Zetech Moodle
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Nav ───────────────────────────────────────────────────── */}
      <nav className="flex-1 px-3 space-y-0.5">
        {navItems.map((item) => {
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
      </nav>

      {/* ─── Footer ────────────────────────────────────────────────── */}
      <div className="px-3 pb-4 space-y-1">
        {!collapsed && profile ? (
          <div className="px-3 py-3 mb-2 rounded-xl flex items-center justify-between gap-2" style={{ background: "rgba(99, 102, 241, 0.05)" }}>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-[var(--color-text-primary)] truncate">
                {firstName}
              </p>
              <p className="text-[10px] text-[var(--color-text-muted)] truncate">
                Zetech Digital School
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
          onClick={() => setCollapsed(!collapsed)}
          className="w-full flex items-center justify-center py-2 rounded-xl text-[var(--color-text-muted)] hover:text-[var(--color-primary-light)] transition-colors cursor-pointer"
        >
          {collapsed ? <ChevronRight size={15} /> : <ChevronLeft size={15} />}
        </button>
      </div>
    </motion.aside>
  );
}
