/**
 * Design Mode Element Selector — DOM interaction primary, screenshot fallback
 */

import type { UIElement, SelectionArea, CoordinateClick, ScreenshotFallback } from "./types.js";

export class Selector {
  private selections: Map<string, SelectionArea> = new Map();
  private selectionCounter = 0;
  private isSelecting = false;
  private startX = 0;
  private startY = 0;
  private selectionBox: HTMLElement | null = null;
  private onSelectCallback?: (element: UIElement) => void;
  private onSelectionAreaCallback?: (area: SelectionArea) => void;

  setOnSelect(callback: (element: UIElement) => void): void {
    this.onSelectCallback = callback;
  }

  setOnSelectionArea(callback: (area: SelectionArea) => void): void {
    this.onSelectionAreaCallback = callback;
  }

  startSelection(startX: number, startY: number): void {
    this.isSelecting = true;
    this.startX = startX;
    this.startY = startY;

    this.selectionBox = document.createElement("div");
    this.selectionBox.id = "opensin-selection-box";
    this.selectionBox.style.cssText = `
      position: fixed;
      left: ${startX}px;
      top: ${startY}px;
      border: 2px dashed #3b82f6;
      background: rgba(59, 130, 246, 0.1);
      pointer-events: none;
      z-index: 2147483646;
    `;
    document.body.appendChild(this.selectionBox);

    document.addEventListener("mousemove", this._onMouseMove);
    document.addEventListener("mouseup", this._onMouseUp);
  }

  private _onMouseMove = (e: MouseEvent): void => {
    if (!this.isSelecting || !this.selectionBox) return;

    const currentX = e.clientX;
    const currentY = e.clientY;

    const left = Math.min(this.startX, currentX);
    const top = Math.min(this.startY, currentY);
    const width = Math.abs(currentX - this.startX);
    const height = Math.abs(currentY - this.startY);

    this.selectionBox.style.left = `${left}px`;
    this.selectionBox.style.top = `${top}px`;
    this.selectionBox.style.width = `${width}px`;
    this.selectionBox.style.height = `${height}px`;
  };

  private _onMouseUp = (e: MouseEvent): void => {
    if (!this.isSelecting) return;
    this.isSelecting = false;

    document.removeEventListener("mousemove", this._onMouseMove);
    document.removeEventListener("mouseup", this._onMouseUp);

    if (this.selectionBox) {
      this.selectionBox.remove();
      this.selectionBox = null;
    }

    const endX = e.clientX;
    const endY = e.clientY;

    const left = Math.min(this.startX, endX);
    const top = Math.min(this.startY, endY);
    const right = Math.max(this.startX, endX);
    const bottom = Math.max(this.startY, endY);

    const selectionRect = { left, top, right, bottom };
    const elements = this.findElementsInRect(selectionRect);

    if (elements.length > 0) {
      this.selectionCounter++;
      const id = `selection-${this.selectionCounter}`;
      const selection: SelectionArea = {
        id,
        startX: this.startX,
        startY: this.startY,
        endX,
        endY,
        elements,
        createdAt: Date.now(),
      };
      this.selections.set(id, selection);
      this.onSelectionAreaCallback?.(selection);
    }
  }

  clickAtCoordinate(x: number, y: number): CoordinateClick {
    const click: CoordinateClick = {
      x,
      y,
      timestamp: Date.now(),
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight,
    };

    const elements = document.elementsFromPoint(x, y);
    for (const el of elements) {
      const htmlEl = el as HTMLElement;
      const uiElement = this.elementToUIElement(htmlEl);
      if (uiElement.isVisible) {
        click.element = uiElement;
        this.onSelectCallback?.(uiElement);
        break;
      }
    }

    return click;
  }

  selectElementAtPoint(x: number, y: number): UIElement | null {
    const elements = document.elementsFromPoint(x, y);
    for (const el of elements) {
      const htmlEl = el as HTMLElement;
      const uiElement = this.elementToUIElement(htmlEl);
      if (uiElement.isVisible) {
        this.onSelectCallback?.(uiElement);
        return uiElement;
      }
    }
    return null;
  }

  findElementsInRect(rect: { left: number; top: number; right: number; bottom: number }): UIElement[] {
    const elements: UIElement[] = [];
    const allElements = document.querySelectorAll("*");

    for (const el of allElements) {
      const htmlEl = el as HTMLElement;
      const rect_el = htmlEl.getBoundingClientRect();

      if (
        rect_el.right > rect.left &&
        rect_el.left < rect.right &&
        rect_el.bottom > rect.top &&
        rect_el.top < rect.bottom
      ) {
        const uiElement = this.elementToUIElement(htmlEl);
        if (uiElement.isVisible) {
          elements.push(uiElement);
        }
      }
    }

    return elements.sort((a, b) => {
      const areaA = a.boundingRect.width * a.boundingRect.height;
      const areaB = b.boundingRect.width * b.boundingRect.height;
      return areaA - areaB;
    });
  }

