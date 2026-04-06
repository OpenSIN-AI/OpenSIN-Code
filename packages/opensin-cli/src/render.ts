import chalk from 'chalk';

export interface ColorTheme {
  heading: string;
  emphasis: string;
  strong: string;
  inlineCode: string;
  link: string;
  quote: string;
  tableBorder: string;
  codeBlockBorder: string;
  spinnerActive: string;
  spinnerDone: string;
  spinnerFailed: string;
}

export function defaultColorTheme(): ColorTheme {
  return {
    heading: 'cyan',
    emphasis: 'magenta',
    strong: 'yellow',
    inlineCode: 'green',
    link: 'blue',
    quote: 'gray',
    tableBorder: 'darkCyan',
    codeBlockBorder: 'gray',
    spinnerActive: 'blue',
    spinnerDone: 'green',
    spinnerFailed: 'red',
  };
}

export class Spinner {
  private frameIndex: number = 0;
  private static readonly FRAMES = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];

  public tick(label: string, theme: ColorTheme, out: any): void {
    const frame = Spinner.FRAMES[this.frameIndex % Spinner.FRAMES.length];
    this.frameIndex++;
    out.write(`\r${frame} ${label}`);
    out.flush?.();
  }

  public finish(label: string, theme: ColorTheme, out: any): void {
    this.frameIndex = 0;
    out.write(`\r✔ ${label}\n`);
    out.flush?.();
  }

  public fail(label: string, theme: ColorTheme, out: any): void {
    this.frameIndex = 0;
    out.write(`\r✘ ${label}\n`);
    out.flush?.();
  }
}

interface ListKind {
  type: 'unordered';
  nextIndex?: number;
}

interface TableState {
  headers: string[];
  rows: string[][];
  currentRow: string[];
  currentCell: string;
  inHead: boolean;
}

interface RenderState {
  emphasis: number;
  strong: number;
  headingLevel: number | null;
  quote: number;
  listStack: ListKind[];
  linkStack: LinkState[];
  table: TableState | null;
}

interface LinkState {
  destination: string;
  text: string;
}

function defaultRenderState(): RenderState {
  return {
    emphasis: 0,
    strong: 0,
    headingLevel: null,
    quote: 0,
    listStack: [],
    linkStack: [],
    table: null,
  };
}

export class TerminalRenderer {
  private colorTheme: ColorTheme;

  constructor() {
    this.colorTheme = defaultColorTheme();
  }

  public colorTheme_(): ColorTheme {
    return this.colorTheme;
  }

  public markdownToAnsi(markdown: string): string {
    return this.renderMarkdown(markdown);
  }

  public renderMarkdown(markdown: string): string {
    let output = '';
    let state = defaultRenderState();
    let codeLanguage = '';
    let codeBuffer = '';
    let inCodeBlock = false;

    const lines = markdown.split('\n');
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      if (inCodeBlock) {
        if (line.startsWith('```') || line.startsWith('~~~')) {
          output += this.finishCodeBlock(codeBuffer, codeLanguage);
          inCodeBlock = false;
          codeBuffer = '';
          codeLanguage = '';
          continue;
        }
        codeBuffer += line + '\n';
        continue;
      }

      if (line.startsWith('```') || line.startsWith('~~~')) {
        inCodeBlock = true;
        codeLanguage = line.slice(3).trim() || 'text';
        codeBuffer = '';
        output += this.startCodeBlock(codeLanguage);
        continue;
      }

      output += this.processLine(line, state) + '\n';
    }

    if (inCodeBlock) {
      output += this.finishCodeBlock(codeBuffer, codeLanguage);
    }

