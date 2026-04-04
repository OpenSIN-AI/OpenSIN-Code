/**
 * Design Mode Annotator — Annotate and target UI elements directly in browser
 */

import type { Annotation, UIElement, AnnotationStyle, DesignModeConfig } from "./types.js";

const DEFAULT_STYLE: AnnotationStyle = {
  color: "#3b82f6",
  borderColor: "#3b82f6",
  borderWidth: 2,
  opacity: 0.15,
  labelFontSize: 11,
  showLabel: true,
  pulseAnimation: true,
};

export class Annotator {
  private annotations = new Map<string, Annotation>();
  private overlayElements: HTMLElement[] = [];
  private style: AnnotationStyle;
  private config: DesignModeConfig;
  private annotationCounter = 0;

  constructor(config: Partial<DesignModeConfig> = {}) {
    this.config = {
      annotationColor: "#3b82f6",
      annotationOpacity: 0.15,
      annotationBorderWidth: 2,
      highlightOnHover: true,
      showCoordinates: true,
      screenshotFallback: true,
      domInteractionPrimary: true,
      maxAnnotations: 100,
      autoCollectStyles: true,
      ...config,
    };
    this.style = {
      color: this.config.annotationColor,
      borderColor: this.config.annotationColor,
      borderWidth: this.config.annotationBorderWidth,
      opacity: this.config.annotationOpacity,
      labelFontSize: 11,
      showLabel: true,
      pulseAnimation: true,
    };
  }

  highlightElement(element: UIElement, content?: string): Annotation {
    this.annotationCounter++;
    const annotation: Annotation = {
      id: `ann-${this.annotationCounter}`,
      elementId: element.id,
      type: "highlight",
      position: { x: element.boundingRect.left, y: element.boundingRect.top },
      size: { width: element.boundingRect.width, height: element.boundingRect.height },
      content: content ?? `${element.tagName}${element.textContent ? `: "${element.textContent.slice(0, 30)}"` : ""}`,
      color: this.style.color,
      createdAt: Date.now(),
      author: "opensin",
      resolved: false,
      tags: [],
    };

    this.annotations.set(annotation.id, annotation);
    this.renderAnnotation(annotation, element);
    return annotation;
  }

  addComment(element: UIElement, comment: string): Annotation {
    this.annotationCounter++;
    const annotation: Annotation = {
      id: `ann-${this.annotationCounter}`,
      elementId: element.id,
      type: "comment",
      position: { x: element.boundingRect.right + 8, y: element.boundingRect.top },
      size: { width: 200, height: 60 },
      content: comment,
      color: "#f59e0b",
      createdAt: Date.now(),
      author: "opensin",
      resolved: false,
      tags: ["comment"],
    };

    this.annotations.set(annotation.id, annotation);
    this.renderComment(annotation);
    return annotation;
  }

  addEditMarker(element: UIElement, editDescription: string): Annotation {
    this.annotationCounter++;
    const annotation: Annotation = {
      id: `ann-${this.annotationCounter}`,
      elementId: element.id,
      type: "edit",
      position: { x: element.boundingRect.left, y: element.boundingRect.top },
      size: { width: element.boundingRect.width, height: element.boundingRect.height },
      content: editDescription,
      color: "#10b981",
      createdAt: Date.now(),
      author: "opensin",
      resolved: false,
      tags: ["edit"],
    };

    this.annotations.set(annotation.id, annotation);
    this.renderEditMarker(annotation, element);
    return annotation;
  }

  resolveAnnotation(id: string): boolean {
    const ann = this.annotations.get(id);
    if (!ann) return false;
    ann.resolved = true;
    this.removeOverlay(id);
    return true;
  }

  deleteAnnotation(id: string): boolean {
    const deleted = this.annotations.delete(id);
    if (deleted) this.removeOverlay(id);
    return deleted;
  }

  getAnnotations(): Annotation[] {
    return Array.from(this.annotations.values());
  }

