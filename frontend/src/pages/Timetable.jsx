/**
 * SomaSync — Study Planner (v3 — Weekly Grid + Notification Reminders)
 * Professional timetable grid layout with CRUD and WhatsApp reminder links.
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
  Bell,
  MessageCircle,
} from "lucide-react";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const DAY_FULL = { Mon: "Monday", Tue: "Tuesday", Wed: "Wednesday", Thu: "Thursday", Fri: "Friday", Sat: "Saturday", Sun: "Sunday" };
const HOURS = Array.from({ length: 16 }, (_, i) => i + 6); // 6 AM - 9 PM

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
    try { return JSON.parse(stored); } catch {}
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

function timeToRow(time) {
  if (!time) return 0;
  const [h, m] = time.split(":").map(Number);
  return (h - 6) * 2 + (m >= 30 ? 1 : 0); // each hour = 2 rows (30min blocks)
}

function rowSpan(start, end) {
  return Math.max(1, timeToRow(end) - timeToRow(start));
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

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
  }, [events]);

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
  };

  const sendWhatsAppReminder = (event, day) => {
    const msg = encodeURIComponent(
      `📚 SomaSync Reminder!\n\n${event.title}\n📅 ${DAY_FULL[day]} at ${event.time}${event.endTime ? ` - ${event.endTime}` : ""}\n${event.notes ? `📝 ${event.notes}` : ""}\n\nTime to study! 💪`
    );
    window.open(`https://wa.me/?text=${msg}`, "_blank");
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
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => openForm(todayKey || "Mon")}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-white cursor-pointer"
          style={{ background: "linear-gradient(135deg, #6366F1, #818CF8)" }}
        >
          <Plus size={14} /> Add Event
        </motion.button>
      </div>

      {/* ─── Weekly Grid ───────────────────────────────────────────── */}
      <div className="card overflow-hidden" style={{ background: "rgba(17,21,36,0.4)" }}>
        <div className="overflow-x-auto">
          <div className="min-w-[800px]">
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

            {/* Time grid rows */}
            {HOURS.map((hour) => (
              <div key={hour} className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-[rgba(255,255,255,0.02)]">
                {/* Time label */}
                <div className="p-2 text-[10px] text-[var(--color-text-muted)] font-mono text-right pr-3 pt-3">
                  {hour > 12 ? `${hour - 12} PM` : hour === 12 ? "12 PM" : `${hour} AM`}
                </div>

                {/* Day cells */}
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
                      onClick={() => openForm(day, hour)}
                    >
                      {dayEvts.map((evt) => {
                        const cat = getCat(evt.category);
                        const CatIcon = cat.icon;
                        return (
                          <div
                            key={evt.id}
                            className="group rounded-lg p-1.5 mb-1 relative overflow-hidden cursor-default"
                            style={{ background: cat.bg, borderLeft: `3px solid ${cat.color}` }}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="flex items-center justify-between gap-1">
                              <div className="flex items-center gap-1 min-w-0">
                                <CatIcon size={10} style={{ color: cat.color }} className="flex-shrink-0" />
                                <span className="text-[10px] font-semibold truncate" style={{ color: cat.color }}>
                                  {evt.title}
                                </span>
                              </div>
                              {/* Actions (visible on hover) */}
                              <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                                <button onClick={() => sendWhatsAppReminder(evt, day)} className="p-0.5 rounded text-[var(--color-accent-emerald)] hover:bg-[rgba(52,211,153,0.1)] cursor-pointer" title="Send WhatsApp reminder">
                                  <MessageCircle size={10} />
                                </button>
                                <button onClick={() => handleEdit(day, evt)} className="p-0.5 rounded text-[var(--color-text-muted)] hover:text-[var(--color-primary-light)] cursor-pointer">
                                  <Edit3 size={10} />
                                </button>
                                <button onClick={() => handleDelete(day, evt.id)} className="p-0.5 rounded text-[var(--color-text-muted)] hover:text-[var(--color-accent-rose)] cursor-pointer">
                                  <Trash2 size={10} />
                                </button>
                              </div>
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
            className="fixed inset-0 z-[100] flex items-center justify-center"
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
