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
} from './types';

export {
  designSystemRegistry,
  getDesignSystem,
  listDesignSystems,
  getComponentSpec,
} from './registry';

export {
  loadDesignSystem,
  preloadAllDesignSystems,
  clearDesignSystemCache,
  mergeTheme,
  getThemeVariables,
} from './loader';

export {
  generateComponent,
  generateAllComponents,
} from './generator';
