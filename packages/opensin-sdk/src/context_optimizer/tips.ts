import { OptimizationTip } from "./types.js";

const BUILTIN_TIPS: OptimizationTip[] = [
  {
    id: "builtin-compact",
    title: "Use /compact to summarize",
    description:
      "Summarize the conversation history to free up context window space.",
    action: "Type /compact to trigger automatic summarization",
    estimatedSavings: 5000,
    category: "context",
    priority: "high",
  },
  {
    id: "builtin-clear-files",
    title: "Clear unused file references",
    description:
      "Remove file references that are no longer needed for the current task.",
    action: "Use /clear files to remove stale references",
    estimatedSavings: 2000,
    category: "files",
    priority: "medium",
  },
  {
    id: "builtin-batch-tools",
    title: "Batch tool calls",
    description:
      "Combine multiple independent tool calls into a single batch to reduce overhead.",
    action: "Group related file reads or searches together",
    estimatedSavings: 1500,
    category: "tools",
    priority: "medium",
  },
  {
    id: "builtin-fresh-session",
    title: "Start a fresh session",
    description:
      "For complex multi-step tasks, break into separate sessions with focused context.",
    action: "Complete current phase and start a new session with a summary",
    estimatedSavings: 10000,
    category: "context",
    priority: "low",
  },
  {
    id: "builtin-prune-memory",
    title: "Prune memory",
    description:
      "Remove outdated or irrelevant memory entries that consume context.",
    action: "Review memory entries and delete stale ones",
    estimatedSavings: 800,
    category: "memory",
    priority: "low",
  },
  {
    id: "builtin-avoid-reread",
    title: "Avoid re-reading files",
    description:
      "Cache file contents in your working memory instead of re-reading from disk.",
    action: "Reference previously read content from context instead of re-reading",
    estimatedSavings: 3000,
    category: "tools",
    priority: "medium",
  },
];

export function getBuiltinTips(): OptimizationTip[] {
  return [...BUILTIN_TIPS];
}

export function getTipsByCategory(
  category: OptimizationTip["category"],
): OptimizationTip[] {
  return BUILTIN_TIPS.filter((t) => t.category === category);
}

export function getTipById(id: string): OptimizationTip | undefined {
  return BUILTIN_TIPS.find((t) => t.id === id);
}
