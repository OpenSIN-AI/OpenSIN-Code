import type {
  Lesson,
  LessonCategory,
  LessonStep,
  LessonProgress,
  StepResult,
  UserProgress,
} from "./types.js";

const DEFAULT_LESSONS: Lesson[] = [
  {
    id: "lesson-001",
    title: "Welcome to OpenSIN",
    description: "Learn the basics of OpenSIN and set up your first session",
    category: "getting-started",
    difficulty: "beginner",
    steps: [
      {
        id: "step-001-01",
        title: "Open the Command Palette",
        description: "Press Cmd+K to open the OpenSIN command palette",
        action: "Open command palette with Cmd+K",
        expectedOutcome: "Command palette appears with search input",
        hint: "Look for the search bar at the top of your screen",
        durationEstimateSeconds: 10,
        isInteractive: true,
      },
      {
        id: "step-001-02",
        title: "Start a New Session",
        description: "Type 'new session' and press Enter",
        action: "Type 'new session' and press Enter",
        expectedOutcome: "New session is created and chat opens",
        hint: "You can also use the + button in the sidebar",
        durationEstimateSeconds: 15,
        isInteractive: true,
      },
      {
        id: "step-001-03",
        title: "Send Your First Message",
        description: "Type a question or command and send it",
        action: "Type any message and press Enter",
        expectedOutcome: "Agent responds with helpful output",
        hint: "Try asking 'What can you do?'",
        durationEstimateSeconds: 20,
        isInteractive: true,
      },
    ],
    estimatedDurationMinutes: 3,
    prerequisites: [],
    tags: ["onboarding", "basics"],
    createdAt: "2026-04-01T00:00:00Z",
    updatedAt: "2026-04-01T00:00:00Z",
  },
  {
    id: "lesson-002",
    title: "Using Design Mode",
    description: "Learn how to annotate UI elements and give precise feedback",
    category: "features",
    difficulty: "intermediate",
    steps: [
      {
        id: "step-002-01",
        title: "Activate Design Mode",
        description: "Enable Design Mode to start annotating UI elements",
        action: "Toggle Design Mode on",
        expectedOutcome: "Design Mode overlay appears with annotation tools",
        hint: "Look for the Design Mode toggle in the toolbar",
        durationEstimateSeconds: 10,
        isInteractive: true,
      },
      {
        id: "step-002-02",
        title: "Select an Element",
        description: "Shift+drag to select an area on the page",
        action: "Hold Shift and drag to create a selection",
        expectedOutcome: "Selection box appears with highlighted elements",
        hint: "Try selecting a button or text block",
        durationEstimateSeconds: 20,
        isInteractive: true,
      },
      {
        id: "step-002-03",
        title: "Add to Chat",
        description: "Press Cmd+L to add the selected element to chat",
        action: "Press Cmd+L with element selected",
        expectedOutcome: "Element reference appears in chat input",
        hint: "You can now give feedback about this element",
        durationEstimateSeconds: 15,
        isInteractive: true,
      },
    ],
    estimatedDurationMinutes: 5,
    prerequisites: ["lesson-001"],
    tags: ["design", "ui", "feedback"],
    createdAt: "2026-04-01T00:00:00Z",
    updatedAt: "2026-04-01T00:00:00Z",
  },
  {
    id: "lesson-003",
    title: "Automations & Always-on Agents",
    description: "Set up automations triggered by Slack, GitHub, and more",
    category: "advanced",
    difficulty: "advanced",
    steps: [
      {
        id: "step-003-01",
        title: "Create an Automation",
        description: "Create a new automation with a trigger",
        action: "Navigate to Automations and click Create",
        expectedOutcome: "New automation form appears",
        hint: "Choose a trigger type: Slack, GitHub, Linear, etc.",
        durationEstimateSeconds: 30,
        isInteractive: true,
      },
      {
        id: "step-003-02",
        title: "Configure the Trigger",
        description: "Set up the trigger conditions for your automation",
        action: "Configure trigger type and filters",
        expectedOutcome: "Trigger is configured and ready",
        hint: "You can use webhooks for custom integrations",
        durationEstimateSeconds: 45,
        isInteractive: true,
      },
      {
        id: "step-003-03",
        title: "Test the Automation",
        description: "Trigger the automation manually to verify it works",
        action: "Click the Test button",
        expectedOutcome: "Automation runs and shows results",
        hint: "Check the execution history for details",
        durationEstimateSeconds: 30,
        isInteractive: true,
      },
    ],
    estimatedDurationMinutes: 8,
    prerequisites: ["lesson-001"],
    tags: ["automations", "triggers", "agents"],
    createdAt: "2026-04-01T00:00:00Z",
    updatedAt: "2026-04-01T00:00:00Z",
  },
];

