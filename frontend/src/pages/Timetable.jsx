/**
 * SomaSync — Study Planner (CRUD)
 * A premium weekly study planner where students can create, edit, and delete
 * study events for each day. Data persists in localStorage.
 */

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CalendarDays,
  Clock,
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
} from "lucide-react";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const STORAGE_KEY = "somasync_study_planner";

const CATEGORIES = [
  { id: "lecture", label: "Lecture", icon: BookOpen, color: "#6366F1", bg: "rgba(99,102,241,0.10)" },
  { id: "study", label: "Study Session", icon: FileText, color: "#22D3EE", bg: "rgba(34,211,238,0.10)" },
  { id: "lab", label: "Lab / Practical", icon: Code, color: "#34D399", bg: "rgba(52,211,153,0.10)" },
  { id: "group", label: "Group Work", icon: Users, color: "#F472B6", bg: "rgba(244,114,182,0.10)" },
  { id: "revision", label: "Revision", icon: Sparkles, color: "#FBBF24", bg: "rgba(251,191,36,0.10)" },
  { id: "break", label: "Break", icon: Coffee, color: "#94A3B8", bg: "rgba(148,163,184,0.10)" },
  { id: "exercise", label: "Exercise", icon: Dumbbell, color: "#FB7185", bg: "rgba(251,113,133,0.10)" },
];

const defaultEvents = () => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      // corrupted data, reset
    }
  }
  // seed with example events
  return {
    Monday: [
      { id: "seed-1", title: "Database Systems Lecture", time: "08:30", endTime: "10:30", category: "lecture", notes: "" },
      { id: "seed-2", title: "System Analysis Revision", time: "14:00", endTime: "15:30", category: "revision", notes: "Focus on UML diagrams" },
    ],
    Tuesday: [
      { id: "seed-3", title: "Operating Systems Lab", time: "10:00", endTime: "12:00", category: "lab", notes: "Linux terminal practice" },
    ],
    Wednesday: [
      { id: "seed-4", title: "Electronics Study Group", time: "09:00", endTime: "11:00", category: "group", notes: "" },
    ],
    Thursday: [],
    Friday: [
      { id: "seed-5", title: "User Centered Design Lecture", time: "14:00", endTime: "17:00", category: "lecture", notes: "BSD 321 — HCI concepts" },
    ],
    Saturday: [
      { id: "seed-6", title: "Weekend Revision", time: "10:00", endTime: "13:00", category: "study", notes: "Cover all week's materials" },
    ],
    Sunday: [
      { id: "seed-7", title: "Rest & Recharge", time: "10:00", endTime: "11:00", category: "break", notes: "" },
    ],
  };
};

