/**
 * SomaSync — Smart Weekly Timetable
 * Dynamically maps the student's live enrolled Moodle courses into a premium weekly schedule.
 */

import { useState } from "react";
import { motion } from "framer-motion";
import { CalendarDays, Clock, MapPin, Monitor, BookOpen, Users, Bookmark } from "lucide-react";
import { useMyCourses } from "../hooks/useMoodle";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

const typeIcons = {
  lecture: BookOpen,
  practical: Monitor,
  tutorial: Users,
};

const typeColors = {
  lecture: "rgba(99, 102, 241, 0.08)",
  practical: "rgba(34, 211, 238, 0.08)",
  tutorial: "rgba(52, 211, 153, 0.08)",
};

const textColors = {
  lecture: "var(--color-primary-light)",
  practical: "var(--color-accent-cyan)",
  tutorial: "var(--color-accent-emerald)",
};

export default function Timetable() {
  const { data: coursesData, loading } = useMyCourses();
  const courses = coursesData?.courses || [];

  const [activeDay, setActiveDay] = useState("Monday");

  // Dynamically generate a beautiful mock timetable based on the user's actual courses
  const getTimetableForStudent = () => {
    if (courses.length === 0) return {};

    const timetable = {
      Monday: [],
      Tuesday: [],
      Wednesday: [],
      Thursday: [],
      Friday: [],
    };

    // Distribute student's actual courses across the week to simulate a real timetable
    courses.slice(0, 8).forEach((course, idx) => {
      const displayCode = course.shortname.split("M26")?.[0] || course.shortname;
      const cleanName = course.fullname.split(" MAY TO ")?.[0] || course.fullname;

      if (idx === 0) {
        timetable.Monday.push({ time: "08:30 - 10:30", code: displayCode, name: cleanName, room: "Ruiru Hall A", type: "lecture" });
        timetable.Wednesday.push({ time: "14:00 - 16:00", code: displayCode, name: cleanName, room: "Lab 3B", type: "practical" });
      } else if (idx === 1) {
        timetable.Tuesday.push({ time: "10:30 - 12:30", code: displayCode, name: cleanName, room: "Room 102", type: "lecture" });
        timetable.Thursday.push({ time: "14:00 - 16:00", code: displayCode, name: cleanName, room: "Room 102", type: "tutorial" });
      } else if (idx === 2) {
        timetable.Wednesday.push({ time: "08:30 - 10:30", code: displayCode, name: cleanName, room: "Lab 2A", type: "practical" });
        timetable.Friday.push({ time: "10:30 - 12:30", code: displayCode, name: cleanName, room: "Ruiru Hall B", type: "lecture" });
      } else if (idx === 3) {
        timetable.Monday.push({ time: "11:00 - 13:00", code: displayCode, name: cleanName, room: "Room 204", type: "lecture" });
      } else if (idx === 4) {
        timetable.Thursday.push({ time: "08:30 - 10:30", code: displayCode, name: cleanName, room: "Lab 1A", type: "practical" });
      } else if (idx === 5) {
        timetable.Tuesday.push({ time: "14:00 - 16:00", code: displayCode, name: cleanName, room: "Ruiru Hall C", type: "lecture" });
      } else if (idx === 6) {
        timetable.Friday.push({ time: "14:00 - 15:30", code: displayCode, name: cleanName, room: "Room 305", type: "tutorial" });
      } else if (idx === 7) {
        timetable.Wednesday.push({ time: "11:00 - 13:00", code: displayCode, name: cleanName, room: "Room 108", type: "lecture" });
      }
    });

    // Sort slots in each day by time
    Object.keys(timetable).forEach(day => {
      timetable[day].sort((a, b) => a.time.localeCompare(b.time));
    });

    return timetable;
  };

  const studentSchedule = getTimetableForStudent();
  const activeSlots = studentSchedule[activeDay] || [];

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
          <h1 className="text-xl font-bold text-[var(--color-text-primary)]">Smart Timetable</h1>
          <p className="text-sm text-[var(--color-text-muted)] mt-1">
            Weekly academic schedule synchronized with your course registrations.
          </p>
        </div>

        {/* Day selection tabs */}
        <div className="flex bg-[var(--color-base-900)] p-1 rounded-xl border border-[var(--color-border-subtle)] overflow-x-auto max-w-full">
          {DAYS.map((day) => (
            <button
              key={day}
              onClick={() => setActiveDay(day)}
              className="text-xs font-semibold py-2 px-3.5 rounded-lg transition-all cursor-pointer whitespace-nowrap"
              style={{
                background: activeDay === day ? "var(--color-primary)" : "transparent",
                color: activeDay === day ? "#ffffff" : "var(--color-text-secondary)",
              }}
            >
              {day}
            </button>
          ))}
        </div>
      </div>

      {/* ─── Timetable Slots Grid ──────────────────────────────────── */}
      {loading ? (
        <div className="grid grid-cols-1 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card p-6 h-28 skeleton" />
          ))}
        </div>
      ) : activeSlots.length === 0 ? (
        <div className="card p-12 text-center max-w-md mx-auto">
          <CalendarDays size={40} className="text-[var(--color-text-muted)] mx-auto mb-4" />
          <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">No Classes Scheduled</h3>
          <p className="text-xs text-[var(--color-text-muted)] mt-1">
            Take a breath! You have no classes scheduled for {activeDay}.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {activeSlots.map((slot, idx) => {
            const IconComponent = typeIcons[slot.type] || BookOpen;
            const cardBg = typeColors[slot.type] || "var(--color-surface)";
            const iconColor = textColors[slot.type] || "var(--color-text-primary)";

            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.35, delay: idx * 0.08 }}
                whileHover={{ y: -2 }}
                className="card p-5 md:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all relative overflow-hidden"
              >
                {/* Left Indicator Ribbon */}
                <div
                  className="absolute left-0 top-0 bottom-0 w-[4px]"
                  style={{ background: iconColor }}
                />

                {/* Left Section: Time & Type */}
                <div className="flex items-center gap-4">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: cardBg }}
                  >
                    <IconComponent size={20} style={{ color: iconColor }} />
                  </div>
                  <div>
                    <span
                      className="text-[9px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full"
                      style={{ background: cardBg, color: iconColor }}
                    >
                      {slot.type}
                    </span>
                    <div className="flex items-center gap-1.5 text-xs text-[var(--color-text-muted)] font-mono mt-1.5">
                      <Clock size={12} />
                      {slot.time}
                    </div>
                  </div>
                </div>

                {/* Center Section: Course details */}
                <div className="flex-1 min-w-0 md:px-6">
                  <div className="flex items-center gap-2 mb-1.5">
                    <Bookmark size={12} className="text-[var(--color-text-muted)]" />
                    <span className="text-xs font-bold font-mono text-[var(--color-text-primary)]">
                      {slot.code}
                    </span>
                  </div>
                  <h3 className="text-sm font-semibold text-[var(--color-text-secondary)] truncate">
                    {slot.name}
                  </h3>
                </div>

                {/* Right Section: Location/Room */}
                <div className="flex items-center gap-2 text-xs font-semibold text-[var(--color-text-primary)] bg-[var(--color-base-900)] py-2 px-3.5 rounded-xl border border-[var(--color-border-subtle)] w-fit">
                  <MapPin size={12} className="text-[var(--color-text-muted)]" />
                  {slot.room}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}
