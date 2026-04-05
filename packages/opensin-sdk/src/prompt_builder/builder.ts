import { PromptTemplate, PromptSection, PromptContext } from './types';
import { injectContext } from './context_injector';

export class PromptBuilder {
  private templates: PromptTemplate[];
  private customSections: PromptSection[];

  constructor(templates: PromptTemplate[] = []) {
    this.templates = templates;
    this.customSections = [];
  }

  addTemplate(template: PromptTemplate): void {
    this.templates.push(template);
  }

  addSection(section: PromptSection): void {
    this.customSections.push(section);
  }

  build(context: PromptContext, maxTokens?: number): string {
    const allSections = this.getAllSections();
    const sorted = allSections.sort((a, b) => b.priority - a.priority);

    let result = '';
    for (const section of sorted) {
      let content = section.content;
      if (section.variable) {
        for (const [key, value] of Object.entries(section.variable)) {
          content = content.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value);
        }
      }
      content = injectContext(content, context);
      result += content + '\n\n';

      if (maxTokens && estimateTokens(result) > maxTokens) {
        break;
      }
    }

    return result.trim();
  }

  private getAllSections(): PromptSection[] {
    const sections: PromptSection[] = [...this.customSections];
    for (const template of this.templates) {
      sections.push(...template.sections);
    }
    return sections;
  }
}

function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}
