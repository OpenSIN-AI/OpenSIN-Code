import { CompletionContext } from './types';

export interface ContextAnalysis {
  language: string;
  scope: string;
  hasOpenBlock: boolean;
  indentation: string;
  lastToken: string;
}

export function analyzeContext(ctx: CompletionContext): ContextAnalysis {
  const indent = ctx.currentLine.match(/^(\s*)/)?.[1] ?? '';
  const hasOpenBlock = ctx.currentLine.includes('{') && !ctx.currentLine.includes('}');
  const lastToken = ctx.currentLine.trim().split(/\s+/).pop() ?? '';

  return {
    language: ctx.language,
    scope: detectScope(ctx),
    hasOpenBlock,
    indentation: indent,
    lastToken,
  };
}

function detectScope(ctx: CompletionContext): string {
  const combined = [...ctx.precedingLines, ctx.currentLine].join('\n');
  if (combined.includes('function ') || combined.includes('=>')) return 'function';
  if (combined.includes('class ')) return 'class';
  if (combined.includes('if ') || combined.includes('else')) return 'conditional';
  if (combined.includes('for ') || combined.includes('while')) return 'loop';
  return 'global';
}
