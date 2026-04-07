import { SubtaskTree, SubtaskNode, SubtaskRenderOptions } from './types';

const DEFAULT_SYMBOLS = {
  pending: '○',
  running: '◉',
  completed: '●',
  failed: '✗',
  cancelled: '⊘',
  branch: '├─',
  leaf: '└─',
};

export function visualizeTree(tree: SubtaskTree, options?: Partial<SubtaskRenderOptions>): string {
  const opts: SubtaskRenderOptions = {
    showStatus: true,
    showTiming: true,
    indent: '  ',
    symbols: DEFAULT_SYMBOLS,
    ...options,
  };

  const lines: string[] = [];
  renderNode(tree.root, tree.nodes, '', true, opts, lines);
  return lines.join('\n');
}

function renderNode(
  nodeId: string,
  nodes: Map<string, SubtaskNode>,
  prefix: string,
  isLast: boolean,
  opts: SubtaskRenderOptions,
  lines: string[]
): void {
  const node = nodes.get(nodeId);
  if (!node) return;

  const connector = isLast ? opts.symbols.leaf : opts.symbols.branch;
  const statusSymbol = opts.symbols[node.status] ?? '?';
  const statusStr = opts.showStatus ? ` ${statusSymbol}` : '';
  const timingStr = opts.showTiming && node.startedAt && node.completedAt
    ? ` (${((node.completedAt.getTime() - node.startedAt.getTime()) / 1000).toFixed(1)}s)`
    : '';

  lines.push(`${prefix}${connector} ${node.title}${statusStr}${timingStr}`);

  const childPrefix = `${prefix}${isLast ? opts.indent : opts.indent}`;
  node.children.forEach((childId, i) => {
    renderNode(childId, nodes, childPrefix, i === node.children.length - 1, opts, lines);
  });
}
