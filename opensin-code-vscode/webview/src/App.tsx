import React, { useState, useEffect, useRef } from 'react';
import { SwarmCoordinator } from './SwarmCoordinator';
interface Message { id: string; role: 'user' | 'assistant' | 'system'; content: string; timestamp: number; }
interface ToolCall { id: string; name: string; args: Record<string, unknown>; result?: string; status: 'running' | 'success' | 'error'; }
type Tab = 'chat' | 'swarm';
const vscode = acquireVsCodeApi();
export const App: React.FC = () => {
  const [tab, setTab] = useState<Tab>('chat');
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [mode, setMode] = useState('code');
  const [model, setModel] = useState('qwen3.6-plus-free');
  const [isLoading, setIsLoading] = useState(false);
  const [toolCalls, setToolCalls] = useState<ToolCall[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    window.addEventListener('message', (event) => {
      const message = event.data;
      switch (message.type) {
        case 'message': setMessages(prev => [...prev, message.data]); break;
        case 'tool_call': setToolCalls(prev => [...prev, message.data]); break;
        case 'tool_result': setToolCalls(prev => prev.map(tc => tc.id === message.data.id ? { ...tc, result: message.data.result, status: 'success' } : tc)); break;
        case 'clear': setMessages([]); setToolCalls([]); break;
        case 'mode': setMode(message.data); break;
      }
    });
  }, []);
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);
  const sendMessage = () => {
    if (!input.trim() || isLoading) return;
    const userMessage: Message = { id: Date.now().toString(), role: 'user', content: input, timestamp: Date.now() };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    vscode.postMessage({ type: 'sendMessage', data: { content: input, mode, model } });
  };
  const handleKeyDown = (e: React.KeyboardEvent) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <div style={{ display: 'flex', borderBottom: '1px solid var(--vscode-panel-border)' }}>
        {(['chat', 'swarm'] as Tab[]).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ flex: 1, padding: '8px', background: tab === t ? 'var(--vscode-tab-activeBackground)' : 'var(--vscode-tab-inactiveBackground)', color: tab === t ? 'var(--vscode-tab-activeForeground)' : 'var(--vscode-tab-inactiveForeground)', border: 'none', borderBottom: tab === t ? '2px solid var(--vscode-tab-activeBorder)' : '2px solid transparent', cursor: 'pointer', fontSize: '12px' }}>{t === 'chat' ? '💬 Chat' : '🐝 Swarm'}</button>
        ))}
      </div>
      {tab === 'chat' && (<div style={{ padding: '8px 12px', borderBottom: '1px solid var(--vscode-panel-border)' }}><div style={{ display: 'flex', gap: '8px' }}><select value={mode} onChange={e => { setMode(e.target.value); vscode.postMessage({ type: 'setMode', data: e.target.value }); }} style={{ flex: 1, background: 'var(--vscode-input-background)', color: 'var(--vscode-input-foreground)', border: '1px solid var(--vscode-input-border)', padding: '4px 8px', borderRadius: '4px' }}><option value="architect">🏗️ Architect</option><option value="code">💻 Code</option><option value="debug">🐛 Debug</option><option value="ask">❓ Ask</option><option value="opensin-code">🏛️ OpenSIN-Code</option></select><select value={model} onChange={e => setModel(e.target.value)} style={{ flex: 1, background: 'var(--vscode-input-background)', color: 'var(--vscode-input-foreground)', border: '1px solid var(--vscode-input-border)', padding: '4px 8px', borderRadius: '4px' }}><option value="qwen3.6-plus-free">Qwen 3.6 Plus</option><option value="claude-sonnet-4-20250514">Claude Sonnet 4</option><option value="gpt-4.1">GPT-4.1</option></select></div></div>)}
      <div style={{ flex: 1, overflow: 'auto' }}>
        {tab === 'chat' ? (<div style={{ padding: '12px' }}>{messages.length === 0 && <div style={{ textAlign: 'center', color: 'var(--vscode-descriptionForeground)', marginTop: '40px' }}><div style={{ fontSize: '48px', marginBottom: '16px' }}>🏛️</div><div>OpenSIN Code</div><div style={{ fontSize: '12px', marginTop: '8px' }}>Select a mode and start coding</div></div>}{messages.map(msg => (<div key={msg.id} style={{ marginBottom: '12px', padding: '8px 12px', borderRadius: '8px', background: msg.role === 'user' ? 'var(--vscode-input-background)' : 'var(--vscode-editor-background)', border: `1px solid ${msg.role === 'user' ? 'var(--vscode-input-border)' : 'var(--vscode-panel-border)'}` }}><div style={{ fontSize: '12px', color: 'var(--vscode-descriptionForeground)', marginBottom: '4px' }}>{msg.role === 'user' ? '👤 You' : '🏛️ OpenSIN'}</div><pre style={{ whiteSpace: 'pre-wrap', margin: 0, fontFamily: 'var(--vscode-editor-font-family)', fontSize: 'var(--vscode-editor-font-size)' }}>{msg.content}</pre></div>))}{isLoading && <div style={{ padding: '8px 12px', color: 'var(--vscode-descriptionForeground)' }}><span style={{ animation: 'pulse 1s infinite' }}>●●●</span> Thinking...</div>}{toolCalls.map(tc => (<div key={tc.id} style={{ marginBottom: '8px', padding: '6px 12px', background: 'var(--vscode-textBlockQuote-background)', borderRadius: '4px', fontSize: '12px' }}><span>{tc.status === 'running' ? '⏳' : tc.status === 'success' ? '✅' : '❌'}</span> {tc.name}{tc.result && <div style={{ marginTop: '4px', color: 'var(--vscode-descriptionForeground)' }}>{tc.result}</div>}</div>))}<div ref={messagesEndRef} /></div>) : (<SwarmCoordinator />)}
      </div>
      {tab === 'chat' && (<div style={{ padding: '8px 12px', borderTop: '1px solid var(--vscode-panel-border)' }}><div style={{ display: 'flex', gap: '8px' }}><textarea value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKeyDown} placeholder="Ask OpenSIN Code..." rows={2} style={{ flex: 1, background: 'var(--vscode-input-background)', color: 'var(--vscode-input-foreground)', border: '1px solid var(--vscode-input-border)', borderRadius: '4px', padding: '8px', resize: 'none', fontFamily: 'var(--vscode-font-family)', boxSizing: 'border-box' }} /><button onClick={sendMessage} disabled={isLoading || !input.trim()} style={{ background: 'var(--vscode-button-background)', color: 'var(--vscode-button-foreground)', border: 'none', borderRadius: '4px', padding: '8px 16px', cursor: isLoading ? 'not-allowed' : 'pointer', opacity: isLoading || !input.trim() ? 0.5 : 1 }}>▶</button></div></div>)}
    </div>
  );
};
