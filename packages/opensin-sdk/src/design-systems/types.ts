/**
 * Design System Integration — type definitions for pre-built component libraries like Bolt.new
 */

export type DesignSystemName = "shadcn" | "mui" | "chakra" | "tailwind";

export type ComponentCategory =
  | "layout"
  | "form"
  | "feedback"
  | "navigation"
  | "data-display"
  | "overlay"
  | "typography"
  | "media"
  | "actions";

export interface PropDefinition {
  name: string;
  type: string;
  required: boolean;
  defaultValue?: unknown;
  description: string;
}

export interface SlotDefinition {
  name: string;
  description: string;
}

export interface ComponentVariant {
  name: string;
  className?: string;
  props: Record<string, unknown>;
  description?: string;
}

export interface ComponentSpec {
  name: string;
  category: ComponentCategory;
  props: PropDefinition[];
  slots?: SlotDefinition[];
  variants?: string[];
  description: string;
  example: string;
}

export interface ColorTokens {
  primary: string;
  primaryForeground: string;
  secondary: string;
  secondaryForeground: string;
  muted: string;
  mutedForeground: string;
  accent: string;
  accentForeground: string;
  destructive: string;
  destructiveForeground: string;
  border: string;
  input: string;
  ring: string;
  background: string;
  foreground: string;
  card: string;
  cardForeground: string;
  popover: string;
  popoverForeground: string;
}

export interface SpacingScale {
  [key: string]: string | undefined;
}

export interface TypographyScale {
  [key: string]: {
    fontSize: string;
    lineHeight: string;
    fontWeight: string;
    letterSpacing?: string;
  } | undefined;
}

export interface ThemeConfig {
  colors: ColorTokens;
  spacing: SpacingScale;
  typography: TypographyScale;
  borderRadius: Record<string, string>;
  shadows: Record<string, string>;
  breakpoints: Record<string, string>;
}

export interface ThemeCustomization {
  colors?: Partial<ColorTokens>;
  spacing?: Partial<SpacingScale>;
  typography?: Partial<TypographyScale>;
  borderRadius?: Record<string, string>;
  shadows?: Record<string, string>;
}

export interface DesignSystemConfig {
  name: string;
  version: string;
  components: ComponentSpec[];
  theme: ThemeConfig;
  dependencies: string[];
}

export interface DesignSystemRegistry {
  [key: string]: DesignSystemConfig;
}

export interface GeneratedComponent {
  componentName: string;
  code: string;
  language: "tsx" | "jsx" | "vue" | "svelte";
  dependencies: string[];
  theme: string;
}

export interface ComponentGenerationRequest {
  componentName: string;
  designSystem: DesignSystemName;
  variant?: string;
  props?: Record<string, unknown>;
  themeOverrides?: Partial<ThemeConfig>;
  customClassName?: string;
}

export interface ComponentGenerationResult {
  component: GeneratedComponent;
  warnings: string[];
  suggestions: string[];
}

export interface DesignSystemMetadata {
  name: DesignSystemName;
  displayName: string;
  version: string;
  description: string;
  url: string;
  license: string;
}

export interface DesignSystem {
  metadata: DesignSystemMetadata;
  components: ComponentSpec[];
  theme: ThemeConfig;
  dependencies: string[];
  setupCommands: string[];
}
