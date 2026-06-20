/**
 * SomaSync — AI Workspace (v4 — Full-Screen with Chat History)
 * Production-grade AI consultation interface with persistent chat threads.
 * Pattern: Left sidebar with saved conversations + main chat panel.
 */

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send,
  Sparkles,
  Bot,
  Loader2,
  X,
  Paperclip,
  FileText,
  Plus,
  Trash2,
  MessageSquare,
  User,
  AlertCircle,
  PanelLeftClose,
  PanelLeftOpen,
  Clock,
} from "lucide-react";
import { sendConsultationQuery, uploadFileForOcr } from "../services/api";
import MarkdownRenderer from "./MarkdownRenderer";

const THREADS_KEY = "somasync_chat_threads";

function loadThreads() {
  try {
    const raw = localStorage.getItem(THREADS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveThreads(threads) {
  localStorage.setItem(THREADS_KEY, JSON.stringify(threads));
}

function timeAgo(ts) {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(ts).toLocaleDateString();
}

export default function ChatWorkspace({ isOpen, onClose, isPage = false }) {
  const [threads, setThreads] = useState(loadThreads);
  const [activeThreadId, setActiveThreadId] = useState(null);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);
  const [sidebarOpen, setSidebarOpen] = useState(() => window.innerWidth >= 768);

  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);

  const messagesEndRef = useRef(null);

  // OCR States
  const fileInputRef = useRef(null);
  const [attachedText, setAttachedText] = useState("");
  const [attachedFileName, setAttachedFileName] = useState("");
  const [uploadingOcr, setUploadingOcr] = useState(false);
  const [ocrError, setOcrError] = useState(null);

  const activeThread = threads.find((t) => t.id === activeThreadId);
  const messages = activeThread?.messages || [];

  // Persist threads
  useEffect(() => { saveThreads(threads); }, [threads]);

  // Scroll to bottom
  useEffect(() => {
    if (isPage || isOpen) {
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 80);
    }
  }, [messages, isTyping, isOpen, isPage]);

  // Auto-select most recent thread or create new
  useEffect(() => {
    if ((isPage || isOpen) && !activeThreadId && threads.length > 0) {
      setActiveThreadId(threads[0].id);
    }
  }, [isOpen, isPage]);



  const createNewThread = useCallback(() => {
    const newThread = {
      id: `thread-${Date.now()}`,
      title: "New Consultation",
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    setThreads((prev) => [newThread, ...prev]);
    setActiveThreadId(newThread.id);
    setInput("");
    setAttachedText("");
    setAttachedFileName("");
    setOcrError(null);
  }, []);

  const deleteThread = (threadId) => {
    setThreads((prev) => prev.filter((t) => t.id !== threadId));
    if (activeThreadId === threadId) {
      setActiveThreadId(null);
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
      setOcrError(err.message || "Failed to analyze file.");
    } finally {
      setUploadingOcr(false);
      e.target.value = "";
    }
  };

  const handleSend = async (presetText = "") => {
    const query = presetText || input.trim();
    if (!query && !attachedText) return;

    let threadId = activeThreadId;
    if (!threadId) {
      const newThread = {
        id: `thread-${Date.now()}`,
        title: query.slice(0, 50) || "File Analysis",
        messages: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      setThreads((prev) => [newThread, ...prev]);
      threadId = newThread.id;
      setActiveThreadId(threadId);
    }

    if (!presetText) setInput("");

    const fullContent = attachedText
      ? `${query}\n\n[Attached File (${attachedFileName})]:\n${attachedText}`
      : query;

    const userMsg = {
      role: "user",
      content: query || `Analyzed file: ${attachedFileName}`,
      ts: Date.now(),
    };

    const history = messages.map(m => ({ role: m.role, content: m.content }));

    setThreads((prev) =>
      prev.map((t) =>
        t.id === threadId
          ? {
              ...t,
              messages: [...t.messages, userMsg],
              title: t.messages.length === 0 ? (query.slice(0, 50) || "File Analysis") : t.title,
              updatedAt: Date.now(),
            }
          : t
      )
    );

    setIsTyping(true);
    setAttachedText("");
    setAttachedFileName("");
    setOcrError(null);

    try {
      const data = await sendConsultationQuery(fullContent, "", "", history);
      setThreads((prev) =>
        prev.map((t) =>
          t.id === threadId
            ? { ...t, messages: [...t.messages, userMsg, { role: "assistant", content: data.response, ts: Date.now() }].filter((m, i, arr) => arr.findIndex(x => x.ts === m.ts && x.role === m.role) === i), updatedAt: Date.now() }
            : t
        )
      );
    } catch (err) {
      setThreads((prev) =>
        prev.map((t) =>
          t.id === threadId
            ? { ...t, messages: [...t.messages, { role: "assistant", content: `Error: ${err.message || "Connection failed"}. Please retry.`, ts: Date.now() }], updatedAt: Date.now() }
            : t
        )
      );
    } finally {
      setIsTyping(false);
    }
  };

  const renderContent = () => {
    return (
      <>
        {/* ─── Left Sidebar: Thread History ──────────────────────────── */}
        <AnimatePresence>
          {sidebarOpen && isMobile && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[98]"
              onClick={() => setSidebarOpen(false)}
            />
          )}
          {sidebarOpen && (
            <motion.div
              initial={{ x: -280, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -280, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 250 }}
              className={`${isMobile ? "fixed inset-y-0 left-0 z-[99]" : "relative"} w-[280px] h-full flex flex-col border-r border-[var(--color-border-subtle)]`}
              style={{ background: "var(--color-base-900)" }}
            >
              {/* Sidebar Header */}
              <div className="p-4 border-b border-[var(--color-border-subtle)] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <img src="/logo.png" className="w-6 h-6 object-contain" alt="Logo" />
                  <h2 className="text-sm font-bold text-[var(--color-text-primary)]">Consultations</h2>
                </div>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="p-1.5 rounded-lg text-[var(--color-text-muted)] hover:text-white hover:bg-[rgba(255,255,255,0.05)] transition-all cursor-pointer"
                >
                  <PanelLeftClose size={16} />
                </button>
              </div>

              {/* New Chat Button */}
              <div className="p-3">
                <button
                  onClick={createNewThread}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-white cursor-pointer transition-all hover:opacity-90"
                  style={{ background: "linear-gradient(135deg, #6366F1, #818CF8)" }}
                >
                  <Plus size={14} />
                  New Consultation
                </button>
              </div>

              {/* Thread List */}
              <div className="flex-1 overflow-y-auto px-3 space-y-1 pb-3">
                {threads.length === 0 ? (
                  <div className="text-center py-8">
                    <MessageSquare size={24} className="text-[var(--color-text-muted)] mx-auto mb-2" />
                    <p className="text-[11px] text-[var(--color-text-muted)]">No conversations yet</p>
                  </div>
                ) : (
                  threads.map((thread) => (
                    <div
                      key={thread.id}
                      onClick={() => setActiveThreadId(thread.id)}
                      className={`group flex items-center gap-2.5 px-3 py-2.5 rounded-xl cursor-pointer transition-all ${
                        activeThreadId === thread.id
                          ? "bg-[rgba(99,102,241,0.12)] border border-[rgba(99,102,241,0.2)]"
                          : "hover:bg-[rgba(255,255,255,0.03)] border border-transparent"
                      }`}
                    >
                      <MessageSquare size={13} className={activeThreadId === thread.id ? "text-[var(--color-primary-light)]" : "text-[var(--color-text-muted)]"} />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-[var(--color-text-primary)] truncate">
                          {thread.title}
                        </p>
                        <p className="text-[10px] text-[var(--color-text-muted)] flex items-center gap-1 mt-0.5">
                          <Clock size={9} />
                          {timeAgo(thread.updatedAt)}
                          <span className="text-[var(--color-text-muted)]">· {thread.messages.length} msgs</span>
                        </p>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); deleteThread(thread.id); }}
                        className="opacity-0 group-hover:opacity-100 p-1 rounded text-[var(--color-text-muted)] hover:text-[var(--color-accent-rose)] transition-all cursor-pointer"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ─── Main Chat Panel ──────────────────────────────────────── */}
        <div className="flex-1 flex flex-col min-w-0 bg-[var(--color-base-950)]">
          {/* Header */}
          <div className="px-5 py-3.5 border-b border-[var(--color-border-subtle)] flex items-center justify-between" style={{ background: "var(--color-base-900)" }}>
            <div className="flex items-center gap-3">
              {!sidebarOpen && (
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="p-1.5 rounded-lg text-[var(--color-text-muted)] hover:text-white hover:bg-[rgba(255,255,255,0.05)] transition-all cursor-pointer mr-1"
                >
                  <PanelLeftOpen size={16} />
                </button>
              )}
              <Bot size={18} className="text-[var(--color-primary-light)]" />
              <div>
                <h3 className="text-sm font-bold text-[var(--color-text-primary)]">
                  {activeThread?.title || "SomaSync AI Workspace"}
                </h3>
                <p className="text-[10px] text-[var(--color-text-muted)] mt-0.5">
                  Your academic consultation history and live tutoring companion
                </p>
              </div>
            </div>
            {!isPage && (
              <button
                onClick={onClose}
                className="p-2 rounded-xl text-[var(--color-text-muted)] hover:text-white hover:bg-[rgba(255,255,255,0.06)] transition-all cursor-pointer"
              >
                <X size={18} />
              </button>
            )}
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-5 md:px-8 lg:px-12 space-y-5">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center p-6 max-w-lg mx-auto">
                <div className="w-16 h-16 rounded-2xl bg-[rgba(99,102,241,0.08)] flex items-center justify-center mb-5">
                  <Sparkles size={28} className="text-[var(--color-primary-light)] animate-pulse" />
                </div>
                <h4 className="text-sm font-bold text-[var(--color-text-primary)] mb-2">How can I help you study?</h4>
                <p className="text-xs text-[var(--color-text-muted)] max-w-sm leading-relaxed mb-6">
                  Upload whiteboard photos, lecture notes, or ask any academic question. I can analyze documents, explain concepts, and generate practice material.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-md">
                  {[
                    "Summarize my upcoming assignments",
                    "Explain database normalization",
                    "Create a study plan for this week",
                    "Generate practice quiz questions",
                  ].map((preset, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSend(preset)}
                      className="p-3 text-left rounded-xl border border-[var(--color-border-subtle)] hover:border-[var(--color-border-hover)] bg-[rgba(255,255,255,0.01)] text-[11px] text-[var(--color-text-secondary)] transition-all cursor-pointer hover:bg-[rgba(99,102,241,0.03)]"
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((msg, i) => (
                <div key={i} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  {msg.role !== "user" && (
                    <div className="w-8 h-8 rounded-xl bg-[rgba(99,102,241,0.1)] border border-[rgba(99,102,241,0.15)] flex items-center justify-center flex-shrink-0 text-[var(--color-primary-light)]">
                      <Bot size={16} />
                    </div>
                  )}
                  <div
                    className={`max-w-[85%] px-4 py-3 rounded-2xl leading-relaxed ${
                      msg.role === "user"
                        ? "bg-[var(--color-primary)] text-white shadow-lg rounded-tr-sm text-xs"
                        : "bg-[var(--color-surface)] text-[var(--color-text-secondary)] border border-[var(--color-border-subtle)] rounded-tl-sm"
                    }`}
                  >
                    {msg.role === "user" ? (
                      msg.content.split("\n").map((line, idx) => (
                        <p key={idx} className={idx > 0 ? "mt-1.5" : ""}>{line}</p>
                      ))
                    ) : (
                      <MarkdownRenderer content={msg.content} />
                    )}
                  </div>
                  {msg.role === "user" && (
                    <div className="w-8 h-8 rounded-xl bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.08)] flex items-center justify-center flex-shrink-0 text-[var(--color-text-secondary)]">
                      <User size={16} />
                    </div>
                  )}
                </div>
              ))
            )}

            {uploadingOcr && (
              <div className="flex gap-3 justify-start">
                <div className="w-8 h-8 rounded-xl bg-[rgba(99,102,241,0.1)] flex items-center justify-center flex-shrink-0 text-[var(--color-primary-light)]">
                  <Bot size={16} />
                </div>
                <div className="bg-[var(--color-surface)] border border-[var(--color-border-subtle)] px-4 py-3 rounded-2xl rounded-tl-sm text-xs text-[var(--color-text-muted)] flex items-center gap-2">
                  <Loader2 size={13} className="animate-spin text-[var(--color-primary-light)]" />
                  Analyzing document...
                </div>
              </div>
            )}
            {isTyping && (
              <div className="flex gap-3 justify-start">
                <div className="w-8 h-8 rounded-xl bg-[rgba(99,102,241,0.1)] flex items-center justify-center flex-shrink-0 text-[var(--color-primary-light)]">
                  <Bot size={16} />
                </div>
                <div className="bg-[var(--color-surface)] border border-[var(--color-border-subtle)] px-4 py-3 rounded-2xl rounded-tl-sm text-xs text-[var(--color-text-muted)] flex items-center gap-2">
                  <Loader2 size={13} className="animate-spin text-[var(--color-primary-light)]" />
                  Thinking...
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Attachment Banner */}
          {attachedFileName && (
            <div className="px-5 py-2 bg-[rgba(99,102,241,0.08)] border-t border-[var(--color-border-subtle)] flex items-center justify-between text-xs text-[var(--color-primary-light)] font-semibold">
              <span className="flex items-center gap-1.5">
                <FileText size={13} />
                Document synced: <span className="text-white font-normal ml-1">{attachedFileName}</span>
              </span>
              <button onClick={() => { setAttachedText(""); setAttachedFileName(""); }} className="text-[var(--color-accent-rose)] hover:text-red-400 cursor-pointer flex items-center gap-1 text-[10px]">
                <X size={10} /> Remove
              </button>
            </div>
          )}

          {ocrError && (
            <div className="px-5 py-2 bg-red-500/10 border-t border-red-500/20 flex items-center justify-between text-xs text-[var(--color-accent-rose)] font-semibold">
              <span className="flex items-center gap-1.5"><AlertCircle size={12} /> {ocrError}</span>
              <button onClick={() => setOcrError(null)} className="text-[var(--color-text-muted)] hover:text-white cursor-pointer"><X size={12} /></button>
            </div>
          )}

          {/* Input Bar */}
          <div className="p-4 border-t border-[var(--color-border-subtle)] flex items-center gap-3" style={{ background: "var(--color-base-900)" }}>
            <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*,application/pdf,application/vnd.openxmlformats-officedocument.*,.docx,.pptx,.xlsx,.txt" style={{ display: "none" }} />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingOcr || isTyping}
              className="p-3 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-base-950)] text-[var(--color-text-secondary)] hover:text-white hover:border-[var(--color-border-hover)] transition-all cursor-pointer disabled:opacity-20 flex-shrink-0"
              title="Upload document for AI analysis"
            >
              {uploadingOcr ? <Loader2 size={16} className="animate-spin text-[var(--color-primary-light)]" /> : <Paperclip size={16} />}
            </button>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
              disabled={uploadingOcr || isTyping}
              placeholder="Ask anything about your courses..."
              className="flex-1 text-xs py-3 px-4 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-base-950)] text-[var(--color-text-primary)] outline-none focus:border-[var(--color-primary-light)] transition-colors placeholder:text-[var(--color-text-muted)] disabled:opacity-50"
            />
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleSend()}
              disabled={(!input.trim() && !attachedFileName) || uploadingOcr || isTyping}
              className="p-3 rounded-xl text-white transition-all flex items-center justify-center flex-shrink-0 disabled:opacity-20 cursor-pointer"
              style={{ background: "linear-gradient(135deg, #6366F1, #818CF8)" }}
            >
              {isTyping ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            </motion.button>
          </div>
        </div>
      </>
    );
  };

  if (isPage) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex w-full rounded-2xl overflow-hidden border border-[var(--color-border-subtle)] bg-[rgba(17,21,36,0.6)] shadow-xl relative z-10"
        style={{ height: "calc(100vh - 120px)" }}
      >
        {renderContent()}
      </motion.div>
    );
  }

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex"
        style={{ background: "rgba(4, 6, 14, 0.85)", backdropFilter: "blur(8px)" }}
      >
        {renderContent()}
      </motion.div>
    </AnimatePresence>
  );
}
