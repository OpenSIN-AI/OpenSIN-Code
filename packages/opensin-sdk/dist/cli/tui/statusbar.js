import { AutonomyLevel, PermissionMatrix } from "../../autonomy/index.js";
export class StatusBarRenderer {
    static renderAutonomyIndicator(config) {
        const parts = [];
        if (config.showIcon) {
            const icon = PermissionMatrix.icon(config.autonomyLevel);
            parts.push(`[${icon}]`);
        }
        if (config.showLabel) {
            parts.push(PermissionMatrix.label(config.autonomyLevel));
        }
        if (config.showDescription) {
            parts.push(`(${PermissionMatrix.description(config.autonomyLevel)})`);
        }
        return parts.join(" ");
    }
    static renderStatusBar(autonomyLevel, options) {
        const showIcon = options?.showIcon ?? true;
        const showLabel = options?.showLabel ?? true;
        return StatusBarRenderer.renderAutonomyIndicator({
            autonomyLevel,
            showIcon,
            showLabel,
            showDescription: false,
            color: "",
        });
    }
    static getColorForLevel(level) {
        switch (level) {
            case AutonomyLevel.Assist:
                return "green";
            case AutonomyLevel.Collaborate:
                return "yellow";
            case AutonomyLevel.Autonomous:
                return "red";
        }
    }
    static getAnsiColor(level) {
        switch (level) {
            case AutonomyLevel.Assist:
                return "\x1b[32m";
            case AutonomyLevel.Collaborate:
                return "\x1b[33m";
            case AutonomyLevel.Autonomous:
                return "\x1b[31m";
        }
    }
    static renderColoredStatusBar(level) {
        const color = StatusBarRenderer.getAnsiColor(level);
        const reset = "\x1b[0m";
        const indicator = StatusBarRenderer.renderStatusBar(level);
        return `${color}${indicator}${reset}`;
    }
}
//# sourceMappingURL=statusbar.js.map