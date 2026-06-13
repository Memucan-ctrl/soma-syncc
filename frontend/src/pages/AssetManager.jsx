/**
 * SomaSync — Study Lab & AI Consultation (v5)
 * Full-width course catalog with collapsible AI panel that slides in on action.
 * File action buttons: Quick Summary, Practice Quiz, Deep Dive, View.
 */

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText,
  Link2,
  Send,
  Loader2,
  FolderOpen,
  Eye,
  Bot,
  ArrowRight,
  ChevronDown,
  ChevronRight,
  Paperclip,
  X,
  AlertCircle,
  HelpCircle,
  Code,
  Compass,
  MessageSquare,
  Zap,
} from "lucide-react";
import { useMyCourses } from "../hooks/useMoodle";
import { fetchCourseContents, sendConsultationQuery, uploadFileForOcr, ocrMoodleFile } from "../services/api";
import MarkdownRenderer from "../components/MarkdownRenderer";

export default function AssetManager() {
  const { data: coursesData, loading: coursesLoading } = useMyCourses();
  const courses = (coursesData?.courses || []).filter(
    (c) => !c.fullname?.toLowerCase().includes("survey")
  );

  const [selectedCourse, setSelectedCourse] = useState(null);
  const [courseContents, setCourseContents] = useState([]);
  const [contentsLoading, setContentsLoading] = useState(false);
  const [expandedSections, setExpandedSections] = useState({});

  // AI Panel state
  const [aiPanelOpen, setAiPanelOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef(null);

  // OCR states
  const fileInputRef = useRef(null);
  const [attachedText, setAttachedText] = useState("");
  const [attachedFileName, setAttachedFileName] = useState("");
  const [uploadingOcr, setUploadingOcr] = useState(false);
  const [ocrError, setOcrError] = useState(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, chatLoading]);

  const cleanCourseName = (fullname) => {
    if (!fullname) return "";
    return fullname.split(" MAY TO ")[0].split("G1")?.[0]?.split("GRP")?.[0]?.trim() || fullname;
  };

  const handleSelectCourse = async (course) => {
    setSelectedCourse(course);
    setContentsLoading(true);
    setCourseContents([]);
    setExpandedSections({});
    setAiPanelOpen(false);
    setChatMessages([]);

    try {
      const data = await fetchCourseContents(course.id);
      if (data.status === "ok" && Array.isArray(data.sections)) {
        setCourseContents(data.sections);
        if (data.sections.length > 0) {
          setExpandedSections({ [data.sections[0].id || 0]: true });
        }
      }
    } catch (err) {
      console.error("Failed to load course materials:", err);
    } finally {
      setContentsLoading(false);
    }
  };

  const toggleSection = (sectionId) => {
    setExpandedSections((prev) => ({ ...prev, [sectionId]: !prev[sectionId] }));
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
      setAiPanelOpen(true);
    } catch (err) {
      setOcrError(err.message || "Failed to analyze document.");
    } finally {
      setUploadingOcr(false);
      e.target.value = "";
    }
  };

  const handleSendChat = async (presetMsg = "") => {
    const query = presetMsg || chatInput.trim();
    if (!query || !selectedCourse) return;
    if (!presetMsg) setChatInput("");

    const fullPromptText = attachedText
      ? `${query}\n\n[Attached File (${attachedFileName})]:\n${attachedText}`
      : query;

    const history = chatMessages.map(m => ({ role: m.role, content: m.content }));
    const userMsg = { role: "user", content: query, ts: Date.now() };
    setChatMessages((prev) => [...prev, userMsg]);
    setChatLoading(true);
    setAttachedText("");
    setAttachedFileName("");
    setOcrError(null);

    const courseCode = selectedCourse.shortname.split("M26")?.[0] || selectedCourse.shortname;
    const contentsContext = courseContents
      .map((s) => `${s.name}: ${s.modules?.map((m) => m.name).join(", ")}`)
      .join("\n");

    try {
      const data = await sendConsultationQuery(fullPromptText, courseCode, contentsContext, history);
      setChatMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.response, ts: Date.now() },
      ]);
    } catch {
      setChatMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Connection error. Please try again.", ts: Date.now() },
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  // AI Action on a specific file
  const handleFileAction = async (resourceName, fileUrl, mode) => {
    if (!selectedCourse) return;
    setAiPanelOpen(true);
    setChatLoading(true);

    const prompts = {
      explain: { label: "Quick Summary", suffix: "\n\nProvide a concise summary of the key concepts, main takeaways, and important points from these notes. Be brief and structured." },
      quiz: { label: "Practice Quiz", suffix: "\n\nGenerate a 5-question multiple choice quiz from these notes. Include the correct answer and a brief explanation for each." },
      deep: { label: "Deep Dive", suffix: "\n\nProvide a comprehensive, detailed explanation of every concept in these notes. Use examples, analogies, and break down complex ideas step by step." },
      formulas: { label: "Code & Formulas", suffix: "\n\nExtract and explain all code snippets, formulas, algorithms, or technical procedures found in these notes." },
    };

    const { label, suffix } = prompts[mode] || prompts.explain;

    const history = chatMessages.map(m => ({ role: m.role, content: m.content }));
    setChatMessages((prev) => [
      ...prev,
      { role: "user", content: `${label}: "${resourceName}"`, ts: Date.now() },
    ]);

    try {
      let ocrText = "";
      if (fileUrl) {
        const token = localStorage.getItem("somasync_token");
        const ocrData = await ocrMoodleFile(fileUrl, token);
        ocrText = ocrData.text;
      }

      const courseCode = selectedCourse.shortname.split("M26")?.[0] || selectedCourse.shortname;
      const contentsContext = courseContents
        .map((s) => `${s.name}: ${s.modules?.map((m) => m.name).join(", ")}`)
        .join("\n");

      const fullPrompt = `${label} for "${resourceName}".${suffix}${ocrText ? `\n\n[Note Contents]:\n${ocrText}` : ""}`;
      const aiData = await sendConsultationQuery(fullPrompt, courseCode, contentsContext, history);

      setChatMessages((prev) => [
        ...prev,
        { role: "assistant", content: aiData.response, ts: Date.now() },
      ]);
    } catch (err) {
      setChatMessages((prev) => [
        ...prev,
        { role: "assistant", content: `Failed to analyze "${resourceName}". ${err.message || ""}`, ts: Date.now() },
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  // Action button component
  const ActionBtn = ({ icon: Icon, label, color, bg, onClick }) => (
    <button
      onClick={onClick}
      className="px-2.5 py-1.5 rounded-lg border text-[10px] font-semibold flex items-center gap-1.5 cursor-pointer transition-all hover:brightness-125"
      style={{ background: bg, borderColor: `${color}30`, color }}
    >
      <Icon size={11} />
      {label}
    </button>
  );

  const filteredSections = courseContents.filter((section) => {
    const isPlaceholder = section.name?.toLowerCase().trim() === "new section";
    const hasModules = section.modules && section.modules.length > 0;
    return !isPlaceholder || hasModules;
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col lg:flex-row gap-5 min-h-[calc(100vh-120px)]"
    >
      {/* ─── Main Panel: Course Catalog & Assets ──────────────────── */}
      <div className={`flex-1 space-y-5 transition-all duration-300 ${aiPanelOpen ? "lg:max-w-[55%]" : ""}`}>
        <div>
          <h1 className="text-xl font-bold text-[var(--color-text-primary)]">Study Lab</h1>
          <p className="text-sm text-[var(--color-text-muted)] mt-1">
            Browse course materials, notes, and AI-powered study tools.
          </p>
        </div>

        {/* Catalog grid */}
        {coursesLoading ? (
          <div className="grid grid-cols-1 gap-4">
            {[1, 2].map((i) => <div key={i} className="card p-6 h-28 skeleton" />)}
          </div>
        ) : !selectedCourse ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {courses.map((course) => {
              const displayCode = course.shortname.split("M26")?.[0] || course.shortname;
              const cleanName = cleanCourseName(course.fullname);
              return (
                <motion.div
                  key={course.id}
                  whileHover={{ y: -3, borderColor: "rgba(99,102,241,0.3)" }}
                  onClick={() => handleSelectCourse(course)}
                  className="card p-5 cursor-pointer flex flex-col justify-between hover:border-[var(--color-border-hover)] transition-all bg-[rgba(17,21,36,0.5)] border-[var(--color-border-subtle)]"
                >
                  <div>
                    <div className="flex items-center gap-2 mb-2.5">
                      <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded-full" style={{ background: "rgba(99, 102, 241, 0.08)", color: "var(--color-primary-light)" }}>
                        {displayCode}
                      </span>
                    </div>
                    <h3 className="text-sm font-semibold text-[var(--color-text-primary)] leading-snug">
                      {cleanName}
                    </h3>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-[var(--color-primary-light)] font-semibold mt-4">
                    <span>Open Study Lab</span>
                    <ArrowRight size={12} />
                  </div>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <div className="card p-5 space-y-4 bg-[rgba(17,21,36,0.5)] border-[var(--color-border-subtle)]">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--color-border-subtle)]">
              <button
                onClick={() => { setSelectedCourse(null); setAiPanelOpen(false); setChatMessages([]); }}
                className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors flex items-center gap-1 font-semibold cursor-pointer"
              >
                ← Back to catalog
              </button>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded-full" style={{ background: "rgba(99, 102, 241, 0.08)", color: "var(--color-primary-light)" }}>
                  {selectedCourse.shortname.split("M26")?.[0]}
                </span>
                {!aiPanelOpen && (
                  <button
                    onClick={() => {
                      setAiPanelOpen(true);
                      const courseCode = selectedCourse.shortname.split("M26")?.[0] || selectedCourse.shortname;
                      if (chatMessages.length === 0) {
                        setChatMessages([{
                          role: "assistant",
                          content: `Connected to **${courseCode} — ${cleanCourseName(selectedCourse.fullname)}**. Ask me anything or use the action buttons on your files!`,
                          ts: Date.now(),
                        }]);
                      }
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-semibold cursor-pointer transition-all"
                    style={{ background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.15)", color: "var(--color-primary-light)" }}
                  >
                    <Bot size={11} />
                    Open AI Tutor
                  </button>
                )}
              </div>
            </div>

            <h2 className="text-base font-bold text-[var(--color-text-primary)]">
              {cleanCourseName(selectedCourse.fullname)}
            </h2>

            {contentsLoading ? (
              <div className="space-y-3 pt-2">
                {[1, 2, 3].map((i) => <div key={i} className="h-12 skeleton" />)}
              </div>
            ) : filteredSections.length === 0 ? (
              <div className="text-center py-10">
                <FolderOpen size={32} className="text-[var(--color-text-muted)] mx-auto mb-2" />
                <p className="text-xs text-[var(--color-text-muted)]">No resources found.</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {filteredSections.map((section) => {
                  const isExpanded = !!expandedSections[section.id];
                  const hasModules = section.modules && section.modules.length > 0;

                  return (
                    <div key={section.id} className="border border-[var(--color-border-subtle)] rounded-xl overflow-hidden bg-[var(--color-base-900)]">
                      <button
                        onClick={() => toggleSection(section.id)}
                        className="w-full flex items-center justify-between p-3.5 text-xs font-semibold text-[var(--color-text-secondary)] hover:bg-[rgba(255,255,255,0.01)] transition-colors text-left"
                      >
                        <span className="truncate">{section.name}</span>
                        {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                      </button>

                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                          >
                            <div className="border-t border-[var(--color-border-subtle)] p-3 space-y-2 bg-[var(--color-surface)]">
                              {hasModules ? (
                                section.modules.map((module) => {
                                  const isFile = module.modname === "resource";
                                  const fileUrl = isFile ? module.contents?.[0]?.fileurl : module.url;

                                  return (
                                    <div key={module.id} className="flex flex-col gap-2 p-3 rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-base-950)]">
                                      <div className="flex items-center justify-between gap-3 min-w-0">
                                        <div className="flex items-center gap-2.5 min-w-0">
                                          {isFile ? (
                                            <FileText className="text-[var(--color-primary-light)] flex-shrink-0" size={14} />
                                          ) : (
                                            <Link2 className="text-[var(--color-accent-cyan)] flex-shrink-0" size={14} />
                                          )}
                                          <span className="text-xs text-[var(--color-text-secondary)] font-medium truncate">
                                            {module.name}
                                          </span>
                                        </div>
                                        {fileUrl && (
                                          <a
                                            href={`${fileUrl}${fileUrl.includes("?") ? "" : "?"}&token=${localStorage.getItem("somasync_token")}`}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="p-1.5 rounded-lg border border-[var(--color-border-subtle)] hover:border-[var(--color-border-hover)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors flex items-center gap-1 text-[10px]"
                                          >
                                            <Eye size={11} />
                                          </a>
                                        )}
                                      </div>

                                      {/* AI Action Buttons */}
                                      {isFile && fileUrl && (
                                        <div className="flex flex-wrap gap-1.5 pt-1.5 border-t border-[rgba(255,255,255,0.03)]">
                                          <ActionBtn icon={Zap} label="Summary" color="#6366F1" bg="rgba(99,102,241,0.06)" onClick={() => handleFileAction(module.name, fileUrl, "explain")} />
                                          <ActionBtn icon={HelpCircle} label="Quiz" color="#10B981" bg="rgba(16,185,129,0.06)" onClick={() => handleFileAction(module.name, fileUrl, "quiz")} />
                                          <ActionBtn icon={Compass} label="Deep Dive" color="#06B6D4" bg="rgba(6,182,212,0.06)" onClick={() => handleFileAction(module.name, fileUrl, "deep")} />
                                          <ActionBtn icon={Code} label="Code/Formulas" color="#F472B6" bg="rgba(244,114,182,0.06)" onClick={() => handleFileAction(module.name, fileUrl, "formulas")} />
                                        </div>
                                      )}
                                    </div>
                                  );
                                })
                              ) : (
                                <p className="text-[10px] text-[var(--color-text-muted)] text-center py-2">No files under this section.</p>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ─── Right Panel: Collapsible AI Chat ─────────────────────── */}
      <AnimatePresence>
        {aiPanelOpen && selectedCourse && (
          <>
            {/* Mobile Backdrop overlay */}
            <div
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
              onClick={() => setAiPanelOpen(false)}
            />
            <motion.div
              initial={window.innerWidth < 1024 ? { y: "100%" } : { width: 0, opacity: 0 }}
              animate={window.innerWidth < 1024 ? { y: 0 } : { width: "45%", opacity: 1 }}
              exit={window.innerWidth < 1024 ? { y: "100%" } : { width: 0, opacity: 0 }}
              transition={{ type: "spring", damping: 28, stiffness: 280 }}
              className="fixed inset-x-0 bottom-0 top-[10%] rounded-t-3xl lg:rounded-none z-50 lg:relative lg:inset-auto lg:z-auto flex flex-col min-w-0"
            >
              <div className="card flex-1 flex flex-col h-full lg:min-h-[420px] lg:max-h-[calc(100vh-140px)] overflow-hidden shadow-xl bg-[rgba(17,21,36,0.9)] lg:bg-[rgba(17,21,36,0.6)] border-[var(--color-border-subtle)]">
              {/* Header */}
              <div className="px-4 py-3 border-b border-[var(--color-border-subtle)] flex items-center justify-between bg-[var(--color-base-900)]">
                <div className="flex items-center gap-2">
                  <Bot size={16} className="text-[var(--color-primary-light)]" />
                  <div>
                    <h3 className="text-xs font-bold text-[var(--color-text-primary)]">AI Tutor</h3>
                    <p className="text-[10px] text-[var(--color-accent-emerald)] font-semibold uppercase mt-0.5">
                      {selectedCourse.shortname.split("M26")?.[0]}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setAiPanelOpen(false)}
                  className="p-1.5 rounded-lg text-[var(--color-text-muted)] hover:text-white hover:bg-[rgba(255,255,255,0.05)] transition-all cursor-pointer"
                >
                  <X size={14} />
                </button>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[var(--color-base-950)]/60">
                {chatMessages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[88%] px-3.5 py-2.5 rounded-2xl text-xs leading-relaxed ${
                      msg.role === "user"
                        ? "bg-[var(--color-primary)] text-white shadow-md rounded-tr-sm"
                        : "bg-[var(--color-surface)] text-[var(--color-text-secondary)] border border-[var(--color-border-subtle)] rounded-tl-sm"
                    }`}>
                      {msg.role === "user" ? (
                        msg.content.split("\n").map((line, idx) => (
                          <p key={idx} className={idx > 0 ? "mt-1" : ""}>{line}</p>
                        ))
                      ) : (
                        <MarkdownRenderer content={msg.content} />
                      )}
                    </div>
                  </div>
                ))}
                {chatLoading && (
                  <div className="flex justify-start">
                    <div className="bg-[var(--color-surface)] border border-[var(--color-border-subtle)] px-3.5 py-2.5 rounded-2xl rounded-tl-sm text-xs text-[var(--color-text-muted)] flex items-center gap-2">
                      <Loader2 size={12} className="animate-spin text-[var(--color-primary-light)]" />
                      Analyzing...
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Attached banner */}
              {attachedFileName && (
                <div className="px-4 py-2 bg-[rgba(99,102,241,0.08)] border-t border-[var(--color-border-subtle)] flex items-center justify-between text-[11px] text-[var(--color-primary-light)] font-semibold">
                  <span className="flex items-center gap-1.5"><FileText size={12} /> {attachedFileName}</span>
                  <button onClick={() => { setAttachedText(""); setAttachedFileName(""); }} className="text-[var(--color-accent-rose)] cursor-pointer"><X size={10} /></button>
                </div>
              )}

              {ocrError && (
                <div className="px-4 py-2 bg-red-500/10 border-t border-red-500/20 text-xs text-[var(--color-accent-rose)] flex items-center gap-1.5">
                  <AlertCircle size={11} /> {ocrError}
                </div>
              )}

              {/* Input */}
              <div className="p-3 border-t border-[var(--color-border-subtle)] bg-[var(--color-base-900)] flex items-center gap-2">
                <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*,application/pdf,.docx,.pptx,.xlsx,.txt" style={{ display: "none" }} />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={chatLoading || uploadingOcr}
                  className="p-2.5 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-base-950)] text-[var(--color-text-secondary)] hover:text-white transition-all cursor-pointer disabled:opacity-20 flex-shrink-0"
                >
                  {uploadingOcr ? <Loader2 size={13} className="animate-spin" /> : <Paperclip size={13} />}
                </button>
                <input
                  type="text"
                  value={chatInput}
                  disabled={chatLoading || uploadingOcr}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSendChat()}
                  placeholder="Ask about this course..."
                  className="flex-1 text-xs py-2.5 px-3 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-base-950)] text-[var(--color-text-primary)] outline-none focus:border-[var(--color-primary-light)] transition-colors placeholder:text-[var(--color-text-muted)] disabled:opacity-50"
                />
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleSendChat()}
                  disabled={chatLoading || !chatInput.trim() || uploadingOcr}
                  className="p-2.5 rounded-xl text-white transition-all flex-shrink-0 disabled:opacity-20 cursor-pointer"
                  style={{ background: "var(--color-primary)" }}
                >
                  <Send size={13} />
                </motion.button>
              </div>
            </div>
          </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ─── Mobile: Floating AI Button (shows when panel hidden on mobile) ── */}
      {selectedCourse && !aiPanelOpen && (
        <motion.button
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          onClick={() => {
            setAiPanelOpen(true);
            const courseCode = selectedCourse.shortname.split("M26")?.[0] || selectedCourse.shortname;
            if (chatMessages.length === 0) {
              setChatMessages([{
                role: "assistant",
                content: `Connected to **${courseCode}**. Use the action buttons on your files or ask me anything!`,
                ts: Date.now(),
              }]);
            }
          }}
          className="fixed bottom-6 right-6 lg:hidden z-50 p-4 rounded-2xl text-white shadow-xl cursor-pointer"
          style={{ background: "linear-gradient(135deg, #6366F1, #818CF8)", boxShadow: "0 8px 32px rgba(99,102,241,0.35)" }}
        >
          <MessageSquare size={20} />
        </motion.button>
      )}
    </motion.div>
  );
}
