/**
 * SomaSync — AI Flashcards Page (v2)
 * Premium interactive study tool with 3D card flipping and course selection.
 */

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Layers, ChevronLeft, ChevronRight, RotateCw, Check, AlertCircle } from "lucide-react";
import { useMyCourses } from "../hooks/useMoodle";

// Rich set of subject-specific flashcards
const flashcardData = {
  // Database Systems
  "DIT 124": [
    { q: "What is a Primary Key?", a: "A unique identifier for a database record in a table, ensuring no duplicate rows can exist." },
    { q: "Define Database Normalization.", a: "The process of structuring a relational database to reduce data redundancy and improve data integrity." },
    { q: "What is the difference between INNER and LEFT JOIN?", a: "INNER JOIN returns records that have matching values in both tables. LEFT JOIN returns all records from the left table, and matching records from the right." },
    { q: "What does ACID stand for in DBMS?", a: "Atomicity, Consistency, Isolation, and Durability — properties that guarantee reliable database transactions." }
  ],
  // Electronics
  "DCS 121": [
    { q: "What is Ohm's Law?", a: "V = I * R (Voltage equals Current times Resistance)." },
    { q: "What is the primary function of a Diode?", a: "To allow electric current to flow in only one direction, acting as a one-way valve." },
    { q: "Explain the difference between AC and DC current.", a: "Alternating Current (AC) periodically reverses direction, while Direct Current (DC) flows in a single constant direction." },
    { q: "What is a Capacitor?", a: "A passive two-terminal electronic component that stores electrical energy in an electric field." }
  ],
  // User Centered Design
  "BSD 321": [
    { q: "What is the main goal of User-Centered Design?", a: "To design products around user needs, limitations, behaviors, and expectations rather than forcing users to adapt." },
    { q: "What are the stages in the UCD process?", a: "1. Understand context of use. 2. Specify user requirements. 3. Design solutions. 4. Evaluate against requirements." },
    { q: "What is a Persona in UX?", a: "A semi-fictional representation of your ideal user based on real data and research about target demographics." },
    { q: "What is Usability Testing?", a: "A technique used to evaluate a product by testing it with representative users to identify UX issues." }
  ],
  // Internet Programming II
  "BDS 322": [
    { q: "What is FastAPI?", a: "A modern, high-performance web framework for building APIs with Python 3.8+ based on standard Python type hints." },
    { q: "What is the purpose of CORS middleware in API design?", a: "To control which external domains are allowed to access API resources from a web browser, preventing unauthorized requests." },
    { q: "Define RESTful APIs.", a: "An architectural style for APIs that uses HTTP requests (GET, POST, PUT, DELETE) to access and manipulate resources." },
    { q: "What is the difference between ASGI and WSGI?", a: "WSGI (Web Server Gateway Interface) is synchronous. ASGI (Asynchronous Server Gateway Interface) supports asynchronous code execution, WebSockets, and HTTP/2." }
  ],
  // Default general study flashcards
  "General Study": [
    { q: "What is the Pomodoro Technique?", a: "A time management method that uses a timer to break work down into intervals, traditionally 25 minutes in length, separated by short breaks." },
    { q: "What is Active Recall?", a: "A study method where you stimulate your memory for a piece of information, retrieving it from your brain rather than passively re-reading." },
    { q: "Define Spaced Repetition.", a: "A learning technique performed with flashcards where cards are reviewed at increasing intervals to improve retention." }
  ]
};

const courseTitles = {
  "DIT 124": "Database Systems",
  "DCS 121": "Electronics",
  "BSD 321": "User Centered Design",
  "BDS 322": "Internet Programming II",
  "General Study": "General Study Hacks"
};

