/**
 * Design System Registry — manages pre-built design systems
 */

import type {
  ComponentSpec,
  DesignSystem,
  DesignSystemName,
  ThemeConfig,
} from "./types.js";

const shadcnTheme: ThemeConfig = {
  colors: {
    primary: "hsl(222.2 47.4% 11.2%)",
    secondary: "hsl(210 40% 96.1%)",
    background: "hsl(0 0% 100%)",
    foreground: "hsl(222.2 84% 4.9%)",
    muted: "hsl(210 40% 96.1%)",
    accent: "hsl(210 40% 96.1%)",
    destructive: "hsl(0 84.2% 60.2%)",
    border: "hsl(214.3 31.8% 91.4%)",
  },
  spacing: { xs: "0.25rem", sm: "0.5rem", md: "1rem", lg: "1.5rem", xl: "2rem" },
  borderRadius: { sm: "0.3rem", md: "0.5rem", lg: "0.75rem", full: "9999px" },
  typography: {
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    fontSize: { xs: "0.75rem", sm: "0.875rem", base: "1rem", lg: "1.125rem", xl: "1.25rem", "2xl": "1.5rem" },
    fontWeight: { normal: 400, medium: 500, semibold: 600, bold: 700 },
  },
};

const materialUITheme: ThemeConfig = {
  colors: {
    primary: "#1976d2",
    secondary: "#9c27b0",
    background: "#ffffff",
    foreground: "#212121",
    muted: "#f5f5f5",
    accent: "#ff9800",
    destructive: "#f44336",
    border: "#e0e0e0",
  },
  spacing: { xs: "4px", sm: "8px", md: "16px", lg: "24px", xl: "32px" },
  borderRadius: { sm: "4px", md: "8px", lg: "12px", full: "50%" },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    fontSize: { xs: "0.75rem", sm: "0.875rem", base: "1rem", lg: "1.25rem", xl: "1.5rem", "2xl": "2rem" },
    fontWeight: { normal: 400, medium: 500, semibold: 600, bold: 700 },
  },
};

const chakraTheme: ThemeConfig = {
  colors: {
    primary: "#3182ce",
    secondary: "#805ad5",
    background: "#ffffff",
    foreground: "#1a202c",
    muted: "#edf2f7",
    accent: "#ed8936",
    destructive: "#e53e3e",
    border: "#e2e8f0",
  },
  spacing: { xs: "0.25rem", sm: "0.5rem", md: "1rem", lg: "1.5rem", xl: "2rem" },
  borderRadius: { sm: "0.125rem", md: "0.25rem", lg: "0.5rem", full: "9999px" },
  typography: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    fontSize: { xs: "0.75rem", sm: "0.875rem", base: "1rem", lg: "1.125rem", xl: "1.25rem", "2xl": "1.5rem" },
    fontWeight: { normal: 400, medium: 500, semibold: 600, bold: 700 },
  },
};

const tailwindTheme: ThemeConfig = {
  colors: {
    primary: "#3b82f6",
    secondary: "#6366f1",
    background: "#ffffff",
    foreground: "#111827",
    muted: "#f3f4f6",
    accent: "#f59e0b",
    destructive: "#ef4444",
    border: "#e5e7eb",
  },
  spacing: { xs: "0.25rem", sm: "0.5rem", md: "1rem", lg: "1.5rem", xl: "2rem" },
  borderRadius: { sm: "0.125rem", md: "0.25rem", lg: "0.5rem", full: "9999px" },
  typography: {
    fontFamily:
      'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
    fontSize: { xs: "0.75rem", sm: "0.875rem", base: "1rem", lg: "1.125rem", xl: "1.25rem", "2xl": "1.5rem" },
    fontWeight: { normal: 400, medium: 500, semibold: 600, bold: 700 },
  },
};

