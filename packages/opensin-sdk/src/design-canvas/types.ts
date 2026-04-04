/**
 * Visual Design Canvas Types — Parallel design while agent builds like Replit/Bolt
 */

export interface DesignCanvasConfig {
  width: number;
  height: number;
  gridSize: number;
  showGrid: boolean;
  snapToGrid: boolean;
  zoomLevel: number;
  theme: "light" | "dark";
  autoSync: boolean;
  syncIntervalMs: number;
}

export interface CanvasComponent {
  id: string;
  type: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  zIndex: number;
  properties: Record<string, unknown>;
  styles: Record<string, string>;
  children: string[];
  parentId: string | null;
  locked: boolean;
  visible: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface CanvasState {
  components: Map<string, CanvasComponent>;
  selectedIds: string[];
  clipboard: CanvasComponent[];
  history: CanvasHistoryEntry[];
  historyIndex: number;
  viewport: { x: number; y: number; zoom: number };
  isDragging: boolean;
  isResizing: boolean;
  dragOffset: { x: number; y: number };
}

export interface CanvasHistoryEntry {
  type: "add" | "remove" | "move" | "resize" | "update" | "reorder";
  componentId: string;
  previousState?: Partial<CanvasComponent>;
  newState: Partial<CanvasComponent>;
  timestamp: number;
}

export interface ComponentTemplate {
  type: string;
  name: string;
  icon: string;
  category: string;
  defaultWidth: number;
  defaultHeight: number;
  defaultProperties: Record<string, unknown>;
  defaultStyles: Record<string, string>;
  codeTemplate: string;
}

export interface CanvasSyncEvent {
  type: "component:added" | "component:removed" | "component:moved" | "component:updated" | "canvas:cleared" | "code:synced";
  componentId?: string;
  component?: CanvasComponent;
  generatedCode?: string;
  timestamp: number;
}

export interface RenderedComponent {
  id: string;
  html: string;
  css: string;
  js: string;
  boundingBox: { x: number; y: number; width: number; height: number };
}

export type CanvasEvent =
  | { type: "component:added"; component: CanvasComponent }
  | { type: "component:removed"; componentId: string }
  | { type: "component:moved"; componentId: string; x: number; y: number }
  | { type: "component:resized"; componentId: string; width: number; height: number }
  | { type: "component:selected"; componentId: string }
  | { type: "component:deselected"; componentId: string }
  | { type: "component:updated"; component: CanvasComponent }
  | { type: "canvas:undo" }
  | { type: "canvas:redo" }
  | { type: "canvas:cleared" }
  | { type: "canvas:zoom"; zoom: number }
  | { type: "sync:started" }
  | { type: "sync:complete"; code: string }
  | { type: "sync:error"; error: string };
