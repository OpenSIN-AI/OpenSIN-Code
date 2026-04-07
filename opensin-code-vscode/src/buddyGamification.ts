import * as vscode from 'vscode';

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  xpReward: number;
  unlocked: boolean;
  unlockedAt?: number;
}

export interface BuddyState {
  enabled: boolean;
  xp: number;
  level: number;
  achievements: Achievement[];
  tasksCompleted: number;
  streakDays: number;
  lastActiveDate?: string;
}

const ACHIEVEMENT_DEFS: Omit<Achievement, 'unlocked' | 'unlockedAt'>[] = [
  { id: 'first_task', name: 'First Steps', description: 'Complete your first OpenSIN task', icon: '$(star-empty)', xpReward: 50 },
  { id: 'ten_tasks', name: 'Getting Started', description: 'Complete 10 tasks', icon: '$(star-full)', xpReward: 100 },
  { id: 'fifty_tasks', name: 'Power User', description: 'Complete 50 tasks', icon: '$(trophy)', xpReward: 250 },
  { id: 'first_swarm', name: 'Swarm Leader', description: 'Create your first agent swarm', icon: '$(group-by-ref-type)', xpReward: 75 },
  { id: 'memory_master', name: 'Memory Master', description: 'Consolidate memory 5 times', icon: '$(brain)', xpReward: 150 },
  { id: 'mode_explorer', name: 'Mode Explorer', description: 'Use all 5 agent modes', icon: '$(symbol-enum)', xpReward: 100 },
  { id: 'streak_3', name: 'On a Roll', description: '3-day activity streak', icon: '$(flame)', xpReward: 100 },
  { id: 'streak_7', name: 'Committed', description: '7-day activity streak', icon: '$(flame)', xpReward: 200 },
  { id: 'lsp_tuner', name: 'LSP Tuner', description: 'Restart the LSP server 3 times', icon: '$(gear)', xpReward: 50 },
  { id: 'reviewer', name: 'Code Reviewer', description: 'Use review mode 10 times', icon: '$(eye)', xpReward: 150 }
];

const XP_PER_LEVEL = 500;

export class BuddyGamification {
  private state: BuddyState;
  private context: vscode.ExtensionContext;
  private outputChannel: vscode.OutputChannel;
  private modesUsed: Set<string>;
  private lspRestarts: number;
  private memoryConsolidations: number;
  private reviewModeCount: number;

  constructor(context: vscode.ExtensionContext, outputChannel: vscode.OutputChannel) {
    this.context = context;
    this.outputChannel = outputChannel;
    this.modesUsed = new Set(context.workspaceState.get<string[]>('opensin.buddy.modesUsed') || []);
    this.lspRestarts = context.workspaceState.get('opensin.buddy.lspRestarts', 0);
    this.memoryConsolidations = context.workspaceState.get('opensin.buddy.memoryConsolidations', 0);
    this.reviewModeCount = context.workspaceState.get('opensin.buddy.reviewModeCount', 0);

    const savedState = context.workspaceState.get<BuddyState>('opensin.buddy.state');
    if (savedState) {
      this.state = savedState;
    } else {
      this.state = {
        enabled: vscode.workspace.getConfiguration('opensin').get('buddyEnabled', false),
        xp: 0,
        level: 1,
        achievements: ACHIEVEMENT_DEFS.map(a => ({ ...a, unlocked: false })),
        tasksCompleted: 0,
        streakDays: 0
      };
    }

    this.updateStreak();
  }

  isEnabled(): boolean {
    return this.state.enabled;
  }

  toggle(): boolean {
    this.state.enabled = !this.state.enabled;
    vscode.workspace.getConfiguration('opensin').update('buddyEnabled', this.state.enabled, vscode.ConfigurationTarget.Global);
    this.persistState();
    return this.state.enabled;
  }

  getXP(): number {
    return this.state.xp;
  }

  getLevel(): number {
    return this.state.level;
  }

  getTasksCompleted(): number {
    return this.state.tasksCompleted;
  }

  recordTaskCompleted(): void {
    if (!this.state.enabled) return;

    this.state.tasksCompleted++;
    this.addXP(25);
    this.checkAchievements();
    this.persistState();
  }

  recordSwarmCreated(): void {
    if (!this.state.enabled) return;
    this.addXP(75);
    this.checkAchievements();
    this.persistState();
  }

