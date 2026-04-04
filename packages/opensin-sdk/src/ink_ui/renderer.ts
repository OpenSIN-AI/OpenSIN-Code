/**
 * OpenSIN Terminal Renderer — Frame-Based Rendering
 *
 * Renders UI components to the terminal using a frame buffer
 * with diff-based updates for efficient rendering.
 */

import type {
  FrameBuffer,
  RenderContext,
  RenderResult,
  Position,
  Dimensions,
  UIComponent,
  Style,
  TerminalState,
} from './types.js';

const ESC = '\x1b[';
const RESET = `${ESC}0m`;
const CURSOR_HOME = `${ESC}H`;
const CLEAR_SCREEN = `${ESC}2J`;
const HIDE_CURSOR = `${ESC}?25l`;
const SHOW_CURSOR = `${ESC}?25h`;
const ALT_SCREEN_ENTER = `${ESC}?1049h`;
const ALT_SCREEN_EXIT = `${ESC}?1049l`;

const COLORS: Record<string, string> = {
  black: '30', red: '31', green: '32', yellow: '33',
  blue: '34', magenta: '35', cyan: '36', white: '37',
  gray: '90', brightRed: '91', brightGreen: '92',
  brightYellow: '93', brightBlue: '94', brightMagenta: '95',
  brightCyan: '96', brightWhite: '97',
};

const BG_COLORS: Record<string, string> = {
  black: '40', red: '41', green: '42', yellow: '43',
  blue: '44', magenta: '45', cyan: '46', white: '47',
  gray: '100',
};

export class TerminalRenderer {
  private frontBuffer: FrameBuffer | null;
  private backBuffer: FrameBuffer;
  private frameCount: number;
  private terminalState: TerminalState;

  constructor() {
    this.frontBuffer = null;
    this.backBuffer = this.createBuffer(80, 24);
    this.frameCount = 0;
    this.terminalState = {
      dimensions: { width: 80, height: 24 },
      cursorVisible: true,
      altScreen: false,
      mouseTracking: false,
    };
  }

  render(component: UIComponent, context: RenderContext): RenderResult {
    this.frameCount++;
    const dims = context.dimensions || this.terminalState.dimensions;

    this.backBuffer = this.createBuffer(dims.width, dims.height);
    this.renderComponent(component, 0, 0, dims.width, dims.height, this.backBuffer, context);

    const patches = this.diffBuffers(this.frontBuffer, this.backBuffer);
    this.frontBuffer = this.cloneBuffer(this.backBuffer);

    const output = this.buildOutput(patches);

    return {
      output,
      patches,
      cursorPosition: { ...this.backBuffer.cursor },
      dimensions: { width: dims.width, height: dims.height },
    };
  }

  private renderComponent(
    component: UIComponent,
    x: number,
    y: number,
    maxWidth: number,
    maxHeight: number,
    buffer: FrameBuffer,
    context: RenderContext
  ): void {
    const output = component.render(context);
    const lines = output.split('\n');

    for (let row = 0; row < lines.length && y + row < maxHeight; row++) {
      const line = lines[row];
      for (let col = 0; col < line.length && x + col < maxWidth; col++) {
        this.setCell(buffer, x + col, y + row, line[col], component.style || {});
      }
    }

    if (component.children) {
      let childY = y + lines.length;
      for (const child of component.children) {
        this.renderComponent(child, x, childY, maxWidth, maxHeight, buffer, context);
        childY += 1;
      }
    }
  }

  private createBuffer(width: number, height: number): FrameBuffer {
    const cells: string[][] = [];
    const styles: Style[][] = [];
    for (let y = 0; y < height; y++) {
      cells[y] = new Array(width).fill(' ');
      styles[y] = new Array(width).fill({});
    }
    return { cells, styles, width, height, cursor: { x: 0, y: 0 } };
  }

  private cloneBuffer(buffer: FrameBuffer): FrameBuffer {
    const cells = buffer.cells.map((row) => [...row]);
    const styles = buffer.styles.map((row) => [...row.map((s) => ({ ...s }))]);
    return { cells, styles, width: buffer.width, height: buffer.height, cursor: { ...buffer.cursor } };
  }

  private setCell(buffer: FrameBuffer, x: number, y: number, char: string, style: Style): void {
    if (y >= 0 && y < buffer.height && x >= 0 && x < buffer.width) {
      buffer.cells[y][x] = char;
      buffer.styles[y][x] = { ...style };
    }
  }

  private diffBuffers(front: FrameBuffer | null, back: FrameBuffer): string[] {
    const patches: string[] = [];

    if (!front) {
      patches.push(CLEAR_SCREEN + CURSOR_HOME);
      for (let y = 0; y < back.height; y++) {
        let line = '';
        let currentStyle = '';
        for (let x = 0; x < back.width; x++) {
          const style = this.styleToAnsi(back.styles[y][x]);
          if (style !== currentStyle) {
            line += style;
            currentStyle = style;
          }
          line += back.cells[y][x];
        }
        if (line.trim() || y < back.height - 1) {
          patches.push(line + RESET);
        }
      }
      return patches;
    }

    for (let y = 0; y < back.height; y++) {
      let lineChanged = false;
      for (let x = 0; x < back.width; x++) {
        if (front.cells[y][x] !== back.cells[y][x] ||
            JSON.stringify(front.styles[y][x]) !== JSON.stringify(back.styles[y][x])) {
          lineChanged = true;
          break;
        }
      }
      if (lineChanged) {
        patches.push(`${ESC}${y + 1};1H` + this.buildLine(back, y));
      }
    }

    return patches;
  }

  private buildLine(buffer: FrameBuffer, y: number): string {
    let line = '';
    let currentStyle = '';
    for (let x = 0; x < buffer.width; x++) {
      const style = this.styleToAnsi(buffer.styles[y][x]);
      if (style !== currentStyle) {
        line += style;
        currentStyle = style;
      }
      line += buffer.cells[y][x];
    }
    return line + RESET;
  }

  private buildOutput(patches: string[]): string {
    return patches.join('\n') + '\n';
  }

  private styleToAnsi(style: Style): string {
    if (!style || Object.keys(style).length === 0) return '';

    const codes: string[] = [];

    if (style.bold) codes.push('1');
    if (style.dim) codes.push('2');
    if (style.italic) codes.push('3');
    if (style.underline) codes.push('4');
    if (style.strikethrough) codes.push('9');
    if (style.inverse) codes.push('7');

    if (style.color && COLORS[style.color]) {
      codes.push(COLORS[style.color]);
    }
    if (style.backgroundColor && BG_COLORS[style.backgroundColor]) {
      codes.push(BG_COLORS[style.backgroundColor]);
    }

    return codes.length > 0 ? `${ESC}${codes.join(';')}m` : '';
  }

  enterAltScreen(): string {
    this.terminalState.altScreen = true;
    return ALT_SCREEN_ENTER;
  }

  exitAltScreen(): string {
    this.terminalState.altScreen = false;
    return ALT_SCREEN_EXIT;
  }

  hideCursor(): string {
    this.terminalState.cursorVisible = false;
    return HIDE_CURSOR;
  }

  showCursor(): string {
    this.terminalState.cursorVisible = true;
    return SHOW_CURSOR;
  }

  getFrameCount(): number {
    return this.frameCount;
  }

  getTerminalState(): TerminalState {
    return { ...this.terminalState };
  }
}
