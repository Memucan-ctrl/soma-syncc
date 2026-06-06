/**
 * SomaSync — Home Page (formerly Dashboard)
 * Layout: Greeting → Metric Cards → Quick AI Widget → Courses + Events
 */

import { useState, useRef } from "react";
import { motion } from "framer-motion";
import {
  Sparkles,
  Paperclip,
  Send,
  Loader2,
  FileText,
  X,
  AlertCircle,
  Bot
} from "lucide-react";
import MetricCards from "../components/MetricCards";
import CourseRoster from "../components/CourseRoster";
import UpcomingEvents from "../components/UpcomingEvents";
import { uploadFileForOcr } from "../services/api";

export default function Home({ profile, courses, events, loading, onOpenAi, onSendToAi }) {
  const firstName = profile?.lastname?.split(" ")?.[0] || "there";
  
  // Quick AI Widget States
  const [quickInput, setQuickInput] = useState("");
  const fileInputRef = useRef(null);
  const [attachedText, setAttachedText] = useState("");
  const [attachedFileName, setAttachedFileName] = useState("");
  const [uploadingOcr, setUploadingOcr] = useState(false);
  const [ocrError, setOcrError] = useState(null);

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
    // Clear states
    setQuickInput("");
    setAttachedText("");
    setAttachedFileName("");
    setOcrError(null);
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col gap-6 min-h-[calc(100vh-64px)]"
      >
        {/* ─── Greeting ────────────────────────────────────────────────── */}
        <div>
          <motion.h1
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-xl font-bold text-[var(--color-text-primary)]"
          >
            Welcome back, {firstName}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-sm text-[var(--color-text-muted)] mt-1"
          >
            {profile ? "Your Academic Dashboard" : "Loading your learning data..."}
          </motion.p>
        </div>

        {/* ─── Metric Cards (Top) ──────────────────────────────────────── */}
        <MetricCards courses={courses} events={events} loading={loading} />

        {/* ─── SomaSync AI Quick Workspace ────────────────────────────── */}
        <div className="card p-5 relative overflow-hidden bg-[rgba(17,21,36,0.4)] border border-[var(--color-border-subtle)]">
          {/* Decorative ambient background glow */}
          <div className="absolute top-0 right-0 w-64 h-64 pointer-events-none opacity-20"
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
              <p className="text-[10px] text-[var(--color-text-muted)] mt-0.5">
                Upload whiteboard captures, syllabus notes, or ask any academic question.
              </p>
            </div>
          </div>

          <div className="relative z-10 flex flex-col gap-3">
            {/* Attachment Banner */}
            {attachedFileName && (
              <div className="px-3.5 py-2 rounded-xl bg-[rgba(99,102,241,0.06)] border border-[rgba(99,102,241,0.12)] flex items-center justify-between text-xs text-[var(--color-primary-light)] font-semibold animate-fadeIn">
                <span className="flex items-center gap-1.5">
                  <FileText size={13} />
                  Document Synced: <span className="text-white font-normal ml-1">{attachedFileName}</span>
                </span>
                <button onClick={() => { setAttachedText(""); setAttachedFileName(""); }} className="text-[var(--color-accent-rose)] hover:text-red-400 cursor-pointer flex items-center gap-0.5 text-[10px]">
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

            <div className="flex items-center gap-3">
              <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*,application/pdf,application/vnd.openxmlformats-officedocument.*,.docx,.pptx,.xlsx,.txt" style={{ display: "none" }} />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingOcr}
                className="p-3 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-base-950)] text-[var(--color-text-secondary)] hover:text-white hover:border-[var(--color-border-hover)] transition-all cursor-pointer disabled:opacity-20 flex-shrink-0"
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
                placeholder="Ask anything or upload whiteboard photo to start learning..."
                className="flex-1 text-xs py-3 px-4 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-base-950)] text-[var(--color-text-primary)] outline-none focus:border-[var(--color-primary-light)] transition-colors placeholder:text-[var(--color-text-muted)] disabled:opacity-50"
              />
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleQuickSend}
                disabled={(!quickInput.trim() && !attachedFileName) || uploadingOcr}
                className="p-3 rounded-xl text-white transition-all flex items-center justify-center flex-shrink-0 disabled:opacity-20 cursor-pointer"
                style={{ background: "linear-gradient(135deg, #6366F1, #818CF8)" }}
              >
                <Send size={16} />
              </motion.button>
            </div>
          </div>
        </div>

        {/* ─── Analytics Split (Middle) ────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 flex-1">
          <CourseRoster courses={courses} loading={loading} />
          <UpcomingEvents events={events} loading={loading} />
        </div>
      </motion.div>

      {/* ─── Floating AI Action Button ─────────────────────────────────── */}
      <motion.button
        whileHover={{ scale: 1.08, boxShadow: "0 0 30px rgba(99, 102, 241, 0.3)" }}
        whileTap={{ scale: 0.95 }}
        onClick={onOpenAi}
        className="fixed bottom-6 right-8 z-50 flex items-center gap-2.5 px-5 py-3.5 rounded-2xl text-white font-semibold text-sm cursor-pointer shadow-xl"
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