export default function Flashcards() {
  const { data: coursesData } = useMyCourses();
  const courses = coursesData?.courses || [];

  // Filter courses that have flashcard definitions or fallback to General
  const availableCourses = courses.filter(c => 
    Object.keys(flashcardData).some(key => c.shortname.includes(key))
  );

  const [selectedCourse, setSelectedCourse] = useState("General Study");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [masteredStatus, setMasteredStatus] = useState({});

  const activeCards = flashcardData[selectedCourse] || flashcardData["General Study"];
  const currentCard = activeCards[currentIndex];

  const handleNext = () => {
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % activeCards.length);
    }, 150);
  };

  const handlePrev = () => {
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev - 1 + activeCards.length) % activeCards.length);
    }, 150);
  };

  const toggleMastered = (status) => {
    const cardId = `${selectedCourse}-${currentIndex}`;
    setMasteredStatus(prev => ({
      ...prev,
      [cardId]: status
    }));
  };

  const currentCardId = `${selectedCourse}-${currentIndex}`;
  const cardMastery = masteredStatus[currentCardId];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6 flex flex-col min-h-[calc(100vh-120px)]"
    >
      {/* ─── Header ────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[var(--color-text-primary)]">AI Flashcards</h1>
          <p className="text-sm text-[var(--color-text-muted)] mt-1">
            Master core syllabus terms using spaced repetition.
          </p>
        </div>

        {/* Course Filter Dropdown */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-[var(--color-text-secondary)] font-medium">Select Subject:</span>
          <select
            value={selectedCourse}
            onChange={(e) => {
              setSelectedCourse(e.target.value);
              setCurrentIndex(0);
              setIsFlipped(false);
            }}
            className="text-xs py-2 px-3 rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-base-900)] text-[var(--color-text-primary)] outline-none focus:border-[var(--color-primary)] cursor-pointer"
          >
            <option value="General Study">General Study Hacks</option>
            {Object.keys(flashcardData).map(key => {
              if (key === "General Study") return null;
              return (
                <option key={key} value={key}>
                  {courseTitles[key] || key}
                </option>
              );
            })}
          </select>
        </div>
      </div>

      {/* ─── Flashcard Display ──────────────────────────────────────── */}
      <div className="flex-1 flex flex-col items-center justify-center max-w-lg mx-auto w-full py-4">
        
        {/* Progress */}
        <div className="text-xs text-[var(--color-text-muted)] font-mono mb-4">
          Card {currentIndex + 1} of {activeCards.length}
        </div>

        {/* Card Flip Shell */}
        <div 
          onClick={() => setIsFlipped(!isFlipped)}
          className="w-full h-80 cursor-pointer relative"
          style={{ perspective: 1000 }}
        >
          <motion.div
            animate={{ rotateY: isFlipped ? 180 : 0 }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
            style={{ transformStyle: "preserve-3d" }}
            className="w-full h-full relative"
          >
            {/* Front of Card */}
            <div 
              className="absolute inset-0 card flex flex-col justify-between p-8 md:p-10 shadow-xl"
              style={{
                backfaceVisibility: "hidden",
                border: cardMastery === "mastered" 
                  ? "1px solid rgba(52, 211, 153, 0.2)" 
                  : cardMastery === "review" 
                  ? "1px solid rgba(251, 113, 133, 0.2)"
                  : "1px solid var(--color-border-subtle)"
              }}
            >
              <div className="flex items-center justify-between text-xs text-[var(--color-text-muted)] font-semibold uppercase tracking-wider">
                <span>Question</span>
                <span className="flex items-center gap-1.5 text-[var(--color-primary-light)]">
                  <RotateCw size={11} className="animate-pulse" /> Flip card
                </span>
              </div>
              
              <div className="text-center py-6">
                <p className="text-base md:text-lg font-medium text-[var(--color-text-primary)] leading-relaxed">
                  {currentCard?.q}
                </p>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full" style={{ background: "rgba(99, 102, 241, 0.08)", color: "var(--color-primary-light)" }}>
                  {selectedCourse}
                </span>
                {cardMastery && (
                  <span className={`text-[10px] font-semibold uppercase tracking-wider ${cardMastery === "mastered" ? "text-[var(--color-accent-emerald)]" : "text-[var(--color-accent-rose)]"}`}>
                    {cardMastery}
                  </span>
                )}
              </div>
            </div>

            {/* Back of Card */}
            <div 
              className="absolute inset-0 card flex flex-col justify-between p-8 md:p-10 shadow-xl"
              style={{
                transform: "rotateY(180deg)",
                backfaceVisibility: "hidden",
                border: cardMastery === "mastered" 
                  ? "1px solid rgba(52, 211, 153, 0.2)" 
                  : cardMastery === "review" 
                  ? "1px solid rgba(251, 113, 133, 0.2)"
                  : "1px solid var(--color-border-subtle)"
              }}
            >
              <div className="flex items-center justify-between text-xs text-[var(--color-text-muted)] font-semibold uppercase tracking-wider">
                <span>Explanation</span>
                <span className="flex items-center gap-1.5 text-[var(--color-primary-light)]">
                  <RotateCw size={11} /> Flip back
                </span>
              </div>

              <div className="text-center py-6">
                <p className="text-sm md:text-base text-[var(--color-text-secondary)] leading-relaxed">
                  {currentCard?.a}
                </p>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full" style={{ background: "rgba(99, 102, 241, 0.08)", color: "var(--color-primary-light)" }}>
                  Answer
                </span>
                {cardMastery && (
                  <span className={`text-[10px] font-semibold uppercase tracking-wider ${cardMastery === "mastered" ? "text-[var(--color-accent-emerald)]" : "text-[var(--color-accent-rose)]"}`}>
                    {cardMastery}
                  </span>
                )}
              </div>
            </div>
          </motion.div>
        </div>

        {/* ─── Control Actions ───────────────────────────────────────── */}
        <div className="w-full flex items-center justify-between mt-6">
          <button
            onClick={handlePrev}
            className="p-3 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-base-900)] text-[var(--color-text-primary)] hover:border-[var(--color-border-hover)] transition-colors cursor-pointer"
          >
            <ChevronLeft size={16} />
          </button>

          {/* Mastery Toggles */}
          <div className="flex gap-2.5">
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleMastered(cardMastery === "review" ? null : "review");
              }}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
              style={{
                background: cardMastery === "review" ? "rgba(251, 113, 133, 0.15)" : "rgba(251, 113, 133, 0.03)",
                border: `1px solid ${cardMastery === "review" ? "rgba(251, 113, 133, 0.3)" : "rgba(251, 113, 133, 0.08)"}`,
                color: "var(--color-accent-rose)"
              }}
            >
              <AlertCircle size={12} />
              Review
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleMastered(cardMastery === "mastered" ? null : "mastered");
              }}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
              style={{
                background: cardMastery === "mastered" ? "rgba(52, 211, 153, 0.15)" : "rgba(52, 211, 153, 0.03)",
                border: `1px solid ${cardMastery === "mastered" ? "rgba(52, 211, 153, 0.3)" : "rgba(52, 211, 153, 0.08)"}`,
                color: "var(--color-accent-emerald)"
              }}
            >
              <Check size={12} />
              Mastered
            </button>
          </div>

          <button
            onClick={handleNext}
            className="p-3 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-base-900)] text-[var(--color-text-primary)] hover:border-[var(--color-border-hover)] transition-colors cursor-pointer"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
