/**
 * Design Mode — UI annotation for agents like Cursor/Replit
 *
 * Provides:
 * - Annotate and target UI elements directly in browser
 * - Precise visual feedback to agents
 * - Screenshot-based coordinate clicking
 * - DOM interaction primary, screenshot fallback
 */

export { DesignMode, activateDesignMode, deactivateDesignMode, isDesignModeActive } from "./browser.js";
export { Annotator } from "./annotator.js";
export { Selector } from "./selector.js";
export { FeedbackCollector, sendFeedbackToAgent } from "./feedback.js";

export type {
  DesignModeConfig,
  UIElement,
  Annotation,
  SelectionArea,
  FeedbackPayload,
  CoordinateClick,
  DesignModeState,
  ElementSelector,
  AnnotationStyle,
  ScreenshotFallback,
  DesignModeEvent,
} from "./types.js";
