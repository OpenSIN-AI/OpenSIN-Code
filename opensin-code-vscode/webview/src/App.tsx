import React, { useState, useEffect } from 'react';

declare const vscode: {
  postMessage(message: unknown): void;
  getState(): unknown;
  setState(state: unknown): void;
};

interface Task {
  id: string;
  description: string;
  agent: string;
  mode: string;
  status: 'running' | 'completed' | 'failed';
  progress: number;
}

interface SwarmInfo {
  id: string;
  name: string;
  agentCount: number;
  status: 'active' | 'paused' | 'completed';
}

interface AppState {
  tasks: Task[];
  swarms: SwarmInfo[];
  mode: string;
  buddyEnabled: boolean;
  buddyLevel: number;
  buddyXP: number;
  memoryCount: number;
  status: 'connected' | 'disconnected' | 'connecting';
}

const App: React.FC = () => {
  const [state, setState] = useState<AppState>({
    tasks: [],
    swarms: [],
    mode: 'explore',
    buddyEnabled: false,
    buddyLevel: 1,
    buddyXP: 0,
    memoryCount: 0,
    status: 'connecting'
  });

  const [dispatchInput, setDispatchInput] = useState('');
  const [selectedAgent, setSelectedAgent] = useState('explore');
  const [activeTab, setActiveTab] = useState<'tasks' | 'swarms' | 'buddy' | 'memory'>('tasks');

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const message = event.data;
      switch (message.type) {
        case 'state':
          setState(prev => ({ ...prev, ...message.payload }));
          break;
        case 'task_update':
          setState(prev => ({
            ...prev,
            tasks: prev.tasks.map(t => t.id === message.payload.id ? { ...t, ...message.payload } : t)
          }));
          break;
        case 'task_added':
          setState(prev => ({
            ...prev,
            tasks: [...prev.tasks, message.payload]
          }));
          break;
        case 'status':
          setState(prev => ({ ...prev, status: message.payload }));
          break;
      }
    };

    window.addEventListener('message', handleMessage);
    vscode.postMessage({ type: 'ready' });

    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const handleDispatch = () => {
    if (!dispatchInput.trim()) return;
    vscode.postMessage({
      type: 'dispatch',
      description: dispatchInput,
      agent: selectedAgent
    });
    setDispatchInput('');
  };

  const handleToggleBuddy = () => {
    vscode.postMessage({ type: 'toggle_buddy' });
  };

  const handleCreateSwarm = () => {
    vscode.postMessage({ type: 'create_swarm' });
  };

  const handleConsolidateMemory = () => {
    vscode.postMessage({ type: 'consolidate_memory' });
  };

  const statusColor = state.status === 'connected' ? '#4ec9b0' : state.status === 'connecting' ? '#dcdcaa' : '#f44747';

  return (
    <div style={{ padding: '12px', fontFamily: 'var(--vscode-font-family)', color: 'var(--vscode-foreground)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <h2 style={{ margin: 0, fontSize: '14px', fontWeight: 600 }}>
          <span style={{ marginRight: '8px' }}>🧠</span>
          OpenSIN Code
        </h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: statusColor, display: 'inline-block' }} />
          {state.status}
        </div>
      </div>

      <div style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', gap: '4px', marginBottom: '8px' }}>
          <input
            type="text"
            value={dispatchInput}
            onChange={e => setDispatchInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleDispatch()}
            placeholder="Describe your task..."
            style={{
              flex: 1,
              padding: '6px 8px',
              background: 'var(--vscode-input-background)',
              color: 'var(--vscode-input-foreground)',
              border: '1px solid var(--vscode-input-border)',
              borderRadius: '3px',
              fontSize: '12px'
            }}
          />
          <select
            value={selectedAgent}
            onChange={e => setSelectedAgent(e.target.value)}
            style={{
              padding: '6px 8px',
              background: 'var(--vscode-dropdown-background)',
              color: 'var(--vscode-dropdown-foreground)',
              border: '1px solid var(--vscode-dropdown-border)',
              borderRadius: '3px',
              fontSize: '12px'
            }}
          >
            <option value="explore">Explore</option>
            <option value="implement">Implement</option>
            <option value="review">Review</option>
            <option value="architect">Architect</option>
            <option value="debug">Debug</option>
          </select>
          <button
            onClick={handleDispatch}
            style={{
              padding: '6px 12px',
              background: 'var(--vscode-button-background)',
              color: 'var(--vscode-button-foreground)',
              border: 'none',
              borderRadius: '3px',
              cursor: 'pointer',
              fontSize: '12px'
            }}
          >
            Dispatch
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '2px', marginBottom: '12px', borderBottom: '1px solid var(--vscode-panel-border)' }}>
        {(['tasks', 'swarms', 'buddy', 'memory'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '6px 12px',
              background: activeTab === tab ? 'var(--vscode-tab-activeBackground)' : 'transparent',
              color: activeTab === tab ? 'var(--vscode-tab-activeForeground)' : 'var(--vscode-tab-inactiveForeground)',
              border: 'none',
              borderBottom: activeTab === tab ? '2px solid var(--vscode-tab-activeBorder)' : '2px solid transparent',
              cursor: 'pointer',
              fontSize: '11px',
              textTransform: 'capitalize'
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'tasks' && (
        <div>
          {state.tasks.length === 0 ? (
            <p style={{ fontSize: '12px', opacity: 0.6, textAlign: 'center', padding: '20px' }}>
              No active tasks. Dispatch one above.
            </p>
          ) : (
            state.tasks.map(task => (
              <div
                key={task.id}
                style={{
                  padding: '8px',
                  marginBottom: '4px',
                  background: 'var(--vscode-list-hoverBackground)',
                  borderRadius: '3px',
                  fontSize: '12px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 500 }}>{task.description}</span>
                  <span style={{
                    fontSize: '10px',
                    padding: '2px 6px',
                    borderRadius: '3px',
                    background: task.status === 'running' ? '#1a7f37' : task.status === 'completed' ? '#0969da' : '#cf222e',
                    color: '#fff'
                  }}>
                    {task.status}
                  </span>
                </div>
                <div style={{ fontSize: '10px', opacity: 0.7, marginTop: '4px' }}>
                  {task.agent} / {task.mode} — {task.progress}%
                </div>
                <div style={{
                  height: '2px',
                  background: 'var(--vscode-progressBar-background)',
                  borderRadius: '1px',
                  marginTop: '4px',
                  width: `${task.progress}%`
                }} />
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'swarms' && (
        <div>
          <button
            onClick={handleCreateSwarm}
            style={{
              padding: '6px 12px',
              background: 'var(--vscode-button-background)',
              color: 'var(--vscode-button-foreground)',
              border: 'none',
              borderRadius: '3px',
              cursor: 'pointer',
              fontSize: '12px',
              marginBottom: '8px'
            }}
          >
            + Create Swarm
          </button>
          {state.swarms.length === 0 ? (
            <p style={{ fontSize: '12px', opacity: 0.6, textAlign: 'center', padding: '20px' }}>
              No active swarms.
            </p>
          ) : (
            state.swarms.map(swarm => (
              <div
                key={swarm.id}
                style={{
                  padding: '8px',
                  marginBottom: '4px',
                  background: 'var(--vscode-list-hoverBackground)',
                  borderRadius: '3px',
                  fontSize: '12px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontWeight: 500 }}>{swarm.name}</span>
                  <span style={{ fontSize: '10px', opacity: 0.7 }}>{swarm.agentCount} agents</span>
                </div>
                <div style={{ fontSize: '10px', opacity: 0.7, marginTop: '4px' }}>
                  Status: {swarm.status}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'buddy' && (
        <div style={{ textAlign: 'center', padding: '12px' }}>
          <div style={{ fontSize: '32px', marginBottom: '8px' }}>
            {state.buddyEnabled ? '🤖' : '😴'}
          </div>
          <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '4px' }}>
            {state.buddyEnabled ? 'Buddy Active' : 'Buddy Inactive'}
          </div>
          <div style={{ fontSize: '12px', opacity: 0.7, marginBottom: '12px' }}>
            Level {state.buddyLevel} — {state.buddyXP} XP
          </div>
          <button
            onClick={handleToggleBuddy}
            style={{
              padding: '6px 16px',
              background: state.buddyEnabled ? 'var(--vscode-errorForeground)' : 'var(--vscode-button-background)',
              color: 'var(--vscode-button-foreground)',
              border: 'none',
              borderRadius: '3px',
              cursor: 'pointer',
              fontSize: '12px'
            }}
          >
            {state.buddyEnabled ? 'Disable Buddy' : 'Enable Buddy'}
          </button>
        </div>
      )}

      {activeTab === 'memory' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px' }}>{state.memoryCount} memory entries</span>
            <button
              onClick={handleConsolidateMemory}
              style={{
                padding: '4px 10px',
                background: 'var(--vscode-button-secondaryBackground)',
                color: 'var(--vscode-button-secondaryForeground)',
                border: 'none',
                borderRadius: '3px',
                cursor: 'pointer',
                fontSize: '11px'
              }}
            >
              Consolidate
            </button>
          </div>
          {state.memoryCount === 0 ? (
            <p style={{ fontSize: '12px', opacity: 0.6, textAlign: 'center', padding: '20px' }}>
              No memory entries yet. Start coding to build memory.
            </p>
          ) : (
            <p style={{ fontSize: '12px', opacity: 0.7 }}>
              Memory is being tracked. Click Consolidate to merge entries into summaries.
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default App;
