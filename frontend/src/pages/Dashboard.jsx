/**
 * SomaSync — Home Page (v3 — AI Nudge, Mobile Responsive, Stale Indicators)
 * Layout: Greeting → AI Nudge → Metric Cards → Quick AI Widget → Courses + Events
 */

import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Sparkles,
  Paperclip,
  Send,
  Loader2,
  FileText,
  X,
  AlertCircle,
  Bot,
  MessageSquare,
  Check,
  Bell,
} from "lucide-react";
import MetricCards from "../components/MetricCards";
import CourseRoster from "../components/CourseRoster";
import UpcomingEvents from "../components/UpcomingEvents";
import AIStudyNudge from "../components/AIStudyNudge";
import WeeklyIntelligenceCard from "../components/WeeklyIntelligenceCard";
import { uploadFileForOcr, sendTestWhatsapp, triggerAlertWhatsapp } from "../services/api";

export default function Home({ profile, courses, events, loading, onOpenAi, onSendToAi, onOpenTab }) {
  const firstName = profile?.lastname?.split(" ")?.[0] || "there";
  
  // Quick AI Widget States
  const [quickInput, setQuickInput] = useState("");
  const fileInputRef = useRef(null);
  const [attachedText, setAttachedText] = useState("");
  const [attachedFileName, setAttachedFileName] = useState("");
  const [uploadingOcr, setUploadingOcr] = useState(false);
  const [ocrError, setOcrError] = useState(null);

  // WhatsApp Settings States
  const [whatsappPhone, setWhatsappPhone] = useState(() => localStorage.getItem("somasync_whatsapp_phone_number") || "");
  const [whatsappWeekly, setWhatsappWeekly] = useState(() => localStorage.getItem("somasync_whatsapp_weekly") === "true");
  const [whatsappUrgent, setWhatsappUrgent] = useState(() => localStorage.getItem("somasync_whatsapp_urgent") === "true");
  
  const [savingSettings, setSavingSettings] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null); // { type: 'success' | 'error', message: string }
  const [testingConnection, setTestingConnection] = useState(false);

  // Background check once per session when courses/events are loaded
  useEffect(() => {
    if (loading || !courses || !events) return;
    
    const triggered = sessionStorage.getItem("somasync_whatsapp_triggered_session");
    if (!triggered) {
      const storedPhone = localStorage.getItem("somasync_whatsapp_phone_number");
      const storedWeekly = localStorage.getItem("somasync_whatsapp_weekly") === "true";
      const storedUrgent = localStorage.getItem("somasync_whatsapp_urgent") === "true";
      
      if (storedPhone && (storedWeekly || storedUrgent)) {
        sessionStorage.setItem("somasync_whatsapp_triggered_session", "true");
        triggerAlertWhatsapp(storedPhone, storedWeekly, storedUrgent, courses, events)
          .then(res => console.log("[WhatsApp Alert] Background trigger successful:", res))
          .catch(err => console.error("[WhatsApp Alert] Background trigger failed:", err));
      }
    }
  }, [loading, courses, events]);

  const handleSavePreferences = async () => {
    setSavingSettings(true);
    setSaveStatus(null);
    try {
      localStorage.setItem("somasync_whatsapp_phone_number", whatsappPhone);
      localStorage.setItem("somasync_whatsapp_weekly", whatsappWeekly ? "true" : "false");
      localStorage.setItem("somasync_whatsapp_urgent", whatsappUrgent ? "true" : "false");
      
      setSaveStatus({ type: "success", message: "Preferences saved successfully!" });
      
      // Immediately trigger background alert if any setting is enabled and phone number exists
      if (whatsappPhone && (whatsappWeekly || whatsappUrgent) && courses && events) {
        await triggerAlertWhatsapp(whatsappPhone, whatsappWeekly, whatsappUrgent, courses, events);
      }
    } catch (err) {
      setSaveStatus({ type: "error", message: err.message || "Failed to save preferences." });
    } finally {
      setSavingSettings(false);
      setTimeout(() => setSaveStatus(null), 3000);
    }
  };

  const handleSendTestMessage = async () => {
    if (!whatsappPhone) {
      setSaveStatus({ type: "error", message: "Please enter a valid phone number first." });
      setTimeout(() => setSaveStatus(null), 3000);
      return;
    }
    setTestingConnection(true);
    try {
      await sendTestWhatsapp(whatsappPhone);
      setSaveStatus({ type: "success", message: "Test message sent to WhatsApp! Check your phone." });
    } catch (err) {
      setSaveStatus({ type: "error", message: err.message || "Failed to send test message." });
    } finally {
      setTestingConnection(false);
      setTimeout(() => setSaveStatus(null), 4000);
    }
  };


  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const MAX_FILE_SIZE = 10 * 1024 * 1024;
    if (file.size > MAX_FILE_SIZE) {
      setOcrError(`File too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Max 10MB.`);
      e.target.value = "";
      return;
    }
    setUploadingOcr(true);
    setOcrError(null);
    try {
      const data = await uploadFileForOcr(file);
      setAttachedText(data.text);
      setAttachedFileName(file.name);
    } catch (err) {
      setOcrError(err.message || "Failed to analyze document.");
    } finally {
      setUploadingOcr(false);
      e.target.value = "";
    }
  };

  const handleQuickSend = () => {
    if (!quickInput.trim() && !attachedText) return;
    onSendToAi(quickInput.trim(), attachedText, attachedFileName);
    setQuickInput("");
    setAttachedText("");
    setAttachedFileName("");
    setOcrError(null);
  };

  // Get greeting based on time of day
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col gap-5 md:gap-6 min-h-[calc(100vh-64px)]"
      >
        {/* ─── Greeting ────────────────────────────────────────────────── */}
        <div>
          <motion.h1
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-lg md:text-xl font-bold text-[var(--color-text-primary)]"
          >
            {greeting}, {firstName} 👋
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-xs md:text-sm text-[var(--color-text-muted)] mt-1"
          >
            {profile ? "Your Academic Dashboard" : "Loading your learning data..."}
          </motion.p>
        </div>

        {/* ─── AI Study Nudge ──────────────────────────────────────────── */}
        <AIStudyNudge
          courses={courses}
          events={events}
          onOpenTab={onOpenTab || onOpenAi}
        />

        {/* ─── Metric Cards ───────────────────────────────────────────── */}
        <MetricCards courses={courses} events={events} loading={loading} />

        {/* ─── AI Weekly Intelligence ─────────────────────────────────── */}
        {!loading && courses && (
          <WeeklyIntelligenceCard courses={courses} events={events} onOpenTab={onOpenTab} />
        )}

        {/* ─── WhatsApp Notifications Card ────────────────────────────── */}
        {!loading && courses && (
          <div className="card p-5 relative overflow-hidden border border-[var(--color-border-subtle)]">
            {/* Glow background */}
            <div
              className="absolute top-0 right-0 w-48 h-48 pointer-events-none opacity-20"
              style={{
                background: "radial-gradient(circle, rgba(52, 211, 153, 0.12) 0%, transparent 70%)",
                filter: "blur(30px)",
              }}
            />

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 relative z-10">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[rgba(52,211,153,0.08)] flex items-center justify-center text-[var(--color-accent-emerald)]">
                  <Bell size={16} />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-[var(--color-text-primary)]">
                    WhatsApp Notifications & Study Alerts
                  </h3>
                  <p className="text-[10px] text-[var(--color-text-muted)] mt-0.5">
                    Get real-time study nudges and weekly intelligence updates directly to your WhatsApp
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={handleSendTestMessage}
                  disabled={testingConnection || !whatsappPhone}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[10px] font-semibold border border-[var(--color-border-subtle)] text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  {testingConnection ? (
                    <Loader2 size={11} className="animate-spin" />
                  ) : (
                    <Send size={11} />
                  )}
                  Send Test Alert
                </button>
                <button
                  onClick={handleSavePreferences}
                  disabled={savingSettings}
                  className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed hover:opacity-90"
                  style={{ background: "linear-gradient(135deg, #10B981, #059669)" }}
                >
                  {savingSettings ? (
                    <Loader2 size={13} className="animate-spin" />
                  ) : (
                    <Check size={13} />
                  )}
                  {savingSettings ? "Saving..." : "Save Preferences"}
                </button>
              </div>
            </div>

            <div className="relative z-10 flex flex-col gap-4">
              {saveStatus && (
                <div className={`px-3.5 py-2 rounded-xl border flex items-center justify-between text-xs font-semibold animate-fadeIn ${
                  saveStatus.type === "success" 
                    ? "bg-emerald-500/10 border-emerald-500/20 text-[var(--color-accent-emerald)]" 
                    : "bg-red-500/10 border-red-500/20 text-[var(--color-accent-rose)]"
                }`}>
                  <span className="flex items-center gap-1.5">
                    {saveStatus.type === "success" ? <Check size={12} /> : <AlertCircle size={12} />}
                    {saveStatus.message}
                  </span>
                  <button onClick={() => setSaveStatus(null)} className="text-[var(--color-text-muted)] hover:text-white cursor-pointer">
                    <X size={12} />
                  </button>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Left Column: Phone Input & info */}
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-secondary)]">
                    WhatsApp Phone Number
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={whatsappPhone}
                      onChange={(e) => setWhatsappPhone(e.target.value)}
                      placeholder="e.g. +254712345678"
                      className="w-full text-xs py-2.5 px-3.5 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-base-950)] text-[var(--color-text-primary)] outline-none focus:border-[var(--color-accent-emerald)] transition-colors placeholder:text-[var(--color-text-muted)]"
                    />
                  </div>
                  <p className="text-[9px] text-[var(--color-text-muted)] leading-relaxed">
                    Enter your number with country code. Do not prefix with <code>whatsapp:</code>, the backend handles normalization.
                  </p>
                </div>

                {/* Right Column: Toggles */}
                <div className="flex flex-col gap-2.5 justify-center">
                  {/* Weekly Insight Toggle */}
                  <div className="flex items-center justify-between p-2 rounded-lg hover:bg-[rgba(99,102,241,0.02)] transition-colors">
                    <div className="flex flex-col">
                      <span className="text-xs font-semibold text-[var(--color-text-primary)]">AI Weekly Insights</span>
                      <span className="text-[9px] text-[var(--color-text-muted)]">Receive weekly personalized advice via WhatsApp</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setWhatsappWeekly(!whatsappWeekly)}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        whatsappWeekly ? "bg-[var(--color-accent-emerald)]" : "bg-[var(--color-base-500)]"
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                          whatsappWeekly ? "translate-x-4" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>

                  {/* Urgent Deadline Toggle */}
                  <div className="flex items-center justify-between p-2 rounded-lg hover:bg-[rgba(99,102,241,0.02)] transition-colors">
                    <div className="flex flex-col">
                      <span className="text-xs font-semibold text-[var(--color-text-primary)]">48hr Urgent Deadline Alerts</span>
                      <span className="text-[9px] text-[var(--color-text-muted)]">Get warning notifications for upcoming deadlines</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setWhatsappUrgent(!whatsappUrgent)}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        whatsappUrgent ? "bg-[var(--color-accent-emerald)]" : "bg-[var(--color-base-500)]"
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                          whatsappUrgent ? "translate-x-4" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}


        {/* ─── SomaSync AI Quick Workspace ────────────────────────────── */}
        <div className="card p-4 md:p-5 relative overflow-hidden border border-[var(--color-border-subtle)]">
          <div className="absolute top-0 right-0 w-64 h-64 pointer-events-none opacity-20 hidden md:block"
               style={{
                 background: "radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, transparent 70%)",
                 filter: "blur(40px)"
               }} 
          />
          
          <div className="flex items-center gap-2.5 mb-3.5 relative z-10">
            <div className="w-8 h-8 rounded-xl bg-[rgba(99,102,241,0.08)] flex items-center justify-center text-[var(--color-primary-light)]">
              <Bot size={16} />
            </div>
            <div>
              <h3 className="text-xs font-bold text-[var(--color-text-primary)]">SomaSync AI Workspace</h3>
              <p className="text-[10px] text-[var(--color-text-muted)] mt-0.5 hidden sm:block">
                Upload whiteboard captures, syllabus notes, or ask any academic question.
              </p>
            </div>
          </div>

          <div className="relative z-10 flex flex-col gap-3">
            {/* Attachment Banner */}
            {attachedFileName && (
              <div className="px-3.5 py-2 rounded-xl bg-[rgba(99,102,241,0.06)] border border-[rgba(99,102,241,0.12)] flex items-center justify-between text-xs text-[var(--color-primary-light)] font-semibold animate-fadeIn">
                <span className="flex items-center gap-1.5 min-w-0 truncate">
                  <FileText size={13} className="flex-shrink-0" />
                  <span className="truncate">Synced: {attachedFileName}</span>
                </span>
                <button onClick={() => { setAttachedText(""); setAttachedFileName(""); }} className="text-[var(--color-accent-rose)] hover:text-red-400 cursor-pointer flex items-center gap-0.5 text-[10px] flex-shrink-0 ml-2">
                  <X size={10} /> Remove
                </button>
              </div>
            )}

            {ocrError && (
              <div className="px-3.5 py-2 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-between text-xs text-[var(--color-accent-rose)] font-semibold">
                <span className="flex items-center gap-1.5"><AlertCircle size={12} /> {ocrError}</span>
                <button onClick={() => setOcrError(null)} className="text-[var(--color-text-muted)] hover:text-white cursor-pointer"><X size={12} /></button>
              </div>
            )}

            <div className="flex items-center gap-2 md:gap-3">
              <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*,application/pdf,application/vnd.openxmlformats-officedocument.*,.docx,.pptx,.xlsx,.txt" style={{ display: "none" }} />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingOcr}
                className="p-2.5 md:p-3 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-base-950)] text-[var(--color-text-secondary)] hover:text-white hover:border-[var(--color-border-hover)] transition-all cursor-pointer disabled:opacity-20 flex-shrink-0"
                title="Upload whiteboard, notes, or slides"
              >
                {uploadingOcr ? <Loader2 size={16} className="animate-spin text-[var(--color-primary-light)]" /> : <Paperclip size={16} />}
              </button>
              <input
                type="text"
                value={quickInput}
                onChange={(e) => setQuickInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleQuickSend()}
                disabled={uploadingOcr}
                placeholder="Ask anything or upload a photo..."
                className="flex-1 text-xs py-2.5 md:py-3 px-3 md:px-4 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-base-950)] text-[var(--color-text-primary)] outline-none focus:border-[var(--color-primary-light)] transition-colors placeholder:text-[var(--color-text-muted)] disabled:opacity-50"
              />
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleQuickSend}
                disabled={(!quickInput.trim() && !attachedFileName) || uploadingOcr}
                className="p-2.5 md:p-3 rounded-xl text-white transition-all flex items-center justify-center flex-shrink-0 disabled:opacity-20 cursor-pointer"
                style={{ background: "linear-gradient(135deg, #6366F1, #818CF8)" }}
              >
                <Send size={16} />
              </motion.button>
            </div>
          </div>
        </div>

        {/* ─── Analytics Split ─────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-5 flex-1">
          <CourseRoster courses={courses} loading={loading} />
          <UpcomingEvents events={events} loading={loading} />
        </div>
      </motion.div>

      {/* ─── Floating AI Action Button (desktop only) ──────────────────── */}
      <motion.button
        whileHover={{ scale: 1.08, boxShadow: "0 0 30px rgba(99, 102, 241, 0.3)" }}
        whileTap={{ scale: 0.95 }}
        onClick={onOpenAi}
        className="fixed bottom-6 right-8 z-40 hidden md:flex items-center gap-2.5 px-5 py-3.5 rounded-2xl text-white font-semibold text-sm cursor-pointer shadow-xl"
        style={{
          background: "linear-gradient(135deg, #6366F1, #818CF8)",
          boxShadow: "0 8px 32px rgba(99, 102, 241, 0.35)",
        }}
      >
        <Sparkles size={18} className="animate-pulse" />
        SomaSync AI
      </motion.button>
    </>
  );
}
