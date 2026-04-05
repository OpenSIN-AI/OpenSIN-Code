import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import { SessionStore } from '../session_persistence/store';
import { SessionManager } from '../session_persistence/manager';

const TEST_DIR = '/tmp/opensin-test-sessions';

describe('SessionStore', () => {
  let store: SessionStore;

  beforeEach(() => {
    if (fs.existsSync(TEST_DIR)) fs.rmSync(TEST_DIR, { recursive: true });
    store = new SessionStore(TEST_DIR);
  });

  afterEach(() => {
    if (fs.existsSync(TEST_DIR)) fs.rmSync(TEST_DIR, { recursive: true });
  });

  it('creates directory on init', () => {
    expect(fs.existsSync(TEST_DIR)).toBe(true);
  });

  it('saves and loads messages', () => {
    store.saveMessage('test-1', { role: 'user', content: 'Hello' });
    store.saveMessage('test-1', { role: 'assistant', content: 'Hi' });
    const messages = store.loadMessages('test-1');
    expect(messages).toHaveLength(2);
    expect(messages[0].role).toBe('user');
  });

  it('returns empty array for non-existent session', () => {
    expect(store.loadMessages('non-existent')).toEqual([]);
  });

  it('deletes session', () => {
    store.saveMessage('test-1', { role: 'user', content: 'Hello' });
    expect(store.deleteSession('test-1')).toBe(true);
    expect(store.loadMessages('test-1')).toEqual([]);
  });

  it('lists sessions', () => {
    store.saveMessage('session-a', { role: 'user', content: 'A' });
    store.saveMessage('session-b', { role: 'user', content: 'B' });
    const sessions = store.listSessions();
    expect(sessions).toContain('session-a');
    expect(sessions).toContain('session-b');
  });

  it('returns session size', () => {
    store.saveMessage('test-1', { role: 'user', content: 'Hello' });
    expect(store.getSessionSize('test-1')).toBeGreaterThan(0);
    expect(store.getSessionSize('non-existent')).toBe(0);
  });
});

describe('SessionManager', () => {
  let manager: SessionManager;

  beforeEach(() => {
    if (fs.existsSync(TEST_DIR)) fs.rmSync(TEST_DIR, { recursive: true });
    manager = new SessionManager(new SessionStore(TEST_DIR));
  });

  afterEach(() => {
    if (fs.existsSync(TEST_DIR)) fs.rmSync(TEST_DIR, { recursive: true });
  });

  it('creates session', () => {
    const meta = manager.createSession('test-1', 'Test Session');
    expect(meta.id).toBe('test-1');
    expect(meta.name).toBe('Test Session');
    expect(meta.messageCount).toBe(0);
  });

  it('adds messages', () => {
    manager.createSession('test-1');
    manager.addMessage({ role: 'user', content: 'Hello' });
    manager.addMessage({ role: 'assistant', content: 'Hi' });
    const data = manager.resumeSession('test-1');
    expect(data.messages).toHaveLength(2);
    expect(data.metadata.messageCount).toBe(2);
  });

  it('resumes session', () => {
    manager.createSession('test-1');
    manager.addMessage({ role: 'user', content: 'Hello' });
    const data = manager.resumeSession('test-1');
    expect(data.messages).toHaveLength(1);
    expect(manager.getCurrentSession()).toBe('test-1');
  });

  it('lists sessions', () => {
    manager.createSession('session-a');
    manager.createSession('session-b');
    const sessions = manager.listSessions();
    expect(sessions).toHaveLength(2);
  });

  it('deletes session', () => {
    manager.createSession('test-1');
    expect(manager.deleteSession('test-1')).toBe(true);
    expect(manager.getCurrentSession()).toBeNull();
  });

  it('throws when no active session', () => {
    expect(() => manager.addMessage({ role: 'user', content: 'Hello' })).toThrow('No active session');
  });
});

describe('session_persistence exports', () => {
  it('exports all public API from index', async () => {
    const sp = await import('../session_persistence/index');
    expect(sp.SessionStore).toBeDefined();
    expect(sp.SessionManager).toBeDefined();
  });
});
