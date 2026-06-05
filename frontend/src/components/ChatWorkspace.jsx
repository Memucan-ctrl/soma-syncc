/**
 * SomaSync — Omni-Input Chat Workspace
 * Terminal-styled chat interface for AI interactions.
 */

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Terminal, Send, Sparkles, Bot, User, Loader2 } from "lucide-react";

const initialMessages = [
  {
    role: "system",
    content: "SomaSync AI v0.1.0 — Powered by Gemini 2.5 Flash",
    timestamp: new Date().toISOString(),
  },
  {
    role: "assistant",
    content: "Welcome to SomaSync. I can help you analyze your coursework, generate flashcards from syllabi, or explain concepts from your enrolled modules. What would you like to work on?",
    timestamp: new Date().toISOString(),
  },
];

export default function ChatWorkspace() {
  const [messages, setMessages] = useState(initialMessages);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg = {
      role: "user",
      content: input.trim(),
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    // Simulate AI response (will be replaced with real Gemini call)
    setTimeout(() => {
      const aiMsg = {
        role: "assistant",
        content: `Processing your request about "${userMsg.content.slice(0, 50)}..." — This will connect to the Gemini 2.5 Flash API when the backend pipeline is live. For now, I'm in mock mode. Try asking about your CS301 coursework or upcoming deadlines!`,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, aiMsg]);
      setIsTyping(false);
    }, 1200);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="glass-card flex flex-col h-full" style={{ minHeight: 420 }}>
      {/* ─── Header ──────────────────────────────────────────────────── */}
      <div
        className="flex items-center gap-3 px-5 py-3 border-b"
        style={{ borderColor: "rgba(34, 211, 238, 0.08)" }}
      >
        <div className="p-1.5 rounded-lg" style={{ background: "rgba(34, 211, 238, 0.1)" }}>
          <Terminal size={14} className="text-cyan-400" />
        </div>
        <div className="flex-1">
          <h3 className="text-xs font-semibold text-slate-200">Omni-Input Workspace</h3>
          <p className="text-[10px] text-slate-500 font-mono">soma-ai :: gemini-2.5-flash</p>
        </div>
        <Sparkles size={14} className="text-amber-400 animate-float" />
      </div>

      {/* ─── Messages ────────────────────────────────────────────────── */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-5 py-4 space-y-4"
        style={{ maxHeight: 350 }}
      >
        <AnimatePresence>
          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
            >
              {msg.role !== "system" && (
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                  style={{
                    background: msg.role === "user"
                      ? "rgba(59, 130, 246, 0.15)"
                      : "rgba(34, 211, 238, 0.1)",
                  }}
                >
                  {msg.role === "user" ? (
                    <User size={13} className="text-blue-400" />
                  ) : (
                    <Bot size={13} className="text-cyan-400" />
                  )}
                </div>
              )}

              <div
                className={`
                  max-w-[85%] px-3.5 py-2.5 rounded-xl text-xs leading-relaxed
                  ${msg.role === "system"
                    ? "text-center w-full text-slate-600 font-mono text-[10px] py-1"
                    : msg.role === "user"
                      ? "text-slate-200 ml-auto"
                      : "text-slate-300"
                  }
                `}
                style={
                  msg.role === "system"
                    ? {}
                    : msg.role === "user"
                      ? { background: "rgba(59, 130, 246, 0.12)", border: "1px solid rgba(59, 130, 246, 0.15)" }
                      : { background: "rgba(14, 20, 37, 0.8)", border: "1px solid rgba(34, 211, 238, 0.08)" }
                }
              >
                {msg.content}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {isTyping && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-2 text-xs text-slate-500"
          >
            <Loader2 size={12} className="animate-spin text-cyan-400" />
            <span className="font-mono">soma-ai is thinking...</span>
          </motion.div>
        )}
      </div>

      {/* ─── Input ───────────────────────────────────────────────────── */}
      <div
        className="px-4 py-3 border-t"
        style={{ borderColor: "rgba(34, 211, 238, 0.08)" }}
      >
        <div className="flex items-center gap-2">
          <span className="text-cyan-500 text-xs font-mono flex-shrink-0">❯</span>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about coursework, generate flashcards, or analyze progress..."
            className="terminal-input flex-1 !py-2 !px-3 text-xs"
            id="omni-input"
          />
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleSend}
            disabled={!input.trim()}
            className="p-2 rounded-lg transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
            style={{ background: "rgba(34, 211, 238, 0.1)" }}
          >
            <Send size={14} className="text-cyan-400" />
          </motion.button>
        </div>
      </div>
    </div>
  );
}
