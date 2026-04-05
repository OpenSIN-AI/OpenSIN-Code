export interface PromptSection {
  name: string;
  content: string;
  priority: number;
  variable?: Record<string, string>;
}

export interface PromptTemplate {
  name: string;
  sections: PromptSection[];
}

export interface PromptContext {
  cwd?: string;
  gitBranch?: string;
  fileTree?: string;
  envVars?: Record<string, string>;
  skills?: string[];
  tools?: string[];
}
