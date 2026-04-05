import { describe, it, expect } from 'vitest';
import { ContextAnalysisPlugin, estimateCost } from '../index.js';

describe('estimateCost', () => {
  it('calculates basic cost', () => {
    const cost = estimateCost(1000, 500);
    expect(cost.inputCost).toBe(0.0025);
    expect(cost.outputCost).toBe(0.005);
    expect(cost.totalCost).toBe(0.0075);
  });
  it('handles zero tokens', () => {
    const cost = estimateCost(0, 0);
    expect(cost.totalCost).toBe(0);
  });
  it('uses custom config', () => {
    const cost = estimateCost(1000, 1000, { inputCostPer1K: 0.01, outputCostPer1K: 0.03 });
    expect(cost.inputCost).toBe(0.01);
    expect(cost.outputCost).toBe(0.03);
    expect(cost.totalCost).toBe(0.04);
  });
  it('includes model and currency', () => {
    const cost = estimateCost(100, 100, { model: 'gpt-4-turbo', currency: 'EUR' });
    expect(cost.model).toBe('gpt-4-turbo');
    expect(cost.currency).toBe('EUR');
  });
});

describe('ContextAnalysisPlugin', () => {
  it('has correct manifest', () => {
    const plugin = new ContextAnalysisPlugin('test-session');
    expect(plugin.getManifest().id).toBe('context-analysis');
  });
  it('records turns', () => {
    const plugin = new ContextAnalysisPlugin('s1');
    plugin.recordTurn(100, 50);
    plugin.recordTurn(200, 100);
    const stats = plugin.getTokenUsage();
    expect(stats.turnCount).toBe(2);
    expect(stats.totalInputTokens).toBe(300);
    expect(stats.totalOutputTokens).toBe(150);
    expect(stats.totalTokens).toBe(450);
    expect(stats.avgTokensPerTurn).toBe(225);
    expect(stats.maxTokensInTurn).toBe(300);
  });
  it('estimates cost', () => {
    const plugin = new ContextAnalysisPlugin('s2');
    plugin.recordTurn(1000, 500);
    const cost = plugin.getCostEstimate();
    expect(cost.totalCost).toBeGreaterThan(0);
  });
  it('gets per-turn cost', () => {
    const plugin = new ContextAnalysisPlugin('s3');
    plugin.recordTurn(1000, 500);
    const cost = plugin.getTurnCost(1);
    expect(cost).not.toBeNull();
    expect(cost!.totalCost).toBeGreaterThan(0);
  });
  it('returns null for invalid turn', () => {
    const plugin = new ContextAnalysisPlugin('s4');
    expect(plugin.getTurnCost(999)).toBeNull();
  });
  it('resets stats', () => {
    const plugin = new ContextAnalysisPlugin('s5');
    plugin.recordTurn(100, 50);
    plugin.reset();
    expect(plugin.getTokenUsage().turnCount).toBe(0);
  });
  it('allows config update', () => {
    const plugin = new ContextAnalysisPlugin();
    plugin.setConfig({ inputCostPer1K: 0.05 });
    expect(plugin.getConfig().inputCostPer1K).toBe(0.05);
  });
});
