import { AutonomyLevel, AutonomySlider, PermissionMatrix } from "../../autonomy/index.js";
export interface AutonomyCommandResult {
    success: boolean;
    message: string;
    level?: AutonomyLevel;
    permissions?: ReturnType<typeof PermissionMatrix.get>;
}
export declare function handleAutonomyCommand(slider: AutonomySlider, args: string[], scope: "session" | "project", scopeId: string): AutonomyCommandResult;
export declare function parseAutonomyCommand(input: string): string[];
//# sourceMappingURL=autonomy.d.ts.map