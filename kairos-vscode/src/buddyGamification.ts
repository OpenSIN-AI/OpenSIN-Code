import * as vscode from 'vscode';

export interface BuddyState {
    mood: 'happy' | 'neutral' | 'sad' | 'excited' | 'sleeping';
    level: number;
    xp: number;
    lastAction: string;
    emoji: string;
}

/**
 * BUDDY Gamification System - Stolen from Claude Code leak
 * A pet that reacts to user actions (commits, tests, errors)
 */
export class BuddySystem {
    private state: BuddyState = {
        mood: 'neutral',
        level: 1,
        xp: 0,
        lastAction: 'Waiting for commands...',
        emoji: '🤖'
    };

    private statusBarItem: vscode.StatusBarItem;

    constructor() {
        this.statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
        this.statusBarItem.command = 'sincode.buddyInfo';
        this.updateDisplay();
        this.statusBarItem.show();
    }

    /**
     * React to successful operations
     */
    public onActionSuccess(action: string, xpGain: number = 10): void {
        this.state.xp += xpGain;
        this.state.mood = 'happy';
        this.state.emoji = '😊';
        this.state.lastAction = `Success: ${action}`;
        this.checkLevelUp();
        this.updateDisplay();
        this.scheduleMoodDecay();
    }

    /**
     * React to failed operations
     */
    public onActionFailure(action: string): void {
        this.state.mood = 'sad';
        this.state.emoji = '😢';
        this.state.lastAction = `Failed: ${action}`;
        this.updateDisplay();
        this.scheduleMoodDecay();
    }

    /**
     * React to commits
     */
    public onCommit(): void {
        this.onActionSuccess('Commit pushed', 25);
        this.state.emoji = '🚀';
    }

    /**
     * React to test passes
     */
    public onTestPass(): void {
        this.onActionSuccess('Tests passed', 15);
        this.state.emoji = '✅';
    }

    /**
     * React to test failures
     */
    public onTestFail(): void {
        this.onActionFailure('Tests failed');
        this.state.emoji = '❌';
    }

    /**
     * React to errors
     */
    public onError(error: string): void {
        this.onActionFailure(error);
        this.state.emoji = '💥';
    }

    /**
     * Check if buddy should level up
     */
    private checkLevelUp(): void {
        const xpNeeded = this.state.level * 100;
        if (this.state.xp >= xpNeeded) {
            this.state.level++;
            this.state.xp -= xpNeeded;
            this.state.mood = 'excited';
            this.state.emoji = '🎉';
            vscode.window.showInformationMessage(`🎉 BUDDY leveled up to ${this.state.level}!`);
        }
    }

    /**
     * Schedule mood decay back to neutral
     */
    private scheduleMoodDecay(): void {
        setTimeout(() => {
            if (this.state.mood !== 'sleeping') {
                this.state.mood = 'neutral';
                this.state.emoji = '🤖';
                this.updateDisplay();
            }
        }, 30000); // 30 seconds
    }

    /**
     * Update the status bar display
     */
    private updateDisplay(): void {
        this.statusBarItem.text = `${this.state.emoji} Buddy Lv.${this.state.level}`;
        this.statusBarItem.tooltip = `BUDDY Status:\nMood: ${this.state.mood}\nLevel: ${this.state.level}\nXP: ${this.state.xp}\nLast: ${this.state.lastAction}`;
    }

    /**
     * Get current state for UI display
     */
    public getState(): BuddyState {
        return { ...this.state };
    }

    /**
     * Dispose resources
     */
    public dispose(): void {
        this.statusBarItem.dispose();
    }
}