const shadcnComponents: ComponentSpec[] = [
  {
    name: "Button",
    description: "Interactive button with variants",
    category: "actions",
    variants: [
      { name: "default", className: "bg-primary text-primary-foreground", props: { variant: "default" } },
      { name: "secondary", className: "bg-secondary text-secondary-foreground", props: { variant: "secondary" } },
      { name: "outline", className: "border border-input bg-background", props: { variant: "outline" } },
      { name: "ghost", className: "hover:bg-accent", props: { variant: "ghost" } },
      { name: "destructive", className: "bg-destructive text-destructive-foreground", props: { variant: "destructive" } },
    ],
    defaultProps: { variant: "default", size: "default" },
    requiredProps: ["children"],
    imports: ["import { Button } from '@/components/ui/button'"],
    template: `<Button variant="{{variant}}" size="{{size}}" className="{{className}}">\n  {{children}}\n</Button>`,
  },
  {
    name: "Card",
    description: "Container card component",
    category: "layout",
    variants: [
      { name: "default", className: "rounded-lg border bg-card", props: {} },
      { name: "elevated", className: "rounded-lg border bg-card shadow-lg", props: { elevated: true } },
    ],
    defaultProps: {},
    requiredProps: ["children"],
    imports: ["import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'"],
    template: `<Card>\n  <CardHeader>\n    <CardTitle>{{title}}</CardTitle>\n  </CardHeader>\n  <CardContent>\n    {{children}}\n  </CardContent>\n</Card>`,
  },
  {
    name: "Input",
    description: "Text input field",
    category: "forms",
    variants: [
      { name: "default", className: "flex h-10 w-full rounded-md border border-input", props: {} },
      { name: "error", className: "flex h-10 w-full rounded-md border border-destructive", props: { error: true } },
    ],
    defaultProps: { type: "text" },
    requiredProps: [],
    imports: ["import { Input } from '@/components/ui/input'"],
    template: `<Input type="{{type}}" placeholder="{{placeholder}}" value="{{value}}" onChange="{{onChange}}" />`,
  },
];

const materialUIComponents: ComponentSpec[] = [
  {
    name: "Button",
    description: "Material Design button",
    category: "actions",
    variants: [
      { name: "contained", props: { variant: "contained" } },
      { name: "outlined", props: { variant: "outlined" } },
      { name: "text", props: { variant: "text" } },
    ],
    defaultProps: { variant: "contained", color: "primary" },
    requiredProps: ["children"],
    imports: ["import Button from '@mui/material/Button'"],
    template: `<Button variant="{{variant}}" color="{{color}}" onClick="{{onClick}}">\n  {{children}}\n</Button>`,
  },
  {
    name: "TextField",
    description: "Material Design text field",
    category: "forms",
    variants: [
      { name: "outlined", props: { variant: "outlined" } },
      { name: "filled", props: { variant: "filled" } },
      { name: "standard", props: { variant: "standard" } },
    ],
    defaultProps: { variant: "outlined" },
    requiredProps: [],
    imports: ["import TextField from '@mui/material/TextField'"],
    template: `<TextField\n  variant="{{variant}}"\n  label="{{label}}"\n  value="{{value}}"\n  onChange="{{onChange}}"\n  error="{{error}}"\n  helperText="{{helperText}}"\n/>`,
  },
];

const chakraComponents: ComponentSpec[] = [
  {
    name: "Button",
    description: "Chakra UI button",
    category: "actions",
    variants: [
      { name: "solid", props: { variant: "solid" } },
      { name: "outline", props: { variant: "outline" } },
      { name: "ghost", props: { variant: "ghost" } },
      { name: "link", props: { variant: "link" } },
    ],
    defaultProps: { variant: "solid", colorScheme: "blue" },
    requiredProps: ["children"],
    imports: ["import { Button } from '@chakra-ui/react'"],
    template: `<Button variant="{{variant}}" colorScheme="{{colorScheme}}" onClick="{{onClick}}">\n  {{children}}\n</Button>`,
  },
  {
    name: "Input",
    description: "Chakra UI input",
    category: "forms",
    variants: [
      { name: "outline", props: { variant: "outline" } },
      { name: "filled", props: { variant: "filled" } },
      { name: "flushed", props: { variant: "flushed" } },
    ],
    defaultProps: { variant: "outline" },
    requiredProps: [],
    imports: ["import { Input } from '@chakra-ui/react'"],
    template: `<Input\n  variant="{{variant}}"\n  placeholder="{{placeholder}}"\n  value="{{value}}"\n  onChange="{{onChange}}"\n  size="{{size}}"\n/>`,
  },
];

