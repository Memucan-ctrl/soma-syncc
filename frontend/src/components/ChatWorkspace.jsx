/**
 * SomaSync — Chat Input Bar (v2 — Bottom Bar)
 * Full-width AI chat bar pinned at the bottom of the home page.
 */

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Sparkles, Bot, Loader2, X } from "lucide-react";

export default function ChatBar() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const inputRef = useRef(null);

  const handleSend = () => {
    if (!input.trim()) return;

    const userMsg = { role: "user", content: input.trim(), ts: Date.now() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);
    setExpanded(true);

    setTimeout(() => {
      const aiMsg = {
        role: "assistant",
        content: `I'll help with "${userMsg.content.substring(0, 60)}". The Gemini 2.5 Flash pipeline will be connected soon — for now I'm in preview mode. Try asking about your courses or upcoming deadlines!`,
        ts: Date.now(),
      };
      setMessages((prev) => [...prev, aiMsg]);
      setIsTyping(false);
    }, 1000);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
    if (e.key === "Escape") {
      setExpanded(false);
    }
  };

  return (
    <motion.div
      layout
      className="card overflow-hidden"
      style={{ borderColor: expanded ? "rgba(99, 102, 241, 0.15)" : undefined }}
    >
      {/* ─── Expanded Messages ─────────────────────────────────────── */}
      <AnimatePresence>
        {expanded && messages.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="border-b"
            style={{ borderColor: "var(--color-border-subtle)" }}
          >
            <div className="flex items-center justify-between px-5 py-2">
              <div className="flex items-center gap-2">
                <Bot size={13} className="text-[var(--color-primary)]" />
                <span className="text-[11px] text-[var(--color-text-muted)] font-medium">SomaSync AI</span>
              </div>
              <button
                onClick={() => setExpanded(false)}
                className="p-1 rounded-md hover:bg-[rgba(99,102,241,0.1)] transition-colors cursor-pointer"
              >
                <X size={13} className="text-[var(--color-text-muted)]" />
              </button>
            </div>
            <div className="px-5 pb-3 space-y-2 max-h-48 overflow-y-auto">
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className="max-w-[80%] px-3 py-2 rounded-xl text-xs leading-relaxed"
                    style={
                      msg.role === "user"
                        ? { background: "rgba(99, 102, 241, 0.12)", color: "var(--color-text-primary)" }
                        : { background: "rgba(17, 21, 36, 0.8)", color: "var(--color-text-secondary)" }
                    }
                  >
                    {msg.content}
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex items-center gap-2 text-[11px] text-[var(--color-text-muted)]">
                  <Loader2 size={11} className="animate-spin text-[var(--color-primary)]" />
                  Thinking...
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Input Bar ─────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 px-5 py-3">
        <Sparkles size={16} className="text-[var(--color-primary)] flex-shrink-0" />
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => messages.length > 0 && setExpanded(true)}
          placeholder="Ask SomaSync AI about your courses, generate flashcards, or plan your study schedule..."
          className="chat-input !border-0 !bg-transparent !p-0 !shadow-none flex-1"
          id="soma-chat-input"
        />
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleSend}
          disabled={!input.trim()}
          className="p-2.5 rounded-xl transition-all cursor-pointer disabled:opacity-25 disabled:cursor-not-allowed"
          style={{
            background: input.trim() ? "linear-gradient(135deg, #6366F1, #818CF8)" : "rgba(99, 102, 241, 0.08)",
          }}
        >
          <Send size={14} className="text-white" />
        </motion.button>
      </div>
    </motion.div>
  );
}
