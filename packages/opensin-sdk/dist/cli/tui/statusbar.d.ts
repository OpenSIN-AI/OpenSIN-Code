import { AutonomyLevel } from "../../autonomy/index.js";
export interface StatusBarConfig {
    autonomyLevel: AutonomyLevel;
    showIcon: boolean;
    showLabel: boolean;
    showDescription: boolean;
    color: string;
}
export declare class StatusBarRenderer {
    static renderAutonomyIndicator(config: StatusBarConfig): string;
    static renderStatusBar(autonomyLevel: AutonomyLevel, options?: {
        showIcon?: boolean;
        showLabel?: boolean;
    }): string;
    static getColorForLevel(level: AutonomyLevel): string;
    static getAnsiColor(level: AutonomyLevel): string;
    static renderColoredStatusBar(level: AutonomyLevel): string;
}
//# sourceMappingURL=statusbar.d.ts.map