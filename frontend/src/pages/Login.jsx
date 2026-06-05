/**
 * SomaSync — Login Page (v2)
 * Premium Academic themed login screen. Authenticates directly with Zetech Moodle.
 */

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, User, Lock, ArrowRight, ShieldAlert, CheckCircle } from "lucide-react";
import { login } from "../services/api";

export default function Login({ onLoginSuccess }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError("Please fill in all fields.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await login(username.trim(), password);
      setSuccess(true);
      // Wait slightly for success animation
      setTimeout(() => {
        onLoginSuccess(data.token, data.profile);
      }, 1000);
    } catch (err) {
      setError(err.message || "Failed to connect to Zetech Moodle.");
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen w-full flex items-center justify-center relative overflow-hidden"
      style={{ background: "var(--color-base-950)" }}
    >
      {/* ─── Ambient Glow Effects ─────────────────────────────────────── */}
      <div
        className="absolute w-[600px] h-[600px] rounded-full pointer-events-none opacity-25"
        style={{
          top: "10%",
          left: "15%",
          background: "radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, transparent 65%)",
          filter: "blur(80px)",
        }}
      />
      <div
        className="absolute w-[500px] h-[500px] rounded-full pointer-events-none opacity-20"
        style={{
          bottom: "10%",
          right: "15%",
          background: "radial-gradient(circle, rgba(34, 211, 238, 0.12) 0%, transparent 65%)",
          filter: "blur(80px)",
        }}
      />

      {/* ─── Login Card ──────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-[420px] mx-4 relative z-10"
      >
        <div className="card p-8 md:p-10 shadow-2xl relative overflow-hidden">
          {/* Subtle top indicator border */}
          <div
            className="absolute top-0 left-0 right-0 h-[3px]"
            style={{ background: "linear-gradient(90deg, #6366F1, #22D3EE)" }}
          />

          {/* ─── Logo & Header ────────────────────────────────────────── */}
          <div className="flex flex-col items-center text-center mb-8">
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4"
              style={{ background: "linear-gradient(135deg, #6366F1, #818CF8)" }}
            >
              <Zap className="text-white" size={24} />
            </motion.div>
            <h2 className="text-2xl font-bold tracking-tight text-[var(--color-text-primary)]">
              SomaSync
            </h2>
            <p className="text-xs text-[var(--color-text-muted)] mt-1.5 uppercase tracking-wider font-semibold">
              Zetech University Portal
            </p>
          </div>

          {/* ─── Success Feedback ──────────────────────────────────────── */}
          <AnimatePresence mode="wait">
            {success ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="flex flex-col items-center justify-center py-6 text-center"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, damping: 15 }}
                  className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
                  style={{ background: "rgba(52, 211, 153, 0.1)" }}
                >
                  <CheckCircle className="text-[var(--color-accent-emerald)]" size={36} />
                </motion.div>
                <h3 className="text-base font-semibold text-[var(--color-text-primary)]">
                  Sync Successful
                </h3>
                <p className="text-xs text-[var(--color-text-secondary)] mt-1">
                  Welcome to gamified study intelligence.
                </p>
              </motion.div>
            ) : (
              <motion.form
                key="login-form"
                onSubmit={handleSubmit}
                className="space-y-5"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                {/* Error Banner */}
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3.5 rounded-xl flex items-start gap-3"
                    style={{
                      background: "rgba(251, 113, 133, 0.08)",
                      border: "1px solid rgba(251, 113, 133, 0.15)",
                    }}
                  >
                    <ShieldAlert className="text-[var(--color-accent-rose)] flex-shrink-0 mt-0.5" size={16} />
                    <p className="text-xs text-[var(--color-accent-rose)] leading-relaxed font-medium">
                      {error}
                    </p>
                  </motion.div>
                )}

                {/* Username Field */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[var(--color-text-secondary)]">
                    Student Username
                  </label>
                  <div className="relative">
                    <User
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]"
                      size={16}
                    />
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="e.g. bse-01-0114/2025"
                      disabled={loading}
                      className="w-full text-sm py-3 pl-11 pr-4 rounded-xl border transition-all"
                      style={{
                        background: "var(--color-base-900)",
                        borderColor: "var(--color-border-subtle)",
                        color: "var(--color-text-primary)",
                      }}
                      onFocus={(e) => (e.target.style.borderColor = "var(--color-primary)")}
                      onBlur={(e) => (e.target.style.borderColor = "var(--color-border-subtle)")}
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[var(--color-text-secondary)]">
                    Moodle Password
                  </label>
                  <div className="relative">
                    <Lock
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]"
                      size={16}
                    />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      disabled={loading}
                      className="w-full text-sm py-3 pl-11 pr-4 rounded-xl border transition-all"
                      style={{
                        background: "var(--color-base-900)",
                        borderColor: "var(--color-border-subtle)",
                        color: "var(--color-text-primary)",
                      }}
                      onFocus={(e) => (e.target.style.borderColor = "var(--color-primary)")}
                      onBlur={(e) => (e.target.style.borderColor = "var(--color-border-subtle)")}
                    />
                  </div>
                </div>

                {/* Action Info */}
                <p className="text-[10px] text-[var(--color-text-muted)] leading-relaxed text-center">
                  Your credentials sync directly with the official Zetech Digital School server. We do not store your password.
                </p>

                {/* Submit Button */}
                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  disabled={loading}
                  type="submit"
                  className="w-full py-3.5 rounded-xl font-medium text-sm text-white flex items-center justify-center gap-2 transition-all relative overflow-hidden cursor-pointer"
                  style={{
                    background: "linear-gradient(90deg, #6366F1, #4F46E5)",
                    boxShadow: "0 4px 20px rgba(99, 102, 241, 0.15)",
                  }}
                >
                  {loading ? (
                    <div className="flex items-center gap-2.5">
                      <span className="w-4.5 h-4.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Syncing Data...</span>
                    </div>
                  ) : (
                    <>
                      <span>Sign In & Sync</span>
                      <ArrowRight size={15} />
                    </>
                  )}
                </motion.button>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
