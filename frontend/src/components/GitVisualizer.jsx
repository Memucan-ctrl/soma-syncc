/**
 * SomaSync — Git Workflow Visualizer
 * Vertical node tree mapping real commits to syllabus milestones.
 */

import { motion } from "framer-motion";
import { GitCommitHorizontal, GitBranch, Plus, Minus, FileText, Bug, FlaskConical, Wrench } from "lucide-react";
import { mockGitCommits } from "../data/mockData";

const typeConfig = {
  feature: { color: "#22D3EE", icon: Plus, label: "feat" },
  bugfix: { color: "#FB7185", icon: Bug, label: "fix" },
  docs: { color: "#A78BFA", icon: FileText, label: "docs" },
  test: { color: "#34D399", icon: FlaskConical, label: "test" },
  refactor: { color: "#FBBF24", icon: Wrench, label: "refactor" },
};

function formatCommitDate(dateStr) {
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now - d;
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);

  if (diffHours < 1) return "just now";
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return "yesterday";
  return `${diffDays}d ago`;
}

export default function GitVisualizer() {
  return (
    <div className="glass-card p-5 h-full overflow-y-auto" style={{ maxHeight: "calc(100vh - 200px)" }}>
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
          <GitBranch size={16} className="text-cyan-400" />
          Git Workflow Visualizer
        </h2>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-slate-500 font-mono">
            {mockGitCommits.length} commits
          </span>
        </div>
      </div>

      {/* ─── Commit Tree ─────────────────────────────────────────────── */}
      <div className="relative">
        {/* Vertical line */}
        <div
          className="absolute left-[19px] top-0 bottom-0 w-px"
          style={{ background: "linear-gradient(180deg, #22D3EE 0%, #3B82F6 50%, #A78BFA 100%)" }}
        />

        <div className="space-y-1">
          {mockGitCommits.map((commit, i) => {
            const config = typeConfig[commit.type];
            const Icon = config.icon;

            return (
              <motion.div
                key={commit.hash}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.08, duration: 0.4 }}
                whileHover={{ x: 4 }}
                className="relative flex items-start gap-4 p-3 rounded-xl cursor-pointer group transition-all"
                style={{ marginLeft: 0 }}
              >
                {/* Node dot */}
                <div className="relative z-10 flex-shrink-0">
                  <motion.div
                    whileHover={{ scale: 1.3 }}
                    className="w-[38px] h-[38px] rounded-full flex items-center justify-center"
                    style={{
                      background: `${config.color}18`,
                      border: `2px solid ${config.color}60`,
                    }}
                  >
                    <Icon size={14} style={{ color: config.color }} />
                  </motion.div>
                </div>

                {/* Commit content */}
                <div className="flex-1 min-w-0 pt-1">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span
                      className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded"
                      style={{ background: `${config.color}15`, color: config.color }}
                    >
                      {commit.hash}
                    </span>
                    <span
                      className="text-[9px] font-semibold tracking-wider uppercase px-1.5 py-0.5 rounded"
                      style={{ background: `${config.color}10`, color: `${config.color}CC` }}
                    >
                      {config.label}
                    </span>
                    {commit.branch !== "main" && (
                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded"
                        style={{ background: "rgba(167, 139, 250, 0.1)", color: "#A78BFA" }}
                      >
                        ⎇ {commit.branch}
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-200 font-medium mb-1.5 truncate group-hover:text-white transition-colors">
                    {commit.message}
                  </p>

                  {/* Syllabus mapping */}
                  <div className="flex items-center gap-3 flex-wrap">
                    <span
                      className="text-[10px] px-2 py-0.5 rounded-full"
                      style={{
                        background: "rgba(59, 130, 246, 0.1)",
                        border: "1px solid rgba(59, 130, 246, 0.2)",
                        color: "#60A5FA",
                      }}
                    >
                      📚 {commit.syllabusModule}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {formatCommitDate(commit.date)}
                    </span>
                    <span className="text-[10px] text-slate-600">
                      <span className="text-emerald-500">+{commit.additions}</span>
                      {" "}
                      <span className="text-rose-400">-{commit.deletions}</span>
                    </span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
