import React, { useState, useEffect } from 'react';

declare const vscode: {
  postMessage(message: unknown): void;
};

interface SwarmAgent {
  name: string;
  status: 'idle' | 'working' | 'error';
  currentTask?: string;
  tasksCompleted: number;
}

interface Swarm {
  id: string;
  name: string;
  agents: SwarmAgent[];
  status: 'active' | 'paused' | 'completed' | 'error';
  createdAt: number;
  tasksTotal: number;
  tasksCompleted: number;
  tasksFailed: number;
}

interface SwarmCoordinatorProps {
  swarms: Swarm[];
  onCreateSwarm: (name: string, agents: string[]) => void;
  onDeleteSwarm: (id: string) => void;
  onPauseSwarm: (id: string) => void;
  onResumeSwarm: (id: string) => void;
  onDispatchToSwarm: (swarmId: string, task: string) => void;
}

const SwarmCoordinator: React.FC<SwarmCoordinatorProps> = ({
  swarms,
  onCreateSwarm,
  onDeleteSwarm,
  onPauseSwarm,
  onResumeSwarm,
  onDispatchToSwarm
}) => {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [swarmName, setSwarmName] = useState('');
  const [agentInput, setAgentInput] = useState('explore,implement,review');
  const [dispatchInputs, setDispatchInputs] = useState<Record<string, string>>({});
  const [selectedSwarm, setSelectedSwarm] = useState<string | null>(null);

  useEffect(() => {
    vscode.postMessage({ type: 'swarm_panel_ready' });
  }, []);

  const handleCreate = () => {
    if (!swarmName.trim()) return;
    const agents = agentInput.split(',').map(a => a.trim()).filter(Boolean);
    if (agents.length === 0) return;
    onCreateSwarm(swarmName, agents);
    setSwarmName('');
    setAgentInput('explore,implement,review');
    setShowCreateForm(false);
  };

  const handleDispatch = (swarmId: string) => {
    const task = dispatchInputs[swarmId];
    if (!task?.trim()) return;
    onDispatchToSwarm(swarmId, task);
    setDispatchInputs(prev => ({ ...prev, [swarmId]: '' }));
  };

  const statusColor = (status: string) => {
    switch (status) {
      case 'active': return '#4ec9b0';
      case 'paused': return '#dcdcaa';
      case 'completed': return '#0969da';
      case 'error': return '#f44747';
      default: return '#888';
    }
  };

  const agentStatusIcon = (status: string) => {
    switch (status) {
      case 'idle': return '⏸';
      case 'working': return '⚡';
      case 'error': return '❌';
      default: return '❓';
    }
  };

  return (
    <div style={{ padding: '8px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <h3 style={{ margin: 0, fontSize: '13px', fontWeight: 600 }}>Agent Swarms</h3>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          style={{
            padding: '4px 10px',
            background: 'var(--vscode-button-background)',
            color: 'var(--vscode-button-foreground)',
            border: 'none',
            borderRadius: '3px',
            cursor: 'pointer',
            fontSize: '11px'
          }}
        >
          {showCreateForm ? 'Cancel' : '+ New Swarm'}
        </button>
      </div>

      {showCreateForm && (
        <div style={{
          padding: '10px',
          marginBottom: '12px',
          background: 'var(--vscode-editor-inactiveSelectionBackground)',
          borderRadius: '4px'
        }}>
          <div style={{ marginBottom: '8px' }}>
            <label style={{ fontSize: '11px', display: 'block', marginBottom: '4px', opacity: 0.8 }}>Swarm Name</label>
            <input
              type="text"
              value={swarmName}
              onChange={e => setSwarmName(e.target.value)}
              placeholder="e.g., refactor-swarm"
              style={{
                width: '100%',
                padding: '5px 8px',
                background: 'var(--vscode-input-background)',
                color: 'var(--vscode-input-foreground)',
                border: '1px solid var(--vscode-input-border)',
                borderRadius: '3px',
                fontSize: '12px',
                boxSizing: 'border-box'
              }}
            />
          </div>
          <div style={{ marginBottom: '8px' }}>
            <label style={{ fontSize: '11px', display: 'block', marginBottom: '4px', opacity: 0.8 }}>Agents (comma-separated)</label>
            <input
              type="text"
              value={agentInput}
              onChange={e => setAgentInput(e.target.value)}
              placeholder="explore,implement,review"
              style={{
                width: '100%',
                padding: '5px 8px',
                background: 'var(--vscode-input-background)',
                color: 'var(--vscode-input-foreground)',
                border: '1px solid var(--vscode-input-border)',
                borderRadius: '3px',
                fontSize: '12px',
                boxSizing: 'border-box'
              }}
            />
          </div>
          <button
            onClick={handleCreate}
            style={{
              padding: '5px 14px',
              background: 'var(--vscode-button-background)',
              color: 'var(--vscode-button-foreground)',
              border: 'none',
              borderRadius: '3px',
              cursor: 'pointer',
              fontSize: '12px'
            }}
          >
            Create Swarm
          </button>
        </div>
      )}

      {swarms.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '24px 12px', opacity: 0.6, fontSize: '12px' }}>
          No swarms yet. Create one to coordinate multiple agents.
        </div>
      ) : (
        swarms.map(swarm => (
          <div
            key={swarm.id}
            style={{
              marginBottom: '8px',
              border: selectedSwarm === swarm.id
                ? '1px solid var(--vscode-focusBorder)'
                : '1px solid var(--vscode-panel-border)',
              borderRadius: '4px',
              overflow: 'hidden'
            }}
          >
            <div
              onClick={() => setSelectedSwarm(selectedSwarm === swarm.id ? null : swarm.id)}
              style={{
                padding: '8px 10px',
                background: 'var(--vscode-list-hoverBackground)',
                cursor: 'pointer',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <div>
                <span style={{ fontWeight: 600, fontSize: '12px' }}>{swarm.name}</span>
                <span style={{ fontSize: '10px', opacity: 0.7, marginLeft: '8px' }}>
                  {swarm.agents.length} agents
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{
                  fontSize: '10px',
                  padding: '1px 6px',
                  borderRadius: '3px',
                  background: statusColor(swarm.status),
                  color: '#fff'
                }}>
                  {swarm.status}
                </span>
                <span style={{ fontSize: '10px', opacity: 0.6 }}>
                  {swarm.tasksCompleted}/{swarm.tasksTotal}
                </span>
              </div>
            </div>

            {selectedSwarm === swarm.id && (
              <div style={{ padding: '10px', borderTop: '1px solid var(--vscode-panel-border)' }}>
                <div style={{ marginBottom: '8px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 600, marginBottom: '6px', opacity: 0.8 }}>Agents</div>
                  {swarm.agents.map((agent, i) => (
                    <div
                      key={i}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '4px 0',
                        fontSize: '11px'
                      }}
                    >
                      <span>{agentStatusIcon(agent.status)}</span>
                      <span style={{ fontWeight: 500 }}>{agent.name}</span>
                      <span style={{ opacity: 0.6, fontSize: '10px' }}>
                        {agent.currentTask ? agent.currentTask : 'idle'}
                      </span>
                      <span style={{ marginLeft: 'auto', opacity: 0.6, fontSize: '10px' }}>
                        {agent.tasksCompleted} done
                      </span>
                    </div>
                  ))}
                </div>

                <div style={{ marginBottom: '8px' }}>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <input
                      type="text"
                      value={dispatchInputs[swarm.id] || ''}
                      onChange={e => setDispatchInputs(prev => ({ ...prev, [swarm.id]: e.target.value }))}
                      onKeyDown={e => e.key === 'Enter' && handleDispatch(swarm.id)}
                      placeholder="Task for swarm..."
                      style={{
                        flex: 1,
                        padding: '4px 8px',
                        background: 'var(--vscode-input-background)',
                        color: 'var(--vscode-input-foreground)',
                        border: '1px solid var(--vscode-input-border)',
                        borderRadius: '3px',
                        fontSize: '11px'
                      }}
                    />
                    <button
                      onClick={() => handleDispatch(swarm.id)}
                      style={{
                        padding: '4px 10px',
                        background: 'var(--vscode-button-background)',
                        color: 'var(--vscode-button-foreground)',
                        border: 'none',
                        borderRadius: '3px',
                        cursor: 'pointer',
                        fontSize: '11px'
                      }}
                    >
                      Dispatch
                    </button>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '4px' }}>
                  {swarm.status === 'active' ? (
                    <button
                      onClick={() => onPauseSwarm(swarm.id)}
                      style={{
                        flex: 1,
                        padding: '4px',
                        background: 'var(--vscode-button-secondaryBackground)',
                        color: 'var(--vscode-button-secondaryForeground)',
                        border: 'none',
                        borderRadius: '3px',
                        cursor: 'pointer',
                        fontSize: '10px'
                      }}
                    >
                      Pause
                    </button>
                  ) : swarm.status === 'paused' ? (
                    <button
                      onClick={() => onResumeSwarm(swarm.id)}
                      style={{
                        flex: 1,
                        padding: '4px',
                        background: 'var(--vscode-button-background)',
                        color: 'var(--vscode-button-foreground)',
                        border: 'none',
                        borderRadius: '3px',
                        cursor: 'pointer',
                        fontSize: '10px'
                      }}
                    >
                      Resume
                    </button>
                  ) : null}
                  <button
                    onClick={() => onDeleteSwarm(swarm.id)}
                    style={{
                      flex: 1,
                      padding: '4px',
                      background: 'transparent',
                      color: 'var(--vscode-errorForeground)',
                      border: '1px solid var(--vscode-errorForeground)',
                      borderRadius: '3px',
                      cursor: 'pointer',
                      fontSize: '10px'
                    }}
                  >
                    Delete
                  </button>
                </div>

                <div style={{ marginTop: '8px', fontSize: '10px', opacity: 0.5 }}>
                  Created: {new Date(swarm.createdAt).toLocaleString()}
                </div>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
};

export default SwarmCoordinator;
