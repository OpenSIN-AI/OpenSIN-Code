/**
 * Design System Loader — loads and validates design systems
 */

import type { DesignSystem, DesignSystemName, ThemeConfig } from "./types.js";
import { getDesignSystemRegistry } from "./registry.js";

export class DesignSystemLoader {
  async load(name: DesignSystemName): Promise<DesignSystem> {
    const registry = getDesignSystemRegistry();
    const system = registry.get(name);

    if (!system) {
      throw new Error(`Design system "${name}" not found in registry`);
    }

    await this.validate(system);
    return system;
  }

  async loadAll(): Promise<DesignSystem[]> {
    const registry = getDesignSystemRegistry();
    const names = registry.list();
    const systems: DesignSystem[] = [];

    for (const name of names) {
      try {
        const system = await this.load(name);
        systems.push(system);
      } catch (err) {
        console.warn(`Failed to load design system "${name}":`, err);
      }
    }

    return systems;
  }

  async mergeThemes(base: DesignSystemName, overrides: Partial<ThemeConfig>): Promise<ThemeConfig> {
    const registry = getDesignSystemRegistry();
    const baseTheme = registry.getTheme(base);

    if (!baseTheme) {
      throw new Error(`Base design system "${base}" not found`);
    }

    const merged: ThemeConfig = {
      colors: { ...baseTheme.colors, ...overrides.colors },
      spacing: { ...baseTheme.spacing, ...overrides.spacing },
      borderRadius: { ...baseTheme.borderRadius, ...overrides.borderRadius },
      typography: {
        ...baseTheme.typography,
        ...overrides.typography,
        fontSize: { ...baseTheme.typography.fontSize, ...overrides.typography?.fontSize },
        fontWeight: { ...baseTheme.typography.fontWeight, ...overrides.typography?.fontWeight },
      },
    };

    return merged;
  }

  async validate(system: DesignSystem): Promise<boolean> {
    if (!system.metadata?.name) {
      throw new Error("Design system must have a valid metadata.name");
    }

    if (!Array.isArray(system.components)) {
      throw new Error("Design system must have a components array");
    }

    if (!system.theme?.colors) {
      throw new Error("Design system must have theme.colors defined");
    }

    const componentNames = new Set<string>();
    for (const comp of system.components) {
      if (componentNames.has(comp.name)) {
        throw new Error(`Duplicate component name: ${comp.name}`);
      }
      componentNames.add(comp.name);

      if (!comp.template) {
        throw new Error(`Component ${comp.name} must have a template`);
      }
    }

    return true;
  }

  getSetupInstructions(name: DesignSystemName): string {
    const registry = getDesignSystemRegistry();
    const system = registry.get(name);

    if (!system) {
      return `Design system "${name}" not found.`;
    }

    const lines = [
      `# Setup ${system.metadata.displayName}`,
      "",
      "## Install dependencies",
      "```bash",
      ...system.setupCommands.map((cmd) => `$ ${cmd}`),
      "```",
      "",
      "## Dependencies",
      "```bash",
      `npm install ${system.dependencies.join(" ")}`,
      "```",
    ];

    return lines.join("\n");
  }
}

let loader: DesignSystemLoader | undefined;

export function getDesignSystemLoader(): DesignSystemLoader {
  if (!loader) {
    loader = new DesignSystemLoader();
  }
  return loader;
}
