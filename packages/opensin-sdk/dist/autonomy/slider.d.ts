import { AutonomyLevel, AutonomyConfig, AdminAutonomyPolicy, AutonomyChangeEvent } from "./types.js";
import { resolvePermissions } from "./permissions.js";
export declare class AutonomySlider {
    #private;
    constructor(options?: {
        defaultLevel?: AutonomyLevel;
        adminPolicy?: AdminAutonomyPolicy;
    });
    get defaultLevel(): AutonomyLevel;
    get adminPolicy(): AdminAutonomyPolicy | null;
    setAdminPolicy(policy: AdminAutonomyPolicy): void;
    getSessionLevel(sessionId: string): AutonomyLevel;
    setSessionLevel(sessionId: string, level: AutonomyLevel): AutonomyLevel;
    getProjectLevel(projectPath: string): AutonomyLevel;
    setProjectLevel(projectPath: string, level: AutonomyLevel): AutonomyLevel;
    getEffectiveLevel(sessionId?: string, projectPath?: string): AutonomyLevel;
    getConfig(sessionId?: string, projectPath?: string): AutonomyConfig;
    getPermissions(sessionId?: string, projectPath?: string): ReturnType<typeof resolvePermissions>;
    onChange(listener: (event: AutonomyChangeEvent) => void): () => void;
    serialize(): Record<string, unknown>;
    static deserialize(data: Record<string, unknown>): AutonomySlider;
}
//# sourceMappingURL=slider.d.ts.map