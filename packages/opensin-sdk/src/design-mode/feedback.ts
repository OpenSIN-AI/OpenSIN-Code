/**
 * Design Mode Feedback Collector — Precise visual feedback to agents
 */

import type { FeedbackPayload, UIElement, Annotation } from "./types.js";

export class FeedbackCollector {
  private feedbackQueue: FeedbackPayload[] = [];
  private feedbackCounter = 0;
  private onSubmitCallback?: (feedback: FeedbackPayload) => void;
  private onResolveCallback?: (feedbackId: string) => void;

  setOnSubmit(callback: (feedback: FeedbackPayload) => void): void {
    this.onSubmitCallback = callback;
  }

  setOnResolve(callback: (feedbackId: string) => void): void {
    this.onResolveCallback = callback;
  }

  submitTextFeedback(annotationId: string, content: string, targetElement?: UIElement, priority: FeedbackPayload["priority"] = "medium"): FeedbackPayload {
    this.feedbackCounter++;
    const feedback: FeedbackPayload = {
      id: `fb-${this.feedbackCounter}`,
      annotationId,
      type: "text",
      content,
      targetElement,
      timestamp: Date.now(),
      priority,
    };

    this.feedbackQueue.push(feedback);
    this.onSubmitCallback?.(feedback);
    return feedback;
  }

  submitScreenshotFeedback(annotationId: string, screenshotData: string, coordinates?: { x: number; y: number }, priority: FeedbackPayload["priority"] = "medium"): FeedbackPayload {
    this.feedbackCounter++;
    const feedback: FeedbackPayload = {
      id: `fb-${this.feedbackCounter}`,
      annotationId,
      type: "screenshot",
      content: "Screenshot feedback",
      screenshotData,
      coordinates,
      timestamp: Date.now(),
      priority,
    };

    this.feedbackQueue.push(feedback);
    this.onSubmitCallback?.(feedback);
    return feedback;
  }

  submitDrawingFeedback(annotationId: string, content: string, coordinates: { x: number; y: number }, priority: FeedbackPayload["priority"] = "medium"): FeedbackPayload {
    this.feedbackCounter++;
    const feedback: FeedbackPayload = {
      id: `fb-${this.feedbackCounter}`,
      annotationId,
      type: "drawing",
      content,
      coordinates,
      timestamp: Date.now(),
      priority,
    };

    this.feedbackQueue.push(feedback);
    this.onSubmitCallback?.(feedback);
    return feedback;
  }

  submitVoiceFeedback(annotationId: string, transcript: string, targetElement?: UIElement): FeedbackPayload {
    this.feedbackCounter++;
    const feedback: FeedbackPayload = {
      id: `fb-${this.feedbackCounter}`,
      annotationId,
      type: "voice",
      content: transcript,
      targetElement,
      timestamp: Date.now(),
      priority: "medium",
    };

    this.feedbackQueue.push(feedback);
    this.onSubmitCallback?.(feedback);
    return feedback;
  }

  sendToAgent(feedbackId: string, agentId: string): boolean {
    const feedback = this.feedbackQueue.find((f) => f.id === feedbackId);
    if (!feedback) return false;
    feedback.agentId = agentId;
    return true;
  }

  resolveFeedback(feedbackId: string): boolean {
    const idx = this.feedbackQueue.findIndex((f) => f.id === feedbackId);
    if (idx === -1) return false;
    this.feedbackQueue.splice(idx, 1);
    this.onResolveCallback?.(feedbackId);
    return true;
  }

  getFeedbackQueue(): FeedbackPayload[] {
    return [...this.feedbackQueue];
  }

  getPendingFeedback(): FeedbackPayload[] {
    return this.feedbackQueue.filter((f) => !f.agentId);
  }

  getFeedbackForAgent(agentId: string): FeedbackPayload[] {
    return this.feedbackQueue.filter((f) => f.agentId === agentId);
  }

  clearQueue(): void {
    this.feedbackQueue = [];
  }

  exportFeedbackForAgent(agentId?: string): Record<string, unknown>[] {
    const feedback = agentId ? this.getFeedbackForAgent(agentId) : this.getFeedbackQueue();
    return feedback.map((f) => ({
      id: f.id,
      type: f.type,
      content: f.content,
      coordinates: f.coordinates,
      targetElement: f.targetElement ? {
        tagName: f.targetElement.tagName,
        cssSelector: f.targetElement.cssSelector,
        xpath: f.targetElement.xpath,
        textContent: f.targetElement.textContent,
      } : null,
      priority: f.priority,
      timestamp: f.timestamp,
    }));
  }
}

export async function sendFeedbackToAgent(
  feedback: FeedbackPayload,
  agentEndpoint: string,
  authToken?: string
): Promise<boolean> {
  try {
    const response = await fetch(agentEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      },
      body: JSON.stringify({
        type: "design_feedback",
        feedback: {
          id: feedback.id,
          type: feedback.type,
          content: feedback.content,
          coordinates: feedback.coordinates,
          targetElement: feedback.targetElement ? {
            cssSelector: feedback.targetElement.cssSelector,
            xpath: feedback.targetElement.xpath,
          } : null,
          priority: feedback.priority,
          timestamp: feedback.timestamp,
        },
      }),
    });
    return response.ok;
  } catch {
    return false;
  }
}