  getUnresolvedAnnotations(): Annotation[] {
    return this.getAnnotations().filter((a) => !a.resolved);
  }

  clearAll(): void {
    this.overlayElements.forEach((el) => el.remove());
    this.overlayElements = [];
    this.annotations.clear();
  }

  updateStyle(style: Partial<AnnotationStyle>): void {
    this.style = { ...this.style, ...style };
  }

  private renderAnnotation(annotation: Annotation, element: UIElement): void {
    const overlay = document.createElement("div");
    overlay.id = `opensin-ann-${annotation.id}`;
    overlay.setAttribute("data-annotation-id", annotation.id);
    overlay.style.cssText = `
      position: fixed;
      left: ${element.boundingRect.left}px;
      top: ${element.boundingRect.top}px;
      width: ${element.boundingRect.width}px;
      height: ${element.boundingRect.height}px;
      border: ${this.style.borderWidth}px solid ${this.style.borderColor};
      background: ${this.style.color}${Math.round(this.style.opacity * 255).toString(16).padStart(2, "0")};
      pointer-events: none;
      z-index: 2147483647;
      ${this.style.pulseAnimation ? "animation: opensin-pulse 2s infinite;" : ""}
    `;

    if (this.style.showLabel) {
      const label = document.createElement("div");
      label.style.cssText = `
        position: absolute;
        top: -20px;
        left: 0;
        background: ${this.style.color};
        color: white;
        font-size: ${this.style.labelFontSize}px;
        padding: 2px 6px;
        border-radius: 3px;
        white-space: nowrap;
        font-family: monospace;
      `;
      label.textContent = annotation.content;
      overlay.appendChild(label);
    }

    document.body.appendChild(overlay);
    this.overlayElements.push(overlay);
  }

  private renderComment(annotation: Annotation): void {
    const bubble = document.createElement("div");
    bubble.id = `opensin-ann-${annotation.id}`;
    bubble.setAttribute("data-annotation-id", annotation.id);
    bubble.style.cssText = `
      position: fixed;
      left: ${annotation.position.x}px;
      top: ${annotation.position.y}px;
      max-width: ${annotation.size.width}px;
      background: #fef3c7;
      border: 1px solid #f59e0b;
      border-radius: 6px;
      padding: 8px 12px;
      font-size: 12px;
      color: #92400e;
      z-index: 2147483647;
      box-shadow: 0 2px 8px rgba(0,0,0,0.15);
      font-family: system-ui, sans-serif;
    `;
    bubble.textContent = annotation.content;
    document.body.appendChild(bubble);
    this.overlayElements.push(bubble);
  }

  private renderEditMarker(annotation: Annotation, element: UIElement): void {
    const overlay = document.createElement("div");
    overlay.id = `opensin-ann-${annotation.id}`;
    overlay.setAttribute("data-annotation-id", annotation.id);
    overlay.style.cssText = `
      position: fixed;
      left: ${element.boundingRect.left}px;
      top: ${element.boundingRect.top}px;
      width: ${element.boundingRect.width}px;
      height: ${element.boundingRect.height}px;
      border: 2px dashed #10b981;
      background: rgba(16, 185, 129, 0.1);
      pointer-events: none;
      z-index: 2147483647;
    `;

    const label = document.createElement("div");
    label.style.cssText = `
      position: absolute;
      bottom: -18px;
      left: 0;
      background: #10b981;
      color: white;
      font-size: 10px;
      padding: 1px 5px;
      border-radius: 2px;
      white-space: nowrap;
      font-family: monospace;
    `;
    label.textContent = `EDIT: ${annotation.content}`;
    overlay.appendChild(label);

    document.body.appendChild(overlay);
    this.overlayElements.push(overlay);
  }

  private removeOverlay(id: string): void {
    const el = document.getElementById(`opensin-ann-${id}`);
    if (el) {
      el.remove();
      this.overlayElements = this.overlayElements.filter((e) => e !== el);
    }
  }
}
