import * as readline from 'readline';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

function isTTY(fd: number): boolean {
  if (fd === 0) return (process.stdin as any).isTTY === true;
  if (fd === 1) return (process.stdout as any).isTTY === true;
  if (fd === 2) return (process.stderr as any).isTTY === true;
  return false;
}

export const ReadOutcome = {
  Submit: 'Submit',
  Cancel: 'Cancel',
  Exit: 'Exit',
} as const;

export type ReadOutcome = typeof ReadOutcome[keyof typeof ReadOutcome];

enum EditorMode {
  Plain = 'Plain',
  Insert = 'Insert',
  Normal = 'Normal',
  Visual = 'Visual',
  Command = 'Command',
}

interface YankBuffer {
  text: string;
  linewise: boolean;
}

interface EditSession {
  text: string;
  cursor: number;
  mode: EditorMode;
  pendingOperator: string | null;
  visualAnchor: number | null;
  commandBuffer: string;
  commandCursor: number;
  historyIndex: number | null;
  historyBackup: string | null;
  renderedCursorRow: number;
  renderedLines: number;
}

interface CompletionState {
  prefix: string;
  matches: string[];
  nextIndex: number;
}

export class LineEditor {
  private prompt: string;
  private completions: string[];
  private history: string[];
  private yankBuffer: YankBuffer;
  private vimEnabled: boolean;
  private completionState: CompletionState | null;

  constructor(prompt: string, completions: string[] = []) {
    this.prompt = prompt;
    this.completions = completions;
    this.history = [];
    this.yankBuffer = { text: '', linewise: false };
    this.vimEnabled = false;
    this.completionState = null;
    this.loadHistory();
  }

  public pushHistory(entry: string): void {
    const trimmed = entry.trim();
    if (!trimmed) return;
    this.history.push(trimmed);
    this.saveHistory();
  }

  public async readLine(): Promise<ReadOutcome> {
    if (!isTTY(process.stdin.fd) || !isTTY(process.stdout.fd)) {
      return this.readLineFallback();
    }

    const session = this.createSession();
    this.renderSession(session);

    return new Promise((resolve) => {
      readline.emitKeypressEvents(process.stdin);
      
      process.stdin.setRawMode(true);
      
      const keyHandler = (chunk: string, key: any) => {
        const action = this.handleKeyEvent(session, key);
        
        switch (action.type) {
          case 'Continue':
            this.renderSession(session);
            break;
          case 'Submit':
            this.finalizeRender(session);
            process.stdin.setRawMode(false);
            process.stdin.removeListener('keypress', keyHandler);
            resolve(ReadOutcome.Submit);
            break;
          case 'Cancel':
            this.clearRender(session);
            process.stdout.write('\n');
            process.stdin.setRawMode(false);
            process.stdin.removeListener('keypress', keyHandler);
            resolve(ReadOutcome.Cancel);
            break;
          case 'Exit':
            this.clearRender(session);
            process.stdout.write('\n');
            process.stdin.setRawMode(false);
            process.stdin.removeListener('keypress', keyHandler);
            resolve(ReadOutcome.Exit);
            break;
          case 'ToggleVim':
            this.clearRender(session);
            this.vimEnabled = !this.vimEnabled;
            process.stdout.write(`Vim mode ${this.vimEnabled ? 'enabled' : 'disabled'}.\n`);
            const newSession = this.createSession();
            this.renderSession(newSession);
            break;
        }
      };

      process.stdin.on('keypress', keyHandler);
    });
  }

  private createSession(): EditSession {
    return {
      text: '',
      cursor: 0,
      mode: this.vimEnabled ? EditorMode.Insert : EditorMode.Plain,
      pendingOperator: null,
      visualAnchor: null,
      commandBuffer: '',
      commandCursor: 0,
      historyIndex: null,
      historyBackup: null,
      renderedCursorRow: 0,
      renderedLines: 1,
    };
  }

  private async readLineFallback(): Promise<ReadOutcome> {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    return new Promise((resolve) => {
      rl.question(this.prompt, (input) => {
        rl.close();
        
        if (input.trim() === '/vim') {
          this.vimEnabled = !this.vimEnabled;
          console.log(`Vim mode ${this.vimEnabled ? 'enabled' : 'disabled'}.`);
          resolve(ReadOutcome.Submit);
          return;
        }
        
        resolve(ReadOutcome.Submit);
      });
    });
  }

