/**
 * SomaSync — AI Flashcards (v3 — AI-Generated from Real Course Content)
 * Generates flashcard Q&A from actual enrolled course syllabus via Gemini AI.
 * Caches in localStorage. Shows completion screen with topic recommendations.
 */

import { useState } from "react";
import { motion } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  RotateCw,
  Check,
  AlertCircle,
  Loader2,
  Sparkles,
  RefreshCw,
  Trophy,
  Target,
  ArrowRight,
} from "lucide-react";
import { useMyCourses } from "../hooks/useMoodle";
import { fetchCourseContents, generateFlashcards } from "../services/api";

const CACHE_KEY = "somasync_flashcards_cache";

function loadCache() {
  try { return JSON.parse(localStorage.getItem(CACHE_KEY) || "{}"); } catch { return {}; }
}

function saveCache(cache) {
  localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
}

const fallbackCards = [
  { q: "What is the Pomodoro Technique?", a: "A time management method that uses a timer to break work into 25-minute intervals separated by short breaks." },
  { q: "What is Active Recall?", a: "A study method where you stimulate memory by retrieving information from your brain rather than passively re-reading." },
  { q: "Define Spaced Repetition.", a: "A learning technique where flashcards are reviewed at increasing intervals to improve long-term retention." },
  { q: "What is the Feynman Technique?", a: "A learning method where you explain a concept in simple terms as if teaching someone else, identifying gaps in understanding." },
  { q: "What is Cornell Note-Taking?", a: "A systematic format for condensing and organizing notes by dividing a page into notes, cues, and a summary section." },
  { q: "Define the Leitner System.", a: "A flashcard review method using multiple boxes where correctly answered cards advance, and incorrect ones return to the first box." },
  { q: "What is Interleaving?", a: "A study practice where you mix different topics or problem types during a session, rather than focusing on a single topic." },
  { q: "What is the SQ3R Method?", a: "A reading comprehension method named for its steps: Survey, Question, Read, Recite, and Review." },
  { q: "Define Dual Coding.", a: "Combining verbal and visual materials (like words and diagrams) to make the information easier to store and recall." },
  { q: "What is Elaborative Rehearsal?", a: "A memory technique that involves thinking about the meaning of term to be remembered, as opposed to simply repeating it." },
  { q: "What is the Zeigarnik Effect?", a: "A psychological tendency to remember interrupted or incomplete tasks better than completed ones, highlighting the power of starting." },
  { q: "Define Metacognition.", a: "The awareness and understanding of one's own thought processes—literally 'thinking about thinking' to assess learning." },
  { q: "What is Chunking?", a: "The process of taking individual pieces of information and grouping them into larger, meaningful units to improve working memory." },
  { q: "What is the Curve of Forgetting?", a: "A hypothesis describing the exponential rate at which information is lost from the brain if there is no attempt to retain it." },
  { q: "Define Mind Mapping.", a: "A visual diagram used to represent tasks, words, concepts, or items linked to and arranged around a central subject." },
  { q: "What is the Blurting Method?", a: "An active recall study technique where you read a section of text, close the book, and quickly write down everything you remember." },
  { q: "What is Parkinson's Law?", a: "The adage that 'work expands to fill the time available for its completion,' emphasizing the benefit of setting tighter deadlines." },
  { q: "Define Cognitive Load.", a: "The total amount of mental effort being used in the working memory, which should be managed to prevent learning fatigue." },
  { q: "What is Retrieval Practice?", a: "The act of trying to recall information from memory, which strengthens neural pathways and enhances long-term retention." },
  { q: "What is Spaced Practice?", a: "Distributing study sessions over a longer period of time, rather than cramming them into a single, long session." }
];

const getNow = () => Date.now();

