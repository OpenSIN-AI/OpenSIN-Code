import type {
  Achievement,
  LessonProgress,
  PowerupConfig,
  UserProgress,
} from "./types.js";

const DEFAULT_CONFIG: PowerupConfig = {
  autoSave: true,
  saveIntervalMs: 5000,
  xpPerLesson: 100,
  xpPerStep: 20,
  xpBonusForNoHints: 50,
  levelThresholds: [0, 100, 300, 600, 1000, 1500, 2100, 2800, 3600, 4500],
  maxStreakDays: 365,
  showHints: true,
  animationSpeed: 1,
};

const DEFAULT_ACHIEVEMENTS: Omit<Achievement, "unlockedAt">[] = [
  {
    id: "first-lesson",
    title: "First Steps",
    description: "Complete your first lesson",
    icon: "🎯",
    xpReward: 50,
  },
  {
    id: "speed-learner",
    title: "Speed Learner",
    description: "Complete a lesson in under half the estimated time",
    icon: "⚡",
    xpReward: 75,
  },
  {
    id: "no-hints",
    title: "No Hints Needed",
    description: "Complete a lesson without using any hints",
    icon: "🧠",
    xpReward: 100,
  },
  {
    id: "streak-3",
    title: "Three Day Streak",
    description: "Use OpenSIN for 3 consecutive days",
    icon: "🔥",
    xpReward: 150,
  },
  {
    id: "all-beginner",
    title: "Beginner Complete",
    description: "Complete all beginner lessons",
    icon: "📚",
    xpReward: 200,
  },
  {
    id: "xp-500",
    title: "Half Way There",
    description: "Earn 500 XP",
    icon: "⭐",
    xpReward: 100,
  },
];

export class ProgressTracker {
  private config: PowerupConfig;
  private progress: UserProgress;
  private saveTimer: ReturnType<typeof setTimeout> | null = null;
  private onProgressUpdate?: (progress: UserProgress) => void;
  private onAchievementUnlocked?: (achievement: Achievement) => void;

  constructor(userId: string, config?: Partial<PowerupConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.progress = this.createEmptyProgress(userId);
  }

  loadProgress(saved: Partial<UserProgress>): void {
    this.progress = {
      ...this.progress,
      ...saved,
      achievements: saved.achievements || [],
      completedLessons: saved.completedLessons || [],
      inProgressLessons: saved.inProgressLessons || [],
    };
  }

  getProgress(): UserProgress {
    return { ...this.progress };
  }

  addLessonProgress(lessonProgress: LessonProgress): void {
    const existing = this.progress.inProgressLessons?.findIndex(
      (p) => p.lessonId === lessonProgress.lessonId
    );

    if (existing >= 0) {
      this.progress.inProgressLessons[existing] = lessonProgress;
    } else {
      this.progress.inProgressLessons.push(lessonProgress);
    }

    this.checkAchievements();
    this.scheduleSave();
  }

  completeLesson(
    lessonId: string,
    timeSpentSeconds: number,
    hintsUsed: number,
    estimatedMinutes: number
  ): void {
    if (!this.progress.completedLessons.includes(lessonId)) {
      this.progress.completedLessons.push(lessonId);
    }

    this.progress.inProgressLessons = this.progress.inProgressLessons.filter(
      (p) => p.lessonId !== lessonId
    );

    let xp = this.config.xpPerLesson;

    const estimatedSeconds = estimatedMinutes * 60;
    if (timeSpentSeconds < estimatedSeconds * 0.5) {
      xp += this.config.xpBonusForNoHints;
    } else if (hintsUsed === 0) {
      xp += this.config.xpBonusForNoHints;
    }

    this.progress.totalXP += xp;
    this.progress.level = this.calculateLevel(this.progress.totalXP);

    this.updateStreak();
    this.checkAchievements();
    this.onProgressUpdate?.(this.progress);
    this.scheduleSave();
  }

  getCompletionPercentage(lessonId: string, totalSteps: number): number {
    const lp = this.progress.inProgressLessons?.find(
      (p) => p.lessonId === lessonId
    );
    if (!lp) return 0;
    return Math.round((lp.completedSteps.length / totalSteps) * 100);
  }

