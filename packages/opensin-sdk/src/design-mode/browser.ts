/**
 * Design Mode Browser Integration — Screenshot-based coordinate clicking
 */

import type { UIElement, DesignModeState, DesignModeEvent, DesignModeConfig, ScreenshotFallback } from "./types.js";
import { Annotator } from "./annotator.js";
import { Selector } from "./selector.js";
import { FeedbackCollector } from "./feedback.js";

const DEFAULT_CONFIG: DesignModeConfig = {
  annotationColor: "#3b82f6",
  annotationOpacity: 0.15,
  annotationBorderWidth: 2,
  highlightOnHover: true,
  showCoordinates: true,
  screenshotFallback: true,
  domInteractionPrimary: true,
  maxAnnotations: 100,
  autoCollectStyles: true,
};

export class DesignMode {
  private config: DesignModeConfig;
  private state: DesignModeState;
  private annotator: Annotator;
  private selector: Selector;
  private feedbackCollector: FeedbackCollector;
  private eventListeners: Map<string, Set<(event: DesignModeEvent) => void>> = new Map();
  private hoverOverlay: HTMLElement | null = null;
  private coordinateTooltip: HTMLElement | null = null;
  private styleSheet: HTMLStyleElement | null = null;

  constructor(config: Partial<DesignModeConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.state = {
      isActive: false,
      mode: "select",
      annotations: [],
      selections: [],
      feedbackQueue: [],
      hoveredElement: null,
      selectedElement: null,
    };
    this.annotator = new Annotator(this.config);
    this.selector = new Selector();
    this.feedbackCollector = new FeedbackCollector();

    this.setupCallbacks();
  }

  get annotatorInstance(): Annotator {
    return this.annotator;
  }

  get selectorInstance(): Selector {
    return this.selector;
  }

  get feedbackInstance(): FeedbackCollector {
    return this.feedbackCollector;
  }

  activate(): void {
    if (this.state.isActive) return;
    this.state.isActive = true;
    this.injectStyles();
    this.setupEventListeners();
    this.emit({ type: "mode:activated" });
  }

  deactivate(): void {
    if (!this.state.isActive) return;
    this.state.isActive = false;
    this.removeEventListeners();
    this.removeStyles();
    this.clearHoverOverlay();
    this.clearCoordinateTooltip();
    this.emit({ type: "mode:deactivated" });
  }

  setMode(mode: DesignModeState["mode"]): void {
    this.state.mode = mode;
    this.emit({ type: "mode:changed", mode });
  }

  getState(): DesignModeState {
    return {
      ...this.state,
      annotations: this.annotator.getAnnotations(),
      selections: this.selector.getSelections(),
      feedbackQueue: this.feedbackCollector.getFeedbackQueue(),
    };
  }

  on(eventType: string, listener: (event: DesignModeEvent) => void): void {
    let listeners = this.eventListeners.get(eventType);
    if (!listeners) {
      listeners = new Set();
      this.eventListeners.set(eventType, listeners);
    }
    listeners.add(listener);
  }

  off(eventType: string, listener: (event: DesignModeEvent) => void): void {
    this.eventListeners.get(eventType)?.delete(listener);
  }

  captureScreenshot(): ScreenshotFallback {
    return this.selector.captureScreenshot();
  }

  private setupCallbacks(): void {
    this.selector.setOnSelect((element) => {
      this.state.selectedElement = element;
      this.emit({ type: "element:selected", element });
    });

    this.selector.setOnSelectionArea((area) => {
      this.state.selections.push(area);
      this.emit({ type: "selection:created", selection: area });
    });

    this.feedbackCollector.setOnSubmit((feedback) => {
      this.state.feedbackQueue.push(feedback);
      this.emit({ type: "feedback:submitted", feedback });
    });
  }

  private setupEventListeners(): void {
    document.addEventListener("mousemove", this._onMouseMove);
    document.addEventListener("click", this._onClick, true);
  }

  private removeEventListeners(): void {
    document.removeEventListener("mousemove", this._onMouseMove);
    document.removeEventListener("click", this._onClick, true);
  }

