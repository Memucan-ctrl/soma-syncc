/**
 * SomaSync — Moodle Sync Portal (v2)
 * Advanced synchronization dashboard for Zetech University Moodle REST API.
 */

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  RefreshCw,
  CheckCircle,
  Database,
  Calendar,
  AlertTriangle,
  User,
  ExternalLink,
  BookOpen,
} from "lucide-react";
import {
  useProfile,
  useMyCourses,
  useUpcomingEvents,
  useNotifications,
} from "../hooks/useMoodle";

export default function MoodleSync() {
  const { data: profileData, refetch: refetchProfile } = useProfile();
  const { data: coursesData, refetch: refetchCourses } = useMyCourses();
  const { data: eventsData, refetch: refetchEvents } = useUpcomingEvents();
  const { data: notificationsData, refetch: refetchNotifications } = useNotifications();

  const [syncing, setSyncing] = useState(false);
  const [syncSteps, setSyncSteps] = useState([]);
  const [syncComplete, setSyncComplete] = useState(false);

  const profile = profileData?.profile;
  const courses = coursesData?.courses || [];
  const events = eventsData?.events || [];
  const notifications = notificationsData?.data || [];

  const handleManualSync = async () => {
    setSyncing(true);
    setSyncComplete(false);
    setSyncSteps([
      { id: 1, text: "Contacting Zetech Digital School REST server...", status: "running" },
    ]);

    try {
      // Step 1
      await refetchProfile();
      setSyncSteps((prev) => [
        { ...prev[0], status: "done" },
        { id: 2, text: "Downloading course enrollment records...", status: "running" },
      ]);

      // Step 2
      await refetchCourses();
      setSyncSteps((prev) => [
        prev[0],
        { ...prev[1], status: "done" },
        { id: 3, text: "Syncing upcoming assignments & deadlines...", status: "running" },
      ]);

      // Step 3
      await refetchEvents();
      await refetchNotifications();
      setSyncSteps((prev) => [
        prev[0],
        prev[1],
        { ...prev[2], status: "done" },
      ]);

      setSyncComplete(true);
    } catch (err) {
      console.error(err);
      setSyncSteps((prev) =>
        prev.map((step) => (step.status === "running" ? { ...step, status: "error" } : step))
      );
    } finally {
      setTimeout(() => {
        setSyncing(false);
      }, 1000);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      {/* ─── Header ────────────────────────────────────────────────── */}
      <div>
        <h1 className="text-xl font-bold text-[var(--color-text-primary)]">Moodle Sync Bridge</h1>
        <p className="text-sm text-[var(--color-text-muted)] mt-1">
          Synchronize your courses, assignments, and calendar milestones in real-time.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ─── Profile Details ───────────────────────────────────────── */}
        <div className="card p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{ background: "rgba(99, 102, 241, 0.1)", border: "1px solid var(--color-border-subtle)" }}
              >
                <User className="text-[var(--color-primary-light)]" size={22} />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">
                  {profile?.fullname || "Fetching profile..."}
                </h3>
                <p className="text-xs text-[var(--color-text-muted)]">
                  {profile?.username || "..."}
                </p>
              </div>
            </div>

            <div className="space-y-3.5 border-t border-[var(--color-border-subtle)] pt-4">
              <div className="flex justify-between">
                <span className="text-xs text-[var(--color-text-secondary)]">Institution</span>
                <span className="text-xs text-[var(--color-text-primary)] font-medium">
                  {profile?.sitename || "Zetech Digital School"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-[var(--color-text-secondary)]">Portal URL</span>
                <a
                  href={profile?.siteurl || "https://elearning.zetech.ac.ke"}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-[var(--color-primary-light)] hover:underline inline-flex items-center gap-1 font-medium"
                >
                  elearning.zetech.ac.ke <ExternalLink size={10} />
                </a>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-[var(--color-text-secondary)]">Token Status</span>
                <span className="status-badge" style={{ background: "rgba(52, 211, 153, 0.08)", color: "var(--color-accent-emerald)" }}>
                  <span className="pulse-dot" style={{ background: "var(--color-accent-emerald)" }} />
                  Active
                </span>
              </div>
            </div>
          </div>

          <div className="mt-8">
            <button
              onClick={handleManualSync}
              disabled={syncing}
              className="w-full py-3 rounded-xl font-medium text-xs text-white bg-[var(--color-primary)] hover:bg-[var(--color-primary-light)] transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <RefreshCw size={13} className={syncing ? "animate-spin" : ""} />
              {syncing ? "Syncing..." : "Sync Zetech LMS Now"}
            </button>
          </div>
        </div>

        {/* ─── Sync Status / Progress ────────────────────────────────── */}
        <div className="card p-6 lg:col-span-2 flex flex-col justify-between min-h-[300px]">
          <div>
            <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-4 flex items-center gap-2">
              <Database size={16} className="text-[var(--color-accent-cyan)]" />
              Sync Diagnostics & Statistics
            </h3>

            {/* Metrics Row */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="p-4 rounded-xl" style={{ background: "var(--color-base-900)" }}>
                <span className="text-[10px] uppercase font-semibold text-[var(--color-text-muted)] tracking-wider">
                  Enrolled
                </span>
                <p className="text-lg font-bold text-[var(--color-text-primary)] mt-1">
                  {courses.length} <span className="text-xs font-normal text-[var(--color-text-muted)]">courses</span>
                </p>
              </div>
              <div className="p-4 rounded-xl" style={{ background: "var(--color-base-900)" }}>
                <span className="text-[10px] uppercase font-semibold text-[var(--color-text-muted)] tracking-wider">
                  Deadlines
                </span>
                <p className="text-lg font-bold text-[var(--color-text-primary)] mt-1">
                  {events.length} <span className="text-xs font-normal text-[var(--color-text-muted)]">events</span>
                </p>
              </div>
              <div className="p-4 rounded-xl" style={{ background: "var(--color-base-900)" }}>
                <span className="text-[10px] uppercase font-semibold text-[var(--color-text-muted)] tracking-wider">
                  Alerts
                </span>
                <p className="text-lg font-bold text-[var(--color-text-primary)] mt-1">
                  {notifications.length || 0} <span className="text-xs font-normal text-[var(--color-text-muted)]">notifs</span>
                </p>
              </div>
            </div>

            {/* Sync Logger */}
            <div className="space-y-3">
              {syncSteps.map((step) => (
                <div key={step.id} className="flex items-center justify-between text-xs p-3 rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-surface)]">
                  <span className="text-[var(--color-text-secondary)] font-medium">
                    {step.text}
                  </span>
                  {step.status === "running" && (
                    <span className="text-[var(--color-primary-light)] inline-flex items-center gap-1.5 font-semibold">
                      <RefreshCw size={11} className="animate-spin" /> In progress
                    </span>
                  )}
                  {step.status === "done" && (
                    <span className="text-[var(--color-accent-emerald)] inline-flex items-center gap-1.5 font-semibold">
                      <CheckCircle size={11} /> Done
                    </span>
                  )}
                  {step.status === "error" && (
                    <span className="text-[var(--color-accent-rose)] inline-flex items-center gap-1.5 font-semibold">
                      <AlertTriangle size={11} /> Failed
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {syncComplete && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 p-3 rounded-xl flex items-center gap-3 bg-[rgba(52,211,153,0.06)] border border-[rgba(52,211,153,0.12)]"
            >
              <CheckCircle className="text-[var(--color-accent-emerald)]" size={16} />
              <p className="text-xs text-[var(--color-accent-emerald)] font-medium">
                Synchronization completed. Dashboard is fully updated.
              </p>
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
