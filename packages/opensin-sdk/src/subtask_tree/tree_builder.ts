import { SubtaskNode, SubtaskTree } from './types';

export class SubtaskTreeBuilder {
  private tree: SubtaskTree;

  constructor(rootTitle: string) {
    const rootId = `task-${Date.now()}`;
    const root: SubtaskNode = {
      id: rootId,
      title: rootTitle,
      description: '',
      status: 'pending',
      children: [],
      parentId: null,
      startedAt: null,
      completedAt: null,
    };
    this.tree = { root: rootId, nodes: new Map([[rootId, root]]) };
  }

  addChild(parentId: string, title: string, description: string): string {
    const id = `task-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const node: SubtaskNode = {
      id,
      title,
      description,
      status: 'pending',
      children: [],
      parentId,
      startedAt: null,
      completedAt: null,
    };
    this.tree.nodes.set(id, node);
    const parent = this.tree.nodes.get(parentId);
    if (parent) {
      parent.children.push(id);
    }
    return id;
  }

  setStatus(id: string, status: SubtaskNode['status'], error?: string): void {
    const node = this.tree.nodes.get(id);
    if (!node) return;
    node.status = status;
    if (error) node.error = error;
    if (status === 'running' && !node.startedAt) node.startedAt = new Date();
    if ((status === 'completed' || status === 'failed' || status === 'cancelled') && !node.completedAt) {
      node.completedAt = new Date();
    }
  }

  getNode(id: string): SubtaskNode | undefined {
    return this.tree.nodes.get(id);
  }

  getTree(): SubtaskTree {
    return this.tree;
  }

  getDepth(id: string): number {
    const node = this.tree.nodes.get(id);
    if (!node || !node.parentId) return 0;
    return 1 + this.getDepth(node.parentId);
  }
}