  elementToUIElement(element: HTMLElement): UIElement {
    const rect = element.getBoundingClientRect();
    const computedStyle = window.getComputedStyle(element);

    const styles: Record<string, string> = {};
    const importantProps = ["color", "background-color", "font-size", "font-family", "margin", "padding", "border", "display", "position"];
    for (const prop of importantProps) {
      styles[prop] = computedStyle.getPropertyValue(prop);
    }

    return {
      id: this.getElementId(element),
      tagName: element.tagName.toLowerCase(),
      className: element.className,
      textContent: element.textContent?.trim() || null,
      attributes: this.getElementAttributes(element),
      boundingRect: rect,
      xpath: this.getElementXPath(element),
      cssSelector: this.getElementCSSSelector(element),
      zIndex: parseInt(computedStyle.zIndex, 10) || 0,
      isVisible:
        computedStyle.display !== "none" &&
        computedStyle.visibility !== "hidden" &&
        computedStyle.opacity !== "0" &&
        rect.width > 0 &&
        rect.height > 0,
      parentElement: element.parentElement
        ? {
            id: element.parentElement.id || `el-${Date.now()}`,
            tagName: element.parentElement.tagName.toLowerCase(),
            className: element.parentElement.className,
            textContent: null,
            attributes: {},
            boundingRect: element.parentElement.getBoundingClientRect(),
            xpath: "",
            cssSelector: "",
            zIndex: 0,
            isVisible: true,
            parentElement: null,
            children: [],
          }
        : null,
      children: [],
      computedStyles: styles,
    };
  }

  captureScreenshot(): ScreenshotFallback {
    return {
      imageData: "",
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight,
      scrollX: window.scrollX,
      scrollY: window.scrollY,
      devicePixelRatio: window.devicePixelRatio || 1,
      timestamp: Date.now(),
    };
  }

  getSelections(): SelectionArea[] {
    return Array.from(this.selections.values());
  }

  clearSelections(): void {
    this.selections.clear();
    this.selectionCounter = 0;
  }

  private getElementId(element: HTMLElement): string {
    if (element.id) return `#${element.id}`;
    const parent = element.parentElement;
    if (!parent) return element.tagName.toLowerCase();
    const siblings = Array.from(parent.children).filter((c) => c.tagName === element.tagName);
    const index = siblings.indexOf(element);
    return `${element.tagName.toLowerCase()}[${index}]`;
  }

  private getElementAttributes(element: HTMLElement): Record<string, string> {
    const attrs: Record<string, string> = {};
    for (const attr of element.attributes) {
      attrs[attr.name] = attr.value;
    }
    return attrs;
  }

  private getElementXPath(element: HTMLElement): string {
    const parts: string[] = [];
    let current: HTMLElement | null = element;

    while (current && current.nodeType === Node.ELEMENT_NODE) {
      let index = 0;
      let sibling: Node | null = current.previousSibling;
      while (sibling) {
        if (sibling.nodeType === Node.ELEMENT_NODE && (sibling as Element).nodeName === current.nodeName) {
          index++;
        }
        sibling = sibling.previousSibling;
      }

      const tagName = current.nodeName.toLowerCase();
      const pathIndex = index > 0 ? `[${index + 1}]` : "";
      parts.unshift(`${tagName}${pathIndex}`);
      current = current.parentElement;
    }

    return "/" + parts.join("/");
  }

  private getElementCSSSelector(element: HTMLElement): string {
    const path: string[] = [];
    let current: HTMLElement | null = element;

    while (current && current.nodeType === Node.ELEMENT_NODE) {
      let selector = current.nodeName.toLowerCase();
      if (current.id) {
        selector += `#${current.id}`;
        path.unshift(selector);
        break;
      } else {
        const parent = current.parentElement;
        if (parent) {
          const siblings = Array.from(parent.children).filter((c) => c.tagName === current!.tagName);
          if (siblings.length > 1) {
            const index = siblings.indexOf(current) + 1;
            selector += `:nth-child(${index})`;
          }
        }
        path.unshift(selector);
      }
      current = current.parentElement;
    }

    return path.join(" > ");
  }
}
