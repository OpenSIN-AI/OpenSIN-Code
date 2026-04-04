/**
 * Design Canvas Core — Visual design canvas that works in parallel with agent building
 */

import type {
  CanvasComponent,
  CanvasState,
  CanvasHistoryEntry,
  CanvasEvent,
  CanvasSyncEvent,
  DesignCanvasConfig,
} from "./types.js";
import { createComponentFromTemplate, findTemplateByType, COMPONENT_TEMPLATES } from "./components.js";

const DEFAULT_CONFIG: DesignCanvasConfig = {
  width: 1200,
  height: 800,
  gridSize: 8,
  showGrid: true,
  snapToGrid: true,
  zoomLevel: 1,
  theme: "light",
  autoSync: true,
  syncIntervalMs: 2000,
};

export class DesignCanvas {
  private config: DesignCanvasConfig;
  private state: CanvasState;
  private eventListeners: Map<string, Set<(event: CanvasEvent) => void>> = new Map();
  private syncListeners: Set<(event: CanvasSyncEvent) => void> = new Set();
  private syncTimer: ReturnType<typeof setInterval> | null = null;
  private componentCounter = 0;

  constructor(config: Partial<DesignCanvasConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.state = {
      components: new Map(),
      selectedIds: [],
      clipboard: [],
      history: [],
      historyIndex: -1,
      viewport: { x: 0, y: 0, zoom: this.config.zoomLevel },
      isDragging: false,
      isResizing: false,
      dragOffset: { x: 0, y: 0 },
    };

    if (this.config.autoSync) {
      this.startAutoSync();
    }
  }

  addComponent(type: string, x: number, y: number): CanvasComponent | null {
    const template = findTemplateByType(type);
    if (!template) return null;

    const component = createComponentFromTemplate(template, x, y);
    this.componentCounter++;

    if (this.config.snapToGrid) {
      component.x = Math.round(component.x / this.config.gridSize) * this.config.gridSize;
      component.y = Math.round(component.y / this.config.gridSize) * this.config.gridSize;
    }

    this.state.components.set(component.id, component);
    this.pushHistory("add", component.id, {}, component);
    this.emit({ type: "component:added", component });
    this.notifySync({ type: "component:added", componentId: component.id, component, timestamp: Date.now() });
    return component;
  }

  removeComponent(id: string): boolean {
    const component = this.state.components.get(id);
    if (!component) return false;

    this.state.components.delete(id);
    this.state.selectedIds = this.state.selectedIds.filter((sid) => sid !== id);

    for (const [, comp] of this.state.components) {
      comp.children = comp.children.filter((cid) => cid !== id);
    }

    this.pushHistory("remove", id, component, {});
    this.emit({ type: "component:removed", componentId: id });
    this.notifySync({ type: "component:removed", componentId: id, timestamp: Date.now() });
    return true;
  }

  moveComponent(id: string, x: number, y: number): boolean {
    const component = this.state.components.get(id);
    if (!component || component.locked) return false;

    const prevX = component.x;
    const prevY = component.y;

    if (this.config.snapToGrid) {
      component.x = Math.round(x / this.config.gridSize) * this.config.gridSize;
      component.y = Math.round(y / this.config.gridSize) * this.config.gridSize;
    } else {
      component.x = x;
      component.y = y;
    }

    component.updatedAt = Date.now();
    this.pushHistory("move", id, { x: prevX, y: prevY }, { x: component.x, y: component.y });
    this.emit({ type: "component:moved", componentId: id, x: component.x, y: component.y });
    return true;
  }

  resizeComponent(id: string, width: number, height: number): boolean {
    const component = this.state.components.get(id);
    if (!component || component.locked) return false;

    const prevWidth = component.width;
    const prevHeight = component.height;

    if (this.config.snapToGrid) {
      component.width = Math.max(16, Math.round(width / this.config.gridSize) * this.config.gridSize);
      component.height = Math.max(16, Math.round(height / this.config.gridSize) * this.config.gridSize);
    } else {
      component.width = Math.max(16, width);
      component.height = Math.max(16, height);
    }

    component.updatedAt = Date.now();
    this.pushHistory("resize", id, { width: prevWidth, height: prevHeight }, { width: component.width, height: component.height });
    this.emit({ type: "component:resized", componentId: id, width: component.width, height: component.height });
    return true;
  }

