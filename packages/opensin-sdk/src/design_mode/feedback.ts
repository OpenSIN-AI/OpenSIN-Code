import type { FeedbackPayload, UIElement, Annotation, CoordinateClick } from "./types.js";

export class FeedbackCollector {
  private feedbackHistory: FeedbackPayload[] = [];
  private screenshotCache: Map<string, string> = new Map();

  async collectFeedback(payload: Omit<FeedbackPayload, "timestamp">): Promise<FeedbackPayload> {
    const feedback: FeedbackPayload = {
      ...payload,
      timestamp: Date.now(),
    };
    this.feedbackHistory.push(feedback);
    return feedback;
  }

  async captureScreenshot(element?: UIElement): Promise<string> {
    const cacheKey = element?.id || "viewport";
    if (this.screenshotCache.has(cacheKey)) {
      return this.screenshotCache.get(cacheKey)!;
    }

    try {
      const canvas = document.createElement("canvas");
      if (element) {
        canvas.width = element.boundingRect.width;
        canvas.height = element.boundingRect.height;
      } else {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
      }
      const dataUrl = canvas.toDataURL("image/png");
      this.screenshotCache.set(cacheKey, dataUrl);
      return dataUrl;
    } catch {
      return "";
    }
  }

  async coordinateClickFallback(x: number, y: number): Promise<CoordinateClick> {
    const element = document.elementFromPoint(x, y);
    const screenshot = await this.captureScreenshot();

    if (!element || !(element instanceof HTMLElement)) {
      return { x, y, screenshot, confidence: 0 };
    }

    const uiElement = this.elementToUIElement(element);
    return {
      x,
      y,
      element: uiElement,
      screenshot,
      confidence: 0.85,
    };
  }

  formatFeedbackForAgent(feedback: FeedbackPayload): string {
    const lines = [
      `Target: ${feedback.elementId || feedback.annotationId || "unknown"}`,
      `Intent: ${feedback.intent}`,
      `Priority: ${feedback.priority}`,
      `Message: ${feedback.message}`,
    ];

    if (feedback.coordinates) {
      lines.push(`Coordinates: (${feedback.coordinates.x}, ${feedback.coordinates.y})`);
    }

    if (feedback.screenshot) {
      lines.push("Screenshot: [attached]");
    }

    return lines.join("\n");
  }

  getHistory(): FeedbackPayload[] {
    return [...this.feedbackHistory];
  }

  clearHistory(): void {
    this.feedbackHistory = [];
    this.screenshotCache.clear();
  }

  private elementToUIElement(el: HTMLElement): UIElement {
    const rect = el.getBoundingClientRect();
    return {
      id: el.id || `el-${Date.now()}`,
      tagName: el.tagName.toLowerCase(),
      className: typeof el.className === "string" ? el.className : "",
      textContent: el.textContent?.trim() || null,
      attributes: Array.from(el.attributes).reduce(
        (acc, attr) => ({ ...acc, [attr.name]: attr.value }),
        {} as Record<string, string>,
      ),
      boundingRect: rect,
      xpath: "",
      cssSelector: "",
      zIndex: 0,
      isVisible: rect.width > 0 && rect.height > 0,
      parentElement: null,
      children: [],
    };
  }
}

export async function sendFeedbackToAgent(
  feedback: FeedbackPayload,
  agentEndpoint?: string,
): Promise<boolean> {
  if (!agentEndpoint) {
    console.log("[DesignMode] Feedback queued:", feedback.message);
    return true;
  }

  try {
    const response = await fetch(agentEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(feedback),
    });
    return response.ok;
  } catch {
    return false;
  }
}
