/**
 * Design Canvas Renderer — Real-time preview of canvas components
 */

import type { CanvasComponent, RenderedComponent } from "./types.js";
import { findTemplateByType } from "./components.js";

export class CanvasRenderer {
  private container: HTMLElement | null = null;
  private renderedComponents = new Map<string, RenderedComponent>();
  private styleElement: HTMLStyleElement | null = null;
  private animationFrame: number | null = null;
  private needsRender = false;

  attach(container: HTMLElement): void {
    this.container = container;
    this.injectBaseStyles();
  }

  detach(): void {
    if (this.styleElement) {
      this.styleElement.remove();
      this.styleElement = null;
    }
    if (this.container) {
      this.container.innerHTML = "";
      this.container = null;
    }
    this.renderedComponents.clear();
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }
  }

  renderComponent(component: CanvasComponent): RenderedComponent {
    const template = findTemplateByType(component.type);
    if (!template) {
      return this.renderFallback(component);
    }

    let html = template.codeTemplate;
    for (const [key, value] of Object.entries(component.properties)) {
      html = html.replace(new RegExp(`\\{\\{${key}\\}\\}`, "g"), String(value));
    }

    const styleEntries = Object.entries(component.styles);
    const cssProps = styleEntries
      .map(([k, v]) => `${this.camelToKebab(k)}: ${v}`)
      .join("; ");

    const css = `
      [data-component-id="${component.id}"] {
        ${cssProps}
      }
    `;

    const rendered: RenderedComponent = {
      id: component.id,
      html,
      css,
      js: "",
      boundingBox: {
        x: component.x,
        y: component.y,
        width: component.width,
        height: component.height,
      },
    };

    this.renderedComponents.set(component.id, rendered);
    this.scheduleRender();
    return rendered;
  }

  renderAll(components: CanvasComponent[]): void {
    if (!this.container) return;

    let html = "";
    let css = "";

    const sorted = [...components].sort((a, b) => a.zIndex - b.zIndex);

    for (const comp of sorted) {
      if (!comp.visible) continue;

      const template = findTemplateByType(comp.type);
      if (!template) continue;

      let compHtml = template.codeTemplate;
      for (const [key, value] of Object.entries(comp.properties)) {
        compHtml = compHtml.replace(new RegExp(`\\{\\{${key}\\}\\}`, "g"), String(value));
      }

      const styleStr = Object.entries(comp.styles)
        .map(([k, v]) => `${this.camelToKebab(k)}: ${v}`)
        .join("; ");

      const wrapperStyle = `position:absolute;left:${comp.x}px;top:${comp.y}px;width:${comp.width}px;height:${comp.height}px;z-index:${comp.zIndex};${comp.rotation ? `transform:rotate(${comp.rotation}deg);` : ""}`;

      html += `<div data-component-id="${comp.id}" data-component-type="${comp.type}" style="${wrapperStyle}">${compHtml}</div>\n`;

      const rendered: RenderedComponent = {
        id: comp.id,
        html: compHtml,
        css: `[data-component-id="${comp.id}"] { ${styleStr} }`,
        js: "",
        boundingBox: { x: comp.x, y: comp.y, width: comp.width, height: comp.height },
      };
      this.renderedComponents.set(comp.id, rendered);
    }

    this.container.innerHTML = html;
    this.updateStyles(css);
  }

  updateComponent(component: CanvasComponent): void {
    if (!this.container) return;

    const el = this.container.querySelector(`[data-component-id="${component.id}"]`) as HTMLElement;
    if (!el) {
      this.renderComponent(component);
      return;
    }

    el.style.left = `${component.x}px`;
    el.style.top = `${component.y}px`;
    el.style.width = `${component.width}px`;
    el.style.height = `${component.height}px`;
    el.style.zIndex = `${component.zIndex}`;

    if (component.rotation) {
      el.style.transform = `rotate(${component.rotation}deg)`;
    }

    for (const [key, value] of Object.entries(component.styles)) {
      (el.style as any)[this.kebabToCamel(key)] = value;
    }

    const template = findTemplateByType(component.type);
    if (template) {
      let innerHtml = template.codeTemplate;
      for (const [key, value] of Object.entries(component.properties)) {
        innerHtml = innerHtml.replace(new RegExp(`\\{\\{${key}\\}\\}`, "g"), String(value));
      }
      el.innerHTML = innerHtml;
    }

    const rendered: RenderedComponent = {
      id: component.id,
      html: el.innerHTML,
      css: "",
      js: "",
      boundingBox: { x: component.x, y: component.y, width: component.width, height: component.height },
    };
    this.renderedComponents.set(component.id, rendered);
  }

  removeComponent(id: string): void {
    if (!this.container) return;
    const el = this.container.querySelector(`[data-component-id="${id}"]`);
    if (el) el.remove();
    this.renderedComponents.delete(id);
  }

  getRenderedComponent(id: string): RenderedComponent | undefined {
    return this.renderedComponents.get(id);
  }

  getAllRendered(): RenderedComponent[] {
    return Array.from(this.renderedComponents.values());
  }

  generateFullHTML(components: CanvasComponent[]): string {
    let html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: system-ui, -apple-system, sans-serif; }
    .canvas-container { position: relative; width: ${this.container?.offsetWidth ?? 1200}px; height: ${this.container?.offsetHeight ?? 800}px; }
