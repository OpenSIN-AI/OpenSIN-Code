/**
 * Design System Integration — type definitions
 */

export type DesignSystemName = "shadcn" | "material-ui" | "chakra" | "tailwind";

export interface ComponentVariant {
  name: string;
  className?: string;
  props: Record<string, unknown>;
  description?: string;
}

export interface ComponentSpec {
  name: string;
  description: string;
  category: string;
  variants: ComponentVariant[];
  defaultProps: Record<string, unknown>;
  requiredProps: string[];
  imports: string[];
  template: string;
}

export interface ThemeConfig {
  colors: {
    primary: string;
    secondary: string;
    background: string;
    foreground: string;
    muted: string;
    accent: string;
    destructive: string;
    border: string;
  };
  spacing: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
  borderRadius: {
    sm: string;
    md: string;
    lg: string;
    full: string;
  };
  typography: {
    fontFamily: string;
    fontSize: {
      xs: string;
      sm: string;
      base: string;
      lg: string;
      xl: string;
      "2xl": string;
    };
    fontWeight: {
      normal: number;
      medium: number;
      semibold: number;
      bold: number;
    };
  };
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

export interface ComponentGenerationRequest {
  componentName: string;
  designSystem: DesignSystemName;
  variant?: string;
  props?: Record<string, unknown>;
  themeOverrides?: Partial<ThemeConfig>;
  customClassName?: string;
}

export interface GeneratedComponent {
  componentName: string;
  designSystem: DesignSystemName;
  code: string;
  imports: string[];
  dependencies: string[];
  filePath: string;
  theme: ThemeConfig;
}

export interface ComponentGenerationResult {
  component: GeneratedComponent;
  warnings: string[];
  suggestions: string[];
}
