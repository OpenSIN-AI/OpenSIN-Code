import { SubtaskTree, SubtaskNode } from './types';

export function renderSummary(tree: SubtaskTree): string {
  const nodes = Array.from(tree.nodes.values());
  const total = nodes.length;
  const completed = nodes.filter((n) => n.status === 'completed').length;
  const failed = nodes.filter((n) => n.status === 'failed').length;
  const running = nodes.filter((n) => n.status === 'running').length;
  const pending = nodes.filter((n) => n.status === 'pending').length;

  return `Tasks: ${total} total | ${completed} completed | ${running} running | ${pending} pending | ${failed} failed`;
}

export function renderNodeDetail(node: SubtaskNode): string {
  const lines = [
    `Task: ${node.title}`,
    `  Status: ${node.status}`,
    `  Description: ${node.description || '(none)'}`,
  ];
  if (node.startedAt) lines.push(`  Started: ${node.startedAt.toISOString()}`);
  if (node.completedAt) lines.push(`  Completed: ${node.completedAt.toISOString()}`);
  if (node.error) lines.push(`  Error: ${node.error}`);
  if (node.children.length > 0) lines.push(`  Subtasks: ${node.children.length}`);
  return lines.join('\n');
}

export function renderProgress(tree: SubtaskTree): number {
  const nodes = Array.from(tree.nodes.values());
  if (nodes.length === 0) return 0;
  const completed = nodes.filter((n) => n.status === 'completed').length;
  return Math.round((completed / nodes.length) * 100);
}
