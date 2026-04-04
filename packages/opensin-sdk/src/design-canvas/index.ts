/**
 * Visual Design Canvas — Parallel design while agent builds like Replit/Bolt
 *
 * Provides:
 * - Visual design canvas that works in parallel with agent building
 * - Drag-and-drop component placement
 * - Real-time preview
 * - Sync with agent-generated code
 */

export { DesignCanvas } from "./canvas.js";
export { CanvasRenderer } from "./renderer.js";
export { CanvasSync } from "./sync.js";
export { COMPONENT_TEMPLATES, createComponentFromTemplate, getTemplatesByCategory, getAllCategories, findTemplateByType } from "./components.js";

export type {
  DesignCanvasConfig,
  CanvasComponent,
  CanvasState,
  CanvasHistoryEntry,
  ComponentTemplate,
  CanvasSyncEvent,
  RenderedComponent,
  CanvasEvent,
} from "./types.js";
