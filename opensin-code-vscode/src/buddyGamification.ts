import * as vscode from "vscode";
/**
 * BUDDY Gamification System - Stolen from Claude Code leak
 * A pet that reacts to user actions (commits, tests, errors)
 */
class BuddySystem {
    state = {
        mood: 'neutral',
        level: 1,
        xp: 0,
        lastAction: 'Waiting for commands...',
        emoji: '🤖'
    };
    statusBarItem;
    constructor() {
        this.statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
        this.statusBarItem.command = 'opensin-code.buddyInfo';
        this.updateDisplay();
        this.statusBarItem.show();
    }
    /**
     * React to successful operations
     */
    onActionSuccess(action: any, xpGain = 10) {
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
    onActionFailure(action) {
        this.state.mood = 'sad';
        this.state.emoji = '😢';
        this.state.lastAction = `Failed: ${action}`;
        this.updateDisplay();
        this.scheduleMoodDecay();
    }
    /**
     * React to commits
     */
    onCommit() {
        this.onActionSuccess('Commit pushed', 25);
        this.state.emoji = '🚀';
    }
    /**
     * React to test passes
     */
    onTestPass() {
        this.onActionSuccess('Tests passed', 15);
        this.state.emoji = '✅';
    }
    /**
     * React to test failures
     */
    onTestFail() {
        this.onActionFailure('Tests failed');
        this.state.emoji = '❌';
    }
    /**
     * React to errors
     */
    onError(error) {
        this.onActionFailure(error);
        this.state.emoji = '💥';
    }
    /**
     * Check if buddy should level up
     */
    checkLevelUp() {
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
    scheduleMoodDecay() {
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
    updateDisplay() {
        this.statusBarItem.text = `${this.state.emoji} Buddy Lv.${this.state.level}`;
        this.statusBarItem.tooltip = `BUDDY Status:\nMood: ${this.state.mood}\nLevel: ${this.state.level}\nXP: ${this.state.xp}\nLast: ${this.state.lastAction}`;
    }
    /**
     * Get current state for UI display
     */
    getState() {
        return { ...this.state };
    }
    /**
     * Dispose resources
     */
    dispose() {
        this.statusBarItem.dispose();
    }
}

//# sourceMappingURL=buddyGamification.js.map