  private handleKeyEvent(session: EditSession, key: any): { type: string; text?: string } {
    if (key.ctrl && (key.name === 'c' || key.name === 'C')) {
      return session.text ? { type: 'Cancel' } : { type: 'Exit' };
    }

    if (key.ctrl && (key.name === 'j' || key.name === 'J')) {
      if (session.mode !== EditorMode.Normal && session.mode !== EditorMode.Visual) {
        this.insertText(session, '\n');
      }
      return { type: 'Continue' };
    }

    if (key.ctrl && (key.name === 'd' || key.name === 'D')) {
      if (session.text.length === 0) {
        return { type: 'Exit' };
      }
      this.deleteChar(session);
      return { type: 'Continue' };
    }

    if (key.name === 'return') {
      if (key.shift) {
        if (session.mode !== EditorMode.Normal && session.mode !== EditorMode.Visual) {
          this.insertText(session, '\n');
        }
        return { type: 'Continue' };
      }
      return this.submitOrToggle(session);
    }

    if (key.name === 'escape') {
      return this.handleEscape(session);
    }

    if (key.name === 'backspace') {
      this.handleBackspace(session);
      return { type: 'Continue' };
    }

    if (key.name === 'delete') {
      this.deleteChar(session);
      return { type: 'Continue' };
    }

    if (key.name === 'left') {
      this.moveLeft(session);
      return { type: 'Continue' };
    }

    if (key.name === 'right') {
      this.moveRight(session);
      return { type: 'Continue' };
    }

    if (key.name === 'up') {
      this.historyUp(session);
      return { type: 'Continue' };
    }

    if (key.name === 'down') {
      this.historyDown(session);
      return { type: 'Continue' };
    }

    if (key.name === 'home') {
      this.moveLineStart(session);
      return { type: 'Continue' };
    }

    if (key.name === 'end') {
      this.moveLineEnd(session);
      return { type: 'Continue' };
    }

    if (key.name === 'tab') {
      this.completeSlashCommand(session);
      return { type: 'Continue' };
    }

    if (key.sequence) {
      this.handleChar(session, key.sequence);
      return { type: 'Continue' };
    }

    return { type: 'Continue' };
  }

  private handleChar(session: EditSession, ch: string): void {
    switch (session.mode) {
      case EditorMode.Plain:
      case EditorMode.Insert:
      case EditorMode.Command:
        this.insertText(session, ch);
        break;
      case EditorMode.Normal:
        this.handleNormalChar(session, ch);
        break;
      case EditorMode.Visual:
        this.handleVisualChar(session, ch);
        break;
    }
  }

  private handleNormalChar(session: EditSession, ch: string): void {
    if (session.pendingOperator) {
      const op = session.pendingOperator;
      session.pendingOperator = null;
      
      if (op === 'd' && ch === 'd') {
        this.deleteCurrentLine(session);
        return;
      }
      if (op === 'y' && ch === 'y') {
        this.yankCurrentLine(session);
        return;
      }
    }

    switch (ch) {
      case 'h': this.moveLeft(session); break;
      case 'j': this.moveDown(session); break;
      case 'k': this.moveUp(session); break;
      case 'l': this.moveRight(session); break;
      case 'd':
      case 'y':
        session.pendingOperator = ch;
        break;
      case 'p': this.pasteAfter(session); break;
      case 'i': session.mode = EditorMode.Insert; break;
      case 'v': session.mode = EditorMode.Visual; session.visualAnchor = session.cursor; break;
      case ':': session.mode = EditorMode.Command; session.commandBuffer = ':'; session.commandCursor = 1; break;
    }
  }

  private handleVisualChar(session: EditSession, ch: string): void {
    switch (ch) {
      case 'h': this.moveLeft(session); break;
      case 'j': this.moveDown(session); break;
      case 'k': this.moveUp(session); break;
      case 'l': this.moveRight(session); break;
      case 'v': session.mode = EditorMode.Normal; break;
    }
  }

  private handleEscape(session: EditSession): { type: string; text?: string } {
    switch (session.mode) {
      case EditorMode.Plain:
        return { type: 'Continue' };
      case EditorMode.Insert:
        if (session.cursor > 0) {
          session.cursor = previousBoundary(session.text, session.cursor);
        }
        session.mode = EditorMode.Normal;
        return { type: 'Continue' };
      case EditorMode.Normal:
        return { type: 'Continue' };
      case EditorMode.Visual:
        session.mode = EditorMode.Normal;
        return { type: 'Continue' };
      case EditorMode.Command:
        session.commandBuffer = '';
        session.commandCursor = 0;
        session.mode = EditorMode.Normal;
        return { type: 'Continue' };
    }
  }

