/**
 * SomaSync — Study Planner (v4 — Bulk Actions, ICS Export, Google Calendar, Mobile Day View)
 * Professional timetable with export, bulk operations, and mobile-responsive layout.
 */

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CalendarDays,
  Plus,
  Trash2,
  Edit3,
  Check,
  X,
  BookOpen,
  Coffee,
  Code,
  FileText,
  Users,
  Dumbbell,
  Sparkles,
  Download,
  Calendar,
  CheckSquare,
  Square,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
} from "lucide-react";
import {
  generateICSCalendar,
  generateGoogleCalendarUrl,
  downloadICS,
} from "../utils/icsGenerator";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const DAY_FULL = { Mon: "Monday", Tue: "Tuesday", Wed: "Wednesday", Thu: "Thursday", Fri: "Friday", Sat: "Saturday", Sun: "Sunday" };
const HOURS = Array.from({ length: 16 }, (_, i) => i + 6);
const STORAGE_KEY = "somasync_study_planner";

const CATEGORIES = [
  { id: "lecture", label: "Lecture", icon: BookOpen, color: "#6366F1", bg: "rgba(99,102,241,0.15)" },
  { id: "study", label: "Study", icon: FileText, color: "#22D3EE", bg: "rgba(34,211,238,0.15)" },
  { id: "lab", label: "Lab", icon: Code, color: "#34D399", bg: "rgba(52,211,153,0.15)" },
  { id: "group", label: "Group", icon: Users, color: "#F472B6", bg: "rgba(244,114,182,0.15)" },
  { id: "revision", label: "Revision", icon: Sparkles, color: "#FBBF24", bg: "rgba(251,191,36,0.15)" },
  { id: "break", label: "Break", icon: Coffee, color: "#94A3B8", bg: "rgba(148,163,184,0.15)" },
  { id: "exercise", label: "Exercise", icon: Dumbbell, color: "#FB7185", bg: "rgba(251,113,133,0.15)" },
];

const defaultEvents = () => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    try { return JSON.parse(stored); } catch { return {}; }
  }
  return {
    Mon: [
      { id: "s1", title: "Database Systems", time: "08:30", endTime: "10:30", category: "lecture", notes: "" },
      { id: "s2", title: "System Analysis Review", time: "14:00", endTime: "15:30", category: "revision", notes: "" },
    ],
    Tue: [{ id: "s3", title: "Operating Systems Lab", time: "10:00", endTime: "12:00", category: "lab", notes: "" }],
    Wed: [{ id: "s4", title: "Electronics Study Group", time: "09:00", endTime: "11:00", category: "group", notes: "" }],
    Thu: [],
    Fri: [{ id: "s5", title: "HCI Lecture", time: "14:00", endTime: "16:00", category: "lecture", notes: "" }],
    Sat: [{ id: "s6", title: "Weekend Revision", time: "10:00", endTime: "13:00", category: "study", notes: "" }],
    Sun: [{ id: "s7", title: "Rest & Recharge", time: "10:00", endTime: "11:00", category: "break", notes: "" }],
  };
};

