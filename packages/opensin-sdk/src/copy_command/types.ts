export interface CopyCommandConfig {
  maxHistory: number;
  defaultFormat: ClipboardFormat;
  autoTrim: boolean;
}

export type ClipboardFormat = "text" | "markdown" | "html";

export interface CopyResult {
  success: boolean;
  index: number;
  content: string;
  format: ClipboardFormat;
  error?: string;
}

export interface AssistantResponse {
  index: number;
  content: string;
  timestamp: string;
  format: ClipboardFormat;
}

export interface ClipboardBackend {
  name: string;
  write(text: string): Promise<boolean>;
  read(): Promise<string>;
  isAvailable(): Promise<boolean>;
}

export type PlatformType = "darwin" | "linux" | "windows";
