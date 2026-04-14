/**
 * OpenSIN Terminal UI Components — Component Library
 *
 * React-inspired component library for terminal UI rendering
 * with Text, Box, Spinner, ProgressBar, TextInput, and List.
 */

import type {
  UIComponent,
  RenderContext,
  Dimensions,
  Style,
  TextInputProps,
  SpinnerProps,
  ProgressBarProps,
  ListProps,
  ComponentProps,
} from './types';

const SPINNER_FRAMES: Record<string, string[]> = {
  dots: ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'],
  line: ['-', '\\', '|', '/'],
  simpleDots: ['.', '..', '...', ' ..', '  .', '   '],
  simpleLine: ['-', '=', '~', '='],
  arrow: ['→', '↘', '↓', '↙', '←', '↖', '↑', '↗'],
};

export class Text implements UIComponent {
  public children?: UIComponent[];
  public style?: Style;
  public key?: string;
  private content: string;

  constructor(content: string, style?: Style) {
    this.content = content;
    this.style = style;
  }

  render(ctx: RenderContext): string {
    const width = ctx.dimensions.width;
    if (this.style?.width) {
      const w = typeof this.style.width === 'number' ? this.style.width : width;
      if (this.content.length > w) {
        this.content = this.content.slice(0, w);
      }
    }

    if (this.style?.align === 'center') {
      const pad = Math.floor((width - this.content.length) / 2);
      this.content = ' '.repeat(Math.max(0, pad)) + this.content;
    } else if (this.style?.align === 'right') {
      const pad = width - this.content.length;
      this.content = ' '.repeat(Math.max(0, pad)) + this.content;
    }

    return this.content;
  }

  measure(ctx: RenderContext): Dimensions {
    const lines = this.content.split('\n');
    const maxWidth = Math.max(...lines.map((l) => l.length));
    return { width: maxWidth, height: lines.length };
  }

  setContent(content: string): void {
    this.content = content;
  }
}

export class Box implements UIComponent {
  public children: UIComponent[];
  public style?: Style;
  public key?: string;

  constructor(children: UIComponent[] = [], style?: Style) {
    this.children = children;
    this.style = style;
  }

  render(ctx: RenderContext): string {
    const lines: string[] = [];

    for (const child of this.children) {
      const output = child.render(ctx);
      lines.push(...output.split('\n'));
    }

    if (this.style?.borderStyle && this.style.borderStyle !== 'none') {
      return this.withBorder(lines, ctx.dimensions.width);
    }

    return lines.join('\n');
  }

  measure(ctx: RenderContext): Dimensions {
    let width = 0;
    let height = 0;

    for (const child of this.children) {
      const dims = child.measure(ctx);
      width = Math.max(width, dims.width);
      height += dims.height;
    }

    if (this.style?.width) {
      width = typeof this.style.width === 'number' ? this.style.width : width;
    }
    if (this.style?.height) {
      height = typeof this.style.height === 'number' ? this.style.height : height;
    }

    return { width, height };
  }

  private withBorder(lines: string[], terminalWidth: number): string {
    const borderStyle = this.style?.borderStyle || 'single';
    const borderColor = this.style?.borderColor || '';
    const chars = this.getBorderChars(borderStyle);

    const contentWidth = Math.max(...lines.map((l) => l.length), 0);
    const width = contentWidth + 2;

    const result: string[] = [];
    result.push(`${chars.topLeft}${chars.horizontal.repeat(contentWidth)}${chars.topRight}`);

    for (const line of lines) {
      const padded = line.padEnd(contentWidth);
      result.push(`${chars.vertical}${padded}${chars.vertical}`);
    }

    result.push(`${chars.bottomLeft}${chars.horizontal.repeat(contentWidth)}${chars.bottomRight}`);
    return result.join('\n');
  }

  private getBorderChars(style: string): { topLeft: string; topRight: string; bottomLeft: string; bottomRight: string; horizontal: string; vertical: string } {
    switch (style) {
      case 'double':
        return { topLeft: '╔', topRight: '╗', bottomLeft: '╚', bottomRight: '╝', horizontal: '═', vertical: '║' };
      case 'rounded':
        return { topLeft: '╭', topRight: '╮', bottomLeft: '╰', bottomRight: '╯', horizontal: '─', vertical: '│' };
      case 'bold':
        return { topLeft: '┏', topRight: '┓', bottomLeft: '┗', bottomRight: '┛', horizontal: '━', vertical: '┃' };
      default:
        return { topLeft: '┌', topRight: '┐', bottomLeft: '└', bottomRight: '┘', horizontal: '─', vertical: '│' };
    }
  }
}

export class Spinner implements UIComponent {
  public style?: Style;
  public key?: string;
  public children?: UIComponent[];
  private type: string;
  private frame: number;
  private speed: number;

  constructor(props: SpinnerProps = {}) {
    this.type = props.type || 'dots';
    this.frame = 0;
    this.speed = props.speed || 100;
    this.style = props.style;
  }

