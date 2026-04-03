/**
 * Custom Commands — repeatable workflows like Claude Code /skills
 */

export interface CustomCommandParam {
  name: string;
  type: "string" | "number" | "boolean" | "path" | "enum";
  description: string;
  required: boolean;
  defaultValue?: string;
  enumValues?: string[];
}

export interface CustomCommandDefinition {
  id: string;
  name: string;
  description: string;
  version: string;
  template: string;
  params: CustomCommandParam[];
  tags: string[];
  author: string;
  createdAt: string;
  updatedAt: string;
  isShared: boolean;
  shareId?: string;
  metadata: Record<string, unknown>;
}

export interface CommandTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  template: string;
  params: CustomCommandParam[];
  examples: string[];
}

export interface SharedCommand {
  id: string;
  commandId: string;
  name: string;
  description: string;
  author: string;
  version: string;
  downloads: number;
  rating: number;
  tags: string[];
  createdAt: string;
}

export interface CommandVersion {
  version: string;
  changelog: string;
  template: string;
  params: CustomCommandParam[];
  publishedAt: string;
  isLatest: boolean;
}