    return output.trimEnd();
  }

  private processLine(line: string, state: RenderState): string {
    let output = '';
    
    if (line.startsWith('# ')) {
      output += chalk.cyan.bold(line.substring(2)) + '\n';
    } else if (line.startsWith('## ')) {
      output += chalk.white.bold(line.substring(3)) + '\n';
    } else if (line.startsWith('### ')) {
      output += chalk.blue.bold(line.substring(4)) + '\n';
    } else if (line.startsWith('> ')) {
      output += chalk.gray('│ ' + line.substring(2)) + '\n';
    } else if (line.startsWith('- ') || line.startsWith('* ')) {
      output += '• ' + line.substring(2) + '\n';
    } else if (/^\d+\.\s/.test(line)) {
      output += line + '\n';
    } else if (line.startsWith('|')) {
      output += this.renderTableLine(line);
    } else if (line.startsWith('---')) {
      output += '---\n';
    } else {
      output += this.processInlineFormatting(line, state);
    }
    
    return output;
  }

  private processInlineFormatting(text: string, state: RenderState): string {
    let result = text;
    
    result = result.replace(/`([^`]+)`/g, (_, code) => {
      return chalk.green(code);
    });
    
    result = result.replace(/\*\*([^*]+)\*\*/g, (_, bold) => {
      return chalk.yellow.bold(bold);
    });
    
    result = result.replace(/\*([^*]+)\*/g, (_, italic) => {
      return chalk.italic(italic);
    });
    
    result = result.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, label, url) => {
      return chalk.blue.underline(`${label}(${url})`);
    });
    
    return result;
  }

  private startCodeBlock(language: string): string {
    const label = language || 'code';
    return chalk.gray.bold(`╭─ ${label}\n`);
  }

  private finishCodeBlock(codeBuffer: string, language: string): string {
    const highlighted = this.highlightCode(codeBuffer, language);
    return highlighted + chalk.gray.bold('╰─') + '\n\n';
  }

  private renderTableLine(line: string): string {
    const cells = line.slice(1, -1).split('|').map(c => c.trim());
    const border = chalk.gray('│');
    
    if (cells.every(c => c.match(/^-+$/))) {
      const widths = cells.map((_, i) => {
        const colIdx = line.slice(1, -1).split('|').map(c => c.trim())[i];
        return colIdx.length;
      });
      return chalk.gray('│' + widths.map(w => '─'.repeat(w + 2)).join('┼') + '│') + '\n';
    }
    
    return border + cells.map(c => ' ' + c + ' ').join(border) + border + '\n';
  }

  public highlightCode(code: string, language: string): string {
    const lines = code.split('\n');
    return lines.map(line => {
      return chalk.bgGray.white(line);
    }).join('\n');
  }

  public streamMarkdown(markdown: string, out: any): void {
    const rendered = this.markdownToAnsi(markdown);
    out.write(rendered);
    if (!rendered.endsWith('\n')) {
      out.write('\n');
    }
    out.flush?.();
  }
}

export class MarkdownStreamState {
  private pending: string = '';

  public push(renderer: TerminalRenderer, delta: string): string | null {
    this.pending += delta;
    const split = findStreamSafeBoundary(this.pending);
    if (!split) return null;
    
    const ready = this.pending.substring(0, split);
    this.pending = this.pending.substring(split);
    return renderer.markdownToAnsi(ready);
  }

  public flush(renderer: TerminalRenderer): string | null {
    if (this.pending.trim().length === 0) {
      this.pending = '';
      return null;
    }
    const pending = this.pending;
    this.pending = '';
    return renderer.markdownToAnsi(pending);
  }
}

function findStreamSafeBoundary(markdown: string): number | null {
  let inFence = false;
  let lastBoundary: number | null = null;

  const lines = markdown.split('\n');
  let cursor = 0;
  
  for (const line of lines) {
    const start = cursor;
    cursor += line.length + 1;
    
    const trimmed = line.trimStart();
    if (trimmed.startsWith('```') || trimmed.startsWith('~~~')) {
      inFence = !inFence;
      if (!inFence) {
        lastBoundary = start + line.length + 1;
      }
      continue;
    }

    if (inFence) {
      continue;
    }

    if (trimmed.length === 0) {
      lastBoundary = start + line.length + 1;
    }
  }

  return lastBoundary;
}

function visibleWidth(input: string): number {
  return stripAnsi(input).length;
}

function stripAnsi(input: string): string {
  return input.replace(/\x1b\[[0-9;]*[a-zA-Z]/g, '');
}
