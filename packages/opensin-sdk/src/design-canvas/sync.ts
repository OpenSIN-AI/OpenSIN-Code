/**
 * Design Canvas Sync — Sync with agent-generated code
 */

import type { CanvasComponent, CanvasSyncEvent, CanvasEvent } from "./types.js";
import { DesignCanvas } from "./canvas.js";
import { CanvasRenderer } from "./renderer.js";
import { findTemplateByType } from "./components.js";

export class CanvasSync {
  private canvas: DesignCanvas;
  private renderer: CanvasRenderer;
  private syncQueue: CanvasSyncEvent[] = [];
  private isSyncing = false;
  private lastSyncTime = 0;
  private onCodeUpdate?: (code: string) => void;
  private onComponentSync?: (component: CanvasComponent, code: string) => void;
  private syncInterval: ReturnType<typeof setInterval> | null = null;
  private debounceMs: number;

  constructor(canvas: DesignCanvas, renderer: CanvasRenderer, debounceMs = 500) {
    this.canvas = canvas;
    this.renderer = renderer;
    this.debounceMs = debounceMs;
    this.setupListeners();
  }

  setOnCodeUpdate(callback: (code: string) => void): void {
    this.onCodeUpdate = callback;
  }

  setOnComponentSync(callback: (component: CanvasComponent, code: string) => void): void {
    this.onComponentSync = callback;
  }

  startAutoSync(intervalMs = 2000): void {
    this.stopAutoSync();
    this.syncInterval = setInterval(() => {
      this.syncAll();
    }, intervalMs);
  }

  stopAutoSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  async syncAll(): Promise<void> {
    if (this.isSyncing) return;
    this.isSyncing = true;

    try {
      const components = this.canvas.getAllComponents();
      const fullHTML = this.renderer.generateFullHTML(components);

      this.lastSyncTime = Date.now();
      this.onCodeUpdate?.(fullHTML);

      this.canvas.emit({ type: "sync:complete", code: fullHTML } as CanvasEvent);
    } catch (error) {
      this.canvas.emit({ type: "sync:error", error: (error as Error).message } as CanvasEvent);
    } finally {
      this.isSyncing = false;
    }
  }

  async syncComponent(componentId: string): Promise<void> {
    const component = this.canvas.getComponent(componentId);
    if (!component) return;

    const rendered = this.renderer.getRenderedComponent(componentId);
    if (!rendered) return;

    const code = this.componentToCode(component);
    this.onComponentSync?.(component, code);

    this.syncQueue.push({
      type: "component:updated",
      componentId,
      component,
      timestamp: Date.now(),
    });

    this.debounceSync();
  }

  async importFromCode(code: string): Promise<boolean> {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(code, "text/html");
      const elements = doc.body.querySelectorAll("[data-component-id]");

      let imported = 0;
      for (const el of elements) {
        const htmlEl = el as HTMLElement;
        const id = htmlEl.getAttribute("data-component-id");
        const type = htmlEl.getAttribute("data-component-type");

        if (!id || !type) continue;

        const existing = this.canvas.getComponent(id);
        if (existing) {
          this.canvas.updateComponent(id, {
            properties: this.extractProperties(htmlEl, type),
            styles: this.extractStyles(htmlEl),
          });
        } else {
          const template = findTemplateByType(type);
          if (template) {
            this.canvas.addComponent(type, 0, 0);
          }
        }
        imported++;
      }

      return imported > 0;
    } catch {
      return false;
    }
  }

  async diffWithCode(code: string): Promise<{ added: string[]; removed: string[]; modified: string[] }> {
    const result = { added: [] as string[], removed: [] as string[], modified: [] as string[] };

    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(code, "text/html");
      const codeIds = new Set<string>();

      const elements = doc.body.querySelectorAll("[data-component-id]");
      for (const el of elements) {
        const id = (el as HTMLElement).getAttribute("data-component-id");
        if (id) codeIds.add(id);
      }

      const canvasIds = new Set(this.canvas.getAllComponents().map((c) => c.id));

      for (const id of codeIds) {
        if (!canvasIds.has(id)) {
          result.added.push(id);
        }
      }

      for (const id of canvasIds) {
        if (!codeIds.has(id)) {
          result.removed.push(id);
        }
      }

      for (const id of codeIds) {
        if (canvasIds.has(id)) {
          result.modified.push(id);
        }
      }
    } catch {
      /* ignore parse errors */
    }

    return result;
  }

  getSyncQueue(): CanvasSyncEvent[] {
    return [...this.syncQueue];
  }

  clearSyncQueue(): void {
    this.syncQueue = [];
  }

  getLastSyncTime(): number {
    return this.lastSyncTime;
  }

  isCurrentlySyncing(): boolean {
    return this.isSyncing;
  }

  private setupListeners(): void {
    this.canvas.on("component:added", () => this.debounceSync());
    this.canvas.on("component:removed", () => this.debounceSync());
    this.canvas.on("component:moved", () => this.debounceSync());
    this.canvas.on("component:resized", () => this.debounceSync());
    this.canvas.on("component:updated", () => this.debounceSync());
  }

  private debounceSync(): void {
    setTimeout(() => {
      if (!this.isSyncing) {
        this.syncAll();
      }
    }, this.debounceMs);
  }

  private componentToCode(component: CanvasComponent): string {
    const template = findTemplateByType(component.type);
    if (!template) return "";

    let html = template.codeTemplate;
    for (const [key, value] of Object.entries(component.properties)) {
      html = html.replace(new RegExp(`\\{\\{${key}\\}\\}`, "g"), String(value));
    }

    const styleStr = Object.entries(component.styles)
      .map(([k, v]) => `${this.camelToKebab(k)}: ${v}`)
      .join("; ");

    return `<div id="${component.id}" style="position:absolute;left:${component.x}px;top:${component.y}px;width:${component.width}px;height:${component.height}px;${styleStr}">${html}</div>`;
  }

  private extractProperties(element: HTMLElement, type: string): Record<string, unknown> {
    const template = findTemplateByType(type);
    if (!template) return {};

    const properties: Record<string, unknown> = {};
    for (const key of Object.keys(template.defaultProperties)) {
      const el = element.querySelector(`[data-prop="${key}"]`) || element;
      if (el.textContent) {
        properties[key] = el.textContent.trim();
      }
    }
    return properties;
  }

  private extractStyles(element: HTMLElement): Record<string, string> {
    const styles: Record<string, string> = {};
    const style = element.getAttribute("style");
    if (style) {
      style.split(";").forEach((rule) => {
        const [key, ...valueParts] = rule.split(":");
        if (key && valueParts.length) {
          styles[key.trim()] = valueParts.join(":").trim();
        }
      });
    }
    return styles;
  }

  private camelToKebab(str: string): string {
    return str.replace(/([A-Z])/g, "-$1").toLowerCase();
  }
}
