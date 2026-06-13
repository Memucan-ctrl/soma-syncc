/**
 * SomaSync — Admin Dashboard (v2 — Real PostHog, Functional Settings)
 * System health, PostHog analytics, live feature flags, and user monitoring.
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
  AlertTriangle,
  Users,
  Zap,
  Clock,
  Trash2,
  Download,
} from "lucide-react";
import { fetchAdminHealth, fetchAdminSettings, updateAdminSettings } from "../services/api";

const SETTINGS_KEY = "somasync_admin_settings";
const POSTHOG_KEY = "somasync_posthog_config";

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

function loadPostHogConfig() {
  try {
    return JSON.parse(localStorage.getItem(POSTHOG_KEY) || "{}");
  } catch {
    return {};
  }
}

function savePostHogConfig(c) {
  localStorage.setItem(POSTHOG_KEY, JSON.stringify(c));
}

function ToggleSwitch({ enabled, onToggle, label, description }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-[var(--color-border-subtle)] last:border-b-0">
      <div className="flex-1 min-w-0 mr-4">
        <span className="text-xs font-medium text-[var(--color-text-secondary)]">{label}</span>
        {description && (
          <p className="text-[10px] text-[var(--color-text-muted)] mt-0.5 leading-relaxed">{description}</p>
        )}
      </div>
      <button
        onClick={onToggle}
        className="cursor-pointer transition-all flex-shrink-0"
        style={{ color: enabled ? "var(--color-accent-emerald)" : "var(--color-text-muted)" }}
      >
        {enabled ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
      </button>
    </div>
  );
}

function StatusCard({ icon: Icon, label, value, status, color, sub }) {
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
        ) : status === "warn" ? (
          <AlertTriangle size={14} className="text-[var(--color-accent-amber)]" />
        ) : (
          <RefreshCw size={14} className="animate-spin text-[var(--color-text-muted)]" />
        )}
        <p className="text-sm font-semibold text-[var(--color-text-primary)]">{value}</p>
      </div>
      {sub && <p className="text-[10px] text-[var(--color-text-muted)] mt-1.5">{sub}</p>}
    </div>
  );
}

function StatBadge({ label, value, color }) {
  return (
    <div className="p-3 rounded-xl border border-[var(--color-border-subtle)]">
      <p className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-wider font-semibold">{label}</p>
      <p className="text-lg font-bold mt-1" style={{ color: color || "var(--color-text-primary)" }}>{value}</p>
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
    timetableEnabled: true,
    ...loadSettings(),
  }));

  const [posthogConfig, setPosthogConfig] = useState(() => ({
    enabled: false,
    apiKey: "",
    host: "https://us.i.posthog.com",
    ...loadPostHogConfig(),
  }));

  const [activeSection, setActiveSection] = useState("overview");
  const [backendSettingsSynced, setBackendSettingsSynced] = useState(false);

  // ─── Health Check ──────────────────────────────────────────────
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

  // ─── Settings Persistence ──────────────────────────────────────
  useEffect(() => {
    saveSettings(settings);
  }, [settings]);

  useEffect(() => {
    savePostHogConfig(posthogConfig);
  }, [posthogConfig]);

  // ─── PostHog Initialization ────────────────────────────────────
  useEffect(() => {
    if (!posthogConfig.enabled || !posthogConfig.apiKey) return;

    // Dynamically load PostHog
    const initPostHog = async () => {
      try {
        if (window.posthog) {
          window.posthog.init(posthogConfig.apiKey, {
            api_host: posthogConfig.host,
            loaded: (ph) => {
              console.log("[PostHog] Initialized successfully");
            },
          });
        } else {
          // Load PostHog script dynamically
          const script = document.createElement("script");
          script.src = "https://us-assets.i.posthog.com/static/array.js";
          script.async = true;
          script.onload = () => {
            if (window.posthog) {
              window.posthog.init(posthogConfig.apiKey, {
                api_host: posthogConfig.host,
              });
              // Identify current user if available
              const profile = JSON.parse(localStorage.getItem("somasync_profile") || "{}");
              if (profile?.username) {
                window.posthog.identify(profile.username, {
                  name: profile.lastname || profile.firstname || "Student",
                  email: profile.email || "",
                });
              }
            }
          };
          document.head.appendChild(script);
        }
      } catch (err) {
        console.warn("[PostHog] Init failed:", err);
      }
    };

    initPostHog();
  }, [posthogConfig.enabled, posthogConfig.apiKey, posthogConfig.host]);

  // ─── Sync settings to backend ─────────────────────────────────
  const syncSettingsToBackend = async () => {
    try {
      await updateAdminSettings({
        ai_enabled: settings.aiEnabled,
        flashcards_enabled: settings.flashcardsEnabled,
        ocr_enabled: settings.ocrEnabled,
        maintenance_mode: settings.maintenanceMode,
      });
      setBackendSettingsSynced(true);
      setTimeout(() => setBackendSettingsSynced(false), 3000);
    } catch (err) {
      console.warn("[Admin] Could not sync settings to backend:", err.message);
    }
  };

  const updateSetting = (key, value) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const updatePosthog = (key, value) => {
    setPosthogConfig((prev) => ({ ...prev, [key]: value }));
  };

  // ─── Computed Stats ────────────────────────────────────────────
  const chatThreadCount = (() => { try { return JSON.parse(localStorage.getItem("somasync_chat_threads") || "[]").length; } catch { return 0; } })();
  const flashcardDeckCount = (() => { try { return Object.keys(JSON.parse(localStorage.getItem("somasync_flashcards_cache") || "{}")).length; } catch { return 0; } })();
  const timetableEventCount = (() => { try { const e = JSON.parse(localStorage.getItem("somasync_study_planner") || "{}"); return Object.values(e).reduce((s, d) => s + d.length, 0); } catch { return 0; } })();
  const currentTheme = localStorage.getItem("somasync_theme") || "dark";
  const loginCount = (() => { try { return parseInt(localStorage.getItem("somasync_login_count") || "1"); } catch { return 1; } })();

  // Track page views if PostHog is active
  useEffect(() => {
    if (window.posthog && posthogConfig.enabled) {
      window.posthog.capture("admin_panel_viewed", { section: activeSection });
    }
  }, [activeSection, posthogConfig.enabled]);

  const sections = [
    { id: "overview", label: "Overview", icon: BarChart3 },
    { id: "health", label: "Health", icon: Activity },
    { id: "settings", label: "Settings", icon: Settings },
    { id: "analytics", label: "Analytics", icon: Eye },
  ];

  // ─── Clear cache action ────────────────────────────────────────
  const clearAllCaches = () => {
    sessionStorage.clear();
    localStorage.removeItem("somasync_weekly_summary_cache");
    // Force refresh data on next visit
    window.location.reload();
  };

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
        <div className="flex items-center gap-2">
          <button
            onClick={checkHealth}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold border border-[var(--color-border-subtle)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:border-[var(--color-border-hover)] transition-all cursor-pointer"
          >
            <RefreshCw size={13} className={healthLoading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>
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
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
            <StatusCard
              icon={Server}
              label="API Server"
              value={healthData?.status === "ok" ? "Operational" : healthLoading ? "Checking..." : "Down"}
              status={healthData?.status || "loading"}
              color="#34D399"
              sub={healthData?.timestamp ? `Checked ${new Date(healthData.timestamp).toLocaleTimeString()}` : ""}
            />
            <StatusCard
              icon={Cpu}
              label="AI Engine"
              value={settings.aiEnabled ? "Active" : "Disabled"}
              status={settings.aiEnabled ? "ok" : "warn"}
              color="#6366F1"
              sub="Gemini 2.5 Flash"
            />
            <StatusCard
              icon={Database}
              label="Moodle Sync"
              value="Token Flow"
              status={healthData ? "ok" : "loading"}
              color="#22D3EE"
              sub="Zetech LMS"
            />
            <StatusCard
              icon={Globe}
              label="Deployment"
              value="somasync.tech"
              status="ok"
              color="#FBBF24"
              sub="Vercel + Azure"
            />
          </div>

          {/* Quick Stats */}
          <div className="card p-5 space-y-3">
            <h3 className="text-sm font-bold text-[var(--color-text-primary)]">Platform Info</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <StatBadge label="Version" value="v0.2.0" />
              <StatBadge label="Frontend" value="React 19" />
              <StatBadge label="Backend" value="FastAPI 3.12" />
              <StatBadge label="AI Model" value="Gemini 2.5" />
            </div>
          </div>

          {/* Session Stats */}
          <div className="card p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-[var(--color-text-primary)]">User Activity</h3>
              <span className="text-[10px] text-[var(--color-text-muted)]">From localStorage</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <StatBadge label="Chat Threads" value={chatThreadCount} color="#6366F1" />
              <StatBadge label="Flashcard Decks" value={flashcardDeckCount} color="#22D3EE" />
              <StatBadge label="Planner Events" value={timetableEventCount} color="#34D399" />
              <StatBadge label="Theme" value={currentTheme} color="#FBBF24" />
            </div>
          </div>
        </div>
      )}

      {/* ─── System Health ────────────────────────────────────────── */}
      {activeSection === "health" && (
        <div className="space-y-5">
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
                  { label: "Version", value: healthData?.version || "0.2.0", ok: true },
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

                {healthData?.services && (
                  <div className="mt-3 pt-3 border-t border-[var(--color-border-subtle)]">
                    <p className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-wider font-semibold mb-2">Services</p>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {Object.entries(healthData.services).map(([key, value]) => (
                        <div key={key} className="flex items-center gap-2 p-2.5 rounded-lg border border-[var(--color-border-subtle)]">
                          <div className={`w-2 h-2 rounded-full ${value === "active" ? "bg-[var(--color-accent-emerald)]" : "bg-[var(--color-accent-amber)]"}`} />
                          <span className="text-[10px] font-medium text-[var(--color-text-secondary)]">
                            {key.replace(/_/g, " ")}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {healthData?.error && (
                  <div className="p-3 rounded-xl bg-red-500/5 border border-red-500/10">
                    <p className="text-xs text-[var(--color-accent-rose)] font-medium">{healthData.error}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Cache Management */}
          <div className="card p-5 space-y-3">
            <h3 className="text-sm font-bold text-[var(--color-text-primary)]">Cache Management</h3>
            <p className="text-[10px] text-[var(--color-text-muted)] leading-relaxed">
              Clear cached data to force fresh fetches from the API. This will reload the page.
            </p>
            <button
              onClick={clearAllCaches}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-[var(--color-accent-rose)] border border-red-500/20 hover:bg-red-500/5 transition-all cursor-pointer"
            >
              <Trash2 size={13} />
              Clear All Caches & Reload
            </button>
          </div>
        </div>
      )}

      {/* ─── Settings ─────────────────────────────────────────────── */}
      {activeSection === "settings" && (
        <div className="space-y-5">
          {/* Feature Flags */}
          <div className="card p-5 space-y-2">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-[var(--color-text-primary)]">Feature Flags</h3>
              <button
                onClick={syncSettingsToBackend}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-semibold transition-all cursor-pointer ${
                  backendSettingsSynced
                    ? "text-[var(--color-accent-emerald)] bg-emerald-500/10 border border-emerald-500/20"
                    : "text-[var(--color-text-muted)] border border-[var(--color-border-subtle)] hover:text-[var(--color-text-secondary)]"
                }`}
              >
                {backendSettingsSynced ? <CheckCircle size={11} /> : <Zap size={11} />}
                {backendSettingsSynced ? "Synced!" : "Sync to Backend"}
              </button>
            </div>

            <ToggleSwitch
              label="AI Chat & Consultation"
              description="Enable the SomaSync AI chat workspace and study consultations."
              enabled={settings.aiEnabled}
              onToggle={() => updateSetting("aiEnabled", !settings.aiEnabled)}
            />
            <ToggleSwitch
              label="AI Flashcards Generation"
              description="Allow AI to generate flashcard decks from course content."
              enabled={settings.flashcardsEnabled}
              onToggle={() => updateSetting("flashcardsEnabled", !settings.flashcardsEnabled)}
            />
            <ToggleSwitch
              label="Document OCR (Azure)"
              description="Process uploaded documents via Azure Document Intelligence."
              enabled={settings.ocrEnabled}
              onToggle={() => updateSetting("ocrEnabled", !settings.ocrEnabled)}
            />
            <ToggleSwitch
              label="DevTracker (GitHub)"
              description="Show the GitHub repository visualization panel."
              enabled={settings.devTrackerEnabled}
              onToggle={() => updateSetting("devTrackerEnabled", !settings.devTrackerEnabled)}
            />
            <ToggleSwitch
              label="Study Planner / Timetable"
              description="Enable the timetable and study scheduling features."
              enabled={settings.timetableEnabled}
              onToggle={() => updateSetting("timetableEnabled", !settings.timetableEnabled)}
            />

            <div className="border-t border-[var(--color-border-subtle)] my-3" />

            <ToggleSwitch
              label="Maintenance Mode"
              description="When enabled, shows a maintenance banner to all non-admin users."
              enabled={settings.maintenanceMode}
              onToggle={() => updateSetting("maintenanceMode", !settings.maintenanceMode)}
            />
          </div>

          {/* Data Export */}
          <div className="card p-5 space-y-3">
            <h3 className="text-sm font-bold text-[var(--color-text-primary)]">Data Export</h3>
            <p className="text-[10px] text-[var(--color-text-muted)] leading-relaxed">
              Export all local app data as a JSON file for backup or debugging.
            </p>
            <button
              onClick={() => {
                const data = {};
                for (let i = 0; i < localStorage.length; i++) {
                  const key = localStorage.key(i);
                  if (key.startsWith("somasync_")) {
                    try { data[key] = JSON.parse(localStorage.getItem(key)); } catch { data[key] = localStorage.getItem(key); }
                  }
                }
                const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `somasync-data-${new Date().toISOString().split("T")[0]}.json`;
                a.click();
                URL.revokeObjectURL(url);
              }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-[var(--color-text-secondary)] border border-[var(--color-border-subtle)] hover:text-[var(--color-text-primary)] hover:border-[var(--color-border-hover)] transition-all cursor-pointer"
            >
              <Download size={13} />
              Export Local Data (JSON)
            </button>
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
                enabled={posthogConfig.enabled}
                onToggle={() => updatePosthog("enabled", !posthogConfig.enabled)}
              />
            </div>

            {posthogConfig.enabled ? (
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-wider block mb-1.5 font-semibold">
                    PostHog Project API Key
                  </label>
                  <input
                    type="text"
                    value={posthogConfig.apiKey}
                    onChange={(e) => updatePosthog("apiKey", e.target.value)}
                    placeholder="phc_..."
                    className="w-full text-xs py-2.5 px-4 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-base-950)] text-[var(--color-text-primary)] outline-none focus:border-[var(--color-primary-light)] transition-colors placeholder:text-[var(--color-text-muted)]"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-wider block mb-1.5 font-semibold">
                    PostHog Host
                  </label>
                  <input
                    type="text"
                    value={posthogConfig.host}
                    onChange={(e) => updatePosthog("host", e.target.value)}
                    placeholder="https://us.i.posthog.com"
                    className="w-full text-xs py-2.5 px-4 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-base-950)] text-[var(--color-text-primary)] outline-none focus:border-[var(--color-primary-light)] transition-colors placeholder:text-[var(--color-text-muted)]"
                  />
                </div>

                <div className="flex flex-wrap gap-2">
                  {posthogConfig.apiKey && (
                    <a
                      href="https://app.posthog.com"
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-white cursor-pointer"
                      style={{ background: "linear-gradient(135deg, #6366F1, #818CF8)" }}
                    >
                      <ExternalLink size={13} />
                      Open PostHog Dashboard
                    </a>
                  )}

                  {posthogConfig.apiKey && (
                    <button
                      onClick={() => {
                        if (window.posthog) {
                          window.posthog.capture("test_event", { source: "admin_panel", test: true });
                          alert("Test event sent! Check your PostHog dashboard.");
                        } else {
                          alert("PostHog not loaded yet. Make sure your API key is correct.");
                        }
                      }}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold border border-[var(--color-border-subtle)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:border-[var(--color-border-hover)] transition-all cursor-pointer"
                    >
                      <Zap size={13} />
                      Send Test Event
                    </button>
                  )}
                </div>

                {posthogConfig.apiKey && (
                  <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/10">
                    <div className="flex items-center gap-2 mb-1">
                      <CheckCircle size={12} className="text-[var(--color-accent-emerald)]" />
                      <p className="text-[10px] font-semibold text-[var(--color-accent-emerald)]">PostHog Active</p>
                    </div>
                    <p className="text-[10px] text-[var(--color-text-muted)] leading-relaxed">
                      Events are being tracked. Visit your PostHog dashboard to view user activity, feature usage heatmaps, session recordings, and custom insights.
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <BarChart3 size={32} className="text-[var(--color-text-muted)] mx-auto mb-3" />
                <p className="text-xs text-[var(--color-text-secondary)] font-medium">Enable PostHog to track user analytics</p>
                <p className="text-[10px] text-[var(--color-text-muted)] mt-1.5 max-w-xs mx-auto leading-relaxed">
                  PostHog provides product analytics, session recordings, feature flags, and A/B testing — all self-hosted or cloud.
                </p>
                <a
                  href="https://posthog.com"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 mt-3 text-[11px] font-semibold text-[var(--color-primary-light)] hover:underline"
                >
                  Get started at posthog.com <ExternalLink size={10} />
                </a>
              </div>
            )}
          </div>

          {/* Local Analytics */}
          <div className="card p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-[var(--color-text-primary)]">Local Usage Stats</h3>
              <span className="text-[9px] font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">Auto-tracked</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <StatBadge label="Chat Threads" value={chatThreadCount} color="#6366F1" />
              <StatBadge label="Flashcard Decks" value={flashcardDeckCount} color="#22D3EE" />
              <StatBadge label="Planner Events" value={timetableEventCount} color="#34D399" />
              <StatBadge label="Active Theme" value={currentTheme} color="#FBBF24" />
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
