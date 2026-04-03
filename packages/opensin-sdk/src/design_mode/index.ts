export type {
  DesignModeConfig,
  UIElement,
  Annotation,
  SelectionArea,
  FeedbackPayload,
  CoordinateClick,
  DesignModeState,
  ElementSelector as ElementSelectorType,
  AnnotationStyle,
  ScreenshotFallback,
} from "./types.js";

export { UIAnnotator } from "./annotator.js";
export { ElementSelector } from "./selector.js";
export { FeedbackCollector, sendFeedbackToAgent } from "./feedback.js";

import type { DesignModeConfig } from "./types.js";
import { UIAnnotator } from "./annotator.js";

let activeInstance: UIAnnotator | null = null;

export class DesignMode {
  static activate(config?: Partial<DesignModeConfig>): UIAnnotator {
    if (!activeInstance) {
      activeInstance = new UIAnnotator(config);
    }
    activeInstance.activate();
    return activeInstance;
  }

  static deactivate(): void {
    activeInstance?.deactivate();
    activeInstance = null;
  }

  static isActive(): boolean {
    return activeInstance !== null;
  }
}

export function activateDesignMode(config?: Partial<DesignModeConfig>): UIAnnotator {
  return DesignMode.activate(config);
}

export function deactivateDesignMode(): void {
  DesignMode.deactivate();
}

export function isDesignModeActive(): boolean {
  return DesignMode.isActive();
}
