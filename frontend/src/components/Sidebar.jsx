/**
 * SomaSync — Sidebar Navigation Component
 * Full-height left sidebar with branding, connection status, and nav links.
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
} from "lucide-react";

const navItems = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "moodle", label: "Moodle Sync Bridge", icon: RefreshCw },
  { id: "git", label: "Git Workflow Visualizer", icon: GitBranch },
  { id: "flashcards", label: "Flashcards", icon: Layers },
  { id: "timetable", label: "Smart Timetable", icon: CalendarClock },
];

export default function Sidebar({ activeTab, onTabChange }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <motion.aside
      animate={{ width: collapsed ? 72 : 260 }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      className="fixed left-0 top-0 h-screen z-50 flex flex-col"
      style={{
        background: "linear-gradient(180deg, #0E1425 0%, #0B0F19 100%)",
        borderRight: "1px solid rgba(34, 211, 238, 0.08)",
      }}
    >
      {/* ─── Logo ──────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 px-5 py-6 min-h-[80px]">
        <motion.div
          whileHover={{ rotate: 180 }}
          transition={{ duration: 0.6 }}
          className="flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center"
          style={{
            background: "linear-gradient(135deg, #22D3EE, #3B82F6)",
          }}
        >
          <Zap size={20} className="text-white" />
        </motion.div>
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
            >
              <h1 className="text-lg font-bold tracking-tight">
                <span className="text-cyan-400">Soma</span>
                <span className="text-slate-100">Sync</span>
                <span className="text-slate-500 text-xs font-normal">.tech</span>
              </h1>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ─── Connection Badge ──────────────────────────────────────────── */}
      <AnimatePresence>
        {!collapsed && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="px-5 mb-4"
          >
            <div
              className="status-badge"
              style={{
                background: "rgba(52, 211, 153, 0.1)",
                border: "1px solid rgba(52, 211, 153, 0.2)",
                color: "#34D399",
              }}
            >
              <span className="pulse-dot" />
              MOODLE CONNECTED
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Navigation ────────────────────────────────────────────────── */}
      <nav className="flex-1 px-3 space-y-1">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          const Icon = item.icon;

          return (
            <motion.button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              whileHover={{ x: 4 }}
              whileTap={{ scale: 0.97 }}
              className={`
                w-full flex items-center gap-3 px-3 py-2.5 rounded-xl
                text-sm font-medium transition-colors duration-200 cursor-pointer
                ${isActive
                  ? "text-cyan-400"
                  : "text-slate-400 hover:text-slate-200"
                }
              `}
              style={isActive ? {
                background: "rgba(34, 211, 238, 0.08)",
                borderLeft: "2px solid #22D3EE",
              } : {
                borderLeft: "2px solid transparent",
              }}
            >
              <Icon size={18} strokeWidth={isActive ? 2.5 : 1.5} />
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
            </motion.button>
          );
        })}
      </nav>

      {/* ─── Footer ────────────────────────────────────────────────────── */}
      <div className="px-3 pb-4 space-y-2">
        <motion.button
          whileHover={{ x: 4 }}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
        >
          <Settings size={18} strokeWidth={1.5} />
          <AnimatePresence>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                Settings
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-full flex items-center justify-center py-2 rounded-xl text-slate-600 hover:text-cyan-400 transition-colors cursor-pointer"
          style={{ background: "rgba(34, 211, 238, 0.04)" }}
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>
    </motion.aside>
  );
}
