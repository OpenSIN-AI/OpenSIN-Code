export interface SubtaskNode {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  children: string[];
  parentId: string | null;
  startedAt: Date | null;
  completedAt: Date | null;
  error?: string;
}

export interface SubtaskTree {
  root: string;
  nodes: Map<string, SubtaskNode>;
}

export interface SubtaskRenderOptions {
  showStatus: boolean;
  showTiming: boolean;
  indent: string;
  symbols: {
    pending: string;
    running: string;
    completed: string;
    failed: string;
    cancelled: string;
    branch: string;
    leaf: string;
  };
}
