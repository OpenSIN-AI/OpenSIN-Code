import { describe, it, expect, beforeEach } from 'vitest';
import { SessionManager } from '../session/manager.js';
import { rm } from 'node:fs/promises';
import { join } from 'node:path';

const SESSIONS_DIR = join(process.env.HOME || '/root', '.local', 'share', 'sincode', 'sessions');

describe('SessionManager', () => {
  let manager: SessionManager;

  beforeEach(async () => {
    await rm(SESSIONS_DIR, { recursive: true, force: true });
    manager = new SessionManager();
  });

  afterEach(async () => {
    await rm(SESSIONS_DIR, { recursive: true, force: true });
  });

  it('should create a new session with initial message', async () => {
    const session = await manager.create('Hello, world!');
    expect(session.title).toBe('Hello, world!');
    expect(session.sessionId).toBeTruthy();
    expect(session.messages).toHaveLength(1);
    expect(session.messages[0].content).toBe('Hello, world!');
  });

  it('should truncate title for long messages', async () => {
    const longMessage = 'A'.repeat(100);
    const session = await manager.create(longMessage);
    expect(session.title.length).toBeLessThanOrEqual(50);
  });

  it('should save and load a session', async () => {
    const created = await manager.create('Test session');
    const loaded = await manager.load(created.sessionId);
    expect(loaded).not.toBeNull();
    expect(loaded!.title).toBe('Test session');
  });

  it('should return null for unknown session', async () => {
    const loaded = await manager.load('nonexistent-session-id-12345');
    expect(loaded).toBeNull();
  });

  it('should list sessions', async () => {
    await manager.create('Session A');
    await manager.create('Session B');
    const sessions = await manager.list();
    expect(sessions.length).toBeGreaterThanOrEqual(2);
    for (const s of sessions) {
      expect(s).toHaveProperty('sessionId');
      expect(s).toHaveProperty('title');
      expect(s).toHaveProperty('messageCount');
    }
  });

  it('should delete a session', async () => {
    const session = await manager.create('To delete');
    await manager.delete(session.sessionId);
    const loaded = await manager.load(session.sessionId);
    expect(loaded).toBeNull();
  });

  it('should load last session', async () => {
    const s1 = await manager.create('First');
    const s2 = await manager.create('Second');
    const last = await manager.loadLast();
    expect(last).not.toBeNull();
    expect(last!.sessionId).toBe(s2.sessionId);
  });

  it('should load specific session by id via loadLast', async () => {
    const s1 = await manager.create('First');
    const s2 = await manager.create('Second');
    const found = await manager.loadLast(s1.sessionId);
    expect(found).not.toBeNull();
    expect(found!.sessionId).toBe(s1.sessionId);
  });
});
