export interface PowerUpConfig {
  enabled?: boolean;
  maxLevel?: number;
}
export interface Lesson {
  id: string;
  title: string;
  content: string;
}
export interface Progress {
  lessonId: string;
  completed: boolean;
  score?: number;
}