export default function StudyPlanner() {
  const [activeDay, setActiveDay] = useState(() => {
    const today = new Date().toLocaleDateString("en-US", { weekday: "long" });
    return DAYS.includes(today) ? today : "Monday";
  });
  const [events, setEvents] = useState(defaultEvents);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // Form state
  const [formTitle, setFormTitle] = useState("");
  const [formTime, setFormTime] = useState("09:00");
  const [formEndTime, setFormEndTime] = useState("10:00");
  const [formCategory, setFormCategory] = useState("study");
  const [formNotes, setFormNotes] = useState("");

  // Persist to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
  }, [events]);

  const resetForm = () => {
    setFormTitle("");
    setFormTime("09:00");
    setFormEndTime("10:00");
    setFormCategory("study");
    setFormNotes("");
    setEditingId(null);
    setShowForm(false);
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
      const dayEvents = [...(prev[activeDay] || [])];
      if (editingId) {
        const idx = dayEvents.findIndex((e) => e.id === editingId);
        if (idx !== -1) dayEvents[idx] = eventObj;
      } else {
        dayEvents.push(eventObj);
      }
      // Sort by start time
      dayEvents.sort((a, b) => a.time.localeCompare(b.time));
      return { ...prev, [activeDay]: dayEvents };
    });

    resetForm();
  };

  const handleEdit = (event) => {
    setFormTitle(event.title);
    setFormTime(event.time);
    setFormEndTime(event.endTime || "");
    setFormCategory(event.category);
    setFormNotes(event.notes || "");
    setEditingId(event.id);
    setShowForm(true);
  };

  const handleDelete = (eventId) => {
    setEvents((prev) => ({
      ...prev,
      [activeDay]: (prev[activeDay] || []).filter((e) => e.id !== eventId),
    }));
  };

  const dayEvents = (events[activeDay] || []).sort((a, b) => a.time.localeCompare(b.time));
  const totalHours = dayEvents.reduce((sum, e) => {
    if (!e.time || !e.endTime) return sum;
    const [sh, sm] = e.time.split(":").map(Number);
    const [eh, em] = e.endTime.split(":").map(Number);
    return sum + (eh + em / 60) - (sh + sm / 60);
  }, 0);

  const getCat = (catId) => CATEGORIES.find((c) => c.id === catId) || CATEGORIES[1];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      {/* ─── Header ────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[var(--color-text-primary)]">Study Planner</h1>
          <p className="text-sm text-[var(--color-text-muted)] mt-1">
            Organize your weekly study sessions, lectures, and activities.
          </p>
        </div>

        {/* Day selector */}
        <div className="flex bg-[var(--color-base-900)] p-1 rounded-xl border border-[var(--color-border-subtle)] overflow-x-auto max-w-full">
          {DAYS.map((day) => {
            const count = (events[day] || []).length;
            return (
              <button
                key={day}
                onClick={() => { setActiveDay(day); resetForm(); }}
                className="text-xs font-semibold py-2 px-3 rounded-lg transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5"
                style={{
                  background: activeDay === day ? "var(--color-primary)" : "transparent",
                  color: activeDay === day ? "#ffffff" : "var(--color-text-secondary)",
                }}
              >
                {day.slice(0, 3)}
                {count > 0 && (
                  <span
                    className="text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center"
                    style={{
                      background: activeDay === day ? "rgba(255,255,255,0.2)" : "rgba(99,102,241,0.15)",
                      color: activeDay === day ? "#fff" : "var(--color-primary-light)",
                    }}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ─── Stats Strip ───────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-[var(--color-text-primary)]">{dayEvents.length}</p>
          <p className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-wider mt-1">Events</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-[var(--color-primary-light)]">{totalHours.toFixed(1)}h</p>
          <p className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-wider mt-1">Planned</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-[var(--color-accent-emerald)]">
            {dayEvents.filter((e) => e.category === "study" || e.category === "revision").length}
          </p>
          <p className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-wider mt-1">Study Blocks</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-[var(--color-accent-cyan)]">
            {dayEvents.filter((e) => e.category === "break").length}
          </p>
          <p className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-wider mt-1">Breaks</p>
        </div>
      </div>

      {/* ─── Add Button ────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-[var(--color-text-secondary)]">
          {activeDay}'s Schedule
        </h2>
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => { resetForm(); setShowForm(true); }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white cursor-pointer transition-all"
          style={{ background: "linear-gradient(135deg, #6366F1, #818CF8)" }}
        >
          <Plus size={14} />
          Add Event
        </motion.button>
      </div>

      {/* ─── Inline Create/Edit Form ───────────────────────────────── */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="card p-5 space-y-4 border-2 border-[var(--color-primary)] bg-[rgba(99,102,241,0.03)]">
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
                placeholder="Event title (e.g., Database Systems Revision)"
                className="w-full text-sm py-2.5 px-4 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-base-950)] text-[var(--color-text-primary)] outline-none focus:border-[var(--color-primary-light)] transition-colors placeholder:text-[var(--color-text-muted)]"
              />

              <div className="flex flex-wrap gap-3">
                <div className="flex-1 min-w-[120px]">
                  <label className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-wider block mb-1.5 font-semibold">Start</label>
                  <input
                    type="time"
                    value={formTime}
                    onChange={(e) => setFormTime(e.target.value)}
                    className="w-full text-sm py-2 px-3 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-base-950)] text-[var(--color-text-primary)] outline-none focus:border-[var(--color-primary-light)] transition-colors"
                  />
                </div>
                <div className="flex-1 min-w-[120px]">
                  <label className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-wider block mb-1.5 font-semibold">End</label>
                  <input
                    type="time"
                    value={formEndTime}
                    onChange={(e) => setFormEndTime(e.target.value)}
                    className="w-full text-sm py-2 px-3 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-base-950)] text-[var(--color-text-primary)] outline-none focus:border-[var(--color-primary-light)] transition-colors"
                  />
                </div>
              </div>

              {/* Category selector */}
              <div>
                <label className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-wider block mb-2 font-semibold">Category</label>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map((cat) => {
                    const CatIcon = cat.icon;
                    const isActive = formCategory === cat.id;
                    return (
                      <button
                        key={cat.id}
                        onClick={() => setFormCategory(cat.id)}
                        className="flex items-center gap-1.5 text-[10px] font-semibold px-3 py-1.5 rounded-lg transition-all cursor-pointer border"
                        style={{
                          background: isActive ? cat.bg : "transparent",
                          borderColor: isActive ? cat.color : "var(--color-border-subtle)",
                          color: isActive ? cat.color : "var(--color-text-muted)",
                        }}
                      >
                        <CatIcon size={11} />
                        {cat.label}
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
                className="w-full text-xs py-2.5 px-4 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-base-950)] text-[var(--color-text-secondary)] outline-none focus:border-[var(--color-primary-light)] transition-colors placeholder:text-[var(--color-text-muted)] resize-none"
              />

              <div className="flex gap-2 justify-end">
                <button
                  onClick={resetForm}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-[var(--color-text-muted)] hover:text-white border border-[var(--color-border-subtle)] hover:border-[var(--color-border-hover)] transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleAddOrUpdate}
                  disabled={!formTitle.trim()}
                  className="px-5 py-2 rounded-xl text-xs font-semibold text-white disabled:opacity-30 cursor-pointer transition-all flex items-center gap-1.5"
                  style={{ background: "linear-gradient(135deg, #6366F1, #818CF8)" }}
                >
                  <Check size={13} />
                  {editingId ? "Save Changes" : "Add Event"}
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Event Cards ───────────────────────────────────────────── */}
      {dayEvents.length === 0 ? (
        <div className="card p-12 text-center max-w-md mx-auto">
          <CalendarDays size={40} className="text-[var(--color-text-muted)] mx-auto mb-4" />
          <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">No Events Planned</h3>
          <p className="text-xs text-[var(--color-text-muted)] mt-1">
            Add study sessions, lectures, or breaks for {activeDay}!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {dayEvents.map((event, idx) => {
            const cat = getCat(event.category);
            const CatIcon = cat.icon;

            return (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: idx * 0.06 }}
                whileHover={{ y: -2 }}
                className="card p-4 md:p-5 flex items-start gap-4 relative overflow-hidden group transition-all"
              >
                {/* Left color ribbon */}
                <div
                  className="absolute left-0 top-0 bottom-0 w-[4px]"
                  style={{ background: cat.color }}
                />

                {/* Icon */}
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                  style={{ background: cat.bg }}
                >
                  <CatIcon size={18} style={{ color: cat.color }} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className="text-[9px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full"
                      style={{ background: cat.bg, color: cat.color }}
                    >
                      {cat.label}
                    </span>
                  </div>
                  <h3 className="text-sm font-semibold text-[var(--color-text-primary)] truncate">
                    {event.title}
                  </h3>
                  <div className="flex items-center gap-1.5 text-xs text-[var(--color-text-muted)] font-mono mt-1">
                    <Clock size={11} />
                    {event.time}{event.endTime ? ` – ${event.endTime}` : ""}
                  </div>
                  {event.notes && (
                    <p className="text-[11px] text-[var(--color-text-muted)] mt-1.5 leading-relaxed italic">
                      {event.notes}
                    </p>
                  )}
                </div>

                {/* Action buttons (visible on hover) */}
                <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                  <button
                    onClick={() => handleEdit(event)}
                    className="p-2 rounded-lg border border-[var(--color-border-subtle)] hover:border-[var(--color-primary-light)] text-[var(--color-text-muted)] hover:text-[var(--color-primary-light)] transition-all cursor-pointer"
                    title="Edit event"
                  >
                    <Edit3 size={13} />
                  </button>
                  <button
                    onClick={() => handleDelete(event.id)}
                    className="p-2 rounded-lg border border-[var(--color-border-subtle)] hover:border-red-500/50 text-[var(--color-text-muted)] hover:text-[var(--color-accent-rose)] transition-all cursor-pointer"
                    title="Delete event"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}
