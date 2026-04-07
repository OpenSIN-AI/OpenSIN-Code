export interface CompletionPrediction {
  text: string;
  confidence: number;
  startLine: number;
  endLine: number;
  isMultiLine: boolean;
}

export interface CompletionContext {
  currentLine: string;
  precedingLines: string[];
  cursorPosition: { line: number; column: number };
  language: string;
  filePath: string;
}

export interface SupercompleteConfig {
  maxPredictions: number;
  minConfidence: number;
  contextLines: number;
  enableMultiLine: boolean;
  maxCompletionLength: number;
}
