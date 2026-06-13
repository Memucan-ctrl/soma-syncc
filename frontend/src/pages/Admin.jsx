/**
 * SomaSync — Admin Dashboard
 * System health, analytics, settings, and user monitoring.
 */

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Shield,
  Activity,
  Settings,
  Server,
  RefreshCw,
  CheckCircle,
  XCircle,
  Globe,
  Cpu,
  Database,
  BarChart3,
  Eye,
  ToggleLeft,
  ToggleRight,
  ExternalLink,
} from "lucide-react";
import { fetchAdminHealth } from "../services/api";

const SETTINGS_KEY = "somasync_admin_settings";

function loadSettings() {
  try {
    return JSON.parse(localStorage.getItem(SETTINGS_KEY) || "{}");
  } catch {
    return {};
  }
}

function saveSettings(s) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
}

function ToggleSwitch({ enabled, onToggle, label }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-[var(--color-border-subtle)]">
      <span className="text-xs font-medium text-[var(--color-text-secondary)]">{label}</span>
      <button
        onClick={onToggle}
        className="cursor-pointer transition-all"
        style={{ color: enabled ? "var(--color-accent-emerald)" : "var(--color-text-muted)" }}
      >
        {enabled ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
      </button>
    </div>
  );
}

function StatusCard({ icon: Icon, label, value, status, color }) {
  return (
    <div className="metric-card">
      <div className="flex items-center gap-3 mb-3">
        <div className="p-2 rounded-lg" style={{ background: `${color}15` }}>
          <Icon size={16} style={{ color }} />
        </div>
        <span className="text-[11px] font-medium text-[var(--color-text-muted)] uppercase tracking-wider">
          {label}
        </span>
      </div>
      <div className="flex items-center gap-2">
        {status === "ok" ? (
          <CheckCircle size={14} className="text-[var(--color-accent-emerald)]" />
        ) : status === "error" ? (
          <XCircle size={14} className="text-[var(--color-accent-rose)]" />
        ) : (
          <RefreshCw size={14} className="animate-spin text-[var(--color-text-muted)]" />
        )}
        <p className="text-sm font-semibold text-[var(--color-text-primary)]">{value}</p>
      </div>
    </div>
  );
}