  private _onMouseMove = (e: MouseEvent): void => {
    if (!this.state.isActive) return;

    const elements = document.elementsFromPoint(e.clientX, e.clientY);
    for (const el of elements) {
      const htmlEl = el as HTMLElement;
      if (htmlEl.id?.startsWith("opensin-")) continue;

      const uiElement = this.selector.elementToUIElement(htmlEl);
      if (uiElement.isVisible) {
        if (this.state.hoveredElement?.id !== uiElement.id) {
          this.state.hoveredElement = uiElement;
          this.emit({ type: "element:hovered", element: uiElement });
        }
        this.updateHoverOverlay(uiElement);
        if (this.config.showCoordinates) {
          this.updateCoordinateTooltip(e.clientX, e.clientY);
        }
        break;
      }
    }
  };

  private _onClick = (e: MouseEvent): void => {
    if (!this.state.isActive) return;
    if ((e.target as HTMLElement).id?.startsWith("opensin-")) return;

    const click = this.selector.clickAtCoordinate(e.clientX, e.clientY);
    if (click.element) {
      this.state.selectedElement = click.element;
    }
  };

  private updateHoverOverlay(element: UIElement): void {
    if (!this.hoverOverlay) {
      this.hoverOverlay = document.createElement("div");
      this.hoverOverlay.id = "opensin-hover-overlay";
      this.hoverOverlay.style.cssText = `
        position: fixed;
        pointer-events: none;
        z-index: 2147483645;
        border: 1px solid rgba(59, 130, 246, 0.5);
        background: rgba(59, 130, 246, 0.05);
        transition: all 0.1s ease;
      `;
      document.body.appendChild(this.hoverOverlay);
    }

    this.hoverOverlay.style.left = `${element.boundingRect.left}px`;
    this.hoverOverlay.style.top = `${element.boundingRect.top}px`;
    this.hoverOverlay.style.width = `${element.boundingRect.width}px`;
    this.hoverOverlay.style.height = `${element.boundingRect.height}px`;
  }

  private updateCoordinateTooltip(x: number, y: number): void {
    if (!this.coordinateTooltip) {
      this.coordinateTooltip = document.createElement("div");
      this.coordinateTooltip.id = "opensin-coordinate-tooltip";
      this.coordinateTooltip.style.cssText = `
        position: fixed;
        pointer-events: none;
        z-index: 2147483647;
        background: rgba(0, 0, 0, 0.8);
        color: white;
        font-size: 11px;
        font-family: monospace;
        padding: 4px 8px;
        border-radius: 4px;
        white-space: nowrap;
      `;
      document.body.appendChild(this.coordinateTooltip);
    }

    this.coordinateTooltip.textContent = `(${x}, ${y})`;
    this.coordinateTooltip.style.left = `${x + 15}px`;
    this.coordinateTooltip.style.top = `${y + 15}px`;
  }

  private clearHoverOverlay(): void {
    if (this.hoverOverlay) {
      this.hoverOverlay.remove();
      this.hoverOverlay = null;
    }
  }

  private clearCoordinateTooltip(): void {
    if (this.coordinateTooltip) {
      this.coordinateTooltip.remove();
      this.coordinateTooltip = null;
    }
  }

  private injectStyles(): void {
    if (this.styleSheet) return;
    this.styleSheet = document.createElement("style");
    this.styleSheet.id = "opensin-design-mode-styles";
    this.styleSheet.textContent = `
      @keyframes opensin-pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.7; }
      }
      body.opensin-design-mode * {
        cursor: crosshair !important;
      }
    `;
    document.head.appendChild(this.styleSheet);
    document.body.classList.add("opensin-design-mode");
  }

  private removeStyles(): void {
    if (this.styleSheet) {
      this.styleSheet.remove();
      this.styleSheet = null;
    }
    document.body.classList.remove("opensin-design-mode");
  }

  private emit(event: DesignModeEvent): void {
    const listeners = this.eventListeners.get(event.type);
    listeners?.forEach((l) => l(event));
  }
}

export function activateDesignMode(config?: Partial<DesignModeConfig>): DesignMode {
  const dm = new DesignMode(config);
  dm.activate();
  return dm;
}

export function deactivateDesignMode(dm: DesignMode): void {
  dm.deactivate();
}

export function isDesignModeActive(dm: DesignMode): boolean {
  return dm.getState().isActive;
}