`;

    for (const comp of components) {
      const styleStr = Object.entries(comp.styles)
        .map(([k, v]) => `  ${this.camelToKebab(k)}: ${v}`)
        .join(";\n");

      html += `  [data-component-id="${comp.id}"] {\n    position: absolute;\n    left: ${comp.x}px;\n    top: ${comp.y}px;\n    width: ${comp.width}px;\n    height: ${comp.height}px;\n    z-index: ${comp.zIndex};\n${styleStr};\n  }\n`;
    }

    html += `  </style>
</head>
<body>
  <div class="canvas-container">
`;

    const sorted = [...components].sort((a, b) => a.zIndex - b.zIndex);
    for (const comp of sorted) {
      if (!comp.visible) continue;
      const template = findTemplateByType(comp.type);
      if (!template) continue;

      let innerHtml = template.codeTemplate;
      for (const [key, value] of Object.entries(comp.properties)) {
        innerHtml = innerHtml.replace(new RegExp(`\\{\\{${key}\\}\\}`, "g"), String(value));
      }

      html += `    <div data-component-id="${comp.id}" data-component-type="${comp.type}">${innerHtml}</div>\n`;
    }

    html += `  </div>
</body>
</html>`;

    return html;
  }

  private renderFallback(component: CanvasComponent): RenderedComponent {
    const html = `<div style="padding:8px;background:#f3f4f6;border:1px dashed #9ca3af;border-radius:4px;">${component.name}</div>`;
    const rendered: RenderedComponent = {
      id: component.id,
      html,
      css: "",
      js: "",
      boundingBox: { x: component.x, y: component.y, width: component.width, height: component.height },
    };
    this.renderedComponents.set(component.id, rendered);
    return rendered;
  }

  private scheduleRender(): void {
    if (this.animationFrame) return;
    this.needsRender = true;
    this.animationFrame = requestAnimationFrame(() => {
      this.animationFrame = null;
      if (this.needsRender && this.container) {
        this.needsRender = false;
      }
    });
  }

  private injectBaseStyles(): void {
    if (this.styleElement) return;
    this.styleElement = document.createElement("style");
    this.styleElement.id = "opensin-canvas-styles";
    this.styleElement.textContent = `
      [data-component-id] {
        transition: box-shadow 0.15s ease;
      }
      [data-component-id]:hover {
        outline: 2px solid #3b82f6;
        outline-offset: 2px;
      }
      [data-component-id].selected {
        outline: 2px solid #3b82f6;
        outline-offset: 2px;
      }
    `;
    document.head.appendChild(this.styleElement);
  }

  private updateStyles(css: string): void {
    if (!this.styleElement) return;
    this.styleElement.textContent += css;
  }

  private camelToKebab(str: string): string {
    return str.replace(/([A-Z])/g, "-$1").toLowerCase();
  }

  private kebabToCamel(str: string): string {
    return str.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
  }
}