  recordMemoryConsolidated(): void {
    if (!this.state.enabled) return;
    this.memoryConsolidations++;
    this.context.workspaceState.update('opensin.buddy.memoryConsolidations', this.memoryConsolidations);
    this.addXP(30);
    this.checkAchievements();
    this.persistState();
  }

  recordModeUsed(mode: string): void {
    if (!this.state.enabled) return;
    this.modesUsed.add(mode);
    this.context.workspaceState.update('opensin.buddy.modesUsed', Array.from(this.modesUsed));

    if (mode === 'review') {
      this.reviewModeCount++;
      this.context.workspaceState.update('opensin.buddy.reviewModeCount', this.reviewModeCount);
    }

    this.addXP(10);
    this.checkAchievements();
    this.persistState();
  }

  recordLSPRestart(): void {
    if (!this.state.enabled) return;
    this.lspRestarts++;
    this.context.workspaceState.update('opensin.buddy.lspRestarts', this.lspRestarts);
    this.addXP(15);
    this.checkAchievements();
    this.persistState();
  }

  getAchievements(): Achievement[] {
    return this.state.achievements;
  }

  getUnlockedAchievements(): Achievement[] {
    return this.state.achievements.filter(a => a.unlocked);
  }

  getProgressToNextLevel(): { current: number; required: number; percentage: number } {
    const xpInCurrentLevel = this.state.xp % XP_PER_LEVEL;
    return {
      current: xpInCurrentLevel,
      required: XP_PER_LEVEL,
      percentage: Math.round((xpInCurrentLevel / XP_PER_LEVEL) * 100)
    };
  }

  private addXP(amount: number): void {
    this.state.xp += amount;
    const newLevel = Math.floor(this.state.xp / XP_PER_LEVEL) + 1;
    if (newLevel > this.state.level) {
      this.state.level = newLevel;
      this.outputChannel.appendLine(`[${new Date().toISOString()}] BUDDY LEVEL UP: Level ${this.state.level}`);
      vscode.window.showInformationMessage(`OpenSIN Buddy: Level Up! You are now level ${this.state.level}!`);
    }
  }

  private checkAchievements(): void {
    for (const achievement of this.state.achievements) {
      if (achievement.unlocked) continue;

      let shouldUnlock = false;
      switch (achievement.id) {
        case 'first_task': shouldUnlock = this.state.tasksCompleted >= 1; break;
        case 'ten_tasks': shouldUnlock = this.state.tasksCompleted >= 10; break;
        case 'fifty_tasks': shouldUnlock = this.state.tasksCompleted >= 50; break;
        case 'first_swarm': shouldUnlock = this.state.tasksCompleted >= 1; break;
        case 'memory_master': shouldUnlock = this.memoryConsolidations >= 5; break;
        case 'mode_explorer': shouldUnlock = this.modesUsed.size >= 5; break;
        case 'streak_3': shouldUnlock = this.state.streakDays >= 3; break;
        case 'streak_7': shouldUnlock = this.state.streakDays >= 7; break;
        case 'lsp_tuner': shouldUnlock = this.lspRestarts >= 3; break;
        case 'reviewer': shouldUnlock = this.reviewModeCount >= 10; break;
      }

      if (shouldUnlock) {
        achievement.unlocked = true;
        achievement.unlockedAt = Date.now();
        this.addXP(achievement.xpReward);
        this.outputChannel.appendLine(`[${new Date().toISOString()}] ACHIEVEMENT UNLOCKED: ${achievement.name}`);
        vscode.window.showInformationMessage(`OpenSIN Buddy: Achievement Unlocked — "${achievement.name}" (+${achievement.xpReward} XP)`);
      }
    }
  }

  private updateStreak(): void {
    const today = new Date().toISOString().split('T')[0];
    const lastActive = this.state.lastActiveDate;

    if (lastActive === today) return;

    if (lastActive) {
      const lastDate = new Date(lastActive);
      const todayDate = new Date(today);
      const diffDays = Math.floor((todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        this.state.streakDays++;
      } else if (diffDays > 1) {
        this.state.streakDays = 1;
      }
    } else {
      this.state.streakDays = 1;
    }

    this.state.lastActiveDate = today;
  }

  private persistState(): void {
    this.context.workspaceState.update('opensin.buddy.state', this.state);
  }
}