  getAchievements(): Achievement[] {
    return this.progress.achievements;
  }

  getStreak(): number {
    return this.progress.streak;
  }

  getLevel(): number {
    return this.progress.level;
  }

  getXP(): number {
    return this.progress.totalXP;
  }

  getXPForNextLevel(): number {
    const thresholds = this.config.levelThresholds;
    const currentLevel = this.progress.level;
    if (currentLevel >= thresholds.length - 1) return -1;
    const next = thresholds[currentLevel + 1] ?? 0;
    return next - (this.progress.totalXP ?? 0);
  }

  exportProgress(): string {
    return JSON.stringify(this.progress, null, 2);
  }

  setOnProgressUpdate(callback: (progress: UserProgress) => void): void {
    this.onProgressUpdate = callback;
  }

  setOnAchievementUnlocked(
    callback: (achievement: Achievement) => void
  ): void {
    this.onAchievementUnlocked = callback;
  }

  private createEmptyProgress(userId: string): UserProgress {
    return {
      userId,
      completedLessons: [],
      inProgressLessons: [],
      totalXP: 0,
      level: 1,
      achievements: [],
      streak: 0,
      lastActiveAt: new Date().toISOString(),
    };
  }

  private calculateLevel(xp: number): number {
    const thresholds = this.config.levelThresholds;
    for (let i = thresholds.length - 1; i >= 0; i--) {
      if (xp >= (thresholds[i] ?? 0)) return i + 1;
    }
    return 1;
  }

  private updateStreak(): void {
    const now = new Date();
    const lastActive = new Date(this.progress.lastActiveAt);
    const diffDays = Math.floor(
      (now.getTime() - lastActive.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diffDays === 1) {
      this.progress.streak = Math.min(
        this.progress.streak + 1,
        this.config.maxStreakDays
      );
    } else if (diffDays > 1) {
      this.progress.streak = 1;
    }

    this.progress.lastActiveAt = now.toISOString();
  }

  private checkAchievements(): void {
    for (const achievementDef of DEFAULT_ACHIEVEMENTS) {
      if (
        this.progress.achievements.some((a) => a.id === achievementDef.id)
      ) {
        continue;
      }

      if (this.shouldUnlockAchievement(achievementDef.id)) {
        const achievement: Achievement = {
          ...achievementDef,
          unlockedAt: new Date().toISOString(),
        };
        this.progress.achievements.push(achievement);
        this.progress.totalXP += achievement.xpReward;
        this.onAchievementUnlocked?.(achievement);
      }
    }
  }

  private shouldUnlockAchievement(id: string): boolean {
    switch (id) {
      case "first-lesson":
        return this.progress.completedLessons.length >= 1;
      case "speed-learner":
        return this.progress.completedLessons.length >= 1;
      case "no-hints":
        return this.progress.completedLessons.length >= 1;
      case "streak-3":
        return this.progress.streak >= 3;
      case "all-beginner":
        return this.progress.completedLessons.length >= 3;
      case "xp-500":
        return this.progress.totalXP >= 500;
      default:
        return false;
    }
  }

  private scheduleSave(): void {
    if (!this.config.autoSave) return;

    if (this.saveTimer) {
      clearTimeout(this.saveTimer);
    }

    this.saveTimer = setTimeout(() => {
      this.saveToStorage();
    }, this.config.saveIntervalMs);
  }

  private saveToStorage(): void {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(
        "opensin-powerup-progress",
        JSON.stringify(this.progress)
      );
    } catch {
      // Storage not available
    }
  }

  loadFromStorage(): void {
    if (typeof window === "undefined") return;
    try {
      const saved = localStorage.getItem("opensin-powerup-progress");
      if (saved) {
        this.loadProgress(JSON.parse(saved));
      }
    } catch {
      // Storage not available or corrupted
    }
  }
}

export function createProgressTracker(
  userId: string,
  config?: Partial<PowerupConfig>
): ProgressTracker {
  return new ProgressTracker(userId, config);
}
