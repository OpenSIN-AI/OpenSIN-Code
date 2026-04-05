import { describe, it, expect } from 'vitest';
import { isInteractiveCommand, makeNonInteractive, getShellStrategyPrompt } from '../skills/shell_strategy.js';

describe('isInteractiveCommand', () => {
  it('should detect interactive git commands', () => {
    expect(isInteractiveCommand('git add -p')).toBe(true);
    expect(isInteractiveCommand('git checkout -p')).toBe(true);
    expect(isInteractiveCommand('git clean -i')).toBe(true);
    expect(isInteractiveCommand('git rebase -i')).toBe(true);
  });

  it('should detect interactive editors', () => {
    expect(isInteractiveCommand('vim file.txt')).toBe(true);
    expect(isInteractiveCommand('nano config.yml')).toBe(true);
  });

  it('should detect interactive TUI programs', () => {
    expect(isInteractiveCommand('htop')).toBe(true);
    expect(isInteractiveCommand('top')).toBe(true);
  });

  it('should detect interactive package managers', () => {
    expect(isInteractiveCommand('npm init')).toBe(true);
    expect(isInteractiveCommand('yarn init')).toBe(true);
  });

  it('should allow safe commands', () => {
    expect(isInteractiveCommand('git status')).toBe(false);
    expect(isInteractiveCommand('npm install')).toBe(false);
    expect(isInteractiveCommand('ls -la')).toBe(false);
    expect(isInteractiveCommand('cat file.txt')).toBe(false);
  });

  it('should allow non-interactive variants', () => {
    expect(isInteractiveCommand('npm init -y')).toBe(false);
    expect(isInteractiveCommand('top -b -n 1')).toBe(false);
  });
});

describe('makeNonInteractive', () => {
  it('should fix git log', () => {
    expect(makeNonInteractive('git log')).toContain('--no-pager');
  });

  it('should fix npm init', () => {
    expect(makeNonInteractive('npm init')).toContain('-y');
  });

  it('should fix yarn init', () => {
    expect(makeNonInteractive('yarn init')).toContain('-y');
  });

  it('should fix top', () => {
    expect(makeNonInteractive('top')).toContain('-b -n 1');
  });

  it('should pass through safe commands', () => {
    expect(makeNonInteractive('git status')).toBe('git status');
    expect(makeNonInteractive('npm install')).toBe('npm install');
  });
});

describe('getShellStrategyPrompt', () => {
  it('should return a non-empty prompt', () => {
    const prompt = getShellStrategyPrompt();
    expect(prompt.length).toBeGreaterThan(100);
    expect(prompt).toContain('git add -p');
    expect(prompt).toContain('npm init -y');
  });
});
