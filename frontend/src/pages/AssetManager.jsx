/**
 * SomaSync — Asset Manager & AI Consultation (v2)
 * A premium interface that maps Zetech Moodle courses to an interactive notes catalog
 * and lets students consult the AI about specific course syllabus and materials.
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
  ExternalLink,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { useMyCourses } from "../hooks/useMoodle";
import { fetchCourseContents, sendConsultationQuery } from "../services/api";

export default function AssetManager() {
  const { data: coursesData, loading: coursesLoading } = useMyCourses();
  const courses = coursesData?.courses || [];

  const [selectedCourse, setSelectedCourse] = useState(null);
  const [courseContents, setCourseContents] = useState([]);
  const [contentsLoading, setContentsLoading] = useState(false);
  const [expandedSections, setExpandedSections] = useState({});

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
    
    // Set introductory AI message for the selected course
    const courseCode = course.shortname.split("M26")?.[0] || course.shortname;
    setChatMessages([
      {
        role: "assistant",
        content: `Hi! I am now connected to your **${courseCode} — ${cleanCourseName(course.fullname)}** study files. What topic would you like to consult about?`,
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

  const handleSendChat = async (presetMsg = "") => {
    const query = presetMsg || chatInput.trim();
    if (!query || !selectedCourse) return;

    if (!presetMsg) setChatInput("");

    const userMsg = { role: "user", content: query, ts: Date.now() };
    setChatMessages((prev) => [...prev, userMsg]);
    setChatLoading(true);

    // Build context representing the course files/topics
    const courseCode = selectedCourse.shortname.split("M26")?.[0] || selectedCourse.shortname;
    const contentsContext = courseContents
      .map((s) => `${s.name}: ${s.modules?.map((m) => m.name).join(", ")}`)
      .join("\n");

    try {
      const data = await sendConsultationQuery(query, courseCode, contentsContext);
      setChatMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.response, ts: Date.now() },
      ]);
    } catch (err) {
      setChatMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Error: Failed to obtain AI consultation. Please verify connection.", ts: Date.now() },
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  const handleQuickConsult = (resourceName) => {
    if (!selectedCourse) return;
    const query = `Can you explain the main concepts covered in "${resourceName}"?`;
    handleSendChat(query);
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
          <h1 className="text-xl font-bold text-[var(--color-text-primary)]">Asset Manager</h1>
          <p className="text-sm text-[var(--color-text-muted)] mt-1">
            Browse notes, files, and resources fetched from your student portal catalog.
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
                  className="card p-5 cursor-pointer flex flex-col justify-between hover:border-[var(--color-border-hover)] transition-all"
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
          <div className="card p-6 space-y-5">
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
                              const isUrl = module.modname === "url";
                              const fileUrl = isFile ? module.contents?.[0]?.fileurl : module.url;

                              return (
                                <div key={module.id} className="flex items-center justify-between gap-3 p-3 rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-base-950)]">
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

                                  <div className="flex items-center gap-2 flex-shrink-0">
                                    {fileUrl && (
                                      <a
                                        href={`${fileUrl}${fileUrl.includes("?") ? "" : "?"}&token=${localStorage.getItem("somasync_token")}`}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="p-1.5 rounded-lg border border-[var(--color-border-subtle)] hover:border-[var(--color-border-hover)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors"
                                      >
                                        <Eye size={12} />
                                      </a>
                                    )}
                                    <button
                                      onClick={() => handleQuickConsult(module.name)}
                                      title="Consult AI about this note"
                                      className="px-2 py-1 rounded-lg bg-[rgba(99, 102, 241, 0.08)] border border-[rgba(99, 102, 241, 0.15)] text-[var(--color-primary-light)] hover:text-white hover:bg-[var(--color-primary)] transition-all text-[10px] font-semibold flex items-center gap-1 cursor-pointer"
                                    >
                                      <Bot size={11} />
                                      Consult AI
                                    </button>
                                  </div>
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
        <div className="card flex-1 flex flex-col min-h-[420px] max-h-[calc(100vh-140px)] overflow-hidden shadow-xl">
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
          <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-[var(--color-base-950)]">
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
                  {/* Handle newlines simply for layout */}
                  {msg.content.split("\n").map((line, idx) => (
                    <p key={idx} className={idx > 0 ? "mt-1.5" : ""}>
                      {line}
                    </p>
                  ))}
                </div>
              </div>
            ))}
            {chatLoading && (
              <div className="flex justify-start">
                <div className="bg-[var(--color-surface)] border border-[var(--color-border-subtle)] px-4 py-3 rounded-2xl rounded-tl-none text-xs text-[var(--color-text-muted)] flex items-center gap-2">
                  <Loader2 size={12} className="animate-spin text-[var(--color-primary-light)]" />
                  Generating consultation response...
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Quick Action Chips */}
          {selectedCourse && (
            <div className="px-5 py-2.5 border-t border-[var(--color-border-subtle)] bg-[var(--color-base-900)] flex gap-2 overflow-x-auto whitespace-nowrap">
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
            </div>
          )}

          {/* Input Panel */}
          <div className="p-4 border-t border-[var(--color-border-subtle)] bg-[var(--color-base-900)] flex items-center gap-2.5">
            <input
              type="text"
              value={chatInput}
              disabled={!selectedCourse || chatLoading}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSendChat()}
              placeholder={selectedCourse ? "Ask about your notes..." : "Select a course to start consulting..."}
              className="chat-input !py-3 !px-4"
            />
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleSendChat()}
              disabled={!selectedCourse || chatLoading || !chatInput.trim()}
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
