/**
 * SomaSync — Study Lab & AI Consultation (v3)
 * A premium interface that maps Zetech Moodle courses to an interactive notes catalog
 * and lets students consult the AI about specific course syllabus and materials.
 * Integrates Azure Document Intelligence for OCR analysis on uploaded notes and whiteboards.
 */

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Layers,
  BookOpen,
  FileText,
  Link2,
  Sparkles,
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
  Calendar,
  Compass,
} from "lucide-react";
import { useMyCourses } from "../hooks/useMoodle";
import { fetchCourseContents, sendConsultationQuery, uploadFileForOcr, ocrMoodleFile } from "../services/api";

export default function AssetManager() {
  const { data: coursesData, loading: coursesLoading } = useMyCourses();
  const courses = coursesData?.courses || [];

  const [selectedCourse, setSelectedCourse] = useState(null);
  const [courseContents, setCourseContents] = useState([]);
  const [contentsLoading, setContentsLoading] = useState(false);
  const [expandedSections, setExpandedSections] = useState({});

  // Azure Document Intelligence states
  const fileInputRef = useRef(null);
  const [attachedText, setAttachedText] = useState("");
  const [attachedFileName, setAttachedFileName] = useState("");
  const [uploadingOcr, setUploadingOcr] = useState(false);
  const [ocrError, setOcrError] = useState(null);

  // AI Consultation States
  const [chatMessages, setChatMessages] = useState([
    {
      role: "assistant",
      content: "Select a course catalog on the left to start a focused study consultation. I can analyze the notes, summarize topics, or generate practice quizzes for you!",
      ts: Date.now(),
    },
  ]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, chatLoading]);

  // Load course materials
  const handleSelectCourse = async (course) => {
    setSelectedCourse(course);
    setContentsLoading(true);
    setCourseContents([]);
    setExpandedSections({});
    setAttachedText("");
    setAttachedFileName("");
    setOcrError(null);
    
    const courseCode = course.shortname.split("M26")?.[0] || course.shortname;
    setChatMessages([
      {
        role: "assistant",
        content: `Hi! I am now connected to your **${courseCode} — ${cleanCourseName(course.fullname)}** study files. You can upload whiteboard pictures, syllabus PDFs, PowerPoint decks, or notes using the paperclip button for AI OCR parsing. What would you like to learn today?`,
        ts: Date.now(),
      },
    ]);

    try {
      const data = await fetchCourseContents(course.id);
      if (data.status === "ok" && Array.isArray(data.sections)) {
        setCourseContents(data.sections);
        // Expand first section by default
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
    setExpandedSections((prev) => ({
      ...prev,
      [sectionId]: !prev[sectionId],
    }));
  };

  const cleanCourseName = (fullname) => {
    if (!fullname) return "";
    return fullname.split(" MAY TO ")[0].split("G1")?.[0]?.split("GRP")?.[0]?.trim() || fullname;
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingOcr(true);
    setOcrError(null);
    try {
      const data = await uploadFileForOcr(file);
      setAttachedText(data.text);
      setAttachedFileName(file.name);
    } catch (err) {
      console.error(err);
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

    // Append OCR text in the payload context
    const fullPromptText = attachedText
      ? `${query}\n\n[Attached File OCR Contents (${attachedFileName})]:\n${attachedText}`
      : query;

    const userMsg = { role: "user", content: query, ts: Date.now() };
    setChatMessages((prev) => [...prev, userMsg]);
    setChatLoading(true);

    // Clear attachment state immediately
    setAttachedText("");
    setAttachedFileName("");
    setOcrError(null);

    // Build context representing the course files/topics
    const courseCode = selectedCourse.shortname.split("M26")?.[0] || selectedCourse.shortname;
    const contentsContext = courseContents
      .map((s) => `${s.name}: ${s.modules?.map((m) => m.name).join(", ")}`)
      .join("\n");

    try {
      const data = await sendConsultationQuery(fullPromptText, courseCode, contentsContext);
      setChatMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.response, ts: Date.now() },
      ]);
    } catch (err) {
      setChatMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Error: Failed to obtain AI consultation. Please verify connection and try again.", ts: Date.now() },
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  // Advanced AI Actions on Moodle Notes
  const handleQuickConsult = async (resourceName, fileUrl = null, mode = "explain") => {
    if (!selectedCourse) return;

    setChatLoading(true);
    setOcrError(null);

    let actionLabel = "";
    let promptSuffix = "";

    switch (mode) {
      case "quiz":
        actionLabel = "Generate a practice quiz for";
        promptSuffix = "\n\nPlease generate a 3-question multiple choice review quiz with explanations based on these notes.";
        break;
      case "formulas":
        actionLabel = "Extract key concepts & code/formulas from";
        promptSuffix = "\n\nPlease extract and explain all code snippets, mathematical formulas, or algorithms found in these notes in detail.";
        break;
      case "jargon":
        actionLabel = "De-jargon";
        promptSuffix = "\n\nPlease summarize these notes by translating complex jargon and equations into simple, plain English analogies.";
        break;
      default:
        actionLabel = "Explain the concepts in";
        promptSuffix = "\n\nPlease explain the main concepts covered in these notes and summarize the core key takeaways.";
    }

    if (fileUrl) {
      setChatMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `[Downloading Moodle resource and executing Advanced AI Pipeline: ${actionLabel} "${resourceName}"...]`,
          ts: Date.now(),
        }
      ]);
      
      try {
        const token = localStorage.getItem("somasync_token");
        const ocrData = await ocrMoodleFile(fileUrl, token);
        
        // Let's send the query with the OCR content as context
        const query = `${actionLabel} "${resourceName}".`;
        const fullPromptText = `${query}${promptSuffix}\n\n[Moodle Note Contents]:\n${ocrData.text}`;
        
        const userMsg = { role: "user", content: `Advanced AI: ${actionLabel} "${resourceName}"`, ts: Date.now() };
        setChatMessages((prev) => [...prev, userMsg]);
        
        const courseCode = selectedCourse.shortname.split("M26")?.[0] || selectedCourse.shortname;
        const contentsContext = courseContents
          .map((s) => `${s.name}: ${s.modules?.map((m) => m.name).join(", ")}`)
          .join("\n");
          
        const aiData = await sendConsultationQuery(fullPromptText, courseCode, contentsContext);
        setChatMessages((prev) => [
          ...prev,
          { role: "assistant", content: aiData.response, ts: Date.now() },
        ]);
      } catch (err) {
        console.error(err);
        setChatMessages((prev) => [
          ...prev,
          { role: "assistant", content: `Failed to analyze "${resourceName}". Fallback to general consultation...`, ts: Date.now() }
        ]);
        const query = `Can you explain the main concepts covered in "${resourceName}"?`;
        handleSendChat(query);
      } finally {
        setChatLoading(false);
      }
    } else {
      const query = `Can you explain the main concepts covered in "${resourceName}"?`;
      handleSendChat(query);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col lg:flex-row gap-6 min-h-[calc(100vh-120px)]"
    >
      {/* ─── Left Panel: Course Catalog & Assets ────────────────────── */}
      <div className="flex-1 space-y-5 lg:max-w-[55%]">
        <div>
          <h1 className="text-xl font-bold text-[var(--color-text-primary)]">Study Lab</h1>
          <p className="text-sm text-[var(--color-text-muted)] mt-1">
            Browse course materials, notes, and resources synced from your portal.
          </p>
        </div>

        {/* Catalog grid */}
        {coursesLoading ? (
          <div className="grid grid-cols-1 gap-4">
            {[1, 2].map((i) => (
              <div key={i} className="card p-6 h-28 skeleton" />
            ))}
          </div>
        ) : !selectedCourse ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {courses.map((course) => {
              const displayCode = course.shortname.split("M26")?.[0] || course.shortname;
              const cleanName = cleanCourseName(course.fullname);
              return (
                <motion.div
                  key={course.id}
                  whileHover={{ y: -2 }}
                  onClick={() => handleSelectCourse(course)}
                  className="card p-5 cursor-pointer flex flex-col justify-between hover:border-[var(--color-border-hover)] transition-all bg-[rgba(17,21,36,0.5)] border-[var(--color-border-subtle)]"
                >
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded-full" style={{ background: "rgba(99, 102, 241, 0.08)", color: "var(--color-primary-light)" }}>
                        {displayCode}
                      </span>
                    </div>
                    <h3 className="text-sm font-semibold text-[var(--color-text-primary)] leading-snug">
                      {cleanName}
                    </h3>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-[var(--color-primary-light)] font-semibold mt-4">
                    <span>View Assets</span>
                    <ArrowRight size={12} />
                  </div>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <div className="card p-6 space-y-5 bg-[rgba(17,21,36,0.5)] border-[var(--color-border-subtle)]">
            {/* Back Button / Header */}
            <div className="flex items-center justify-between pb-4 border-b border-[var(--color-border-subtle)]">
              <button
                onClick={() => setSelectedCourse(null)}
                className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors flex items-center gap-1 font-semibold cursor-pointer"
              >
                ← Back to catalog
              </button>
              <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded-full" style={{ background: "rgba(99, 102, 241, 0.08)", color: "var(--color-primary-light)" }}>
                {selectedCourse.shortname.split("M26")?.[0]}
              </span>
            </div>

            <div>
              <h2 className="text-base font-bold text-[var(--color-text-primary)]">
                {cleanCourseName(selectedCourse.fullname)}
              </h2>
            </div>

            {/* Collapsible tree lists */}
            {contentsLoading ? (
              <div className="space-y-3 pt-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-12 skeleton" />
                ))}
              </div>
            ) : courseContents.length === 0 ? (
              <div className="text-center py-10">
                <FolderOpen size={32} className="text-[var(--color-text-muted)] mx-auto mb-2" />
                <p className="text-xs text-[var(--color-text-muted)]">No resources found in portal.</p>
              </div>
            ) : (
              <div className="space-y-3 pt-2">
                {courseContents.map((section) => {
                  const isExpanded = !!expandedSections[section.id];
                  const hasModules = section.modules && section.modules.length > 0;

                  return (
                    <div key={section.id} className="border border-[var(--color-border-subtle)] rounded-xl overflow-hidden bg-[var(--color-base-900)]">
                      <button
                        onClick={() => toggleSection(section.id)}
                        className="w-full flex items-center justify-between p-4 text-xs font-semibold text-[var(--color-text-secondary)] hover:bg-[rgba(255,255,255,0.01)] transition-colors text-left"
                      >
                        <span className="truncate">{section.name}</span>
                        {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                      </button>

                      {isExpanded && (
                        <div className="border-t border-[var(--color-border-subtle)] p-3 space-y-2 bg-[var(--color-surface)]">
                          {hasModules ? (
                            section.modules.map((module) => {
                              const isFile = module.modname === "resource";
                              const fileUrl = isFile ? module.contents?.[0]?.fileurl : module.url;

                              return (
                                <div key={module.id} className="flex flex-col gap-2.5 p-3 rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-base-950)]">
                                  <div className="flex items-center justify-between gap-3 min-w-0">
                                    <div className="flex items-center gap-2.5 min-w-0">
                                      {isFile ? (
                                        <FileText className="text-[var(--color-primary-light)] flex-shrink-0" size={15} />
                                      ) : (
                                        <Link2 className="text-[var(--color-accent-cyan)] flex-shrink-0" size={15} />
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
                                        className="p-1 rounded-lg border border-[var(--color-border-subtle)] hover:border-[var(--color-border-hover)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors"
                                        title="View raw file"
                                      >
                                        <Eye size={12} />
                                      </a>
                                    )}
                                  </div>

                                  {/* Advanced AI Action Buttons for Notes */}
                                  {isFile && fileUrl && (
                                    <div className="flex flex-wrap gap-1.5 pt-1 border-t border-[rgba(255,255,255,0.03)]">
                                      <button
                                        onClick={() => handleQuickConsult(module.name, fileUrl, "explain")}
                                        className="px-2 py-1 rounded bg-[rgba(99,102,241,0.08)] border border-[rgba(99,102,241,0.15)] text-[var(--color-primary-light)] hover:text-white hover:bg-[var(--color-primary)] transition-all text-[9px] font-semibold flex items-center gap-1 cursor-pointer"
                                      >
                                        <Bot size={10} />
                                        Explain Notes
                                      </button>
                                      <button
                                        onClick={() => handleQuickConsult(module.name, fileUrl, "quiz")}
                                        className="px-2 py-1 rounded bg-[rgba(16,185,129,0.08)] border border-[rgba(16,185,129,0.15)] text-[var(--color-accent-emerald)] hover:text-white hover:bg-[var(--color-accent-emerald)] transition-all text-[9px] font-semibold flex items-center gap-1 cursor-pointer"
                                      >
                                        <HelpCircle size={10} />
                                        Practice Quiz
                                      </button>
                                      <button
                                        onClick={() => handleQuickConsult(module.name, fileUrl, "formulas")}
                                        className="px-2 py-1 rounded bg-[rgba(6,182,212,0.08)] border border-[rgba(6,182,212,0.15)] text-[var(--color-accent-cyan)] hover:text-white hover:bg-[var(--color-accent-cyan)] transition-all text-[9px] font-semibold flex items-center gap-1 cursor-pointer"
                                      >
                                        <Code size={10} />
                                        Code/Formulas
                                      </button>
                                      <button
                                        onClick={() => handleQuickConsult(module.name, fileUrl, "jargon")}
                                        className="px-2 py-1 rounded bg-[rgba(244,63,94,0.08)] border border-[rgba(244,63,94,0.15)] text-[var(--color-accent-rose)] hover:text-white hover:bg-[var(--color-accent-rose)] transition-all text-[9px] font-semibold flex items-center gap-1 cursor-pointer"
                                      >
                                        <Compass size={10} />
                                        De-Jargon
                                      </button>
                                    </div>
                                  )}
                                </div>
                              );
                            })
                          ) : (
                            <p className="text-[10px] text-[var(--color-text-muted)] text-center py-2">No files or pages under this section.</p>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ─── Right Panel: AI Consultation Chat ──────────────────────── */}
      <div className="w-full lg:w-[45%] flex flex-col">
        <div className="card flex-1 flex flex-col min-h-[420px] max-h-[calc(100vh-140px)] overflow-hidden shadow-xl bg-[rgba(17,21,36,0.6)] border-[var(--color-border-subtle)]">
          {/* Header */}
          <div className="px-5 py-4 border-b border-[var(--color-border-subtle)] flex items-center justify-between bg-[var(--color-base-900)]">
            <div className="flex items-center gap-2.5">
              <Bot size={18} className="text-[var(--color-primary-light)]" />
              <div>
                <h3 className="text-xs font-bold text-[var(--color-text-primary)]">AI Study Assistant</h3>
                {selectedCourse ? (
                  <p className="text-[10px] text-[var(--color-accent-emerald)] font-semibold uppercase mt-0.5">
                    Sync Mode: {selectedCourse.shortname.split("M26")?.[0]}
                  </p>
                ) : (
                  <p className="text-[10px] text-[var(--color-text-muted)] mt-0.5">Idle Mode</p>
                )}
              </div>
            </div>
            <Sparkles size={14} className="text-[var(--color-primary-light)] animate-pulse" />
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-[var(--color-base-950)]/60">
            {chatMessages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] px-4 py-3 rounded-2xl text-xs leading-relaxed ${
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
              </div>
            ))}
            
            {/* Inline loading indicators */}
            {uploadingOcr && (
              <div className="flex justify-start">
                <div className="bg-[var(--color-surface)] border border-[var(--color-border-subtle)] px-4 py-3 rounded-2xl rounded-tl-none text-xs text-[var(--color-text-muted)] flex items-center gap-2">
                  <Loader2 size={12} className="animate-spin text-[var(--color-primary-light)]" />
                  Analyzing document formats & extracting text...
                </div>
              </div>
            )}
            
            {chatLoading && (
              <div className="flex justify-start">
                <div className="bg-[var(--color-surface)] border border-[var(--color-border-subtle)] px-4 py-3 rounded-2xl rounded-tl-none text-xs text-[var(--color-text-muted)] flex items-center gap-2">
                  <Loader2 size={12} className="animate-spin text-[var(--color-primary-light)]" />
                  Tutor is thinking...
                </div>
              </div>
            )}
            
            <div ref={chatEndRef} />
          </div>

          {/* Interactive Study Presets */}
          {selectedCourse && (
            <div className="px-5 py-2 border-t border-[var(--color-border-subtle)] bg-[var(--color-base-900)] flex gap-2 overflow-x-auto whitespace-nowrap scrollbar-thin">
              <button
                onClick={() => handleSendChat("Summarize this course syllabus and files.")}
                className="text-[10px] font-semibold px-2.5 py-1.5 rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-base-950)] text-[var(--color-text-secondary)] hover:text-white hover:border-[var(--color-primary-light)] transition-colors cursor-pointer"
              >
                Summarize syllabus
              </button>
              <button
                onClick={() => handleSendChat("Create a 3-question review quiz.")}
                className="text-[10px] font-semibold px-2.5 py-1.5 rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-base-950)] text-[var(--color-text-secondary)] hover:text-white hover:border-[var(--color-primary-light)] transition-colors cursor-pointer"
              >
                Review quiz
              </button>
              <button
                onClick={() => handleSendChat("Recommend a study schedule structure for this module.")}
                className="text-[10px] font-semibold px-2.5 py-1.5 rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-base-950)] text-[var(--color-text-secondary)] hover:text-white hover:border-[var(--color-primary-light)] transition-colors cursor-pointer"
              >
                Study schedule sync
              </button>
            </div>
          )}

          {/* Attached file banner */}
          {attachedFileName && (
            <div className="px-5 py-2 bg-[rgba(99,102,241,0.1)] border-t border-[var(--color-border-subtle)] flex items-center justify-between text-[11px] text-[var(--color-primary-light)] font-semibold">
              <span className="flex items-center gap-1.5">
                <FileText size={12} />
                OCR Synced: <span className="text-white font-normal ml-1">{attachedFileName}</span>
              </span>
              <button
                onClick={() => {
                  setAttachedText("");
                  setAttachedFileName("");
                  setOcrError(null);
                }}
                className="text-[var(--color-accent-rose)] hover:text-red-400 cursor-pointer flex items-center gap-0.5 border border-red-500/20 px-2 py-0.5 rounded bg-red-500/5 text-[10px] transition-all"
              >
                <X size={10} />
                Remove
              </button>
            </div>
          )}

          {/* Inline Upload Errors */}
          {ocrError && (
            <div className="px-5 py-2 bg-red-500/10 border-t border-red-500/20 flex items-center justify-between text-[11px] text-[var(--color-accent-rose)] font-semibold">
              <span className="flex items-center gap-1.5">
                <AlertCircle size={12} />
                Failed: {ocrError}
              </span>
              <button
                onClick={() => setOcrError(null)}
                className="text-[var(--color-text-muted)] hover:text-white cursor-pointer"
              >
                <X size={12} />
              </button>
            </div>
          )}

          {/* Input Panel */}
          <div className="p-4 border-t border-[var(--color-border-subtle)] bg-[var(--color-base-900)] flex items-center gap-2.5">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*,application/pdf,application/vnd.openxmlformats-officedocument.*,application/msword,application/vnd.ms-powerpoint,application/vnd.ms-excel,text/plain"
              style={{ display: "none" }}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={!selectedCourse || chatLoading || uploadingOcr}
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
              value={chatInput}
              disabled={!selectedCourse || chatLoading || uploadingOcr}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSendChat()}
              placeholder={selectedCourse ? "Ask about your notes..." : "Select a course to start consulting..."}
              className="chat-input !py-3 !px-4 disabled:opacity-50"
            />
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleSendChat()}
              disabled={!selectedCourse || chatLoading || !chatInput.trim() || uploadingOcr}
              className="p-3 rounded-xl bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-light)] transition-colors flex items-center justify-center flex-shrink-0 disabled:opacity-20 cursor-pointer"
            >
              <Send size={14} />
            </motion.button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
