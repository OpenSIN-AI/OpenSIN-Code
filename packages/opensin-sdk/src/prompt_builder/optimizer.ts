import { PromptSection } from './types.js';

export function optimizeSections(sections: PromptSection[], maxTokens: number): PromptSection[] {
  const sorted = [...sections].sort((a, b) => b.priority - a.priority);
  const result: PromptSection[] = [];
  let totalTokens = 0;

  for (const section of sorted) {
    const sectionTokens = estimateTokens(section.content);
    if (totalTokens + sectionTokens <= maxTokens) {
      result.push(section);
      totalTokens += sectionTokens;
    }
  }

  return result.sort((a, b) => b.priority - a.priority);
}

function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}
