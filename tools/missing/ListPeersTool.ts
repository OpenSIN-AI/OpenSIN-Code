/**
 * ListPeersTool — Discover other agents/peers in the network
 * Portiert aus sin-claude/claude-code-main/src/tools/ListPeersTool/
 * Feature: UDS_INBOX
 */

export interface ListPeersToolInput {
  filter?: { capability?: string; status?: 'online' | 'offline' | 'busy' };
}

export interface ListPeersToolOutput {
  peers: Array<{
    id: string;
    name: string;
    capabilities: string[];
    status: 'online' | 'offline' | 'busy';
    lastSeen: string;
  }>;
}

export async function ListPeersTool(input: ListPeersToolInput = {}): Promise<ListPeersToolOutput> {
  const { filter } = input;
  // In production: discover peers via UDS or A2A registry
  const peers = [
    { id: 'agent-1', name: 'A2A-SIN-Frontend', capabilities: ['ui', 'design'], status: 'online' as const, lastSeen: new Date().toISOString() },
    { id: 'agent-2', name: 'A2A-SIN-Backend', capabilities: ['api', 'database'], status: 'online' as const, lastSeen: new Date().toISOString() },
    { id: 'agent-3', name: 'A2A-SIN-Code-AI', capabilities: ['ai', 'ml'], status: 'busy' as const, lastSeen: new Date().toISOString() },
  ];

  let filtered = peers;
  if (filter?.capability) {
    filtered = filtered.filter(p => p.capabilities.includes(filter.capability!));
  }
  if (filter?.status) {
    filtered = filtered.filter(p => p.status === filter.status);
  }

  return { peers: filtered };
}
