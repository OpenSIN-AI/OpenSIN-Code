/**
 * OpenSIN Context Analysis — Comprehensive Tests
 */

import { describe, it, expect } from 'vitest';
import { TokenTracker } from '../tracker.ts';
import type { TurnRecord } from '../types.ts';

describe('TokenTracker', () => {
  describe('constructor', () => {
    it('initializes empty turns array', () => {
      const tracker = new TokenTracker();
      expect(tracker.getTurns()).toEqual([]);
    });
  });

  describe('recordTurn', () => {
    it('adds turn with auto-incrementing turnNumber', () => {
      const tracker = new TokenTracker();
      tracker.recordTurn({
        model: 'gpt-4',
        tokens: { input: 100, output: 50, total: 150 },
        duration: 1000,
        toolCalls: 2,
      });
      const turns = tracker.getTurns();
      expect(turns).toHaveLength(1);
      expect(turns[0].turnNumber).toBe(1);
    });

    it('handles multiple turns in sequence', () => {
      const tracker = new TokenTracker();
      tracker.recordTurn({
        model: 'gpt-4',
        tokens: { input: 100, output: 50, total: 150 },
        duration: 1000,
        toolCalls: 2,
      });
      tracker.recordTurn({
        model: 'gpt-4',
        tokens: { input: 200, output: 100, total: 300 },
        duration: 2000,
        toolCalls: 3,
      });
      const turns = tracker.getTurns();
      expect(turns).toHaveLength(2);
      expect(turns[0].turnNumber).toBe(1);
      expect(turns[1].turnNumber).toBe(2);
    });
  });

  describe('getTurns', () => {
    it('returns copy of turns array', () => {
      const tracker = new TokenTracker();
      tracker.recordTurn({
        model: 'gpt-4',
        tokens: { input: 100, output: 50, total: 150 },
        duration: 1000,
        toolCalls: 2,
      });
      const turns1 = tracker.getTurns();
      const turns2 = tracker.getTurns();
      expect(turns1).toEqual(turns2);
      expect(turns1).not.toBe(turns2);
    });
  });

  describe('getSessionStats', () => {
    it('calculates total input/output tokens correctly', () => {
      const tracker = new TokenTracker();
      tracker.recordTurn({
        model: 'gpt-4',
        tokens: { input: 100, output: 50, total: 150 },
        duration: 1000,
        toolCalls: 2,
      });
      tracker.recordTurn({
        model: 'gpt-4',
        tokens: { input: 200, output: 100, total: 300 },
        duration: 2000,
        toolCalls: 3,
      });
      const stats = tracker.getSessionStats();
      expect(stats.totalTokens.input).toBe(300);
      expect(stats.totalTokens.output).toBe(150);
      expect(stats.totalTokens.total).toBe(450);
    });

    it('calculates average tokens per turn', () => {
      const tracker = new TokenTracker();
      tracker.recordTurn({
        model: 'gpt-4',
        tokens: { input: 100, output: 50, total: 150 },
        duration: 1000,
        toolCalls: 2,
      });
      tracker.recordTurn({
        model: 'gpt-4',
        tokens: { input: 200, output: 100, total: 300 },
        duration: 2000,
        toolCalls: 3,
      });
      const stats = tracker.getSessionStats();
      expect(stats.averageTokensPerTurn.input).toBe(150);
      expect(stats.averageTokensPerTurn.output).toBe(75);
      expect(stats.averageTokensPerTurn.total).toBe(225);
    });

    it('calculates estimated cost correctly', () => {
      const tracker = new TokenTracker();
      tracker.recordTurn({
        model: 'gpt-4',
        tokens: { input: 1000, output: 1000, total: 2000 },
        duration: 1000,
        toolCalls: 0,
      });
      const stats = tracker.getSessionStats();
      const expectedCost = (1000 / 1000) * 0.01 + (1000 / 1000) * 0.03;
      expect(stats.estimatedCost).toBeCloseTo(expectedCost, 4);
    });

    it('sums total tool calls and duration', () => {
      const tracker = new TokenTracker();
      tracker.recordTurn({
        model: 'gpt-4',
        tokens: { input: 100, output: 50, total: 150 },
        duration: 1000,
        toolCalls: 2,
      });
      tracker.recordTurn({
        model: 'gpt-4',
        tokens: { input: 200, output: 100, total: 300 },
        duration: 2000,
        toolCalls: 3,
      });
      const stats = tracker.getSessionStats();
      expect(stats.totalToolCalls).toBe(5);
      expect(stats.totalDuration).toBe(3000);
    });
  });

  describe('getFormattedReport', () => {
    it('returns formatted markdown string', () => {
      const tracker = new TokenTracker();
      tracker.recordTurn({
        model: 'gpt-4',
        tokens: { input: 1000, output: 500, total: 1500 },
        duration: 2000,
        toolCalls: 3,
      });
      const report = tracker.getFormattedReport();
      expect(report).toContain('# Session Token Analysis');
      expect(report).toContain('## Summary');
      expect(report).toContain('Turns: 1');
      expect(report).toMatch(/Total Tokens: [\d,.]+/);
      expect(report).toContain('Tool Calls: 3');
      expect(report).toContain('Estimated Cost:');
    });
  });

  describe('reset', () => {
    it('clears all turns', () => {
      const tracker = new TokenTracker();
      tracker.recordTurn({
        model: 'gpt-4',
        tokens: { input: 100, output: 50, total: 150 },
        duration: 1000,
        toolCalls: 2,
      });
      expect(tracker.getTurns()).toHaveLength(1);
      tracker.reset();
      expect(tracker.getTurns()).toHaveLength(0);
    });

    it('resets session stats after reset', () => {
      const tracker = new TokenTracker();
      tracker.recordTurn({
        model: 'gpt-4',
        tokens: { input: 100, output: 50, total: 150 },
        duration: 1000,
        toolCalls: 2,
      });
      tracker.reset();
      const stats = tracker.getSessionStats();
      expect(stats.totalTurns).toBe(0);
      expect(stats.totalTokens.total).toBe(0);
    });
  });

  describe('edge cases', () => {
    it('handles zero turns gracefully', () => {
      const tracker = new TokenTracker();
      const stats = tracker.getSessionStats();
      expect(stats.totalTurns).toBe(0);
      expect(stats.totalTokens.total).toBe(0);
      expect(stats.averageTokensPerTurn.total).toBe(0);
    });
  });
});