export default function Flashcards() {
  const { data: coursesData } = useMyCourses();
  const allCourses = coursesData?.courses || [];
  const courses = allCourses.filter((c) => !c.fullname?.toLowerCase().includes("survey"));

  const [selectedCourseId, setSelectedCourseId] = useState(null);
  const [cards, setCards] = useState(fallbackCards);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [masteredStatus, setMasteredStatus] = useState({});
  const [generating, setGenerating] = useState(false);
  const [showCompletion, setShowCompletion] = useState(false);
  const [genError, setGenError] = useState(null);

  const selectedCourse = courses.find((c) => c.id === selectedCourseId);
  const courseCode = selectedCourse?.shortname?.split("M26")?.[0] || "General";
  const currentCard = cards[currentIndex];
  const currentCardId = `${selectedCourseId || "general"}-${currentIndex}`;
  const cardMastery = masteredStatus[currentCardId];

  // Count mastery stats
  const totalCards = cards.length;
  const masteredCount = Object.entries(masteredStatus).filter(
    ([key, val]) => key.startsWith(`${selectedCourseId || "general"}-`) && val === "mastered"
  ).length;
  const reviewCount = Object.entries(masteredStatus).filter(
    ([key, val]) => key.startsWith(`${selectedCourseId || "general"}-`) && val === "review"
  ).length;
  const answeredCount = masteredCount + reviewCount;

  const handleSelectCourse = async (course) => {
    setSelectedCourseId(course.id);
    setCurrentIndex(0);
    setIsFlipped(false);
    setShowCompletion(false);
    setGenError(null);

    const cache = loadCache();
    if (cache[course.id]?.cards?.length > 0) {
      setCards(cache[course.id].cards);
      return;
    }

    // Generate from AI
    setGenerating(true);
    try {
      const contentsData = await fetchCourseContents(course.id);
      const context = (contentsData.sections || [])
        .map((s) => `${s.name}: ${(s.modules || []).map((m) => m.name).join(", ")}`)
        .join("\n");

      const code = course.shortname?.split("M26")?.[0] || course.shortname;
      const data = await generateFlashcards(code, context);

      let parsed = [];
      try {
        // Try to extract JSON from the response
        const responseText = data.response;
        const jsonMatch = responseText.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          parsed = JSON.parse(jsonMatch[0]);
        }
      } catch (e) {
        console.warn("Failed to parse AI flashcards:", e);
      }

      if (parsed.length > 0) {
        setCards(parsed);
        cache[course.id] = { cards: parsed, generatedAt: getNow() };
        saveCache(cache);
      } else {
        setCards(fallbackCards);
        setGenError("AI generated content couldn't be parsed. Using default cards.");
      }
    } catch (err) {
      console.error(err);
      setCards(fallbackCards);
      setGenError("Failed to generate flashcards. Using defaults.");
    } finally {
      setGenerating(false);
    }
  };

  const handleRegenerate = async () => {
    if (!selectedCourse) return;
    const cache = loadCache();
    delete cache[selectedCourse.id];
    saveCache(cache);
    setMasteredStatus({});
    setShowCompletion(false);
    await handleSelectCourse(selectedCourse);
  };

  const handleNext = () => {
    setIsFlipped(false);
    setTimeout(() => {
      if (currentIndex + 1 >= cards.length && answeredCount >= cards.length - 1) {
        setShowCompletion(true);
      } else {
        setCurrentIndex((prev) => (prev + 1) % cards.length);
      }
    }, 150);
  };

  const handlePrev = () => {
    setIsFlipped(false);
    setShowCompletion(false);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev - 1 + cards.length) % cards.length);
    }, 150);
  };

  const toggleMastered = (status) => {
    setMasteredStatus((prev) => ({
      ...prev,
      [currentCardId]: prev[currentCardId] === status ? null : status,
    }));
  };

  // Review topics (cards marked as "review")
  const reviewTopics = cards.filter((_, i) => {
    const key = `${selectedCourseId || "general"}-${i}`;
    return masteredStatus[key] === "review";
  });

  // If no course selected — show course picker
  if (!selectedCourseId) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="space-y-6"
      >
        <div>
          <h1 className="text-xl font-bold text-[var(--color-text-primary)]">AI Flashcards</h1>
          <p className="text-sm text-[var(--color-text-muted)] mt-1">
            Select a course to generate AI-powered flashcards from your syllabus.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {courses.map((course) => {
            const code = course.shortname?.split("M26")?.[0] || course.shortname;
            const name = course.fullname?.split(" MAY TO ")?.[0]?.split("GRP")?.[0]?.trim() || course.fullname;
            const cache = loadCache();
            const isCached = !!cache[course.id]?.cards?.length;

            return (
              <motion.div
                key={course.id}
                whileHover={{ y: -3 }}
                onClick={() => handleSelectCourse(course)}
                className="card p-5 cursor-pointer flex flex-col justify-between hover:border-[var(--color-border-hover)] transition-all"
              >
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded-full" style={{ background: "rgba(99,102,241,0.08)", color: "var(--color-primary-light)" }}>
                      {code}
                    </span>
                    {isCached && (
                      <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full" style={{ background: "rgba(52,211,153,0.08)", color: "var(--color-accent-emerald)" }}>
                        ✓ Generated
                      </span>
                    )}
                  </div>
                  <h3 className="text-sm font-semibold text-[var(--color-text-primary)] leading-snug">{name}</h3>
                </div>
                <div className="flex items-center gap-1 text-xs text-[var(--color-primary-light)] font-semibold mt-4">
                  <Sparkles size={12} />
                  <span>{isCached ? "Resume Practice" : "Generate Flashcards"}</span>
                  <ArrowRight size={12} />
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    );
  }

  // Generating state
  if (generating) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center justify-center min-h-[60vh]"
      >
        <div className="card p-10 text-center max-w-sm">
          <Loader2 size={32} className="animate-spin text-[var(--color-primary-light)] mx-auto mb-4" />
          <h3 className="text-sm font-bold text-[var(--color-text-primary)] mb-2">Generating Flashcards</h3>
          <p className="text-xs text-[var(--color-text-muted)]">
            AI is analyzing your <span className="text-[var(--color-primary-light)] font-semibold">{courseCode}</span> course materials...
          </p>
        </div>
      </motion.div>
    );
  }

  // Completion screen
  if (showCompletion) {
    const score = totalCards > 0 ? Math.round((masteredCount / totalCards) * 100) : 0;

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center justify-center min-h-[60vh]"
      >
        <div className="card p-8 text-center max-w-md w-full space-y-5">
          <div className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center" style={{ background: "rgba(52,211,153,0.1)" }}>
            <Trophy size={28} className="text-[var(--color-accent-emerald)]" />
          </div>

          <div>
            <h2 className="text-lg font-bold text-[var(--color-text-primary)]">Session Complete!</h2>
            <p className="text-xs text-[var(--color-text-muted)] mt-1">{courseCode} Flashcards</p>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 rounded-xl" style={{ background: "rgba(52,211,153,0.06)", border: "1px solid rgba(52,211,153,0.15)" }}>
              <p className="text-xl font-bold text-[var(--color-accent-emerald)]">{masteredCount}</p>
              <p className="text-[9px] text-[var(--color-text-muted)] uppercase tracking-wider mt-1">Mastered</p>
            </div>
            <div className="p-3 rounded-xl" style={{ background: "rgba(251,113,133,0.06)", border: "1px solid rgba(251,113,133,0.15)" }}>
              <p className="text-xl font-bold text-[var(--color-accent-rose)]">{reviewCount}</p>
              <p className="text-[9px] text-[var(--color-text-muted)] uppercase tracking-wider mt-1">Review</p>
            </div>
            <div className="p-3 rounded-xl" style={{ background: "rgba(99,102,241,0.06)", border: "1px solid rgba(99,102,241,0.15)" }}>
              <p className="text-xl font-bold text-[var(--color-primary-light)]">{score}%</p>
              <p className="text-[9px] text-[var(--color-text-muted)] uppercase tracking-wider mt-1">Score</p>
            </div>
          </div>

          {/* Topics to focus on */}
          {reviewTopics.length > 0 && (
            <div className="text-left p-4 rounded-xl" style={{ background: "rgba(251,113,133,0.04)", border: "1px solid rgba(251,113,133,0.1)" }}>
              <h4 className="text-xs font-bold text-[var(--color-accent-rose)] flex items-center gap-1.5 mb-2">
                <Target size={12} />
                Topics to Focus On
              </h4>
              <ul className="space-y-1.5">
                {reviewTopics.map((card, i) => (
                  <li key={i} className="text-[11px] text-[var(--color-text-secondary)] flex items-start gap-2">
                    <span className="text-[var(--color-accent-rose)] mt-0.5">•</span>
                    {card.q}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex gap-3 justify-center pt-2">
            <button
              onClick={() => { setShowCompletion(false); setCurrentIndex(0); setIsFlipped(false); }}
              className="px-4 py-2 rounded-xl text-xs font-semibold border border-[var(--color-border-subtle)] text-[var(--color-text-secondary)] hover:text-white transition-all cursor-pointer"
            >
              Practice Again
            </button>
            <button
              onClick={handleRegenerate}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-white cursor-pointer flex items-center gap-1.5"
              style={{ background: "linear-gradient(135deg, #6366F1, #818CF8)" }}
            >
              <RefreshCw size={12} />
              Regenerate
            </button>
            <button
              onClick={() => { setSelectedCourseId(null); setShowCompletion(false); setCurrentIndex(0); setMasteredStatus({}); }}
              className="px-4 py-2 rounded-xl text-xs font-semibold border border-[var(--color-border-subtle)] text-[var(--color-text-secondary)] hover:text-white transition-all cursor-pointer"
            >
              Other Course
            </button>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6 flex flex-col min-h-[calc(100vh-120px)]"
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => { setSelectedCourseId(null); setCurrentIndex(0); setMasteredStatus({}); setCards(fallbackCards); }}
              className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors cursor-pointer"
            >
              ← Back
            </button>
            <h1 className="text-xl font-bold text-[var(--color-text-primary)]">AI Flashcards</h1>
          </div>
          <p className="text-sm text-[var(--color-text-muted)] mt-1">
            <span className="text-[var(--color-primary-light)] font-semibold">{courseCode}</span> · AI-generated from your course syllabus
          </p>
        </div>

        <div className="flex items-center gap-2">
          {genError && (
            <span className="text-[10px] text-[var(--color-accent-rose)] flex items-center gap-1">
              <AlertCircle size={10} /> {genError}
            </span>
          )}
          <button
            onClick={handleRegenerate}
            disabled={generating}
            className="text-[10px] font-semibold px-3 py-1.5 rounded-lg border border-[var(--color-border-subtle)] text-[var(--color-text-secondary)] hover:text-white transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-30"
          >
            <RefreshCw size={10} />
            Regenerate
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-1.5 rounded-full bg-[var(--color-base-900)] overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${((currentIndex + 1) / totalCards) * 100}%` }}
            className="h-full rounded-full"
            style={{ background: "linear-gradient(90deg, #6366F1, #34D399)" }}
          />
        </div>
        <span className="text-xs text-[var(--color-text-muted)] font-mono">{currentIndex + 1}/{totalCards}</span>
        <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold" style={{ background: "rgba(52,211,153,0.08)", color: "var(--color-accent-emerald)" }}>
          {masteredCount} mastered
        </span>
      </div>

      {/* Flashcard */}
      <div className="flex-1 flex flex-col items-center justify-center max-w-lg mx-auto w-full py-4">
        <div
          onClick={() => setIsFlipped(!isFlipped)}
          className="w-full h-72 cursor-pointer relative"
          style={{ perspective: 1000 }}
        >
          <motion.div
            animate={{ rotateY: isFlipped ? 180 : 0 }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
            style={{ transformStyle: "preserve-3d" }}
            className="w-full h-full relative"
          >
            {/* Front */}
            <div
              className="absolute inset-0 card flex flex-col justify-between p-7 shadow-xl"
              style={{
                backfaceVisibility: "hidden",
                border: cardMastery === "mastered" ? "1px solid rgba(52,211,153,0.2)" : cardMastery === "review" ? "1px solid rgba(251,113,133,0.2)" : "1px solid var(--color-border-subtle)",
              }}
            >
              <div className="flex items-center justify-between text-xs text-[var(--color-text-muted)] font-semibold uppercase tracking-wider">
                <span>Question</span>
                <span className="flex items-center gap-1.5 text-[var(--color-primary-light)]">
                  <RotateCw size={11} className="animate-pulse" /> Flip
                </span>
              </div>
              <div className="text-center py-4">
                <p className="text-base font-medium text-[var(--color-text-primary)] leading-relaxed">
                  {currentCard?.q}
                </p>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full" style={{ background: "rgba(99,102,241,0.08)", color: "var(--color-primary-light)" }}>
                  {courseCode}
                </span>
                {cardMastery && (
                  <span className={`text-[10px] font-semibold uppercase ${cardMastery === "mastered" ? "text-[var(--color-accent-emerald)]" : "text-[var(--color-accent-rose)]"}`}>
                    {cardMastery}
                  </span>
                )}
              </div>
            </div>

            {/* Back */}
            <div
              className="absolute inset-0 card flex flex-col justify-between p-7 shadow-xl"
              style={{
                transform: "rotateY(180deg)",
                backfaceVisibility: "hidden",
                border: cardMastery === "mastered" ? "1px solid rgba(52,211,153,0.2)" : cardMastery === "review" ? "1px solid rgba(251,113,133,0.2)" : "1px solid var(--color-border-subtle)",
              }}
            >
              <div className="flex items-center justify-between text-xs text-[var(--color-text-muted)] font-semibold uppercase tracking-wider">
                <span>Answer</span>
                <span className="flex items-center gap-1.5 text-[var(--color-primary-light)]"><RotateCw size={11} /> Flip back</span>
              </div>
              <div className="text-center py-4">
                <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">{currentCard?.a}</p>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full" style={{ background: "rgba(99,102,241,0.08)", color: "var(--color-primary-light)" }}>Answer</span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Controls */}
        <div className="w-full flex items-center justify-between mt-6">
          <button onClick={handlePrev} className="p-3 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-base-900)] text-[var(--color-text-primary)] hover:border-[var(--color-border-hover)] transition-colors cursor-pointer">
            <ChevronLeft size={16} />
          </button>

          <div className="flex gap-2.5">
            <button
              onClick={(e) => { e.stopPropagation(); toggleMastered("review"); }}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
              style={{
                background: cardMastery === "review" ? "rgba(251,113,133,0.15)" : "rgba(251,113,133,0.03)",
                border: `1px solid ${cardMastery === "review" ? "rgba(251,113,133,0.3)" : "rgba(251,113,133,0.08)"}`,
                color: "var(--color-accent-rose)",
              }}
            >
              <AlertCircle size={12} /> Review
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); toggleMastered("mastered"); }}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
              style={{
                background: cardMastery === "mastered" ? "rgba(52,211,153,0.15)" : "rgba(52,211,153,0.03)",
                border: `1px solid ${cardMastery === "mastered" ? "rgba(52,211,153,0.3)" : "rgba(52,211,153,0.08)"}`,
                color: "var(--color-accent-emerald)",
              }}
            >
              <Check size={12} /> Mastered
            </button>
          </div>

          <button onClick={handleNext} className="p-3 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-base-900)] text-[var(--color-text-primary)] hover:border-[var(--color-border-hover)] transition-colors cursor-pointer">
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
