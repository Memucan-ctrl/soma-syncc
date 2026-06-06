/**
 * SomaSync — DevTracker (GitHub Activity Visualizer)
 * Fetches real GitHub contributions, repos, and activity using the public API.
 * No API key required — only the student's GitHub username.
 */

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  GitBranch,
  Star,
  GitFork,
  ExternalLink,
  Code2,
  Calendar,
  Activity,
  Search,
  Save,
  Loader2,
  AlertCircle,
  CheckCircle,
  FolderGit2,
  GitCommitHorizontal,
  GitPullRequest,
  Eye,
  TrendingUp,
} from "lucide-react";

const LANG_COLORS = {
  JavaScript: "#f1e05a",
  TypeScript: "#3178c6",
  Python: "#3572A5",
  Java: "#b07219",
  "C++": "#f34b7d",
  C: "#555555",
  "C#": "#178600",
  Go: "#00ADD8",
  Rust: "#dea584",
  Ruby: "#701516",
  PHP: "#4F5D95",
  Swift: "#F05138",
  Kotlin: "#A97BFF",
  Dart: "#00B4AB",
  HTML: "#e34c26",
  CSS: "#563d7c",
  Shell: "#89e051",
  Jupyter: "#DA5B0B",
};

const EVENT_ICONS = {
  PushEvent: GitCommitHorizontal,
  CreateEvent: FolderGit2,
  PullRequestEvent: GitPullRequest,
  WatchEvent: Star,
  ForkEvent: GitFork,
  IssuesEvent: AlertCircle,
};

const EVENT_COLORS = {
  PushEvent: "#22D3EE",
  CreateEvent: "#34D399",
  PullRequestEvent: "#A78BFA",
  WatchEvent: "#FBBF24",
  ForkEvent: "#FB7185",
  IssuesEvent: "#F97316",
};

function formatEventType(type) {
  return type
    .replace("Event", "")
    .replace(/([A-Z])/g, " $1")
    .trim();
}

function timeAgo(dateStr) {
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now - d;
  const mins = Math.floor(diffMs / 60000);
  const hours = Math.floor(mins / 60);
  const days = Math.floor(hours / 24);

  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days === 1) return "yesterday";
  if (days < 30) return `${days}d ago`;
  return d.toLocaleDateString();
}

