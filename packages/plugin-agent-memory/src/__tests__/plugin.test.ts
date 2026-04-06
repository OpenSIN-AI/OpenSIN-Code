import { describe, it, expect } from 'vitest';
import { AgentMemoryPlugin } from '../index.js';

describe('AgentMemoryPlugin', () => {
  it('has correct manifest', () => {
    const plugin = new AgentMemoryPlugin();
    expect(plugin.getManifest().id).toBe('agent-memory');
  });
  it('adds and retrieves memories', () => {
    const plugin = new AgentMemoryPlugin();
    const entry = plugin.add('facts', 'The sky is blue', 0.8);
    expect(entry.category).toBe('facts');
    expect(entry.content).toBe('The sky is blue');
    expect(entry.importance).toBe(0.8);
    const retrieved = plugin.get(entry.id);
    expect(retrieved).toBeDefined();
    expect(retrieved?.content).toBe('The sky is blue');
  });
  it('tracks access count', () => {
    const plugin = new AgentMemoryPlugin();
    const entry = plugin.add('test', 'data');
    plugin.get(entry.id);
    plugin.get(entry.id);
    const retrieved = plugin.get(entry.id);
    expect(retrieved?.accessCount).toBe(3);
  });
  it('queries by category', () => {
    const plugin = new AgentMemoryPlugin();
    plugin.add('cats', 'meow');
    plugin.add('dogs', 'woof');
    plugin.add('cats', 'purr');
    const results = plugin.query({ category: 'cats' });
    expect(results).toHaveLength(2);
    expect(results.every(r => r.category === 'cats')).toBe(true);
  });
  it('queries by importance', () => {
    const plugin = new AgentMemoryPlugin();
    plugin.add('a', 'low', 0.1);
    plugin.add('b', 'high', 0.9);
    plugin.add('c', 'mid', 0.5);
    const results = plugin.query({ minImportance: 0.5 });
    expect(results).toHaveLength(2);
  });
  it('queries with search', () => {
    const plugin = new AgentMemoryPlugin();
    plugin.add('tech', 'TypeScript is great');
    plugin.add('tech', 'Python is also great');
    const results = plugin.query({ search: 'python' });
    expect(results).toHaveLength(1);
    expect(results[0].content).toContain('Python');
  });
  it('limits results', () => {
    const plugin = new AgentMemoryPlugin();
    for (let i = 0; i < 10; i++) plugin.add('items', 'item ' + i, i / 10);
    const results = plugin.query({ limit: 3 });
    expect(results).toHaveLength(3);
  });
  it('updates memories', () => {
    const plugin = new AgentMemoryPlugin();
    const entry = plugin.add('test', 'old content');
    plugin.update(entry.id, 'new content');
    expect(plugin.get(entry.id)?.content).toBe('new content');
  });
  it('deletes memories', () => {
    const plugin = new AgentMemoryPlugin();
    const entry = plugin.add('test', 'to delete');
    expect(plugin.delete(entry.id)).toBe(true);
    expect(plugin.get(entry.id)).toBeUndefined();
  });
  it('lists categories', () => {
    const plugin = new AgentMemoryPlugin();
    plugin.add('alpha', 'a');
    plugin.add('beta', 'b');
    plugin.add('alpha', 'c');
    expect(plugin.getCategories()).toEqual(['alpha', 'beta']);
  });
  it('provides stats', () => {
    const plugin = new AgentMemoryPlugin();
    plugin.add('cat1', 'a', 0.5);
    plugin.add('cat2', 'b', 0.7);
    const stats = plugin.getStats();
    expect(stats.totalEntries).toBe(2);
    expect(stats.categories['cat1']).toBe(1);
    expect(stats.categories['cat2']).toBe(1);
  });
  it('consolidates low importance', () => {
    const plugin = new AgentMemoryPlugin({ minImportance: 0.5, autoConsolidate: true });
    plugin.add('low', 'unimportant', 0.1);
    plugin.add('high', 'important', 0.9);
    const removed = plugin.consolidate();
    expect(removed).toBe(1);
    expect(plugin.getStats().totalEntries).toBe(1);
  });
  it('enforces max entries', () => {
    const plugin = new AgentMemoryPlugin({ maxEntries: 3 });
    plugin.add('a', '1', 0.1);
    plugin.add('b', '2', 0.2);
    plugin.add('c', '3', 0.3);
    plugin.add('d', '4', 0.9);
    expect(plugin.getStats().totalEntries).toBeLessThanOrEqual(3);
  });
  it('allows config update', () => {
    const plugin = new AgentMemoryPlugin();
    plugin.setConfig({ maxEntries: 50 });
    expect(plugin.getConfig().maxEntries).toBe(50);
  });
});
