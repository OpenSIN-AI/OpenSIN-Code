import React, { useState } from 'react';

interface Agent {
  id: string;
  name: string;
  description: string;
  icon: string;
  status: 'idle' | 'busy' | 'error';
}

interface Task {
  id: string;
  agentId: string;
  prompt: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  result?: string;
}

const AVAILABLE_AGENTS: Agent[] = [
  { id: 'explore', name: 'Explore', description: 'Codebase analysis, file structures, AST patterns', icon: '🔍', status: 'idle' },
  { id: 'librarian', name: 'Librarian', description: 'Remote repos, official docs, GitHub examples', icon: '📚', status: 'idle' },
  { id: 'oracle', name: 'Oracle', description: 'Architecture, debugging, complex logic', icon: '🔮', status: 'idle' },
  { id: 'hephaestus', name: 'Hephaestus', description: 'Build, compile, fix, implement', icon: '🔨', status: 'idle' },
  { id: 'metis', name: 'Metis', description: 'Strategy, planning, optimization', icon: '🧠', status: 'idle' },
  { id: 'momus', name: 'Momus', description: 'Code review, critique, quality check', icon: '🎭', status: 'idle' },
];

const vscode = acquireVsCodeApi();

export const SwarmCoordinator: React.FC = () => {
  const [agents] = useState<Agent[]>(AVAILABLE_AGENTS);
  const [selectedAgent, setSelectedAgent] = useState<string>('');
  const [prompt, setPrompt] = useState('');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isDispatching, setIsDispatching] = useState(false);

  const dispatchTask = () => {
    if (!selectedAgent || !prompt.trim() || isDispatching) return;
    
    const task: Task = {
      id: Date.now().toString(),
      agentId: selectedAgent,
      prompt,
      status: 'running',
    };
    
    setTasks(prev => [...prev, task]);
    setPrompt('');
    setIsDispatching(true);
    
    vscode.postMessage({
      type: 'dispatchTask',
      data: { agentId: selectedAgent, prompt, taskId: task.id },
    });
  };

  const dispatchParallel = () => {
    if (!prompt.trim() || isDispatching) return;
    
    const selectedAgents = agents.filter(a => a.status === 'idle').slice(0, 3);
    const newTasks: Task[] = selectedAgents.map(agent => ({
      id: `${Date.now()}-${agent.id}`,
      agentId: agent.id,
      prompt,
      status: 'running' as const,
    }));
    
    setTasks(prev => [...prev, ...newTasks]);
    setIsDispatching(true);
    
    vscode.postMessage({
      type: 'dispatchParallel',
      data: { agents: selectedAgents.map(a => a.id), prompt },
    });
  };

  return (
    <div style={{ padding: '12px' }}>
      <h3 style={{ margin: '0 0 12px', fontSize: '14px' }}>🐝 Swarm Coordinator</h3>
      
      {/* Agent Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '12px' }}>
        {agents.map(agent => (
          <div
            key={agent.id}
            onClick={() => setSelectedAgent(agent.id)}
            style={{
              padding: '8px',
              borderRadius: '6px',
              border: `2px solid ${selectedAgent === agent.id ? 'var(--vscode-focusBorder)' : 'var(--vscode-panel-border)'}`,
              background: selectedAgent === agent.id ? 'var(--vscode-list-activeSelectionBackground)' : 'var(--vscode-editor-background)',
              cursor: 'pointer',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: '20px' }}>{agent.icon}</div>
            <div style={{ fontSize: '11px', fontWeight: 'bold' }}>{agent.name}</div>
            <div style={{ fontSize: '9px', color: 'var(--vscode-descriptionForeground)' }}>{agent.description}</div>
            <div style={{ fontSize: '9px', marginTop: '4px', color: agent.status === 'idle' ? 'var(--vscode-testing-iconPassed)' : 'var(--vscode-testing-iconErrored)' }}>
              {agent.status === 'idle' ? '● Idle' : '● Busy'}
            </div>
          </div>
        ))}
      </div>

      {/* Task Input */}
      <div style={{ marginBottom: '8px' }}>
        <textarea
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          placeholder="Enter task prompt..."
          rows={3}
          style={{ width: '100%', background: 'var(--vscode-input-background)', color: 'var(--vscode-input-foreground)', border: '1px solid var(--vscode-input-border)', borderRadius: '4px', padding: '8px', resize: 'vertical', fontFamily: 'var(--vscode-font-family)', boxSizing: 'border-box' }}
        />
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
        <button
          onClick={dispatchTask}
          disabled={!selectedAgent || !prompt.trim() || isDispatching}
          style={{ flex: 1, background: 'var(--vscode-button-background)', color: 'var(--vscode-button-foreground)', border: 'none', borderRadius: '4px', padding: '6px 12px', cursor: !selectedAgent || !prompt.trim() ? 'not-allowed' : 'pointer', opacity: !selectedAgent || !prompt.trim() ? 0.5 : 1 }}
        >
          🎯 Dispatch to {selectedAgent ? agents.find(a => a.id === selectedAgent)?.name : 'Agent'}
        </button>
        <button
          onClick={dispatchParallel}
          disabled={!prompt.trim() || isDispatching}
          style={{ flex: 1, background: 'var(--vscode-button-secondaryBackground)', color: 'var(--vscode-button-secondaryForeground)', border: 'none', borderRadius: '4px', padding: '6px 12px', cursor: !prompt.trim() ? 'not-allowed' : 'pointer', opacity: !prompt.trim() ? 0.5 : 1 }}
        >
          🐝 Parallel (3 agents)
        </button>
      </div>

      {/* Task List */}
      {tasks.length > 0 && (
        <div>
          <h4 style={{ margin: '0 0 8px', fontSize: '12px' }}>Active Tasks</h4>
          {tasks.map(task => (
            <div key={task.id} style={{ padding: '8px', marginBottom: '4px', background: 'var(--vscode-textBlockQuote-background)', borderRadius: '4px', fontSize: '11px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>{agents.find(a => a.id === task.agentId)?.icon} {agents.find(a => a.id === task.agentId)?.name}</span>
                <span style={{ color: task.status === 'running' ? 'var(--vscode-testing-runIcon)' : task.status === 'completed' ? 'var(--vscode-testing-iconPassed)' : 'var(--vscode-testing-iconErrored)' }}>
                  {task.status === 'running' ? '⏳ Running' : task.status === 'completed' ? '✅ Done' : task.status === 'failed' ? '❌ Failed' : '⏸ Pending'}
                </span>
              </div>
              <div style={{ marginTop: '4px', color: 'var(--vscode-descriptionForeground)' }}>{task.prompt}</div>
              {task.result && <div style={{ marginTop: '4px', padding: '4px', background: 'var(--vscode-editor-background)', borderRadius: '2px' }}>{task.result}</div>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