const tailwindComponents: ComponentSpec[] = [
  {
    name: "Button",
    description: "Tailwind CSS button with utility classes",
    category: "actions",
    variants: [
      { name: "primary", className: "bg-blue-600 text-white hover:bg-blue-700", props: {} },
      { name: "secondary", className: "bg-gray-200 text-gray-800 hover:bg-gray-300", props: {} },
      { name: "danger", className: "bg-red-600 text-white hover:bg-red-700", props: {} },
    ],
    defaultProps: {},
    requiredProps: ["children"],
    imports: [],
    template: `<button className="{{className}} px-4 py-2 rounded-md font-medium transition-colors">\n  {{children}}\n</button>`,
  },
  {
    name: "Card",
    description: "Tailwind CSS card",
    category: "layout",
    variants: [
      { name: "default", className: "bg-white rounded-lg shadow-md border", props: {} },
      { name: "minimal", className: "bg-white rounded-lg", props: { minimal: true } },
    ],
    defaultProps: {},
    requiredProps: ["children"],
    imports: [],
    template: `<div class="{{className}} p-6">\n  <h3 class="text-lg font-semibold mb-2">{{title}}</h3>\n  <div>{{children}}</div>\n</div>`,
  },
];

const designSystems: Record<DesignSystemName, DesignSystem> = {
  shadcn: {
    metadata: {
      name: "shadcn",
      displayName: "shadcn/ui",
      version: "2.0.0",
      description: "Beautifully designed components built with Radix UI and Tailwind CSS",
      url: "https://ui.shadcn.com",
      license: "MIT",
    },
    components: shadcnComponents,
    theme: shadcnTheme,
    dependencies: ["tailwindcss", "class-variance-authority", "clsx", "tailwind-merge"],
    setupCommands: ["npx shadcn@latest init", "npx shadcn@latest add button card input"],
  },
  "material-ui": {
    metadata: {
      name: "material-ui",
      displayName: "Material UI",
      version: "5.15.0",
      description: "React components for faster and easier web development following Material Design",
      url: "https://mui.com",
      license: "MIT",
    },
    components: materialUIComponents,
    theme: materialUITheme,
    dependencies: ["@mui/material", "@mui/icons-material", "@emotion/react", "@emotion/styled"],
    setupCommands: ["npm install @mui/material @emotion/react @emotion/styled"],
  },
  chakra: {
    metadata: {
      name: "chakra",
      displayName: "Chakra UI",
      version: "2.8.0",
      description: "Simple, modular and accessible component library for React",
      url: "https://chakra-ui.com",
      license: "MIT",
    },
    components: chakraComponents,
    theme: chakraTheme,
    dependencies: ["@chakra-ui/react", "@emotion/react", "@emotion/styled", "framer-motion"],
    setupCommands: ["npm install @chakra-ui/react @emotion/react @emotion/styled framer-motion"],
  },
  tailwind: {
    metadata: {
      name: "tailwind",
      displayName: "Tailwind CSS",
      version: "3.4.0",
      description: "A utility-first CSS framework for rapid UI development",
      url: "https://tailwindcss.com",
      license: "MIT",
    },
    components: tailwindComponents,
    theme: tailwindTheme,
    dependencies: ["tailwindcss", "autoprefixer", "postcss"],
    setupCommands: ["npx tailwindcss init -p"],
  },
};

export class DesignSystemRegistry {
  private systems: Map<DesignSystemName, DesignSystem>;

  constructor() {
    this.systems = new Map(Object.entries(designSystems) as [DesignSystemName, DesignSystem][]);
  }

  list(): DesignSystemName[] {
    return Array.from(this.systems.keys());
  }

  get(name: DesignSystemName): DesignSystem | undefined {
    return this.systems.get(name);
  }

  getComponent(name: DesignSystemName, componentName: string): ComponentSpec | undefined {
    const system = this.systems.get(name);
    if (!system) return undefined;
    return system.components.find((c) => c.name.toLowerCase() === componentName.toLowerCase());
  }

  getComponentsByCategory(name: DesignSystemName, category: string): ComponentSpec[] {
    const system = this.systems.get(name);
    if (!system) return [];
    return system.components.filter((c) => c.category === category);
  }

  getAllComponents(name: DesignSystemName): ComponentSpec[] {
    const system = this.systems.get(name);
    return system?.components ?? [];
  }

  getTheme(name: DesignSystemName): ThemeConfig | undefined {
    return this.systems.get(name)?.theme;
  }

  register(custom: DesignSystem): void {
    this.systems.set(custom.metadata.name, custom);
  }
}

let registry: DesignSystemRegistry | undefined;

export function getDesignSystemRegistry(): DesignSystemRegistry {
  if (!registry) {
    registry = new DesignSystemRegistry();
  }
  return registry;
}
