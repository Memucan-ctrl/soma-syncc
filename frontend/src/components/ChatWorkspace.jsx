/**
 * SomaSync — Chat Workspace Drawer (v3 — Right Side Drawer)
 * Floating sticky chat bar at the bottom of the home page.
 * When active, it slides open a dedicated, high-fidelity AI consultation drawer on the right.
 * Connected to Azure Document Intelligence for OCR and Google Gemini for AI responses.
 */

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send,
  Sparkles,
  Bot,
  Loader2,
  X,
  Paperclip,
  FileText,
  Trash2,
  ArrowRight,
  User,
  AlertCircle,
} from "lucide-react";
import { sendConsultationQuery, uploadFileForOcr } from "../services/api";

export default function ChatBar() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const messagesEndRef = useRef(null);

  // Azure OCR States
  const fileInputRef = useRef(null);
  const [attachedText, setAttachedText] = useState("");
  const [attachedFileName, setAttachedFileName] = useState("");
  const [uploadingOcr, setUploadingOcr] = useState(false);
  const [ocrError, setOcrError] = useState(null);

  // Scroll to bottom of chat when new messages arrive
  useEffect(() => {
    if (expanded) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 80);
    }
  }, [messages, isTyping, expanded]);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingOcr(true);
    setOcrError(null);
    try {
      const data = await uploadFileForOcr(file);
      if (data.status === "fallback") {
        // Log fallback but still attach extracted content if any
        console.warn("OCR fallback:", data.detail);
      }
      setAttachedText(data.text);
      setAttachedFileName(file.name);
      
      // Auto-open drawer when file is processed to let the user consult immediately
      setExpanded(true);
    } catch (err) {
      console.error(err);
      setOcrError(err.message || "Failed to analyze document format.");
    } finally {
      setUploadingOcr(false);
      e.target.value = "";
    }
  };

  const handleSend = async (presetText = "") => {
    const query = presetText || input.trim();
    if (!query && !attachedText) return;

    if (!presetText) setInput("");

    const fullContent = attachedText
      ? `${query}\n\n[Attached File Contents (${attachedFileName})]:\n${attachedText}`
      : query;

    const userMsg = {
      role: "user",
      content: query || `Analyzed file: ${attachedFileName}`,
      ts: Date.now(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsTyping(true);
    setExpanded(true); // Open the drawer upon successful message submit

    // Clear attached file state immediately
    const prevFileName = attachedFileName;
    setAttachedText("");
    setAttachedFileName("");
    setOcrError(null);

    try {
      // Fetch response from Gemini
      const data = await sendConsultationQuery(fullContent);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.response, ts: Date.now() },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `Error: Failed to obtain AI response (${err.message || "Connection timed out"}). Please try again.`,
          ts: Date.now(),
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const clearChat = () => {
    if (window.confirm("Are you sure you want to clear this consultation history?")) {
      setMessages([]);
      setAttachedText("");
      setAttachedFileName("");
      setOcrError(null);
    }
  };

  return (
    <>
      {/* ─── Floating Shortcut Bottom Input Bar ────────────────────── */}
      <div className="card overflow-hidden shadow-2xl border border-[var(--color-border-subtle)] bg-[rgba(17,21,36,0.8)] backdrop-blur-md transition-all duration-300">
        
        {/* Uploading Spinner Feedback Overlay */}
        {uploadingOcr && (
          <div className="px-5 py-2.5 bg-[rgba(99,102,241,0.06)] border-b border-[var(--color-border-subtle)] flex items-center gap-2 text-xs text-[var(--color-primary-light)] font-medium">
            <Loader2 size={13} className="animate-spin text-[var(--color-primary-light)]" />
            <span>AI is analyzing document formats & extracting text...</span>
          </div>
        )}

        {/* OCR Error Notification (Replaces native browser alert) */}
        {ocrError && (
          <div className="px-5 py-2.5 bg-red-500/10 border-b border-red-500/20 flex items-center justify-between text-xs text-[var(--color-accent-rose)] font-semibold">
            <span className="flex items-center gap-2">
              <AlertCircle size={14} />
              Failed to analyze file: {ocrError}
            </span>
            <button
              onClick={() => setOcrError(null)}
              className="text-[var(--color-text-muted)] hover:text-white cursor-pointer"
            >
              <X size={14} />
            </button>
          </div>
        )}

        {/* Sync/Attached file banner */}
        {attachedFileName && (
          <div className="px-5 py-2.5 bg-[rgba(99,102,241,0.12)] border-b border-[var(--color-border-subtle)] flex items-center justify-between text-xs text-[var(--color-primary-light)] font-semibold">
            <span className="flex items-center gap-1.5">
              <FileText size={13} className="text-[var(--color-primary-light)]" />
              OCR Document Synced: <span className="text-white font-normal ml-1">{attachedFileName}</span>
            </span>
            <button
              onClick={() => {
                setAttachedText("");
                setAttachedFileName("");
                setOcrError(null);
              }}
              className="text-[var(--color-accent-rose)] hover:text-red-400 hover:scale-105 transition-all cursor-pointer flex items-center gap-1 border border-red-500/20 px-2 py-0.5 rounded-md bg-red-500/5"
              title="Remove attachment"
            >
              <X size={11} />
              Remove
            </button>
          </div>
        )}

        <div className="flex items-center gap-3 px-5 py-3.5">
          {/* Hidden File Input */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*,application/pdf,application/vnd.openxmlformats-officedocument.*,application/msword,application/vnd.ms-powerpoint,application/vnd.ms-excel,text/plain"
            style={{ display: "none" }}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadingOcr || isTyping}
            className="p-2.5 rounded-xl text-[var(--color-text-muted)] hover:text-white hover:bg-[rgba(255,255,255,0.04)] transition-all cursor-pointer disabled:opacity-20 flex-shrink-0 border border-[var(--color-border-subtle)] bg-[var(--color-base-950)]"
            title="Upload whiteboard photo, PDF, Word, PowerPoint, Excel, or Text file"
          >
            {uploadingOcr ? (
              <Loader2 size={15} className="animate-spin text-[var(--color-primary-light)]" />
            ) : (
              <Paperclip size={15} />
            )}
          </button>

          <Sparkles size={16} className="text-[var(--color-primary-light)] flex-shrink-0 animate-pulse" />
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={uploadingOcr}
            onFocus={() => messages.length > 0 && setExpanded(true)}
            placeholder="Ask SomaSync AI about your courses, generate flashcards, or plan your study schedule..."
            className="chat-input !border-0 !bg-transparent !p-0 !shadow-none flex-1 text-sm text-[var(--color-text-primary)] disabled:opacity-50"
            id="soma-chat-input"
          />

          {messages.length > 0 && (
            <button
              onClick={() => setExpanded(true)}
              className="text-xs text-[var(--color-primary-light)] hover:text-white px-2.5 py-1.5 rounded-lg hover:bg-[rgba(99,102,241,0.08)] transition-all cursor-pointer font-semibold flex items-center gap-1 mr-1.5"
            >
              <span>View Chat ({messages.length})</span>
              <ArrowRight size={12} />
            </button>
          )}

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleSend()}
            disabled={(!input.trim() && !attachedFileName) || uploadingOcr || isTyping}
            className="p-2.5 rounded-xl transition-all cursor-pointer disabled:opacity-25 disabled:cursor-not-allowed flex-shrink-0"
            style={{
              background: (input.trim() || attachedFileName) ? "linear-gradient(135deg, #6366F1, #818CF8)" : "rgba(99, 102, 241, 0.08)",
            }}
          >
            {isTyping ? (
              <Loader2 size={14} className="animate-spin text-white" />
            ) : (
              <Send size={14} className="text-white" />
            )}
          </motion.button>
        </div>
      </div>

      {/* ─── Dedicated Side Drawer Chat Interface ───────────────────── */}
      <AnimatePresence>
        {expanded && (
          <>
            {/* Backdrop overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setExpanded(false)}
              className="fixed inset-0 z-45 bg-black/60 pointer-events-auto"
            />

            {/* Side Drawer panel */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 220 }}
              className="fixed right-0 top-0 h-screen w-full md:w-[480px] z-50 flex flex-col shadow-2xl border-l border-[var(--color-border-subtle)]"
              style={{
                background: "rgba(10, 12, 22, 0.92)",
                backdropFilter: "blur(20px)",
                WebkitBackdropFilter: "blur(20px)",
              }}
            >
              {/* Drawer Header */}
              <div className="px-5 py-4 border-b border-[var(--color-border-subtle)] flex items-center justify-between bg-[var(--color-base-900)]">
                <div className="flex items-center gap-2.5">
                  <Bot size={18} className="text-[var(--color-primary-light)]" />
                  <div>
                    <h3 className="text-sm font-bold text-[var(--color-text-primary)]">SomaSync AI Workspace</h3>
                    <p className="text-[10px] text-[var(--color-text-muted)] mt-0.5">University Study Companion</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {messages.length > 0 && (
                    <button
                      onClick={clearChat}
                      title="Clear History"
                      className="p-1.5 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-accent-rose)] hover:bg-red-500/10 transition-all cursor-pointer"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                  <button
                    onClick={() => setExpanded(false)}
                    className="p-1.5 rounded-lg text-[var(--color-text-muted)] hover:text-white hover:bg-[rgba(255,255,255,0.06)] transition-all cursor-pointer"
                    title="Close Workspace"
                  >
                    <X size={15} />
                  </button>
                </div>
              </div>

              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-[var(--color-base-950)]/40">
                {messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center p-6">
                    <div className="w-12 h-12 rounded-2xl bg-[rgba(99,102,241,0.08)] flex items-center justify-center mb-4 text-[var(--color-primary-light)]">
                      <Sparkles size={22} className="animate-pulse" />
                    </div>
                    <h4 className="text-sm font-semibold text-[var(--color-text-primary)]">Start a Study Consultation</h4>
                    <p className="text-xs text-[var(--color-text-muted)] max-w-xs mt-1.5 leading-relaxed">
                      Upload your whiteboard diagrams, syllabus notes, or ask any conceptual question to begin study consultation.
                    </p>
                    
                    {/* Quick Start Cards */}
                    <div className="grid grid-cols-1 gap-2.5 w-full mt-6">
                      {[
                        "Summarize my upcoming assignments.",
                        "Explain database normalization rules.",
                        "Suggest a study plan for this weekend.",
                      ].map((preset, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleSend(preset)}
                          className="p-3 text-left rounded-xl border border-[var(--color-border-subtle)] hover:border-[var(--color-border-hover)] bg-[rgba(255,255,255,0.01)] text-xs text-[var(--color-text-secondary)] transition-all cursor-pointer"
                        >
                          {preset}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  messages.map((msg, i) => (
                    <div
                      key={i}
                      className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                      {msg.role !== "user" && (
                        <div className="w-7 h-7 rounded-lg bg-[rgba(99,102,241,0.1)] border border-[rgba(99,102,241,0.15)] flex items-center justify-center flex-shrink-0 text-[var(--color-primary-light)]">
                          <Bot size={14} />
                        </div>
                      )}
                      
                      <div
                        className={`max-w-[80%] px-4 py-3 rounded-2xl text-xs leading-relaxed ${
                          msg.role === "user"
                             ? "bg-[var(--color-primary)] text-white shadow-md rounded-tr-none"
                            : "bg-[var(--color-surface)] text-[var(--color-text-secondary)] border border-[var(--color-border-subtle)] rounded-tl-none"
                        }`}
                      >
                        {msg.content.split("\n").map((line, idx) => (
                          <p key={idx} className={idx > 0 ? "mt-1.5" : ""}>
                            {line}
                          </p>
                        ))}
                      </div>

                      {msg.role === "user" && (
                        <div className="w-7 h-7 rounded-lg bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.08)] flex items-center justify-center flex-shrink-0 text-[var(--color-text-secondary)]">
                          <User size={14} />
                        </div>
                      )}
                    </div>
                  ))
                )}

                {/* Processing Spinners */}
                {uploadingOcr && (
                  <div className="flex gap-3 justify-start">
                    <div className="w-7 h-7 rounded-lg bg-[rgba(99,102,241,0.1)] flex items-center justify-center flex-shrink-0 text-[var(--color-primary-light)]">
                      <Bot size={14} />
                    </div>
                    <div className="bg-[var(--color-surface)] border border-[var(--color-border-subtle)] px-4 py-3 rounded-2xl rounded-tl-none text-xs text-[var(--color-text-muted)] flex items-center gap-2">
                      <Loader2 size={12} className="animate-spin text-[var(--color-primary-light)]" />
                      Analyzing notes with AI parser...
                    </div>
                  </div>
                )}

                {isTyping && (
                  <div className="flex gap-3 justify-start">
                    <div className="w-7 h-7 rounded-lg bg-[rgba(99,102,241,0.1)] flex items-center justify-center flex-shrink-0 text-[var(--color-primary-light)]">
                      <Bot size={14} />
                    </div>
                    <div className="bg-[var(--color-surface)] border border-[var(--color-border-subtle)] px-4 py-3 rounded-2xl rounded-tl-none text-xs text-[var(--color-text-muted)] flex items-center gap-2">
                      <Loader2 size={12} className="animate-spin text-[var(--color-primary-light)]" />
                      Tutor is thinking...
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Drawer Active Attachment Banner */}
              {attachedFileName && (
                <div className="px-5 py-2.5 border-t border-[var(--color-border-subtle)] bg-[rgba(99,102,241,0.08)] flex items-center justify-between text-xs text-[var(--color-primary-light)] font-semibold">
                  <span className="flex items-center gap-1.5">
                    <FileText size={13} />
                    OCR Synced: {attachedFileName}
                  </span>
                  <button
                    onClick={() => {
                      setAttachedText("");
                      setAttachedFileName("");
                      setOcrError(null);
                    }}
                    className="text-[var(--color-accent-rose)] hover:underline cursor-pointer border-none bg-transparent"
                  >
                    Remove
                  </button>
                </div>
              )}

              {/* Drawer Input Panel */}
              <div className="p-4 border-t border-[var(--color-border-subtle)] bg-[var(--color-base-900)] flex items-center gap-2.5">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingOcr || isTyping}
                  className="p-3 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-base-950)] text-[var(--color-text-secondary)] hover:text-white hover:border-[var(--color-border-hover)] transition-all cursor-pointer disabled:opacity-20 flex-shrink-0"
                  title="Upload whiteboard photo, PDF, Word, PowerPoint, Excel, or Text file"
                >
                  {uploadingOcr ? (
                    <Loader2 size={14} className="animate-spin text-[var(--color-primary-light)]" />
                  ) : (
                    <Paperclip size={14} />
                  )}
                </button>
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={uploadingOcr || isTyping}
                  placeholder="Ask a question about the note..."
                  className="chat-input !py-3 !px-4"
                />
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleSend()}
                  disabled={(!input.trim() && !attachedFileName) || uploadingOcr || isTyping}
                  className="p-3 rounded-xl bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-light)] transition-colors flex items-center justify-center flex-shrink-0 disabled:opacity-20 cursor-pointer"
                >
                  <Send size={14} />
                </motion.button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
