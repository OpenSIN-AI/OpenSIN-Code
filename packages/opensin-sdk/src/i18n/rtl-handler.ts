import { Locale } from "./types.js";
import { I18nEngine } from "./engine.js";

export class RTLHandler {
  private engine: I18nEngine;

  constructor(engine: I18nEngine) {
    this.engine = engine;
  }

  isRTL(): boolean {
    return this.engine.isRTL();
  }

  getDirection(): "ltr" | "rtl" {
    return this.isRTL() ? "rtl" : "ltr";
  }

  applyDirection(element: HTMLElement): void {
    element.dir = this.getDirection();
    element.style.direction = this.getDirection();
    if (this.isRTL()) {
      element.classList.add("rtl");
      element.classList.remove("ltr");
    } else {
      element.classList.add("ltr");
      element.classList.remove("rtl");
    }
  }

  mirrorCSS(element: HTMLElement): void {
    if (!this.isRTL()) return;
    const style = element.style;
    const marginLeft = style.marginLeft;
    const marginRight = style.marginRight;
    style.marginLeft = marginRight;
    style.marginRight = marginLeft;
    const paddingLeft = style.paddingLeft;
    const paddingRight = style.paddingRight;
    style.paddingLeft = paddingRight;
    style.paddingRight = paddingLeft;
  }
}
