import { AutonomyLevel, AutonomySlider, PermissionMatrix } from "../../autonomy/index.js";

export interface AutonomyCommandResult {
  success: boolean;
  message: string;
  level?: AutonomyLevel;
  permissions?: ReturnType<typeof PermissionMatrix.get>;
}

export function handleAutonomyCommand(
  slider: AutonomySlider,
  args: string[],
  scope: "session" | "project",
  scopeId: string,
): AutonomyCommandResult {
  if (args.length === 0) {
    const level = scope === "session"
      ? slider.getSessionLevel(scopeId)
      : slider.getProjectLevel(scopeId);
    const perms = PermissionMatrix.get(level);
    return {
      success: true,
      message: `Autonomy: ${PermissionMatrix.label(level)} — ${PermissionMatrix.description(level)}`,
      level,
      permissions: perms,
    };
  }

  const action = args[0]!.toLowerCase();

  if (action === "status" || action === "show") {
    const level = scope === "session"
      ? slider.getSessionLevel(scopeId)
      : slider.getProjectLevel(scopeId);
    const perms = PermissionMatrix.get(level);
    return {
      success: true,
      message: `Autonomy: ${PermissionMatrix.label(level)} — ${PermissionMatrix.description(level)}`,
      level,
      permissions: perms,
    };
  }

  if (action === "set" || action === "level") {
    const levelArg = args[1]?.toLowerCase();
    if (!levelArg) {
      return {
        success: false,
        message: "Usage: /autonomy set <assist|collaborate|autonomous>",
      };
    }

    const levelMap: Record<string, AutonomyLevel> = {
      assist: AutonomyLevel.Assist,
      collaborate: AutonomyLevel.Collaborate,
      autonomous: AutonomyLevel.Autonomous,
    };

    const level = levelMap[levelArg];
    if (!level) {
      return {
        success: false,
        message: `Invalid autonomy level "${levelArg}". Use: assist, collaborate, autonomous`,
      };
    }

    try {
      const effectiveLevel = scope === "session"
        ? slider.setSessionLevel(scopeId, level)
        : slider.setProjectLevel(scopeId, level);
      const perms = PermissionMatrix.get(effectiveLevel);
      return {
        success: true,
        message: `Autonomy set to ${PermissionMatrix.label(effectiveLevel)} — ${PermissionMatrix.description(effectiveLevel)}`,
        level: effectiveLevel,
        permissions: perms,
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : String(error),
      };
    }
  }

  if (action === "list" || action === "levels") {
    const levels = [AutonomyLevel.Assist, AutonomyLevel.Collaborate, AutonomyLevel.Autonomous];
    const lines = levels.map((l) => {
      const icon = PermissionMatrix.icon(l);
      const label = PermissionMatrix.label(l);
      const desc = PermissionMatrix.description(l);
      return `  [${icon}] ${label}: ${desc}`;
    });
    return {
      success: true,
      message: `Available autonomy levels:\n${lines.join("\n")}`,
    };
  }

  return {
    success: false,
    message: "Unknown autonomy command. Use: status, set <level>, list",
  };
}

export function parseAutonomyCommand(input: string): string[] {
  const trimmed = input.startsWith("/autonomy") ? input.slice("/autonomy".length).trim() : input.trim();
  if (!trimmed) return [];
  return trimmed.split(/\s+/);
}