export default function Admin() {
  const [healthData, setHealthData] = useState(null);
  const [healthLoading, setHealthLoading] = useState(true);
  const [settings, setSettings] = useState(() => ({
    maintenanceMode: false,
    aiEnabled: true,
    flashcardsEnabled: true,
    ocrEnabled: true,
    devTrackerEnabled: true,
    posthogEnabled: true,
    posthogKey: "phx_KRDWza7GTvywRpyBRtbK7gcMzAYVoVBSfxiQbYUgY8xHh4ZY",
    ...loadSettings(),
  }));

  const [activeSection, setActiveSection] = useState("overview");

  const checkHealth = useCallback(async () => {
    setHealthLoading(true);
    try {
      const data = await fetchAdminHealth();
      setHealthData({ ...data, timestamp: Date.now(), status: "ok" });
    } catch (err) {
      setHealthData({ status: "error", error: err.message, timestamp: Date.now() });
    } finally {
      setHealthLoading(false);
    }
  }, []);

  useEffect(() => {
    checkHealth();
  }, [checkHealth]);

  useEffect(() => {
    saveSettings(settings);
  }, [settings]);

  const updateSetting = (key, value) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const sections = [
    { id: "overview", label: "Overview", icon: BarChart3 },
    { id: "health", label: "System Health", icon: Activity },
    { id: "settings", label: "Feature Flags", icon: Settings },
    { id: "analytics", label: "Analytics", icon: Eye },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-5"
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl" style={{ background: "rgba(251,191,36,0.1)", border: "1px solid rgba(251,191,36,0.2)" }}>
            <Shield size={20} className="text-[var(--color-accent-amber)]" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[var(--color-text-primary)]">Admin Panel</h1>
            <p className="text-sm text-[var(--color-text-muted)]">System monitoring & configuration</p>
          </div>
        </div>
        <button
          onClick={checkHealth}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold border border-[var(--color-border-subtle)] text-[var(--color-text-secondary)] hover:text-white hover:border-[var(--color-border-hover)] transition-all cursor-pointer"
        >
          <RefreshCw size={13} className={healthLoading ? "animate-spin" : ""} />
          Refresh Health
        </button>
      </div>

      {/* Section Tabs */}
      <div className="flex gap-1 p-1 rounded-xl border border-[var(--color-border-subtle)]" style={{ background: "var(--color-base-900)" }}>
        {sections.map((s) => {
          const Icon = s.icon;
          return (
            <button
              key={s.id}
              onClick={() => setActiveSection(s.id)}
              className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeSection === s.id
                  ? "bg-[rgba(99,102,241,0.1)] text-[var(--color-primary-light)]"
                  : "text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]"
              }`}
            >
              <Icon size={14} />
              <span className="hidden sm:inline">{s.label}</span>
            </button>
          );
        })}
      </div>

      {/* ─── Overview ─────────────────────────────────────────────── */}
      {activeSection === "overview" && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatusCard
              icon={Server}
              label="API Server"
              value={healthData?.status === "ok" ? "Operational" : healthLoading ? "Checking..." : "Down"}
              status={healthData?.status || "loading"}
              color="#34D399"
            />
            <StatusCard
              icon={Cpu}
              label="AI Engine"
              value={settings.aiEnabled ? "Active" : "Disabled"}
              status={settings.aiEnabled ? "ok" : "error"}
              color="#6366F1"
            />
            <StatusCard
              icon={Database}
              label="Moodle Sync"
              value={healthData?.auth || "Token Flow"}
              status={healthData ? "ok" : "loading"}
              color="#22D3EE"
            />
            <StatusCard
              icon={Globe}
              label="Deployment"
              value="somasync.tech"
              status="ok"
              color="#FBBF24"
            />
          </div>

          {/* Quick Stats */}
          <div className="card p-5 space-y-3">
            <h3 className="text-sm font-bold text-[var(--color-text-primary)]">Quick Info</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "Version", value: "v0.2.0" },
                { label: "Frontend", value: "React 19 + Vite 8" },
                { label: "Backend", value: "FastAPI + Python 3.12" },
                { label: "AI Model", value: "Gemini 2.5 Flash" },
              ].map((item) => (
                <div key={item.label} className="p-3 rounded-xl border border-[var(--color-border-subtle)]">
                  <p className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-wider font-semibold">{item.label}</p>
                  <p className="text-xs font-semibold text-[var(--color-text-primary)] mt-1">{item.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ─── System Health ────────────────────────────────────────── */}
      {activeSection === "health" && (
        <div className="card p-5 space-y-4">
          <h3 className="text-sm font-bold text-[var(--color-text-primary)]">System Health Check</h3>

          {healthLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => <div key={i} className="h-12 skeleton rounded-xl" />)}
            </div>
          ) : (
            <div className="space-y-2">
              {[
                { label: "API Response", value: healthData?.status === "ok" ? "Healthy" : "Error", ok: healthData?.status === "ok" },
                { label: "Auth System", value: healthData?.auth || "moodle_token_flow", ok: true },
                { label: "Last Check", value: healthData?.timestamp ? new Date(healthData.timestamp).toLocaleString() : "—", ok: true },
              ].map((check) => (
                <div key={check.label} className="flex items-center justify-between p-3 rounded-xl border border-[var(--color-border-subtle)]">
                  <span className="text-xs text-[var(--color-text-secondary)] font-medium">{check.label}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-[var(--color-text-primary)]">{check.value}</span>
                    {check.ok ? (
                      <CheckCircle size={14} className="text-[var(--color-accent-emerald)]" />
                    ) : (
                      <XCircle size={14} className="text-[var(--color-accent-rose)]" />
                    )}
                  </div>
                </div>
              ))}

              {healthData?.error && (
                <div className="p-3 rounded-xl bg-red-500/5 border border-red-500/10">
                  <p className="text-xs text-[var(--color-accent-rose)] font-medium">{healthData.error}</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ─── Feature Flags ────────────────────────────────────────── */}
      {activeSection === "settings" && (
        <div className="card p-5 space-y-2">
          <h3 className="text-sm font-bold text-[var(--color-text-primary)] mb-3">Feature Flags</h3>

          <ToggleSwitch
            label="AI Chat & Consultation"
            enabled={settings.aiEnabled}
            onToggle={() => updateSetting("aiEnabled", !settings.aiEnabled)}
          />
          <ToggleSwitch
            label="AI Flashcards Generation"
            enabled={settings.flashcardsEnabled}
            onToggle={() => updateSetting("flashcardsEnabled", !settings.flashcardsEnabled)}
          />
          <ToggleSwitch
            label="Document OCR (Azure)"
            enabled={settings.ocrEnabled}
            onToggle={() => updateSetting("ocrEnabled", !settings.ocrEnabled)}
          />
          <ToggleSwitch
            label="DevTracker (GitHub)"
            enabled={settings.devTrackerEnabled}
            onToggle={() => updateSetting("devTrackerEnabled", !settings.devTrackerEnabled)}
          />
          <ToggleSwitch
            label="Maintenance Mode"
            enabled={settings.maintenanceMode}
            onToggle={() => updateSetting("maintenanceMode", !settings.maintenanceMode)}
          />

          <div className="pt-3 mt-3 border-t border-[var(--color-border-subtle)]">
            <p className="text-[10px] text-[var(--color-text-muted)] leading-relaxed">
              Feature flags are stored locally. Backend feature flag sync requires Supabase or Redis integration.
            </p>
          </div>
        </div>
      )}

      {/* ─── Analytics ────────────────────────────────────────────── */}
      {activeSection === "analytics" && (
        <div className="space-y-5">
          <div className="card p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-[var(--color-text-primary)]">PostHog Analytics</h3>
              <ToggleSwitch
                label=""
                enabled={settings.posthogEnabled}
                onToggle={() => updateSetting("posthogEnabled", !settings.posthogEnabled)}
              />
            </div>

            {settings.posthogEnabled ? (
              <div className="space-y-3">
                <div>
                  <label className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-wider block mb-1.5 font-semibold">
                    PostHog API Key
                  </label>
                  <input
                    type="text"
                    value={settings.posthogKey}
                    onChange={(e) => updateSetting("posthogKey", e.target.value)}
                    placeholder="phc_..."
                    className="w-full text-xs py-2.5 px-4 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-base-950)] text-[var(--color-text-primary)] outline-none focus:border-[var(--color-primary-light)] transition-colors placeholder:text-[var(--color-text-muted)]"
                  />
                </div>

                {settings.posthogKey && (
                  <a
                    href={`https://app.posthog.com`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-white cursor-pointer"
                    style={{ background: "linear-gradient(135deg, #6366F1, #818CF8)" }}
                  >
                    <ExternalLink size={13} />
                    Open PostHog Dashboard
                  </a>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <BarChart3 size={32} className="text-[var(--color-text-muted)] mx-auto mb-3" />
                <p className="text-xs text-[var(--color-text-muted)]">Enable PostHog to track user analytics</p>
                <p className="text-[10px] text-[var(--color-text-muted)] mt-1">
                  Sign up at{" "}
                  <a href="https://posthog.com" target="_blank" rel="noreferrer" className="text-[var(--color-primary-light)] underline">
                    posthog.com
                  </a>
                </p>
              </div>
            )}
          </div>

          {/* Session Stats (from localStorage) */}
          <div className="card p-5 space-y-3">
            <h3 className="text-sm font-bold text-[var(--color-text-primary)]">Local Session Stats</h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Chat Threads", value: (() => { try { return JSON.parse(localStorage.getItem("somasync_chat_threads") || "[]").length; } catch { return 0; } })() },
                { label: "Flashcard Decks", value: (() => { try { return Object.keys(JSON.parse(localStorage.getItem("somasync_flashcards_cache") || "{}")).length; } catch { return 0; } })() },
                { label: "Timetable Events", value: (() => { try { const e = JSON.parse(localStorage.getItem("somasync_study_planner") || "{}"); return Object.values(e).reduce((s, d) => s + d.length, 0); } catch { return 0; } })() },
                { label: "Theme", value: localStorage.getItem("somasync_theme") || "dark" },
              ].map((stat) => (
                <div key={stat.label} className="p-3 rounded-xl border border-[var(--color-border-subtle)]">
                  <p className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-wider font-semibold">{stat.label}</p>
                  <p className="text-lg font-bold text-[var(--color-text-primary)] mt-1">{stat.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
