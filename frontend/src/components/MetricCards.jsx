/**
 * SomaSync — Metric Cards Row
 * Top-level quick stats: Next Deadline, Git Streak, Study Hours, GPA.
 */

import { motion } from "framer-motion";
import { Clock, GitCommitHorizontal, BookOpen, TrendingUp } from "lucide-react";
import { mockDashboardMetrics } from "../data/mockData";

const metrics = mockDashboardMetrics;

function formatTimeLeft(dateStr) {
  const diff = new Date(dateStr) - new Date();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  if (days > 0) return `${days}d ${hours}h`;
  return `${hours}h`;
}

const cards = [
  {
    icon: Clock,
    label: "Next Deadline",
    value: formatTimeLeft(metrics.nextDeadline.due),
    sub: `${metrics.nextDeadline.title} · ${metrics.nextDeadline.course}`,
    accent: "#FB7185",
    bgAccent: "rgba(251, 113, 133, 0.08)",
  },
  {
    icon: GitCommitHorizontal,
    label: "Git Streak",
    value: `${metrics.gitStreak.currentStreak} days`,
    sub: `${metrics.gitStreak.thisWeek} commits this week · ${metrics.gitStreak.totalCommits} total`,
    accent: "#22D3EE",
    bgAccent: "rgba(34, 211, 238, 0.08)",
  },
  {
    icon: BookOpen,
    label: "Study Hours",
    value: `${metrics.studyHours.today}h today`,
    sub: `${metrics.studyHours.thisWeek}h / ${metrics.studyHours.target}h weekly target`,
    accent: "#A78BFA",
    bgAccent: "rgba(167, 139, 250, 0.08)",
  },
  {
    icon: TrendingUp,
    label: "Current GPA",
    value: metrics.gpa.current.toFixed(2),
    sub: `${metrics.gpa.trend === "up" ? "↑" : "↓"} ${metrics.gpa.change} from last semester`,
    accent: "#34D399",
    bgAccent: "rgba(52, 211, 153, 0.08)",
  },
];

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.08 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.4, 0, 0.2, 1] } },
};

export default function MetricCards() {
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
    >
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <motion.div
            key={card.label}
            variants={cardVariants}
            whileHover={{ y: -4, transition: { duration: 0.2 } }}
            className="glass-card glow-border p-5 cursor-default"
          >
            <div className="flex items-start justify-between mb-3">
              <div
                className="p-2 rounded-lg"
                style={{ background: card.bgAccent }}
              >
                <Icon size={18} style={{ color: card.accent }} />
              </div>
              <span
                className="text-[10px] font-semibold tracking-wider uppercase"
                style={{ color: card.accent }}
              >
                {card.label}
              </span>
            </div>
            <p className="text-2xl font-bold text-slate-50 mb-1">
              {card.value}
            </p>
            <p className="text-xs text-slate-400 leading-relaxed">
              {card.sub}
            </p>
          </motion.div>
        );
      })}
    </motion.div>
  );
}