  render(ctx: RenderContext): string {
    const frames = SPINNER_FRAMES[this.type] || SPINNER_FRAMES.dots;
    const char = frames[this.frame % frames.length];
    return char;
  }

  measure(): Dimensions {
    return { width: 1, height: 1 };
  }

  tick(): void {
    this.frame++;
  }
}

export class ProgressBar implements UIComponent {
  public style?: Style;
  public key?: string;
  public children?: UIComponent[];
  private value: number;
  private max: number;
  private width: number;
  private showPercentage: boolean;

  constructor(props: ProgressBarProps) {
    this.value = props.value;
    this.max = props.max;
    this.width = props.width || 30;
    this.showPercentage = props.showPercentage ?? true;
    this.style = props.style;
  }

  render(ctx: RenderContext): string {
    const ratio = Math.min(1, Math.max(0, this.value / this.max));
    const filled = Math.round(ratio * this.width);
    const empty = this.width - filled;

    const bar = '█'.repeat(filled) + '░'.repeat(empty);

    if (this.showPercentage) {
      const pct = `${Math.round(ratio * 100)}%`;
      return `${bar} ${pct}`;
    }

    return bar;
  }

  measure(): Dimensions {
    const width = this.showPercentage ? this.width + 5 : this.width;
    return { width, height: 1 };
  }

  update(value: number, max?: number): void {
    this.value = value;
    if (max !== undefined) this.max = max;
  }
}

export class TextInput implements UIComponent {
  public style?: Style;
  public key?: string;
  public children?: UIComponent[];
  private value: string;
  private placeholder: string;
  private cursorPos: number;
  private focused: boolean;

  constructor(props: TextInputProps) {
    this.value = props.value;
    this.placeholder = props.placeholder || '';
    this.cursorPos = props.value.length;
    this.focused = props.autoFocus ?? false;
    this.style = props.style;
  }

  render(ctx: RenderContext): string {
    const display = this.value || (this.focused ? this.placeholder : '');
    const cursorChar = this.focused ? '▌' : '';

    if (this.cursorPos > 0 && this.cursorPos <= display.length) {
      return display.slice(0, this.cursorPos) + cursorChar + display.slice(this.cursorPos);
    }

    return display + cursorChar;
  }

  measure(): Dimensions {
    return { width: Math.max(this.value.length, this.placeholder.length) + 1, height: 1 };
  }

  focus(): void {
    this.focused = true;
  }

  blur(): void {
    this.focused = false;
  }

  setValue(value: string): void {
    this.value = value;
    this.cursorPos = value.length;
  }

  handleKey(key: string): void {
    if (key === 'backspace' && this.cursorPos > 0) {
      this.value = this.value.slice(0, this.cursorPos - 1) + this.value.slice(this.cursorPos);
      this.cursorPos--;
    } else if (key.length === 1) {
      this.value = this.value.slice(0, this.cursorPos) + key + this.value.slice(this.cursorPos);
      this.cursorPos++;
    }
  }
}

export class List<T> implements UIComponent {
  public style?: Style;
  public key?: string;
  public children?: UIComponent[];
  private items: T[];
  private renderItem: (item: T, index: number) => UIComponent;
  private selectedIndex: number;

  constructor(props: ListProps<T>) {
    this.items = props.items;
    this.renderItem = props.renderItem;
    this.selectedIndex = props.selectedIndex ?? -1;
    this.style = props.style;
  }

  render(ctx: RenderContext): string {
    const lines: string[] = [];

    for (let i = 0; i < this.items.length; i++) {
      const prefix = i === this.selectedIndex ? '▸ ' : '  ';
      const component = this.renderItem(this.items[i], i);
      const output = component.render(ctx);
      const outputLines = output.split('\n');

      for (const line of outputLines) {
        lines.push(prefix + line);
      }
    }

    return lines.join('\n');
  }

  measure(ctx: RenderContext): Dimensions {
    let height = 0;
    let width = 0;

    for (let i = 0; i < this.items.length; i++) {
      const component = this.renderItem(this.items[i], i);
      const dims = component.measure(ctx);
      height += dims.height;
      width = Math.max(width, dims.width + 2);
    }

    return { width, height };
  }

  setSelected(index: number): void {
    this.selectedIndex = Math.max(-1, Math.min(index, this.items.length - 1));
  }

  getSelected(): T | undefined {
    if (this.selectedIndex < 0 || this.selectedIndex >= this.items.length) return undefined;
    return this.items[this.selectedIndex];
  }

  moveUp(): void {
    this.setSelected(this.selectedIndex - 1);
  }

  moveDown(): void {
    this.setSelected(this.selectedIndex + 1);
  }

  updateItems(items: T[]): void {
    this.items = items;
    if (this.selectedIndex >= items.length) {
      this.selectedIndex = Math.max(-1, items.length - 1);
    }
  }
}
