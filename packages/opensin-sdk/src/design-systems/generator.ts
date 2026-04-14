/** Design System Generator — generate components from design system specs */

import type {
  ComponentSpec,
  DesignSystemConfig,
  GeneratedComponent,
  ThemeConfig,
  ThemeCustomization,
} from './types';
import { getDesignSystem } from './registry';
import { loadDesignSystem, mergeTheme } from './loader';

export async function generateComponent(
  designSystemName: string,
  componentName: string,
  customization?: ThemeCustomization,
): Promise<GeneratedComponent | null> {
  const ds = await loadDesignSystem(designSystemName);
  if (!ds) {
    return null;
  }

  const spec = ds.components.find(
    (c) => c.name.toLowerCase() === componentName.toLowerCase(),
  );
  if (!spec) {
    return null;
  }

  const theme = customization ? mergeTheme(ds.theme, customization) : ds.theme;
  const code = generateComponentCode(spec, theme, designSystemName);

  return {
    componentName: spec.name,
    code,
    language: 'tsx' as const,
    dependencies: ds.dependencies,
    theme: designSystemName,
  };
}

function generateComponentCode(
  spec: ComponentSpec,
  theme: ThemeConfig,
  designSystem: string,
): string {
  switch (designSystem) {
    case 'shadcn':
      return generateShadcnComponent(spec, theme);
    case 'mui':
      return generateMUIComponent(spec, theme);
    case 'chakra':
      return generateChakraComponent(spec, theme);
    case 'tailwind':
      return generateTailwindComponent(spec, theme);
    default:
      return generateGenericComponent(spec, theme);
  }
}

function generateShadcnComponent(spec: ComponentSpec, theme: ThemeConfig): string {
  const propsInterface = spec.props
    .map((p) => `  ${p.name}${p.required ? '' : '?'}: ${p.type};`)
    .join('\n');

  return `import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

interface ${spec.name}Props extends React.HTMLAttributes<HTMLElement>, VariantProps<typeof ${spec.name.toLowerCase()}Variants> {
${propsInterface}
  asChild?: boolean;
}

const ${spec.name.toLowerCase()}Variants = cva(
  "base-classes-here",
  {
    variants: {
      variant: {
        ${(spec.variants || ['default']).map((v) => `${v}: "variant-classes-here"`).join(',\n        ')}
      },
      size: {
        sm: "text-sm px-3 py-1.5",
        md: "text-base px-4 py-2",
        lg: "text-lg px-6 py-3",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  }
);

export function ${spec.name}({ className, variant, size, asChild = false, ...props }: ${spec.name}Props) {
  const Comp = asChild ? Slot : "${spec.category === 'form' ? 'button' : 'div'}";
  return (
    <Comp
      className={cn(${spec.name.toLowerCase()}Variants({ variant, size }), className)}
      {...props}
    />
  );
}`;
}

function generateMUIComponent(spec: ComponentSpec, theme: ThemeConfig): string {
  return `import * as React from 'react';
import { ${spec.name} as MUI${spec.name} } from '@mui/material';

interface ${spec.name}Props {
${spec.props.map((p) => `  ${p.name}${p.required ? '' : '?'}: ${p.type};`).join('\n')}
}

export function ${spec.name}(props: ${spec.name}Props) {
  return <MUI${spec.name} {...props} />;
}`;
}

function generateChakraComponent(spec: ComponentSpec, theme: ThemeConfig): string {
  return `import * as React from 'react';
import { ${spec.name} as Chakra${spec.name} } from '@chakra-ui/react';

interface ${spec.name}Props {
${spec.props.map((p) => `  ${p.name}${p.required ? '' : '?'}: ${p.type};`).join('\n')}
}

export function ${spec.name}(props: ${spec.name}Props) {
  return <Chakra${spec.name} {...props} />;
}`;
}

function generateTailwindComponent(spec: ComponentSpec, theme: ThemeConfig): string {
  const className = generateTailwindClasses(spec, theme);

  return `import * as React from 'react';

interface ${spec.name}Props {
${spec.props.map((p) => `  ${p.name}${p.required ? '' : '?'}: ${p.type};`).join('\n')}
  className?: string;
}

export function ${spec.name}({ className, ...props }: ${spec.name}Props) {
  return (
    <${spec.category === 'form' ? 'button' : 'div'}
      className="${className} {className}"
      {...props}
    />
  );
}`;
}

function generateTailwindClasses(spec: ComponentSpec, theme: ThemeConfig): string {
  const base: string[] = [];

  if (spec.category === 'form') {
    base.push('px-4', 'py-2', 'rounded-lg', 'font-medium', 'transition-colors', 'focus:outline-none', 'focus:ring-2');
  } else if (spec.category === 'data-display') {
    base.push('bg-white', 'rounded-lg', 'shadow-md', 'p-6');
  } else if (spec.category === 'overlay') {
    base.push('fixed', 'inset-0', 'z-50', 'flex', 'items-center', 'justify-center');
  } else if (spec.category === 'layout') {
    base.push('flex', 'flex-col');
  } else {
    base.push('p-4');
  }

  return base.join(' ');
}

function generateGenericComponent(spec: ComponentSpec, theme: ThemeConfig): string {
  return `import * as React from 'react';

interface ${spec.name}Props {
${spec.props.map((p) => `  ${p.name}${p.required ? '' : '?'}: ${p.type};`).join('\n')}
}

export function ${spec.name}(props: ${spec.name}Props) {
  // TODO: Implement ${spec.name} component
  return <div>${spec.name}</div>;
}`;
}

export async function generateAllComponents(
  designSystemName: string,
  customization?: ThemeCustomization,
): Promise<GeneratedComponent[]> {
  const ds = await loadDesignSystem(designSystemName);
  if (!ds) {
    return [];
  }

  const components: GeneratedComponent[] = [];
  for (const spec of ds.components) {
    const component = await generateComponent(designSystemName, spec.name, customization);
    if (component) {
      components.push(component);
    }
  }

  return components;
}