  updateComponent(id: string, updates: Partial<CanvasComponent>): boolean {
    const component = this.state.components.get(id);
    if (!component) return false;

    const prevState = { ...component };
    Object.assign(component, updates, { updatedAt: Date.now() });

    this.pushHistory("update", id, prevState, updates);
    this.emit({ type: "component:updated", component: { ...component } });
    return true;
  }

  updateComponentStyles(id: string, styles: Record<string, string>): boolean {
    const component = this.state.components.get(id);
    if (!component) return false;

    component.styles = { ...component.styles, ...styles };
    component.updatedAt = Date.now();
    this.emit({ type: "component:updated", component: { ...component } });
    return true;
  }

  updateComponentProperties(id: string, properties: Record<string, unknown>): boolean {
    const component = this.state.components.get(id);
    if (!component) return false;

    component.properties = { ...component.properties, ...properties };
    component.updatedAt = Date.now();
    this.emit({ type: "component:updated", component: { ...component } });
    return true;
  }

  selectComponent(id: string): void {
    if (!this.state.components.has(id)) return;
    if (!this.state.selectedIds.includes(id)) {
      this.state.selectedIds.push(id);
    }
    this.emit({ type: "component:selected", componentId: id });
  }

  deselectComponent(id: string): void {
    this.state.selectedIds = this.state.selectedIds.filter((sid) => sid !== id);
    this.emit({ type: "component:deselected", componentId: id });
  }

  selectAll(): void {
    this.state.selectedIds = Array.from(this.state.components.keys());
  }

  deselectAll(): void {
    this.state.selectedIds = [];
  }

  getSelectedComponents(): CanvasComponent[] {
    return this.state.selectedIds
      .map((id) => this.state.components.get(id))
      .filter((c): c is CanvasComponent => c !== undefined);
  }

  getComponent(id: string): CanvasComponent | undefined {
    return this.state.components.get(id);
  }

  getAllComponents(): CanvasComponent[] {
    return Array.from(this.state.components.values());
  }

  getComponentsByType(type: string): CanvasComponent[] {
    return this.getAllComponents().filter((c) => c.type === type);
  }

  copySelected(): void {
    this.state.clipboard = this.getSelectedComponents().map((c) => ({ ...c }));
  }

