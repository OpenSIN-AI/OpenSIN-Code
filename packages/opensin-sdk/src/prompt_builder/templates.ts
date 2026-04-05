import { PromptTemplate } from './types.js';

export const SYSTEM_TEMPLATE: PromptTemplate = {
  name: 'system',
  sections: [
    { name: 'identity', content: 'You are OpenSIN-Code, an AI coding assistant.', priority: 100 },
    { name: 'rules', content: 'Follow best practices. Never make assumptions.', priority: 90 },
  ],
};

export const TOOL_TEMPLATE: PromptTemplate = {
  name: 'tools',
  sections: [
    { name: 'tool_list', content: 'Available tools: {{tools}}', priority: 80 },
  ],
};

export const CONTEXT_TEMPLATE: PromptTemplate = {
  name: 'context',
  sections: [
    { name: 'cwd', content: 'Working directory: {{cwd}}', priority: 70 },
    { name: 'git', content: 'Git branch: {{gitBranch}}', priority: 65 },
    { name: 'files', content: 'File tree:\n{{fileTree}}', priority: 60 },
  ],
};
