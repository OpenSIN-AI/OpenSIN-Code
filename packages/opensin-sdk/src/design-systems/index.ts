/** Design System Integration — pre-built component libraries like Bolt.new */

export type {
  DesignSystemConfig,
  ComponentSpec,
  ComponentCategory,
  PropDefinition,
  SlotDefinition,
  ThemeConfig,
  ColorTokens,
  SpacingScale,
  TypographyScale,
  ThemeCustomization,
  GeneratedComponent,
  DesignSystemRegistry,
} from './types.js';

export {
  designSystemRegistry,
  getDesignSystem,
  listDesignSystems,
  getComponentSpec,
} from './registry.js';

export {
  loadDesignSystem,
  preloadAllDesignSystems,
  clearDesignSystemCache,
  mergeTheme,
  getThemeVariables,
} from './loader.js';

export {
  generateComponent,
  generateAllComponents,
} from './generator.js';
