import { CompletionPrediction, CompletionContext, SupercompleteConfig } from './types';

const DEFAULT_CONFIG: SupercompleteConfig = {
  maxPredictions: 3,
  minConfidence: 0.3,
  contextLines: 10,
  enableMultiLine: true,
  maxCompletionLength: 500,
};

export class CompletionPredictor {
  private config: SupercompleteConfig;

  constructor(config?: Partial<SupercompleteConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  async predict(context: CompletionContext): Promise<CompletionPrediction[]> {
    if (!context.currentLine.trim()) {
      return [];
    }

    const predictions: CompletionPrediction[] = [
      {
        text: this.generatePrediction(context),
        confidence: 0.5,
        startLine: context.cursorPosition.line,
        endLine: context.cursorPosition.line,
        isMultiLine: false,
      },
    ];

    return predictions
      .filter((p) => p.confidence >= this.config.minConfidence)
      .slice(0, this.config.maxPredictions);
  }

  private generatePrediction(context: CompletionContext): string {
    const line = context.currentLine;
    const indent = line.match(/^(\s*)/)?.[1] ?? '';

    if (line.includes('function') || line.includes('=>')) {
      return `${indent}  // Implementation goes here\n${indent}  return;\n${indent}}`;
    }

    if (line.includes('if') || line.includes('else')) {
      return `${indent}  // Condition handling\n${indent}  return;`;
    }

    if (line.includes('class')) {
      return `${indent}  constructor() {\n${indent}    // Initialize\n${indent}  }`;
    }

    return '';
  }

  updateConfig(config: Partial<SupercompleteConfig>): void {
    this.config = { ...this.config, ...config };
  }
}