export class LessonEngine {
  private lessons: Map<string, Lesson> = new Map();
  private progress: Map<string, LessonProgress> = new Map();
  private currentLessonId: string | null = null;
  private onStepComplete?: (stepId: string, result: StepResult) => void;
  private onLessonComplete?: (lessonId: string) => void;

  constructor(lessons?: Lesson[]) {
    const source = lessons || DEFAULT_LESSONS;
    for (const lesson of source) {
      this.lessons.set(lesson.id, lesson);
    }
  }

  getLessons(category?: LessonCategory): Lesson[] {
    let all = Array.from(this.lessons.values());
    if (category) {
      all = all.filter((l) => l.category === category);
    }
    return all.sort((a, b) => a.title.localeCompare(b.title));
  }

  getLesson(id: string): Lesson | null {
    return this.lessons.get(id) || null;
  }

  startLesson(lessonId: string, userId: string): LessonProgress | null {
    const lesson = this.lessons.get(lessonId);
    if (!lesson) return null;

    const existing = this.progress.get(lessonId);
    if (existing && existing.completedAt) {
      return existing;
    }

    const progress: LessonProgress = {
      lessonId,
      currentStepIndex: existing?.currentStepIndex || 0,
      completedSteps: existing?.completedSteps || [],
      startedAt: existing?.startedAt || new Date().toISOString(),
      timeSpentSeconds: existing?.timeSpentSeconds || 0,
      attempts: (existing?.attempts || 0) + 1,
      lastAttemptAt: new Date().toISOString(),
    };

    this.progress.set(lessonId, progress);
    this.currentLessonId = lessonId;
    return progress;
  }

  completeStep(
    lessonId: string,
    stepId: string,
    timeSpentSeconds: number,
    hintsUsed: number,
    success: boolean = true
  ): StepResult | null {
    const lessonProgress = this.progress.get(lessonId);
    if (!lessonProgress) return null;

    const lesson = this.lessons.get(lessonId);
    if (!lesson) return null;

    const step = lesson.steps.find((s) => s.id === stepId);
    if (!step) return null;

    const result: StepResult = {
      stepId,
      success,
      timeSpentSeconds,
      hintsUsed,
      attempts: 1,
      completedAt: new Date().toISOString(),
    };

    if (success && !lessonProgress.completedSteps.includes(stepId)) {
      lessonProgress.completedSteps.push(stepId);
    }

    lessonProgress.currentStepIndex = lessonProgress.completedSteps.length;
    lessonProgress.timeSpentSeconds += timeSpentSeconds;

    if (lessonProgress.completedSteps.length === lesson.steps.length) {
      lessonProgress.completedAt = new Date().toISOString();
      this.onLessonComplete?.(lessonId);
    }

    this.onStepComplete?.(stepId, result);
    return result;
  }

  getCurrentStep(lessonId: string): LessonStep | null {
    const lesson = this.lessons.get(lessonId);
    const progress = this.progress.get(lessonId);
    if (!lesson || !progress) return null;

    const nextIndex = progress.completedSteps.length;
    if (nextIndex >= lesson.steps.length) return null;

    return lesson.steps[nextIndex];
  }

  getProgress(lessonId: string): LessonProgress | null {
    return this.progress.get(lessonId) || null;
  }

  resetProgress(lessonId: string): boolean {
    return this.progress.delete(lessonId);
  }

  getCompletionRate(lessonId: string): number {
    const lesson = this.lessons.get(lessonId);
    const progress = this.progress.get(lessonId);
    if (!lesson || !progress) return 0;

    return progress.completedSteps.length / lesson.steps.length;
  }

  getRecommendedLessons(completedLessons: string[]): Lesson[] {
    return this.getLessons().filter((lesson) => {
      if (completedLessons.includes(lesson.id)) return false;

      const prereqsMet = lesson.prerequisites.every((p) =>
        completedLessons.includes(p)
      );
      return prereqsMet;
    });
  }

  setOnStepComplete(callback: (stepId: string, result: StepResult) => void): void {
    this.onStepComplete = callback;
  }

  setOnLessonComplete(callback: (lessonId: string) => void): void {
    this.onLessonComplete = callback;
  }
}

export function createLessonEngine(lessons?: Lesson[]): LessonEngine {
  return new LessonEngine(lessons);
}
