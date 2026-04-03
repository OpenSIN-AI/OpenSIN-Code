export interface ColorPreset {
  name: string;
  hex: string;
  category: "warm" | "cool" | "neutral" | "vibrant";
}

export interface SessionColor {
  sessionId: string;
  hex: string;
  appliedAt: string;
}

export interface ColorPickerState {
  currentColor: string | null;
  sessionId: string;
  history: SessionColor[];
}

export interface ColorPickerConfig {
  maxHistory: number;
  persistAcrossSessions: boolean;
  defaultHex: string;
}

export const COLOR_PRESETS: ColorPreset[] = [
  { name: "Ocean", hex: "#3B82F6", category: "cool" },
  { name: "Emerald", hex: "#10B981", category: "cool" },
  { name: "Violet", hex: "#8B5CF6", category: "cool" },
  { name: "Rose", hex: "#F43F5E", category: "warm" },
  { name: "Amber", hex: "#F59E0B", category: "warm" },
  { name: "Cyan", hex: "#06B6D4", category: "cool" },
  { name: "Lime", hex: "#84CC16", category: "vibrant" },
  { name: "Indigo", hex: "#6366F1", category: "cool" },
  { name: "Slate", hex: "#64748B", category: "neutral" },
  { name: "Zinc", hex: "#71717A", category: "neutral" },
  { name: "Orange", hex: "#F97316", category: "warm" },
  { name: "Teal", hex: "#14B8A6", category: "cool" },
  { name: "Pink", hex: "#EC4899", category: "warm" },
  { name: "Sky", hex: "#0EA5E9", category: "cool" },
  { name: "Red", hex: "#EF4444", category: "warm" },
  { name: "Default", hex: "#1E1E2E", category: "neutral" },
];

export const DEFAULT_SESSION_COLOR = "#1E1E2E";

export interface SessionColor {
  sessionId: string;
  hex: string;
  appliedAt: string;
}

export interface ColorPickerState {
  currentColor: string | null;
  sessionId: string;
  history: SessionColor[];
}

export interface ColorPickerConfig {
  maxHistory: number;
  persistAcrossSessions: boolean;
  defaultHex: string;
}

export const COLOR_PRESETS: ColorPreset[] = [
  { name: "Ocean", hex: "#3B82F6", category: "cool" },
  { name: "Emerald", hex: "#10B981", category: "cool" },
  { name: "Violet", hex: "#8B5CF6", category: "cool" },
  { name: "Rose", hex: "#F43F5E", category: "warm" },
  { name: "Amber", hex: "#F59E0B", category: "warm" },
  { name: "Cyan", hex: "#06B6D4", category: "cool" },
  { name: "Lime", hex: "#84CC16", category: "vibrant" },
  { name: "Indigo", hex: "#6366F1", category: "cool" },
  { name: "Slate", hex: "#64748B", category: "neutral" },
  { name: "Zinc", hex: "#71717A", category: "neutral" },
  { name: "Orange", hex: "#F97316", category: "warm" },
  { name: "Teal", hex: "#14B8A6", category: "cool" },
  { name: "Pink", hex: "#EC4899", category: "warm" },
  { name: "Sky", hex: "#0EA5E9", category: "cool" },
  { name: "Red", hex: "#EF4444", category: "warm" },
  { name: "Default", hex: "#1E1E2E", category: "neutral" },
];

export const DEFAULT_SESSION_COLOR = "#1E1E2E";
