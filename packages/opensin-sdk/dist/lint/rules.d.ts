import { LintSeverity, LintSource } from "./types.js";
export type RuleSeverity = LintSeverity | "off";
export interface LintRule {
    id: string;
    source: LintSource;
    severity: RuleSeverity;
    description: string;
    enabled: boolean;
    projectSpecific: boolean;
    tags?: string[];
}
export interface RulePreset {
    name: string;
    description: string;
    rules: Record<string, RuleSeverity>;
}
export interface RulesConfig {
    defaultSeverity: LintSeverity;
    rules: Record<string, RuleSeverity>;
    presets: string[];
    projectRoot: string;
}
export declare class RulesManager {
    private rules;
    private activePresets;
    private projectRules;
    private defaultSeverity;
    constructor(config?: Partial<RulesConfig>);
    private initializeDefaultRules;
    private generateDescription;
    private applyPresets;
    private mergeCustomRules;
    enableRule(ruleId: string): void;
    disableRule(ruleId: string): void;
    setRuleSeverity(ruleId: string, severity: RuleSeverity): void;
    getRule(ruleId: string): LintRule | undefined;
    getAllRules(): LintRule[];
    getEnabledRules(): LintRule[];
    getRulesBySource(source: LintSource): LintRule[];
    addProjectRule(rule: Omit<LintRule, "projectSpecific">): void;
    removeProjectRule(ruleId: string): void;
    isRuleEnabled(ruleId: string): boolean;
    getRuleSeverity(ruleId: string): RuleSeverity;
    applyPreset(presetName: string): void;
    removePreset(presetName: string): void;
    getActivePresets(): string[];
    getAvailablePresets(): Record<string, RulePreset>;
    setDefaultSeverity(severity: LintSeverity): void;
    getDefaultSeverity(): LintSeverity;
    resetToDefaults(): void;
    exportConfig(): RulesConfig;
    importConfig(config: RulesConfig): void;
    shouldFixError(ruleId: string): boolean;
    getRulesBySeverity(severity: LintSeverity): LintRule[];
    getRulesByTag(tag: string): LintRule[];
    addTagToRule(ruleId: string, tag: string): void;
    removeTagFromRule(ruleId: string, tag: string): void;
}
//# sourceMappingURL=rules.d.ts.map