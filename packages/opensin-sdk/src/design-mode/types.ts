/**
 * Design Mode Types — UI annotation for agents like Cursor/Replit
 */

export interface DesignModeConfig {
  annotationColor: string;
  annotationOpacity: number;
  annotationBorderWidth: number;
  highlightOnHover: boolean;
  showCoordinates: boolean;
  screenshotFallback: boolean;
  domInteractionPrimary: boolean;
  maxAnnotations: number;
  autoCollectStyles: boolean;
}

export interface UIElement {
  id: string;
  tagName: string;
  className: string | SVGAnimatedString;
  textContent: string | null;
  attributes: Record<string, string>;
  boundingRect: DOMRect;
  xpath: string;
  cssSelector: string;
  zIndex: number;
  isVisible: boolean;
  parentElement: UIElement | null;
  children: UIElement[];
  computedStyles?: Record<string, string>;
}

export interface Annotation {
  id: string;
  elementId: string;
  type: "highlight" | "comment" | "arrow" | "box" | "edit";
  position: { x: number; y: number };
  size: { width: number; height: number };
  content: string;
  color: string;
  createdAt: number;
  author: string;
  resolved: boolean;
  tags: string[];
}

export interface SelectionArea {
  id: string;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  elements: UIElement[];
  createdAt: number;
}

export interface FeedbackPayload {
  id: string;
  annotationId: string;
  type: "text" | "voice" | "screenshot" | "drawing";
  content: string;
  coordinates?: { x: number; y: number };
  screenshotData?: string;
  targetElement?: UIElement;
  timestamp: number;
  priority: "low" | "medium" | "high" | "critical";
  agentId?: string;
}

export interface CoordinateClick {
  x: number;
  y: number;
  element?: UIElement;
  timestamp: number;
  viewportWidth: number;
  viewportHeight: number;
}

export interface DesignModeState {
  isActive: boolean;
  mode: "select" | "annotate" | "feedback" | "inspect";
  annotations: Annotation[];
  selections: SelectionArea[];
  feedbackQueue: FeedbackPayload[];
  hoveredElement: UIElement | null;
  selectedElement: UIElement | null;
}

export interface AnnotationStyle {
  color: string;
  borderColor: string;
  borderWidth: number;
  opacity: number;
  labelFontSize: number;
  showLabel: boolean;
  pulseAnimation: boolean;
}

export interface ScreenshotFallback {
  imageData: string;
  viewportWidth: number;
  viewportHeight: number;
  scrollX: number;
  scrollY: number;
  devicePixelRatio: number;
  timestamp: number;
}

export type ElementSelector = "click" | "hover" | "xpath" | "css" | "coordinate";

export type DesignModeEvent =
  | { type: "mode:activated" }
  | { type: "mode:deactivated" }
  | { type: "mode:changed"; mode: DesignModeState["mode"] }
  | { type: "element:hovered"; element: UIElement }
  | { type: "element:selected"; element: UIElement }
  | { type: "annotation:created"; annotation: Annotation }
  | { type: "annotation:resolved"; annotationId: string }
  | { type: "annotation:deleted"; annotationId: string }
  | { type: "feedback:submitted"; feedback: FeedbackPayload }
  | { type: "selection:created"; selection: SelectionArea }
  | { type: "screenshot:captured"; screenshot: ScreenshotFallback };
