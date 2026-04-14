/** Design System Loader — load and cache design system configurations */

import type { DesignSystemConfig, ThemeConfig, ThemeCustomization } from './types';
import { designSystemRegistry, getDesignSystem } from './registry';

const cache = new Map<string, DesignSystemConfig>();

export async function loadDesignSystem(name: string): Promise<DesignSystemConfig | null> {
  if (cache.has(name)) {
    return cache.get(name) as DesignSystemConfig;
  }

  const config = getDesignSystem(name);
  if (!config) {
    return null;
  }

  cache.set(name, config);
  return config;
}

export function preloadAllDesignSystems(): void {
  for (const name of Object.keys(designSystemRegistry)) {
    cache.set(name, designSystemRegistry[name]);
  }
}

export function clearDesignSystemCache(): void {
  cache.clear();
}

export function mergeTheme(base: ThemeConfig, customization: ThemeCustomization): ThemeConfig {
  const merged: ThemeConfig = {
    colors: { ...base.colors, ...(customization.colors || {}) },
    spacing: { ...base.spacing, ...(customization.spacing || {}) },
    typography: { ...base.typography, ...(customization.typography || {}) },
    borderRadius: { ...base.borderRadius, ...(customization.borderRadius || {}) },
    shadows: { ...base.shadows, ...(customization.shadows || {}) },
    breakpoints: { ...base.breakpoints },
  };

  return merged;
}

export function getThemeVariables(theme: ThemeConfig): Record<string, string> {
  const variables: Record<string, string> = {};

  for (const [key, value] of Object.entries(theme.colors)) {
    variables[`--color-${key}`] = value;
  }

  for (const [key, value] of Object.entries(theme.spacing)) {
    if (value) variables[`--spacing-${key}`] = value;
  }

  for (const [key, value] of Object.entries(theme.borderRadius)) {
    variables[`--radius-${key}`] = value;
  }

  for (const [key, value] of Object.entries(theme.shadows)) {
    variables[`--shadow-${key}`] = value;
  }

  return variables;
}
