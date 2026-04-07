export type CopyFormat = 'plain' | 'markdown' | 'code' | 'json';

export interface CopyOptions {
  format: CopyFormat;
  includeLineNumbers: boolean;
  includeLanguage: boolean;
  trimWhitespace: boolean;
}

export interface CopyResult {
  success: boolean;
  content: string;
  length: number;
}