  private handleBackspace(session: EditSession): void {
    switch (session.mode) {
      case EditorMode.Normal:
      case EditorMode.Visual:
        this.moveLeft(session);
        break;
      case EditorMode.Command:
        if (session.commandCursor <= 1) {
          session.commandBuffer = '';
          session.commandCursor = 0;
          session.mode = EditorMode.Normal;
        } else {
          removePreviousChar(session.commandBuffer, session.commandCursor);
        }
        break;
      case EditorMode.Plain:
      case EditorMode.Insert:
        removePreviousChar(session.text, session.cursor);
        break;
    }
  }

  private submitOrToggle(session: EditSession): { type: string; text?: string } {
    const line = session.text;
    if (line.trim() === '/vim') {
      return { type: 'ToggleVim' };
    }
    return { type: 'Submit', text: line };
  }

  private insertText(session: EditSession, text: string): void {
    if (session.mode === EditorMode.Command) {
      session.commandBuffer = session.commandBuffer.slice(0, session.commandCursor) + 
                             text + 
                             session.commandBuffer.slice(session.commandCursor);
      session.commandCursor += text.length;
    } else {
      session.text = session.text.slice(0, session.cursor) + 
                    text + 
                    session.text.slice(session.cursor);
      session.cursor += text.length;
    }
  }

  private deleteChar(session: EditSession): void {
    if (session.cursor < session.text.length) {
      session.text = session.text.slice(0, session.cursor) + session.text.slice(session.cursor + 1);
    }
  }

  private moveLeft(session: EditSession): void {
    session.cursor = previousBoundary(session.text, session.cursor);
  }

  private moveRight(session: EditSession): void {
    session.cursor = nextBoundary(session.text, session.cursor);
  }

  private moveLineStart(session: EditSession): void {
    session.cursor = 0;
  }

  private moveLineEnd(session: EditSession): void {
    session.cursor = session.text.length;
  }

  private moveUp(session: EditSession): void {
    session.cursor = moveVertical(session.text, session.cursor, -1);
  }

  private moveDown(session: EditSession): void {
    session.cursor = moveVertical(session.text, session.cursor, 1);
  }

  private deleteCurrentLine(session: EditSession): void {
    const lineStartIdx = lineStart(session.text, session.cursor);
    const lineEndIdx = lineEnd(session.text, session.cursor);
    const deleteStartIdx = lineEndIdx === session.text.length && lineStartIdx > 0 ? lineStartIdx - 1 : lineStartIdx;
    
    this.yankBuffer.text = session.text.slice(lineStartIdx, lineEndIdx);
    this.yankBuffer.linewise = true;
    session.text = session.text.slice(0, deleteStartIdx) + session.text.slice(lineEndIdx);
    session.cursor = Math.min(deleteStartIdx, session.text.length);
  }

  private yankCurrentLine(session: EditSession): void {
    const lineStartIdx = lineStart(session.text, session.cursor);
    const lineEndIdx = lineEnd(session.text, session.cursor);
    this.yankBuffer.text = session.text.slice(lineStartIdx, lineEndIdx);
    this.yankBuffer.linewise = true;
  }

  private pasteAfter(session: EditSession): void {
    if (!this.yankBuffer.text) return;

    const lineEndIdx = lineEnd(session.text, session.cursor);
    const insertAt = lineEndIdx < session.text.length ? lineEndIdx + 1 : session.text.length;
    
    let insertion = this.yankBuffer.text;
    if (insertAt === session.text.length && !session.text.endsWith('\n')) {
      insertion = '\n' + insertion;
    }
    if (insertAt < session.text.length && !insertion.endsWith('\n')) {
      insertion = insertion + '\n';
    }
    
    session.text = session.text.slice(0, insertAt) + insertion + session.text.slice(insertAt);
    session.cursor = insertion.startsWith('\n') ? insertAt + 1 : insertAt;
  }

  private completeSlashCommand(session: EditSession): void {
    if (session.mode === EditorMode.Command) {
      this.completionState = null;
      return;
    }

    const prefix = session.text;
    if (session.cursor !== session.text.length || !prefix.startsWith('/')) {
      this.completionState = null;
      return;
    }

    const matches = this.completions.filter(c => c.startsWith(prefix) && c !== prefix);
    if (matches.length === 0) {
      this.completionState = null;
      return;
    }

    let candidate: string;
    if (this.completionState && this.completionState.prefix === prefix) {
      this.completionState.nextIndex = (this.completionState.nextIndex + 1) % matches.length;
      candidate = matches[this.completionState.nextIndex];
    } else {
      candidate = matches[0];
      this.completionState = { prefix, matches, nextIndex: 1 };
    }

    session.text = candidate;
    session.cursor = candidate.length;
  }

