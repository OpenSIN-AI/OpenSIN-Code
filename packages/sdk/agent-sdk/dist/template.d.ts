import { TemplateOptions } from "./types.js";
export declare class TemplateGenerator {
    #private;
    generateAgentScaffold(options: TemplateOptions): Map<string, string>;
    generateToolTemplate(toolName: string): string;
    generateConfigTemplate(options: TemplateOptions): string;
}
//# sourceMappingURL=template.d.ts.map