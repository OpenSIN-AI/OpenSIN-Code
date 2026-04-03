import type {
  Annotation,
  AnnotationStyle,
  DesignModeConfig,
  UIElement,
} from "./types.js";

const DEFAULT_STYLE: AnnotationStyle = {
  borderColor: "#3b82f6",
  backgroundColor: "rgba(59, 130, 246, 0.1)",
  borderWidth: 2,
  labelColor: "#ffffff",
  labelFontSize: 12,
  showIndex: true,
  pulseAnimation: true,
};

const DEFAULT_CONFIG: DesignModeConfig = {
  shiftDragEnabled: true,
  cmdLShortcut: true,
  annotationStyle: DEFAULT_STYLE,
  autoScreenshot: true,
  coordinateFallback: true,
  maxAnnotations: 50,
  highlightOnHover: true,
};

export class UIAnnotator {
  private config: DesignModeConfig;
  private annotations: Map<string, Annotation> = new Map();
  private overlay: HTMLElement | null = null;
  private annotationCounter = 0;

  constructor(config?: Partial<DesignModeConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  activate(): void {
    if (this.overlay) return;
    this.createOverlay();
    this.bindKeyboardShortcuts();
    this.bindMouseEvents();
  }

  deactivate(): void {
    if (!this.overlay) return;
    this.overlay.remove();
    this.overlay = null;
    this.unbindKeyboardShortcuts();
    this.unbindMouseEvents();
  }

  annotateElement(element: Element, label: string, description: string = ""): Annotation | null {
    if (this.annotations.size >= this.config.maxAnnotations) {
      console.warn("[DesignMode] Max annotations reached");
      return null;
    }

    const rect = element.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return null;

    this.annotationCounter++;
    const id = `annotation-${this.annotationCounter}`;
    const annotation: Annotation = {
      id,
      elementId: this.getElementId(element),
      label,
      description,
      color: this.config.annotationStyle.borderColor,
      boundingRect: {
        x: rect.x,
        y: rect.y,
        width: rect.width,
        height: rect.height,
      },
      createdAt: Date.now(),
      createdBy: "user",
    };

    this.annotations.set(id, annotation);
    this.renderAnnotation(annotation);
    return annotation;
  }

  removeAnnotation(id: string): boolean {
    const annotation = this.annotations.get(id);
    if (!annotation) return false;

    const el = document.getElementById(id);
    if (el) el.remove();

    this.annotations.delete(id);
    return true;
  }

  clearAnnotations(): void {
    for (const id of this.annotations.keys()) {
      const el = document.getElementById(id);
      if (el) el.remove();
    }
    this.annotations.clear();
    this.annotationCounter = 0;
  }

  getAnnotations(): Annotation[] {
    return Array.from(this.annotations.values());
  }

  getAnnotationsForExport(): Record<string, unknown>[] {
    return this.getAnnotations().map((a) => ({
      id: a.id,
      label: a.label,
      description: a.description,
      element: a.elementId,
      position: a.boundingRect,
    }));
  }

  private createOverlay(): void {
    this.overlay = document.createElement("div");
    this.overlay.id = "opensin-design-mode-overlay";
    this.overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 2147483647;
    `;
    document.body.appendChild(this.overlay);
  }

  private renderAnnotation(annotation: Annotation): void {
    if (!this.overlay) return;

    const el = document.createElement("div");
    el.id = annotation.id;
    el.style.cssText = `
      position: absolute;
      left: ${annotation.boundingRect.x}px;
      top: ${annotation.boundingRect.y}px;
      width: ${annotation.boundingRect.width}px;
      height: ${annotation.boundingRect.height}px;
      border: ${this.config.annotationStyle.borderWidth}px solid ${this.config.annotationStyle.borderColor};
      background: ${this.config.annotationStyle.backgroundColor};
      pointer-events: auto;
      cursor: pointer;
      ${this.config.annotationStyle.pulseAnimation ? "animation: opensin-pulse 2s infinite;" : ""}
    `;

    const label = document.createElement("div");
    label.style.cssText = `
      position: absolute;
      top: -24px;
      left: 0;
      background: ${this.config.annotationStyle.borderColor};
      color: ${this.config.annotationStyle.labelColor};
      font-size: ${this.config.annotationStyle.labelFontSize}px;
      padding: 2px 6px;
      border-radius: 3px;
      white-space: nowrap;
      font-family: system-ui, sans-serif;
    `;
    const index = this.config.annotationStyle.showIndex
      ? `#${this.annotationCounter} `
      : "";
    label.textContent = `${index}${annotation.label}`;
    el.appendChild(label);

    this.overlay.appendChild(el);
  }

  private getElementId(element: Element): string {
    if (element.id) return `#${element.id}`;
    const parent = element.parentElement;
    if (!parent) return element.tagName.toLowerCase();
    const siblings = Array.from(parent.children).filter(
      (c) => c.tagName === element.tagName
    );
    const index = siblings.indexOf(element as HTMLElement);
    return `${element.tagName.toLowerCase()}[${index}]`;
  }

  private bindKeyboardShortcuts(): void {
    this._keyHandler = (e: KeyboardEvent) => {
      if (e.metaKey && e.key === "l") {
        e.preventDefault();
        this.handleCmdL();
      }
    };
    document.addEventListener("keydown", this._keyHandler);
  }

  private unbindKeyboardShortcuts(): void {
    if (this._keyHandler) {
      document.removeEventListener("keydown", this._keyHandler);
    }
  }

  private bindMouseEvents(): void {
    this._mouseMoveHandler = (e: MouseEvent) => {
      if (this.config.highlightOnHover) {
        this.highlightElementAtPoint(e.clientX, e.clientY);
      }
    };
    this._mouseDownHandler = (e: MouseEvent) => {
      if (e.shiftKey && this.config.shiftDragEnabled) {
        e.preventDefault();
        this.startSelection(e.clientX, e.clientY);
      }
    };
    document.addEventListener("mousemove", this._mouseMoveHandler);
    document.addEventListener("mousedown", this._mouseDownHandler);
  }

  private unbindMouseEvents(): void {
    if (this._mouseMoveHandler) {
      document.removeEventListener("mousemove", this._mouseMoveHandler);
    }
    if (this._mouseDownHandler) {
      document.removeEventListener("mousedown", this._mouseDownHandler);
    }
  }

  private highlightElementAtPoint(_x: number, _y: number): void {
    document.querySelectorAll(".opensin-hover-highlight").forEach((el) => {
      (el as HTMLElement).style.outline = "";
      el.classList.remove("opensin-hover-highlight");
    });
  }

  private startSelection(_startX: number, _startY: number): void {
    // Selection handled by ElementSelector
  }

  private handleCmdL(): void {
    const selection = window.getSelection();
    if (selection && selection.toString()) {
      console.log("[DesignMode] Cmd+L: Selected text:", selection.toString());
    }
  }

  private _keyHandler: ((e: KeyboardEvent) => void) | null = null;
  private _mouseMoveHandler: ((e: MouseEvent) => void) | null = null;
  private _mouseDownHandler: ((e: MouseEvent) => void) | null = null;
}
