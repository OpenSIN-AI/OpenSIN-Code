import { describe, it, expect } from 'vitest';
import { isInteractiveCommand, makeNonInteractive, getShellStrategyPrompt, SHELL_STRATEGY_INSTRUCTIONS } from '../skills/shell_strategy.js';

describe('Shell Strategy - Advanced', () => {
  it('should detect git interactive commands', () => {
    expect(isInteractiveCommand('git add -p')).toBe(true);
    expect(isInteractiveCommand('git checkout -p')).toBe(true);
    expect(isInteractiveCommand('git clean -i')).toBe(true);
    expect(isInteractiveCommand('git rebase -i HEAD~3')).toBe(true);
  });

  it('should allow safe git commands', () => {
    expect(isInteractiveCommand('git status')).toBe(false);
    expect(isInteractiveCommand('git log --oneline')).toBe(false);
    expect(isInteractiveCommand('git diff')).toBe(false);
    expect(isInteractiveCommand('git add .')).toBe(false);
    expect(isInteractiveCommand('git commit -m "test"')).toBe(false);
  });

  it('should detect package manager interactive modes', () => {
    expect(isInteractiveCommand('npm init')).toBe(true);
    expect(isInteractiveCommand('yarn init')).toBe(true);
  });

  it('should allow safe package manager commands', () => {
    expect(isInteractiveCommand('npm install')).toBe(false);
    expect(isInteractiveCommand('npm run build')).toBe(false);
    expect(isInteractiveCommand('yarn add lodash')).toBe(false);
  });

  it('should detect editor commands', () => {
    expect(isInteractiveCommand('vim file.txt')).toBe(true);
    expect(isInteractiveCommand('nano config.yml')).toBe(true);
  });

  it('should detect TUI programs', () => {
    expect(isInteractiveCommand('htop')).toBe(true);
    expect(isInteractiveCommand('top')).toBe(true);
  });

  it('should fix git log pager', () => {
    expect(makeNonInteractive('git log')).toContain('--no-pager');
  });

  it('should fix npm init', () => {
    expect(makeNonInteractive('npm init')).toContain('-y');
  });

  it('should fix yarn init', () => {
    expect(makeNonInteractive('yarn init')).toContain('-y');
  });

  it('should fix top command', () => {
    expect(makeNonInteractive('top')).toContain('-b -n 1');
  });

  it('should not modify safe commands', () => {
    expect(makeNonInteractive('git status')).toBe('git status');
    expect(makeNonInteractive('ls -la')).toBe('ls -la');
    expect(makeNonInteractive('cat file.txt')).toBe('cat file.txt');
  });

  it('should return comprehensive strategy prompt', () => {
    const prompt = getShellStrategyPrompt();
    expect(prompt.length).toBeGreaterThan(500);
    expect(prompt).toContain('git add -p');
    expect(prompt).toContain('npm init -y');
    expect(prompt).toContain('docker login');
    expect(prompt).toContain('ssh-keygen');
    expect(prompt).toContain('CI=true');
    expect(prompt).toContain('timeout');
  });

  it('should export the full instructions string', () => {
    expect(SHELL_STRATEGY_INSTRUCTIONS.length).toBeGreaterThan(500);
    expect(SHELL_STRATEGY_INSTRUCTIONS).toContain('git add -p');
  });
});