export default function GitVisualizer() {
  const [username, setUsername] = useState(
    () => localStorage.getItem("somasync_github_user") || ""
  );
  const [inputValue, setInputValue] = useState(username);
  const [profile, setProfile] = useState(null);
  const [repos, setRepos] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeView, setActiveView] = useState("activity"); // activity | repos

  const fetchGitHubData = useCallback(async (user) => {
    if (!user.trim()) return;
    setLoading(true);
    setError(null);

    try {
      const [profileRes, reposRes, eventsRes] = await Promise.all([
        fetch(`https://api.github.com/users/${user}`),
        fetch(`https://api.github.com/users/${user}/repos?sort=updated&per_page=12`),
        fetch(`https://api.github.com/users/${user}/events/public?per_page=30`),
      ]);

      if (!profileRes.ok) throw new Error("GitHub user not found.");

      const profileData = await profileRes.json();
      const reposData = await reposRes.json();
      const eventsData = await eventsRes.json();

      setProfile(profileData);
      setRepos(Array.isArray(reposData) ? reposData : []);
      setEvents(Array.isArray(eventsData) ? eventsData : []);
    } catch (err) {
      setError(err.message || "Failed to fetch GitHub data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (username) {
      fetchGitHubData(username);
    }
  }, [username, fetchGitHubData]);

  const handleSaveUsername = () => {
    const user = inputValue.trim();
    if (!user) return;
    localStorage.setItem("somasync_github_user", user);
    setUsername(user);
  };

  const handleClearUsername = () => {
    localStorage.removeItem("somasync_github_user");
    setUsername("");
    setInputValue("");
    setProfile(null);
    setRepos([]);
    setEvents([]);
  };

  // Compute stats
  const totalStars = repos.reduce((sum, r) => sum + (r.stargazers_count || 0), 0);
  const totalForks = repos.reduce((sum, r) => sum + (r.forks_count || 0), 0);
  const languages = [...new Set(repos.map((r) => r.language).filter(Boolean))];
  const pushEvents = events.filter((e) => e.type === "PushEvent");
  const totalCommits = pushEvents.reduce(
    (sum, e) => sum + (e.payload?.commits?.length || 0),
    0
  );

  // If no username is saved, show the setup screen
  if (!username) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col items-center justify-center min-h-[60vh]"
      >
        <div className="card p-8 md:p-10 max-w-md w-full text-center">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5"
            style={{ background: "rgba(34, 211, 238, 0.1)" }}
          >
            <GitBranch size={24} className="text-[var(--color-accent-cyan)]" />
          </div>
          <h2 className="text-lg font-bold text-[var(--color-text-primary)] mb-2">
            Connect Your GitHub
          </h2>
          <p className="text-xs text-[var(--color-text-muted)] mb-6 leading-relaxed">
            Enter your GitHub username to track your repositories, contributions, and
            developer activity — all synced in real-time.
          </p>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]"
                size={14}
              />
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSaveUsername()}
                placeholder="github-username"
                className="w-full text-sm py-3 pl-10 pr-4 rounded-xl border transition-all"
                style={{
                  background: "var(--color-base-900)",
                  borderColor: "var(--color-border-subtle)",
                  color: "var(--color-text-primary)",
                }}
              />
            </div>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleSaveUsername}
              disabled={!inputValue.trim()}
              className="px-5 py-3 rounded-xl text-sm font-medium text-white flex items-center gap-2 cursor-pointer disabled:opacity-30"
              style={{
                background: "linear-gradient(135deg, #06B6D4, #0EA5E9)",
              }}
            >
              <Save size={14} />
              Save
            </motion.button>
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
      className="space-y-6"
    >
      {/* ─── Header ────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[var(--color-text-primary)]">
            DevTracker
          </h1>
          <p className="text-sm text-[var(--color-text-muted)] mt-1">
            Real-time GitHub activity & repository insights.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-[var(--color-text-muted)] font-mono">
            @{username}
          </span>
          <button
            onClick={handleClearUsername}
            className="text-[10px] font-semibold px-2.5 py-1.5 rounded-lg border border-[var(--color-border-subtle)] text-[var(--color-text-muted)] hover:text-[var(--color-accent-rose)] hover:border-[var(--color-accent-rose)] transition-all cursor-pointer"
          >
            Disconnect
          </button>
        </div>
      </div>

      {/* ─── Loading ───────────────────────────────────────────────── */}
      {loading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 size={24} className="animate-spin text-[var(--color-primary-light)]" />
        </div>
      )}

      {/* ─── Error ─────────────────────────────────────────────────── */}
      {error && (
        <div
          className="card p-5 flex items-center gap-3"
          style={{ border: "1px solid rgba(251, 113, 133, 0.2)" }}
        >
          <AlertCircle className="text-[var(--color-accent-rose)]" size={18} />
          <p className="text-xs text-[var(--color-accent-rose)] font-medium">{error}</p>
        </div>
      )}

      {/* ─── Profile + Stats ───────────────────────────────────────── */}
      {profile && !loading && (
        <>
          {/* Profile Card */}
          <div className="card p-6 flex flex-col md:flex-row items-center gap-6">
            <img
              src={profile.avatar_url}
              alt={profile.login}
              className="w-16 h-16 rounded-2xl border-2"
              style={{ borderColor: "var(--color-border-subtle)" }}
            />
            <div className="flex-1 text-center md:text-left">
              <h2 className="text-base font-bold text-[var(--color-text-primary)]">
                {profile.name || profile.login}
              </h2>
              {profile.bio && (
                <p className="text-xs text-[var(--color-text-secondary)] mt-1 max-w-md">
                  {profile.bio}
                </p>
              )}
              <div className="flex items-center gap-4 mt-3 justify-center md:justify-start flex-wrap">
                <span className="text-[10px] font-semibold text-[var(--color-text-muted)] flex items-center gap-1">
                  <FolderGit2 size={11} /> {profile.public_repos} repos
                </span>
                <span className="text-[10px] font-semibold text-[var(--color-text-muted)] flex items-center gap-1">
                  <Eye size={11} /> {profile.followers} followers
                </span>
                <span className="text-[10px] font-semibold text-[var(--color-text-muted)] flex items-center gap-1">
                  <Calendar size={11} /> Joined{" "}
                  {new Date(profile.created_at).toLocaleDateString("en-US", {
                    month: "short",
                    year: "numeric",
                  })}
                </span>
              </div>
            </div>
            <a
              href={profile.html_url}
              target="_blank"
              rel="noreferrer"
              className="p-2.5 rounded-xl border border-[var(--color-border-subtle)] text-[var(--color-text-muted)] hover:text-white hover:border-[var(--color-border-hover)] transition-all"
            >
              <ExternalLink size={14} />
            </a>
          </div>

          {/* Stat Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              {
                label: "Repositories",
                value: profile.public_repos,
                icon: FolderGit2,
                color: "#22D3EE",
              },
              { label: "Total Stars", value: totalStars, icon: Star, color: "#FBBF24" },
              {
                label: "Recent Commits",
                value: totalCommits,
                icon: GitCommitHorizontal,
                color: "#34D399",
              },
              {
                label: "Languages",
                value: languages.length,
                icon: Code2,
                color: "#A78BFA",
              },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                className="metric-card"
              >
                <div className="flex items-center gap-2 mb-2">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ background: `${stat.color}15` }}
                  >
                    <stat.icon size={14} style={{ color: stat.color }} />
                  </div>
                </div>
                <p className="text-xl font-bold text-[var(--color-text-primary)]">
                  {stat.value}
                </p>
                <p className="text-[10px] text-[var(--color-text-muted)] font-semibold uppercase tracking-wider mt-1">
                  {stat.label}
                </p>
              </motion.div>
            ))}
          </div>

          {/* Language Breakdown */}
          {languages.length > 0 && (
            <div className="card p-5">
              <h3 className="text-xs font-semibold text-[var(--color-text-secondary)] mb-3 flex items-center gap-2">
                <Code2 size={13} className="text-[var(--color-accent-cyan)]" />
                Language Distribution
              </h3>
              <div className="flex flex-wrap gap-2">
                {languages.slice(0, 10).map((lang) => (
                  <span
                    key={lang}
                    className="text-[10px] font-semibold px-2.5 py-1 rounded-full flex items-center gap-1.5"
                    style={{
                      background: `${LANG_COLORS[lang] || "#64748B"}15`,
                      color: LANG_COLORS[lang] || "#64748B",
                      border: `1px solid ${LANG_COLORS[lang] || "#64748B"}30`,
                    }}
                  >
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ background: LANG_COLORS[lang] || "#64748B" }}
                    />
                    {lang}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* ─── Tab Switcher ──────────────────────────────────────── */}
          <div className="flex bg-[var(--color-base-900)] p-1 rounded-xl border border-[var(--color-border-subtle)] w-fit">
            {["activity", "repos"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveView(tab)}
                className="text-xs font-semibold py-2 px-4 rounded-lg transition-all cursor-pointer capitalize"
                style={{
                  background:
                    activeView === tab ? "var(--color-primary)" : "transparent",
                  color: activeView === tab ? "#fff" : "var(--color-text-secondary)",
                }}
              >
                {tab === "activity" ? "Recent Activity" : "Top Repositories"}
              </button>
            ))}
          </div>

          {/* ─── Activity Feed ─────────────────────────────────────── */}
          <AnimatePresence mode="wait">
            {activeView === "activity" ? (
              <motion.div
                key="activity"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="space-y-2"
              >
                {events.length === 0 ? (
                  <div className="card p-10 text-center">
                    <Activity
                      size={32}
                      className="text-[var(--color-text-muted)] mx-auto mb-3"
                    />
                    <p className="text-xs text-[var(--color-text-muted)]">
                      No recent public activity found.
                    </p>
                  </div>
                ) : (
                  <div className="relative">
                    {/* Vertical line */}
                    <div
                      className="absolute left-[19px] top-0 bottom-0 w-px"
                      style={{
                        background:
                          "linear-gradient(180deg, #22D3EE 0%, #3B82F6 50%, #A78BFA 100%)",
                      }}
                    />
                    <div className="space-y-1">
                      {events.slice(0, 20).map((event, i) => {
                        const Icon =
                          EVENT_ICONS[event.type] || GitCommitHorizontal;
                        const color = EVENT_COLORS[event.type] || "#64748B";
                        const repoName = event.repo?.name?.split("/")?.[1] || event.repo?.name;
                        const commits = event.payload?.commits;
                        const commitMsg =
                          commits?.[commits.length - 1]?.message || "";

                        return (
                          <motion.div
                            key={event.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.04, duration: 0.3 }}
                            whileHover={{ x: 4 }}
                            className="relative flex items-start gap-4 p-3 rounded-xl cursor-default group transition-all"
                          >
                            <div className="relative z-10 flex-shrink-0">
                              <div
                                className="w-[38px] h-[38px] rounded-full flex items-center justify-center"
                                style={{
                                  background: `${color}18`,
                                  border: `2px solid ${color}60`,
                                }}
                              >
                                <Icon size={14} style={{ color }} />
                              </div>
                            </div>
                            <div className="flex-1 min-w-0 pt-1">
                              <div className="flex items-center gap-2 flex-wrap mb-1">
                                <span
                                  className="text-[9px] font-semibold tracking-wider uppercase px-1.5 py-0.5 rounded"
                                  style={{
                                    background: `${color}10`,
                                    color: `${color}CC`,
                                  }}
                                >
                                  {formatEventType(event.type)}
                                </span>
                                <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded text-[var(--color-accent-cyan)]"
                                  style={{ background: "rgba(34,211,238,0.08)" }}>
                                  {repoName}
                                </span>
                              </div>
                              {commitMsg && (
                                <p className="text-xs text-[var(--color-text-secondary)] font-medium mb-1 truncate group-hover:text-white transition-colors">
                                  {commitMsg}
                                </p>
                              )}
                              <span className="text-[10px] text-[var(--color-text-muted)] font-mono">
                                {timeAgo(event.created_at)}
                              </span>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="repos"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="grid grid-cols-1 md:grid-cols-2 gap-4"
              >
                {repos.map((repo, i) => (
                  <motion.a
                    key={repo.id}
                    href={repo.html_url}
                    target="_blank"
                    rel="noreferrer"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    whileHover={{ y: -2 }}
                    className="card p-5 flex flex-col justify-between hover:border-[var(--color-border-hover)] transition-all"
                    style={{ textDecoration: "none" }}
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <FolderGit2
                          size={14}
                          className="text-[var(--color-primary-light)]"
                        />
                        <h3 className="text-sm font-semibold text-[var(--color-text-primary)] truncate">
                          {repo.name}
                        </h3>
                      </div>
                      {repo.description && (
                        <p className="text-[11px] text-[var(--color-text-muted)] leading-relaxed line-clamp-2">
                          {repo.description}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-3 flex-wrap">
                      {repo.language && (
                        <span className="text-[10px] font-semibold flex items-center gap-1"
                          style={{ color: LANG_COLORS[repo.language] || "#64748B" }}>
                          <span className="w-2 h-2 rounded-full"
                            style={{ background: LANG_COLORS[repo.language] || "#64748B" }} />
                          {repo.language}
                        </span>
                      )}
                      <span className="text-[10px] text-[var(--color-text-muted)] flex items-center gap-0.5">
                        <Star size={10} /> {repo.stargazers_count}
                      </span>
                      <span className="text-[10px] text-[var(--color-text-muted)] flex items-center gap-0.5">
                        <GitFork size={10} /> {repo.forks_count}
                      </span>
                    </div>
                  </motion.a>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </motion.div>
  );
}
