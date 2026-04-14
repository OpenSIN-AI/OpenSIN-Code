import { PromptContext } from './types';

export function injectContext(template: string, context: PromptContext): string {
  let result = template;
  const replacements: Record<string, string> = {
    cwd: context.cwd || process.cwd(),
    gitBranch: context.gitBranch || 'unknown',
    fileTree: context.fileTree || '',
    tools: (context.tools || []).join(', '),
    skills: (context.skills || []).join(', '),
  };

  for (const [key, value] of Object.entries(replacements)) {
    result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value);
  }

  return result;
}