  pasteClipboard(x: number, y: number): CanvasComponent[] {
    const pasted: CanvasComponent[] = [];
    for (const comp of this.state.clipboard) {
      const newComp: CanvasComponent = {
        ...comp,
        id: `comp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        x: x + (comp.x - (this.state.clipboard[0]?.x ?? 0)),
        y: y + (comp.y - (this.state.clipboard[0]?.y ?? 0)),
        parentId: null,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      this.state.components.set(newComp.id, newComp);
      pasted.push(newComp);
      this.emit({ type: "component:added", component: newComp });
    }
    return pasted;
  }

  deleteSelected(): void {
    for (const id of this.state.selectedIds) {
      this.removeComponent(id);
    }
    this.state.selectedIds = [];
  }

  undo(): boolean {
    if (this.state.historyIndex < 0) return false;

    const entry = this.state.history[this.state.historyIndex];
    const component = this.state.components.get(entry.componentId);

    if (entry.type === "add" && component) {
      this.state.components.delete(entry.componentId);
    } else if (entry.type === "remove" && entry.previousState) {
      this.state.components.set(entry.componentId, {
        ...this.state.components.get(entry.componentId),
        ...entry.previousState,
      } as CanvasComponent);
    } else if (component && entry.previousState) {
      Object.assign(component, entry.previousState);
    }

    this.state.historyIndex--;
    this.emit({ type: "canvas:undo" });
    return true;
  }

  redo(): boolean {
    if (this.state.historyIndex >= this.state.history.length - 1) return false;

    this.state.historyIndex++;
    const entry = this.state.history[this.state.historyIndex];
    const component = this.state.components.get(entry.componentId);

    if (component) {
      Object.assign(component, entry.newState);
      component.updatedAt = Date.now();
    }

    this.emit({ type: "canvas:redo" });
    return true;
  }

  setZoom(zoom: number): void {
    this.state.viewport.zoom = Math.max(0.1, Math.min(5, zoom));
    this.config.zoomLevel = this.state.viewport.zoom;
    this.emit({ type: "canvas:zoom", zoom: this.state.viewport.zoom });
  }

  pan(dx: number, dy: number): void {
    this.state.viewport.x += dx;
    this.state.viewport.y += dy;
  }

  clear(): void {
    this.state.components.clear();
    this.state.selectedIds = [];
    this.state.history = [];
    this.state.historyIndex = -1;
    this.emit({ type: "canvas:cleared" });
    this.notifySync({ type: "canvas:cleared", timestamp: Date.now() });
  }

  exportJSON(): string {
    const data = {
      config: this.config,
      components: Array.from(this.state.components.entries()),
      viewport: this.state.viewport,
    };
    return JSON.stringify(data, null, 2);
  }

  importJSON(json: string): boolean {
    try {
      const data = JSON.parse(json);
      this.config = { ...this.config, ...data.config };
      this.state.components = new Map(data.components);
      this.state.viewport = data.viewport ?? this.state.viewport;
      return true;
    } catch {
      return false;
    }
  }

  on(eventType: string, listener: (event: CanvasEvent) => void): void {
    let listeners = this.eventListeners.get(eventType);
    if (!listeners) {
      listeners = new Set();
      this.eventListeners.set(eventType, listeners);
    }
    listeners.add(listener);
  }

  off(eventType: string, listener: (event: CanvasEvent) => void): void {
    this.eventListeners.get(eventType)?.delete(listener);
  }

  onSync(listener: (event: CanvasSyncEvent) => void): void {
    this.syncListeners.add(listener);
  }

  offSync(listener: (event: CanvasSyncEvent) => void): void {
    this.syncListeners.delete(listener);
  }

  getTemplates() {
    return COMPONENT_TEMPLATES;
  }

  getConfig(): DesignCanvasConfig {
    return { ...this.config };
  }

  getState(): CanvasState {
    return { ...this.state };
  }

  private pushHistory(
    type: CanvasHistoryEntry["type"],
    componentId: string,
    previousState: Partial<CanvasComponent>,
    newState: Partial<CanvasComponent>
  ): void {
    const entry: CanvasHistoryEntry = {
      type,
      componentId,
      previousState,
      newState,
      timestamp: Date.now(),
    };

    this.state.history = this.state.history.slice(0, this.state.historyIndex + 1);
    this.state.history.push(entry);
    this.state.historyIndex = this.state.history.length - 1;

    if (this.state.history.length > 100) {
      this.state.history = this.state.history.slice(-100);
      this.state.historyIndex = this.state.history.length - 1;
    }
  }

  private startAutoSync(): void {
    this.syncTimer = setInterval(() => {
      this.syncToCode();
    }, this.config.syncIntervalMs);
  }

  private syncToCode(): void {
    const components = this.getAllComponents();
    if (components.length === 0) return;

    let html = "";
    let css = "";

    for (const comp of components) {
      const template = findTemplateByType(comp.type);
      if (!template) continue;

      let code = template.codeTemplate;
      for (const [key, value] of Object.entries(comp.properties)) {
        code = code.replace(new RegExp(`\\{\\{${key}\\}\\}`, "g"), String(value));
      }

      const styleStr = Object.entries(comp.styles)
        .map(([k, v]) => `${k.replace(/([A-Z])/g, "-$1").toLowerCase()}: ${v}`)
        .join("; ");

      html += `<div id="${comp.id}" style="position:absolute;left:${comp.x}px;top:${comp.y}px;width:${comp.width}px;height:${comp.height}px;${styleStr}">${code}</div>\n`;
    }

    this.notifySync({
      type: "code:synced",
      generatedCode: html,
      timestamp: Date.now(),
    });
  }

  private emit(event: CanvasEvent): void {
    const listeners = this.eventListeners.get(event.type);
    listeners?.forEach((l) => l(event));
  }

  private notifySync(event: CanvasSyncEvent): void {
    this.syncListeners.forEach((l) => l(event));
  }
}