  private historyUp(session: EditSession): void {
    if (session.mode === EditorMode.Command || this.history.length === 0) return;

    const nextIndex = session.historyIndex !== null 
      ? Math.max(0, session.historyIndex - 1)
      : this.history.length - 1;

    if (session.historyIndex === null) {
      session.historyBackup = session.text;
    }

    session.historyIndex = nextIndex;
    session.text = this.history[nextIndex];
    session.cursor = session.text.length;
  }

  private historyDown(session: EditSession): void {
    if (session.mode === EditorMode.Command) return;
    if (session.historyIndex === null) return;

    if (session.historyIndex + 1 < this.history.length) {
      session.historyIndex++;
      session.text = this.history[session.historyIndex];
      session.cursor = session.text.length;
      return;
    }

    session.historyIndex = null;
    session.text = session.historyBackup || '';
    session.cursor = session.text.length;
    if (this.vimEnabled) {
      session.mode = EditorMode.Insert;
    } else {
      session.mode = EditorMode.Plain;
    }
  }

  private renderSession(session: EditSession): void {
    process.stdout.write('\r' + '\x1b[K');
    const mode = this.vimEnabled ? `[${session.mode}] ` : '';
    process.stdout.write(`${mode}${this.prompt}${session.text}`);
    
    const cursorRow = this.getCursorRow(session);
    if (cursorRow > 0) {
      process.stdout.write('\r\x1b[' + cursorRow + 'A');
    }
    process.stdout.write('\r\x1b[' + (this.prompt.length + session.cursor + (this.vimEnabled ? session.mode.length + 2 : 0)) + 'G');
  }

  private clearRender(session: EditSession): void {
    const rowsToMoveUp = session.renderedCursorRow;
    if (rowsToMoveUp > 0) {
      process.stdout.write('\x1b[' + rowsToMoveUp + 'A');
    }
    process.stdout.write('\r\x1b[0K');
  }

  private finalizeRender(session: EditSession): void {
    this.clearRender(session);
    process.stdout.write(`${this.prompt}${session.text}\n`);
  }

  private getCursorRow(session: EditSession): number {
    const text = session.mode === EditorMode.Command ? session.commandBuffer : session.text;
    const cursor = session.mode === EditorMode.Command ? session.commandCursor : session.cursor;
    return text.slice(0, cursor).split('\n').length - 1;
  }

  private getHistoryPath(): string {
    return path.join(os.homedir(), '.sin', 'history');
  }

  private loadHistory(): void {
    try {
      const historyPath = this.getHistoryPath();
      if (fs.existsSync(historyPath)) {
        const content = fs.readFileSync(historyPath, 'utf-8');
        this.history = content.split('\n').filter(l => l.trim());
      }
    } catch {
      // ignore
    }
  }

  private saveHistory(): void {
    try {
      const historyPath = this.getHistoryPath();
      const dir = path.dirname(historyPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(historyPath, this.history.join('\n'));
    } catch {
      // ignore
    }
  }
}

function previousBoundary(text: string, cursor: number): number {
  if (cursor === 0) return 0;
  return text.slice(0, cursor).length - 1;
}

function nextBoundary(text: string, cursor: number): number {
  if (cursor >= text.length) return text.length;
  return cursor + 1;
}

function removePreviousChar(text: string, cursor: number): void {
  if (cursor === 0) return;
  const start = previousBoundary(text, cursor);
  text.slice(0, start) + text.slice(cursor);
  cursor = start;
}

function lineStart(text: string, cursor: number): number {
  const lastNewline = text.slice(0, cursor).lastIndexOf('\n');
  return lastNewline === -1 ? 0 : lastNewline + 1;
}

function lineEnd(text: string, cursor: number): number {
  const newline = text.slice(cursor).indexOf('\n');
  return newline === -1 ? text.length : cursor + newline;
}

function moveVertical(text: string, cursor: number, delta: number): number {
  const lineStarts = lineStarts_(text);
  const currentRow = text.slice(0, cursor).split('\n').length - 1;
  
  const maxRow = lineStarts.length - 1;
  const targetRow = Math.max(0, Math.min(maxRow, currentRow + delta));
  
  if (targetRow === currentRow) return cursor;
  
  const currentCol = text.slice(lineStarts[currentRow], cursor).length;
  const targetLineStart = lineStarts[targetRow];
  const targetLineEnd = targetRow < lineStarts.length - 1 
    ? lineStarts[targetRow + 1] - 1 
    : text.length;
  const targetLine = text.slice(targetLineStart, targetLineEnd);
  
  return targetLineStart + Math.min(currentCol, targetLine.length);
}

function lineStarts_(text: string): number[] {
  const starts = [0];
  for (let i = 0; i < text.length; i++) {
    if (text[i] === '\n') {
      starts.push(i + 1);
    }
  }
  return starts;
}
