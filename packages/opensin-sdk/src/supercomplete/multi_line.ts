import { CompletionContext } from './types';

export interface MultiLineCompletion {
  lines: string[];
  confidence: number;
}

export class MultiLineCompleter {
  async complete(context: CompletionContext): Promise<MultiLineCompletion | null> {
    const analysis = analyzeContext(context);
    if (!analysis.hasOpenBlock) {
      return null;
    }

    const lines = this.generateBlockCompletion(analysis);
    return {
      lines,
      confidence: 0.6,
    };
  }

  private generateBlockCompletion(analysis: { indentation: string; scope: string }): string[] {
    const indent = analysis.indentation;
    switch (analysis.scope) {
      case 'function':
        return [`${indent}  // TODO: implement`, `${indent}  return null;`, `${indent}}`];
      case 'class':
        return [`${indent}  constructor() {`, `${indent}    super();`, `${indent}  }`, `${indent}}`];
      case 'conditional':
        return [`${indent}  // handle condition`, `${indent}  return;`, `${indent}}`];
      default:
        return [`${indent}  // ...`, `${indent}}`];
    }
  }
}

function analyzeContext(ctx: CompletionContext): { indentation: string; hasOpenBlock: boolean; scope: string } {
  const indent = ctx.currentLine.match(/^(\s*)/)?.[1] ?? '';
  const hasOpenBlock = ctx.currentLine.includes('{') && !ctx.currentLine.includes('}');
  const combined = [...ctx.precedingLines, ctx.currentLine].join('\n');
  let scope = 'global';
  if (combined.includes('function ') || combined.includes('=>')) scope = 'function';
  else if (combined.includes('class ')) scope = 'class';
  else if (combined.includes('if ') || combined.includes('else')) scope = 'conditional';
  return { indentation: indent, hasOpenBlock, scope };
}