function timeToMinutes(time) {
  if (!time) return 0;
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

function hasConflict(event, dayEvents) {
  const start = timeToMinutes(event.time);
  const end = timeToMinutes(event.endTime || event.time);
  return dayEvents.some((other) => {
    if (other.id === event.id) return false;
    const oStart = timeToMinutes(other.time);
    const oEnd = timeToMinutes(other.endTime || other.time);
    return start < oEnd && end > oStart;
  });
}

function getCurrentTimePosition() {
  const now = new Date();
  const h = now.getHours();
  const m = now.getMinutes();
  if (h < 6 || h > 21) return null;
  return ((h - 6) + m / 60) / 16 * 100;
}

export default function StudyPlanner() {
  const [events, setEvents] = useState(defaultEvents);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formDay, setFormDay] = useState("Mon");
  const [formTitle, setFormTitle] = useState("");
  const [formTime, setFormTime] = useState("09:00");
  const [formEndTime, setFormEndTime] = useState("10:00");
  const [formCategory, setFormCategory] = useState("study");
  const [formNotes, setFormNotes] = useState("");

  // Bulk actions
  const [selectedEvents, setSelectedEvents] = useState(new Set());
  const [bulkMode, setBulkMode] = useState(false);

  // Mobile day view
  const [mobileDay, setMobileDay] = useState(() => {
    return new Date().toLocaleDateString("en-US", { weekday: "short" });
  });

  // Export menu
  const [showExport, setShowExport] = useState(false);

  // Current time indicator
  const [timePos, setTimePos] = useState(getCurrentTimePosition);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
  }, [events]);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimePos(getCurrentTimePosition());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const resetForm = () => {
    setFormTitle(""); setFormTime("09:00"); setFormEndTime("10:00");
    setFormCategory("study"); setFormNotes(""); setEditingId(null); setShowForm(false);
  };

  const openForm = (day, hour = null) => {
    resetForm();
    setFormDay(day);
    if (hour !== null) {
      setFormTime(`${String(hour).padStart(2, "0")}:00`);
      setFormEndTime(`${String(hour + 1).padStart(2, "0")}:00`);
    }
    setShowForm(true);
  };

  const handleAddOrUpdate = () => {
    if (!formTitle.trim()) return;
    const eventObj = {
      id: editingId || `evt-${Date.now()}`,
      title: formTitle.trim(),
      time: formTime,
      endTime: formEndTime,
      category: formCategory,
      notes: formNotes.trim(),
    };
    setEvents((prev) => {
      const dayEvents = [...(prev[formDay] || [])];
      if (editingId) {
        const idx = dayEvents.findIndex((e) => e.id === editingId);
        if (idx !== -1) dayEvents[idx] = eventObj;
      } else {
        dayEvents.push(eventObj);
      }
      dayEvents.sort((a, b) => a.time.localeCompare(b.time));
      return { ...prev, [formDay]: dayEvents };
    });
    resetForm();
  };

  const handleEdit = (day, event) => {
    setFormDay(day);
    setFormTitle(event.title);
    setFormTime(event.time);
    setFormEndTime(event.endTime || "");
    setFormCategory(event.category);
    setFormNotes(event.notes || "");
    setEditingId(event.id);
    setShowForm(true);
  };

  const handleDelete = (day, eventId) => {
    setEvents((prev) => ({ ...prev, [day]: (prev[day] || []).filter((e) => e.id !== eventId) }));
    setSelectedEvents((prev) => { const next = new Set(prev); next.delete(`${day}-${eventId}`); return next; });
  };

  // ─── Bulk Actions ───────────────────────────────────────────────
  const toggleEventSelection = (day, eventId) => {
    const key = `${day}-${eventId}`;
    setSelectedEvents((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const selectAll = () => {
    const all = new Set();
    DAYS.forEach((day) => {
      (events[day] || []).forEach((e) => all.add(`${day}-${e.id}`));
    });
    setSelectedEvents(all);
  };

  const deselectAll = () => setSelectedEvents(new Set());

  const bulkDelete = () => {
    setEvents((prev) => {
      const next = { ...prev };
      DAYS.forEach((day) => {
        next[day] = (next[day] || []).filter((e) => !selectedEvents.has(`${day}-${e.id}`));
      });
      return next;
    });
    setSelectedEvents(new Set());
    setBulkMode(false);
  };

  const bulkChangeCategory = (newCat) => {
    setEvents((prev) => {
      const next = { ...prev };
      DAYS.forEach((day) => {
        next[day] = (next[day] || []).map((e) =>
          selectedEvents.has(`${day}-${e.id}`) ? { ...e, category: newCat } : e
        );
      });
      return next;
    });
  };

  const bulkMoveToDay = (targetDay) => {
    setEvents((prev) => {
      const copy = JSON.parse(JSON.stringify(prev));
      selectedEvents.forEach((selKey) => {
        const [day, id] = selKey.split("-");
        if (day === targetDay) return;
        const list = copy[day] || [];
        const idx = list.findIndex((e) => e.id === id);
        if (idx > -1) {
          const [moved] = list.splice(idx, 1);
          copy[targetDay] = [...(copy[targetDay] || []), moved];
        }
      });
      return copy;
    });
    setSelectedEvents(new Set());
    setBulkMode(false);
  };

  const duplicateWeek = () => {
    setEvents((prev) => {
      const next = { ...prev };
      DAYS.forEach((day) => {
        next[day] = (next[day] || []).map((e) => ({ ...e, id: `evt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}` }));
      });
      return next;
    });
  };

  // ─── Export ─────────────────────────────────────────────────────
  const handleExportICS = () => {
    const ics = generateICSCalendar(events, false);
    downloadICS(ics, "somasync-timetable.ics");
    setShowExport(false);
  };

  const handleExportRecurringICS = () => {
    const ics = generateICSCalendar(events, true);
    downloadICS(ics, "somasync-recurring-timetable.ics");
    setShowExport(false);
  };

  const getCat = (catId) => CATEGORIES.find((c) => c.id === catId) || CATEGORIES[1];

  // Stats
  const totalEvents = DAYS.reduce((sum, d) => sum + (events[d]?.length || 0), 0);
  const totalHours = DAYS.reduce((sum, d) => {
    return sum + (events[d] || []).reduce((s, e) => {
      if (!e.time || !e.endTime) return s;
      const [sh, sm] = e.time.split(":").map(Number);
      const [eh, em] = e.endTime.split(":").map(Number);
      return s + (eh + em / 60) - (sh + sm / 60);
    }, 0);
  }, 0);

  const todayKey = new Date().toLocaleDateString("en-US", { weekday: "short" });

  // ─── Mobile Day View ────────────────────────────────────────────
  const renderMobileDayView = () => {
    const dayEvents = (events[mobileDay] || []).sort((a, b) => a.time.localeCompare(b.time));

    return (
      <div className="space-y-4 md:hidden">
        {/* Day Selector */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => {
              const idx = DAYS.indexOf(mobileDay);
              setMobileDay(DAYS[(idx - 1 + 7) % 7]);
            }}
            className="p-2 rounded-xl border border-[var(--color-border-subtle)] text-[var(--color-text-primary)] cursor-pointer"
          >
            <ChevronLeft size={16} />
          </button>
          <div className="flex gap-1.5 overflow-x-auto flex-1 mx-3">
            {DAYS.map((d) => (
              <button
                key={d}
                onClick={() => setMobileDay(d)}
                className={`flex-1 min-w-[42px] py-2 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                  mobileDay === d
                    ? "text-white"
                    : d === todayKey
                    ? "text-[var(--color-primary-light)] border border-[var(--color-primary)]"
                    : "text-[var(--color-text-muted)] border border-[var(--color-border-subtle)]"
                }`}
                style={mobileDay === d ? { background: "var(--color-primary)" } : {}}
              >
                {d}
              </button>
            ))}
          </div>
          <button
            onClick={() => {
              const idx = DAYS.indexOf(mobileDay);
              setMobileDay(DAYS[(idx + 1) % 7]);
            }}
            className="p-2 rounded-xl border border-[var(--color-border-subtle)] text-[var(--color-text-primary)] cursor-pointer"
          >
            <ChevronRight size={16} />
          </button>
        </div>

        <div className="text-center">
          <p className="text-sm font-bold text-[var(--color-text-primary)]">{DAY_FULL[mobileDay]}</p>
          <p className="text-[10px] text-[var(--color-text-muted)]">{dayEvents.length} events</p>
        </div>

        {/* Events List */}
        {dayEvents.length === 0 ? (
          <div className="card p-8 text-center">
            <CalendarDays size={28} className="text-[var(--color-text-muted)] mx-auto mb-2" />
            <p className="text-xs text-[var(--color-text-muted)]">No events for {DAY_FULL[mobileDay]}</p>
            <button
              onClick={() => openForm(mobileDay)}
              className="mt-3 text-xs font-semibold text-[var(--color-primary-light)] cursor-pointer"
            >
              + Add Event
            </button>
          </div>
        ) : (
          <div className="space-y-2.5">
            {dayEvents.map((evt) => {
              const cat = getCat(evt.category);
              const CatIcon = cat.icon;
              const conflict = hasConflict(evt, dayEvents);
              return (
                <motion.div
                  key={evt.id}
                  layout
                  className="card p-4 relative overflow-hidden"
                  style={{ borderLeft: `4px solid ${cat.color}` }}
                >
                  {conflict && (
                    <div className="absolute top-2 right-2">
                      <AlertTriangle size={12} className="text-[var(--color-accent-amber)]" />
                    </div>
                  )}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <CatIcon size={14} style={{ color: cat.color }} />
                        <span className="text-sm font-semibold text-[var(--color-text-primary)]">{evt.title}</span>
                      </div>
                      <p className="text-xs font-mono text-[var(--color-text-muted)]">
                        {evt.time} — {evt.endTime || "—"}
                      </p>
                      {evt.notes && (
                        <p className="text-[10px] text-[var(--color-text-muted)] mt-1 line-clamp-2">{evt.notes}</p>
                      )}
                      <span
                        className="inline-block mt-2 text-[9px] font-bold uppercase px-2 py-0.5 rounded-full"
                        style={{ background: cat.bg, color: cat.color }}
                      >
                        {cat.label}
                      </span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <a
                        href={generateGoogleCalendarUrl(evt, mobileDay)}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 rounded-lg text-[var(--color-accent-cyan)] hover:bg-[rgba(34,211,238,0.1)] transition-all"
                        title="Add to Google Calendar"
                      >
                        <Calendar size={14} />
                      </a>
                      <button
                        onClick={() => handleEdit(mobileDay, evt)}
                        className="p-1.5 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-primary-light)] cursor-pointer"
                      >
                        <Edit3 size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(mobileDay, evt.id)}
                        className="p-1.5 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-accent-rose)] cursor-pointer"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-5"
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[var(--color-text-primary)]">Study Planner</h1>
          <p className="text-sm text-[var(--color-text-muted)] mt-1">
            {totalEvents} events · {totalHours.toFixed(1)}h planned this week
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {/* Bulk mode toggle */}
          <button
            onClick={() => { setBulkMode(!bulkMode); deselectAll(); }}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-[10px] font-semibold border transition-all cursor-pointer ${
              bulkMode
                ? "bg-[rgba(99,102,241,0.1)] border-[var(--color-primary)] text-[var(--color-primary-light)]"
                : "border-[var(--color-border-subtle)] text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]"
            }`}
          >
            <CheckSquare size={12} />
            {bulkMode ? "Exit Bulk" : "Bulk Select"}
          </button>

          {/* Duplicate week */}
          <button
            onClick={duplicateWeek}
            className="hidden md:flex items-center gap-1.5 px-3 py-2 rounded-xl text-[10px] font-semibold border border-[var(--color-border-subtle)] text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] transition-all cursor-pointer"
            title="Duplicate all events with new IDs"
          >
            <CalendarDays size={12} />
            Duplicate Week
          </button>

          {/* Export */}
          <div className="relative">
            <button
              onClick={() => setShowExport(!showExport)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[10px] font-semibold border border-[var(--color-border-subtle)] text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] transition-all cursor-pointer"
            >
              <Download size={12} />
              Export
            </button>
            <AnimatePresence>
              {showExport && (
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.95 }}
                  className="absolute right-0 top-full mt-2 z-50 w-56 card p-2 space-y-1 shadow-xl"
                >
                  <button
                    onClick={handleExportICS}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-medium text-[var(--color-text-secondary)] hover:bg-[rgba(99,102,241,0.05)] hover:text-[var(--color-text-primary)] transition-all cursor-pointer text-left"
                  >
                    <Download size={13} />
                    Download .ics (one-time)
                  </button>
                  <button
                    onClick={handleExportRecurringICS}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-medium text-[var(--color-text-secondary)] hover:bg-[rgba(99,102,241,0.05)] hover:text-[var(--color-text-primary)] transition-all cursor-pointer text-left"
                  >
                    <Calendar size={13} />
                    Download .ics (weekly recurring)
                  </button>
                  <div className="border-t border-[var(--color-border-subtle)] my-1" />
                  <p className="px-3 py-1.5 text-[10px] text-[var(--color-text-muted)] leading-relaxed">
                    Import the .ics file into Google Calendar, Apple Calendar, or Outlook.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Add Event */}
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => openForm(todayKey || "Mon")}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white cursor-pointer"
            style={{ background: "linear-gradient(135deg, #6366F1, #818CF8)" }}
          >
            <Plus size={14} /> Add Event
          </motion.button>
        </div>
      </div>

      {/* Bulk Actions Bar */}
      <AnimatePresence>
        {bulkMode && selectedEvents.size > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="card p-3 flex flex-wrap items-center gap-2 bg-[rgba(99,102,241,0.04)]">
              <span className="text-xs font-semibold text-[var(--color-primary-light)]">
                {selectedEvents.size} selected
              </span>
              <div className="flex-1" />
              <button onClick={selectAll} className="text-[10px] px-2.5 py-1.5 rounded-lg border border-[var(--color-border-subtle)] text-[var(--color-text-muted)] hover:text-white cursor-pointer transition-all font-semibold">
                Select All
              </button>
              <button onClick={deselectAll} className="text-[10px] px-2.5 py-1.5 rounded-lg border border-[var(--color-border-subtle)] text-[var(--color-text-muted)] hover:text-white cursor-pointer transition-all font-semibold">
                Deselect
              </button>

              {/* Bulk category change */}
              <select
                onChange={(e) => { if (e.target.value) bulkChangeCategory(e.target.value); e.target.value = ""; }}
                defaultValue=""
                className="text-[10px] px-2.5 py-1.5 rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-base-950)] text-[var(--color-text-secondary)] cursor-pointer font-semibold"
              >
                <option value="" disabled>Change Category</option>
                {CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
              </select>

              {/* Bulk move to different day */}
              <select
                onChange={(e) => { if (e.target.value) bulkMoveToDay(e.target.value); e.target.value = ""; }}
                defaultValue=""
                className="text-[10px] px-2.5 py-1.5 rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-base-950)] text-[var(--color-text-secondary)] cursor-pointer font-semibold"
              >
                <option value="" disabled>Move to Day</option>
                {DAYS.map((d) => <option key={d} value={d}>{DAY_FULL[d]}</option>)}
              </select>

              <button
                onClick={bulkDelete}
                className="text-[10px] px-2.5 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-[var(--color-accent-rose)] hover:bg-red-500/20 cursor-pointer transition-all font-semibold flex items-center gap-1"
              >
                <Trash2 size={10} /> Delete Selected
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Mobile Day View ──────────────────────────────────────── */}
      {renderMobileDayView()}

      {/* ─── Desktop Weekly Grid ──────────────────────────────────── */}
      <div className="card overflow-hidden hidden md:block" style={{ background: "rgba(17,21,36,0.4)" }}>
        <div className="overflow-x-auto">
          <div className="min-w-[800px] relative">
            {/* Day headers */}
            <div className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-[var(--color-border-subtle)]">
              <div className="p-3 text-[10px] text-[var(--color-text-muted)] font-mono"></div>
              {DAYS.map((day) => {
                const isToday = day === todayKey;
                return (
                  <div
                    key={day}
                    className={`p-3 text-center border-l border-[var(--color-border-subtle)] ${isToday ? "bg-[rgba(99,102,241,0.04)]" : ""}`}
                  >
                    <p className={`text-xs font-bold ${isToday ? "text-[var(--color-primary-light)]" : "text-[var(--color-text-primary)]"}`}>
                      {day}
                    </p>
                    <p className="text-[10px] text-[var(--color-text-muted)] mt-0.5">{(events[day] || []).length} events</p>
                  </div>
                );
              })}
            </div>

            {/* Current time indicator */}
            {timePos !== null && (
              <div
                className="absolute left-[60px] right-0 z-20 pointer-events-none"
                style={{ top: `calc(${timePos}% + 48px)` }}
              >
                <div className="flex items-center">
                  <div className="w-2 h-2 rounded-full bg-[var(--color-accent-rose)] shadow-[0_0_6px_var(--color-accent-rose)]" />
                  <div className="flex-1 h-[1.5px] bg-[var(--color-accent-rose)] opacity-40" />
                </div>
              </div>
            )}

            {/* Time grid rows */}
            {HOURS.map((hour) => (
              <div key={hour} className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-[rgba(255,255,255,0.02)]">
                <div className="p-2 text-[10px] text-[var(--color-text-muted)] font-mono text-right pr-3 pt-3">
                  {hour > 12 ? `${hour - 12} PM` : hour === 12 ? "12 PM" : `${hour} AM`}
                </div>

                {DAYS.map((day) => {
                  const isToday = day === todayKey;
                  const dayEvts = (events[day] || []).filter((e) => {
                    const h = parseInt(e.time?.split(":")?.[0] || "0", 10);
                    return h === hour;
                  });

                  return (
                    <div
                      key={day}
                      className={`min-h-[48px] border-l border-[var(--color-border-subtle)] p-1 relative cursor-pointer hover:bg-[rgba(99,102,241,0.02)] transition-colors ${isToday ? "bg-[rgba(99,102,241,0.015)]" : ""}`}
                      onClick={() => !bulkMode && openForm(day, hour)}
                    >
                      {dayEvts.map((evt) => {
                        const cat = getCat(evt.category);
                        const CatIcon = cat.icon;
                        const conflict = hasConflict(evt, events[day] || []);
                        const isSelected = selectedEvents.has(`${day}-${evt.id}`);
                        return (
                          <div
                            key={evt.id}
                            className={`group rounded-lg p-1.5 mb-1 relative overflow-hidden cursor-default ${isSelected ? "ring-2 ring-[var(--color-primary)]" : ""}`}
                            style={{
                              background: cat.bg,
                              borderLeft: `3px solid ${cat.color}`,
                              borderRight: conflict ? "2px solid var(--color-accent-amber)" : "none",
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (bulkMode) toggleEventSelection(day, evt.id);
                            }}
                          >
                            <div className="flex items-center justify-between gap-1">
                              <div className="flex items-center gap-1 min-w-0">
                                {bulkMode && (
                                  isSelected
                                    ? <CheckSquare size={10} style={{ color: cat.color }} className="flex-shrink-0" />
                                    : <Square size={10} style={{ color: cat.color }} className="flex-shrink-0" />
                                )}
                                <CatIcon size={10} style={{ color: cat.color }} className="flex-shrink-0" />
                                <span className="text-[10px] font-semibold truncate" style={{ color: cat.color }}>
                                  {evt.title}
                                </span>
                              </div>
                              {!bulkMode && (
                                <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                                  <a
                                    href={generateGoogleCalendarUrl(evt, day)}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="p-0.5 rounded text-[var(--color-accent-cyan)] hover:bg-[rgba(34,211,238,0.1)] cursor-pointer"
                                    title="Add to Google Calendar"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <Calendar size={10} />
                                  </a>
                                  <button onClick={(e) => { e.stopPropagation(); handleEdit(day, evt); }} className="p-0.5 rounded text-[var(--color-text-muted)] hover:text-[var(--color-primary-light)] cursor-pointer">
                                    <Edit3 size={10} />
                                  </button>
                                  <button onClick={(e) => { e.stopPropagation(); handleDelete(day, evt.id); }} className="p-0.5 rounded text-[var(--color-text-muted)] hover:text-[var(--color-accent-rose)] cursor-pointer">
                                    <Trash2 size={10} />
                                  </button>
                                </div>
                              )}
                            </div>
                            <p className="text-[9px] font-mono mt-0.5" style={{ color: `${cat.color}AA` }}>
                              {evt.time}{evt.endTime ? ` - ${evt.endTime}` : ""}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ─── Add/Edit Modal ────────────────────────────────────────── */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4"
            style={{ background: "rgba(4,6,14,0.8)", backdropFilter: "blur(6px)" }}
            onClick={() => resetForm()}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="card p-6 w-full max-w-md space-y-4"
              style={{ border: "1px solid rgba(99,102,241,0.2)" }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-[var(--color-text-primary)]">
                  {editingId ? "Edit Event" : "New Event"}
                </h3>
                <button onClick={resetForm} className="p-1.5 rounded-lg hover:bg-[rgba(255,255,255,0.05)] text-[var(--color-text-muted)] hover:text-white transition-all cursor-pointer">
                  <X size={16} />
                </button>
              </div>

              <input
                type="text"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                placeholder="Event title"
                className="w-full text-sm py-2.5 px-4 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-base-950)] text-[var(--color-text-primary)] outline-none focus:border-[var(--color-primary-light)] transition-colors placeholder:text-[var(--color-text-muted)]"
                autoFocus
              />

              {/* Day selector */}
              <div>
                <label className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-wider block mb-1.5 font-semibold">Day</label>
                <div className="flex gap-1.5">
                  {DAYS.map((d) => (
                    <button
                      key={d}
                      onClick={() => setFormDay(d)}
                      className="flex-1 text-[10px] font-semibold py-2 rounded-lg border transition-all cursor-pointer"
                      style={{
                        background: formDay === d ? "var(--color-primary)" : "transparent",
                        color: formDay === d ? "#fff" : "var(--color-text-muted)",
                        borderColor: formDay === d ? "var(--color-primary)" : "var(--color-border-subtle)",
                      }}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-wider block mb-1.5 font-semibold">Start</label>
                  <input type="time" value={formTime} onChange={(e) => setFormTime(e.target.value)} className="w-full text-sm py-2 px-3 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-base-950)] text-[var(--color-text-primary)] outline-none focus:border-[var(--color-primary-light)]" />
                </div>
                <div className="flex-1">
                  <label className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-wider block mb-1.5 font-semibold">End</label>
                  <input type="time" value={formEndTime} onChange={(e) => setFormEndTime(e.target.value)} className="w-full text-sm py-2 px-3 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-base-950)] text-[var(--color-text-primary)] outline-none focus:border-[var(--color-primary-light)]" />
                </div>
              </div>

              {/* Category */}
              <div>
                <label className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-wider block mb-2 font-semibold">Category</label>
                <div className="flex flex-wrap gap-1.5">
                  {CATEGORIES.map((cat) => {
                    const CatIcon = cat.icon;
                    const isActive = formCategory === cat.id;
                    return (
                      <button
                        key={cat.id}
                        onClick={() => setFormCategory(cat.id)}
                        className="flex items-center gap-1 text-[10px] font-semibold px-2.5 py-1.5 rounded-lg transition-all cursor-pointer border"
                        style={{
                          background: isActive ? cat.bg : "transparent",
                          borderColor: isActive ? cat.color : "var(--color-border-subtle)",
                          color: isActive ? cat.color : "var(--color-text-muted)",
                        }}
                      >
                        <CatIcon size={10} /> {cat.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <textarea
                value={formNotes}
                onChange={(e) => setFormNotes(e.target.value)}
                placeholder="Notes (optional)"
                rows={2}
                className="w-full text-xs py-2.5 px-4 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-base-950)] text-[var(--color-text-secondary)] outline-none focus:border-[var(--color-primary-light)] resize-none placeholder:text-[var(--color-text-muted)]"
              />

              <div className="flex gap-2 justify-end pt-1">
                <button onClick={resetForm} className="px-4 py-2 rounded-xl text-xs font-semibold text-[var(--color-text-muted)] hover:text-white border border-[var(--color-border-subtle)] transition-all cursor-pointer">
                  Cancel
                </button>
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={handleAddOrUpdate}
                  disabled={!formTitle.trim()}
                  className="px-5 py-2 rounded-xl text-xs font-semibold text-white disabled:opacity-30 cursor-pointer flex items-center gap-1.5"
                  style={{ background: "linear-gradient(135deg, #6366F1, #818CF8)" }}
                >
                  <Check size={13} />
                  {editingId ? "Save" : "Add"}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
