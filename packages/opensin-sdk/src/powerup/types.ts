export interface LessonStep {
  id: string;
  title: string;
  description: string;
  action: string;
  expectedOutcome: string;
  hint?: string;
  codeExample?: string;
  durationEstimateSeconds: number;
  isInteractive: boolean;
}

export interface Lesson {
  id: string;
  title: string;
  description: string;
  category: LessonCategory;
  difficulty: "beginner" | "intermediate" | "advanced";
  steps: LessonStep[];
  estimatedDurationMinutes: number;
  prerequisites: string[];
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export type LessonCategory =
  | "getting-started"
  | "features"
  | "advanced"
  | "best-practices"
  | "integrations";

export interface DemoAction {
  type: "type" | "click" | "hover" | "scroll" | "highlight" | "wait" | "navigate";
  target?: string;
  text?: string;
  duration?: number;
  description?: string;
}

export interface DemoAnimation {
  id: string;
  lessonId: string;
  stepId: string;
  actions: DemoAction[];
  loop?: boolean;
  speedMultiplier?: number;
}

export interface LessonProgress {
  lessonId: string;
  currentStepIndex: number;
  completedSteps: string[];
  startedAt: string;
  completedAt?: string;
  timeSpentSeconds: number;
  attempts: number;
  lastAttemptAt?: string;
}

export interface UserProgress {
  userId: string;
  completedLessons: string[];
  inProgressLessons: LessonProgress[];
  totalXP: number;
  level: number;
  achievements: Achievement[];
  streak: number;
  lastActiveAt: string;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlockedAt: string;
  xpReward: number;
}

export interface StepResult {
  stepId: string;
  success: boolean;
  timeSpentSeconds: number;
  hintsUsed: number;
  attempts: number;
  completedAt: string;
}

export interface PowerupConfig {
  autoSave: boolean;
  saveIntervalMs: number;
  xpPerLesson: number;
  xpPerStep: number;
  xpBonusForNoHints: number;
  levelThresholds: number[];
  maxStreakDays: number;
  showHints: boolean;
  animationSpeed: number;
}

export interface PowerupState {
  isActive: boolean;
  currentLesson: Lesson | null;
  currentStepIndex: number;
  progress: UserProgress;
  isAnimating: boolean;
  hintsUsed: number;
  sessionStartTime: number;
}
