export interface UIElement {
  id: string;
  tagName: string;
  className: string;
  textContent: string | null;
  attributes: Record<string, string>;
  boundingRect: DOMRect;
  xpath: string;
  cssSelector: string;
  zIndex: number;
  isVisible: boolean;
  parentElement: UIElement | null;
  children: UIElement[];
}

export interface Annotation {
  id: string;
  elementId: string;
  label: string;
  description: string;
  color: string;
  boundingRect: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  createdAt: number;
  createdBy: string;
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
  annotationId?: string;
  elementId?: string;
  selectionId?: string;
  message: string;
  screenshot?: string;
  coordinates?: {
    x: number;
    y: number;
  };
  intent: "modify" | "fix" | "explain" | "create" | "delete";
  priority: "low" | "medium" | "high" | "critical";
  timestamp: number;
}

export interface CoordinateClick {
  x: number;
  y: number;
  element?: UIElement;
  screenshot: string;
  confidence: number;
}

export interface DesignModeState {
  isActive: boolean;
  annotations: Annotation[];
  selections: SelectionArea[];
  hoveredElement: UIElement | null;
  selectedElements: UIElement[];
  feedbackHistory: FeedbackPayload[];
}

export interface ElementSelector {
  css: string;
  xpath: string;
  text: string | null;
  role: string | null;
  ariaLabel: string | null;
}

export interface AnnotationStyle {
  borderColor: string;
  backgroundColor: string;
  borderWidth: number;
  labelColor: string;
  labelFontSize: number;
  showIndex: boolean;
  pulseAnimation: boolean;
}

export interface ScreenshotFallback {
  fullPageScreenshot: string;
  viewportScreenshot: string;
  elementScreenshots: Record<string, string>;
  coordinateMap: Map<string, { x: number; y: number }>;
  resolution: {
    width: number;
    height: number;
  };
}

export interface DesignModeConfig {
  shiftDragEnabled: boolean;
  cmdLShortcut: boolean;
  annotationStyle: AnnotationStyle;
  autoScreenshot: boolean;
  coordinateFallback: boolean;
  maxAnnotations: number;
  highlightOnHover: boolean;
}
