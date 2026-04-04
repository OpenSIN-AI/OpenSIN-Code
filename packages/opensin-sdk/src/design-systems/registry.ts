/** Design System Registry — pre-built design systems like Bolt.new */

import type { DesignSystemConfig, DesignSystemRegistry as DSRegistry } from './types.js';

const shadcn: DesignSystemConfig = {
  name: 'shadcn',
  version: '1.0.0',
  components: [
    {
      name: 'Button',
      category: 'form',
      props: [
        { name: 'variant', type: '"default" | "destructive" | "outline" | "secondary" | "ghost" | "link"', required: false, defaultValue: 'default', description: 'Button visual variant' },
        { name: 'size', type: '"default" | "sm" | "lg" | "icon"', required: false, defaultValue: 'default', description: 'Button size' },
        { name: 'disabled', type: 'boolean', required: false, defaultValue: false, description: 'Disabled state' },
      ],
      variants: ['default', 'destructive', 'outline', 'secondary', 'ghost', 'link'],
      description: 'Accessible button component with variants',
      example: '<Button variant="default" size="lg">Click me</Button>',
    },
    {
      name: 'Card',
      category: 'data-display',
      props: [
        { name: 'className', type: 'string', required: false, description: 'Additional CSS classes' },
      ],
      description: 'Card container with header, content, and footer slots',
      example: '<Card><CardHeader><CardTitle>Title</CardTitle></CardHeader><CardContent>Content</CardContent></Card>',
    },
    {
      name: 'Dialog',
      category: 'overlay',
      props: [
        { name: 'open', type: 'boolean', required: false, defaultValue: false, description: 'Controlled open state' },
        { name: 'onOpenChange', type: '(open: boolean) => void', required: false, description: 'Open state change handler' },
      ],
      description: 'Accessible modal dialog',
      example: '<Dialog><DialogTrigger>Open</DialogTrigger><DialogContent><DialogHeader><DialogTitle>Title</DialogTitle></DialogHeader></DialogContent></Dialog>',
    },
    {
      name: 'Input',
      category: 'form',
      props: [
        { name: 'type', type: 'string', required: false, defaultValue: 'text', description: 'Input type' },
        { name: 'placeholder', type: 'string', required: false, description: 'Placeholder text' },
        { name: 'disabled', type: 'boolean', required: false, defaultValue: false, description: 'Disabled state' },
      ],
      description: 'Text input component',
      example: '<Input type="email" placeholder="Enter email" />',
    },
    {
      name: 'Table',
      category: 'data-display',
      props: [
        { name: 'className', type: 'string', required: false, description: 'Additional CSS classes' },
      ],
      description: 'Data table with header, body, and footer',
      example: '<Table><TableHeader><TableRow><TableHead>Name</TableHead></TableRow></TableHeader><TableBody><TableRow><TableCell>Data</TableCell></TableRow></TableBody></Table>',
    },
  ],
  theme: {
    colors: {
      primary: 'hsl(222.2 47.4% 11.2%)',
      primaryForeground: 'hsl(210 40% 98%)',
      secondary: 'hsl(210 40% 96.1%)',
      secondaryForeground: 'hsl(222.2 47.4% 11.2%)',
      muted: 'hsl(210 40% 96.1%)',
      mutedForeground: 'hsl(215.4 16.3% 46.9%)',
      accent: 'hsl(210 40% 96.1%)',
      accentForeground: 'hsl(222.2 47.4% 11.2%)',
      destructive: 'hsl(0 84.2% 60.2%)',
      destructiveForeground: 'hsl(210 40% 98%)',
      border: 'hsl(214.3 31.8% 91.4%)',
      input: 'hsl(214.3 31.8% 91.4%)',
      ring: 'hsl(222.2 84% 4.9%)',
      background: 'hsl(0 0% 100%)',
      foreground: 'hsl(222.2 84% 4.9%)',
      card: 'hsl(0 0% 100%)',
      cardForeground: 'hsl(222.2 84% 4.9%)',
      popover: 'hsl(0 0% 100%)',
      popoverForeground: 'hsl(222.2 84% 4.9%)',
    },
    spacing: { '0': '0', '1': '0.25rem', '2': '0.5rem', '3': '0.75rem', '4': '1rem', '6': '1.5rem', '8': '2rem' },
    typography: {
      xs: { fontSize: '0.75rem', lineHeight: '1rem', fontWeight: '400' },
      sm: { fontSize: '0.875rem', lineHeight: '1.25rem', fontWeight: '400' },
      base: { fontSize: '1rem', lineHeight: '1.5rem', fontWeight: '400' },
      lg: { fontSize: '1.125rem', lineHeight: '1.75rem', fontWeight: '500' },
      xl: { fontSize: '1.25rem', lineHeight: '1.75rem', fontWeight: '600' },
      '2xl': { fontSize: '1.5rem', lineHeight: '2rem', fontWeight: '700' },
    },
    borderRadius: { sm: '0.125rem', md: '0.375rem', lg: '0.5rem', xl: '0.75rem', full: '9999px' },
    shadows: { sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)', md: '0 4px 6px -1px rgb(0 0 0 / 0.1)', lg: '0 10px 15px -3px rgb(0 0 0 / 0.1)' },
    breakpoints: { sm: '640px', md: '768px', lg: '1024px', xl: '1280px' },
  },
  dependencies: ['@radix-ui/react-dialog', '@radix-ui/react-slot', 'class-variance-authority', 'clsx', 'tailwind-merge'],
};

const materialUI: DesignSystemConfig = {
  name: 'mui',
  version: '5.0.0',
  components: [
    {
      name: 'Button',
      category: 'form',
      props: [
        { name: 'variant', type: '"text" | "outlined" | "contained"', required: false, defaultValue: 'text', description: 'Button variant' },
        { name: 'color', type: '"primary" | "secondary" | "error" | "info" | "success" | "warning"', required: false, defaultValue: 'primary', description: 'Button color' },
        { name: 'size', type: '"small" | "medium" | "large"', required: false, defaultValue: 'medium', description: 'Button size' },
      ],
      variants: ['text', 'outlined', 'contained'],
      description: 'Material Design button',
      example: '<Button variant="contained" color="primary">Click me</Button>',
    },
    {
      name: 'Card',
      category: 'data-display',
      props: [
        { name: 'raised', type: 'boolean', required: false, defaultValue: true, description: 'Whether the card is elevated' },
      ],
      description: 'Material Design card container',
      example: '<Card><CardHeader title="Title" /><CardContent>Content</CardContent><CardActions><Button>Action</Button></CardActions></Card>',
    },
    {
      name: 'TextField',
      category: 'form',
      props: [
        { name: 'label', type: 'string', required: false, description: 'Input label' },
        { name: 'variant', type: '"outlined" | "filled" | "standard"', required: false, defaultValue: 'outlined', description: 'TextField variant' },
        { name: 'error', type: 'boolean', required: false, defaultValue: false, description: 'Error state' },
      ],
      description: 'Material Design text input',
      example: '<TextField label="Email" variant="outlined" fullWidth />',
    },
    {
      name: 'Dialog',
      category: 'overlay',
      props: [
        { name: 'open', type: 'boolean', required: false, defaultValue: false, description: 'Controlled open state' },
        { name: 'onClose', type: '() => void', required: false, description: 'Close handler' },
      ],
      description: 'Material Design dialog',
      example: '<Dialog open={open} onClose={onClose}><DialogTitle>Title</DialogTitle><DialogContent>Content</DialogContent><DialogActions><Button>Close</Button></DialogActions></Dialog>',
    },
  ],
  theme: {
    colors: {
      primary: '#1976d2',
      primaryForeground: '#ffffff',
      secondary: '#9c27b0',
      secondaryForeground: '#ffffff',
      muted: '#f5f5f5',
      mutedForeground: '#757575',
      accent: '#ff4081',
      accentForeground: '#ffffff',
      destructive: '#f44336',
      destructiveForeground: '#ffffff',
      border: '#e0e0e0',
      input: '#e0e0e0',
      ring: '#1976d2',
      background: '#ffffff',
      foreground: '#212121',
      card: '#ffffff',
      cardForeground: '#212121',
      popover: '#ffffff',
      popoverForeground: '#212121',
    },
    spacing: { '0': '0', '1': '8px', '2': '16px', '3': '24px', '4': '32px', '6': '48px', '8': '64px' },
    typography: {
      xs: { fontSize: '0.75rem', lineHeight: '1rem', fontWeight: '400' },
      sm: { fontSize: '0.875rem', lineHeight: '1.25rem', fontWeight: '400' },
      base: { fontSize: '1rem', lineHeight: '1.5rem', fontWeight: '400' },
      lg: { fontSize: '1.125rem', lineHeight: '1.75rem', fontWeight: '500' },
      xl: { fontSize: '1.25rem', lineHeight: '1.75rem', fontWeight: '600' },
      '2xl': { fontSize: '1.5rem', lineHeight: '2rem', fontWeight: '700' },
    },
    borderRadius: { sm: '4px', md: '8px', lg: '12px', xl: '16px', full: '9999px' },
    shadows: { sm: '0 2px 1px -1px rgba(0,0,0,0.2)', md: '0 3px 5px 2px rgba(0,0,0,0.3)', lg: '0 5px 15px 8px rgba(0,0,0,0.24)' },
    breakpoints: { sm: '600px', md: '900px', lg: '1200px', xl: '1536px' },
  },
  dependencies: ['@mui/material', '@emotion/react', '@emotion/styled'],
};

const chakra: DesignSystemConfig = {
  name: 'chakra',
  version: '2.0.0',
  components: [
    {
      name: 'Button',
      category: 'form',
      props: [
        { name: 'variant', type: '"solid" | "outline" | "ghost" | "link"', required: false, defaultValue: 'solid', description: 'Button variant' },
        { name: 'colorScheme', type: 'string', required: false, defaultValue: 'gray', description: 'Color scheme' },
        { name: 'size', type: '"xs" | "sm" | "md" | "lg"', required: false, defaultValue: 'md', description: 'Button size' },
      ],
      variants: ['solid', 'outline', 'ghost', 'link'],
      description: 'Chakra UI button',
      example: '<Button colorScheme="blue" size="lg">Click me</Button>',
    },
    {
      name: 'Box',
      category: 'layout',
      props: [
        { name: 'p', type: 'number | string', required: false, description: 'Padding' },
        { name: 'm', type: 'number | string', required: false, description: 'Margin' },
        { name: 'bg', type: 'string', required: false, description: 'Background color' },
      ],
      description: 'Generic container component',
      example: '<Box p={4} bg="gray.100" borderRadius="md">Content</Box>',
    },
    {
      name: 'Modal',
      category: 'overlay',
      props: [
        { name: 'isOpen', type: 'boolean', required: false, defaultValue: false, description: 'Controlled open state' },
        { name: 'onClose', type: '() => void', required: false, description: 'Close handler' },
      ],
      description: 'Chakra UI modal dialog',
      example: '<Modal isOpen={isOpen} onClose={onClose}><ModalOverlay /><ModalContent><ModalHeader>Title</ModalHeader><ModalBody>Content</ModalBody></ModalContent></Modal>',
    },
  ],
  theme: {
    colors: {
      primary: '#3182ce',
      primaryForeground: '#ffffff',
      secondary: '#805ad5',
      secondaryForeground: '#ffffff',
      muted: '#edf2f7',
      mutedForeground: '#718096',
      accent: '#d53f8c',
      accentForeground: '#ffffff',
      destructive: '#e53e3e',
      destructiveForeground: '#ffffff',
      border: '#e2e8f0',
      input: '#e2e8f0',
      ring: '#3182ce',
      background: '#ffffff',
      foreground: '#1a202c',
      card: '#ffffff',
      cardForeground: '#1a202c',
      popover: '#ffffff',
      popoverForeground: '#1a202c',
    },
    spacing: { '0': '0', '1': '0.25rem', '2': '0.5rem', '3': '0.75rem', '4': '1rem', '6': '1.5rem', '8': '2rem' },
    typography: {
      xs: { fontSize: '0.75rem', lineHeight: '1rem', fontWeight: '400' },
      sm: { fontSize: '0.875rem', lineHeight: '1.25rem', fontWeight: '400' },
      base: { fontSize: '1rem', lineHeight: '1.5rem', fontWeight: '400' },
      lg: { fontSize: '1.125rem', lineHeight: '1.75rem', fontWeight: '500' },
      xl: { fontSize: '1.25rem', lineHeight: '1.75rem', fontWeight: '600' },
      '2xl': { fontSize: '1.5rem', lineHeight: '2rem', fontWeight: '700' },
    },
    borderRadius: { sm: '0.125rem', md: '0.375rem', lg: '0.5rem', xl: '0.75rem', full: '9999px' },
    shadows: { sm: '0 1px 3px rgba(0,0,0,0.12)', md: '0 4px 6px rgba(0,0,0,0.1)', lg: '0 10px 15px rgba(0,0,0,0.1)' },
    breakpoints: { sm: '30em', md: '48em', lg: '62em', xl: '80em' },
  },
  dependencies: ['@chakra-ui/react', '@emotion/react', '@emotion/styled', 'framer-motion'],
};

const tailwind: DesignSystemConfig = {
  name: 'tailwind',
  version: '3.0.0',
  components: [
    {
      name: 'Button',
      category: 'form',
      props: [
        { name: 'variant', type: '"primary" | "secondary" | "outline"', required: false, defaultValue: 'primary', description: 'Button variant' },
        { name: 'size', type: '"sm" | "md" | "lg"', required: false, defaultValue: 'md', description: 'Button size' },
      ],
      variants: ['primary', 'secondary', 'outline'],
      description: 'Tailwind CSS button with utility classes',
      example: '<button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Click me</button>',
    },
    {
      name: 'Card',
      category: 'data-display',
      props: [
        { name: 'className', type: 'string', required: false, description: 'Additional CSS classes' },
      ],
      description: 'Tailwind CSS card container',
      example: '<div className="bg-white rounded-lg shadow-md p-6"><h3 className="text-lg font-semibold">Title</h3><p>Content</p></div>',
    },
    {
      name: 'Input',
      category: 'form',
      props: [
        { name: 'type', type: 'string', required: false, defaultValue: 'text', description: 'Input type' },
        { name: 'placeholder', type: 'string', required: false, description: 'Placeholder text' },
      ],
      description: 'Tailwind CSS text input',
      example: '<input type="text" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Enter text" />',
    },
  ],
  theme: {
    colors: {
      primary: '#3b82f6',
      primaryForeground: '#ffffff',
      secondary: '#6366f1',
      secondaryForeground: '#ffffff',
      muted: '#f3f4f6',
      mutedForeground: '#6b7280',
      accent: '#f59e0b',
      accentForeground: '#ffffff',
      destructive: '#ef4444',
      destructiveForeground: '#ffffff',
      border: '#d1d5db',
      input: '#d1d5db',
      ring: '#3b82f6',
      background: '#ffffff',
      foreground: '#111827',
      card: '#ffffff',
      cardForeground: '#111827',
      popover: '#ffffff',
      popoverForeground: '#111827',
    },
    spacing: { '0': '0', '1': '0.25rem', '2': '0.5rem', '3': '0.75rem', '4': '1rem', '6': '1.5rem', '8': '2rem' },
    typography: {
      xs: { fontSize: '0.75rem', lineHeight: '1rem', fontWeight: '400' },
      sm: { fontSize: '0.875rem', lineHeight: '1.25rem', fontWeight: '400' },
      base: { fontSize: '1rem', lineHeight: '1.5rem', fontWeight: '400' },
      lg: { fontSize: '1.125rem', lineHeight: '1.75rem', fontWeight: '500' },
      xl: { fontSize: '1.25rem', lineHeight: '1.75rem', fontWeight: '600' },
      '2xl': { fontSize: '1.5rem', lineHeight: '2rem', fontWeight: '700' },
    },
    borderRadius: { sm: '0.125rem', md: '0.375rem', lg: '0.5rem', xl: '0.75rem', full: '9999px' },
    shadows: { sm: '0 1px 2px 0 rgba(0,0,0,0.05)', md: '0 4px 6px -1px rgba(0,0,0,0.1)', lg: '0 10px 15px -3px rgba(0,0,0,0.1)' },
    breakpoints: { sm: '640px', md: '768px', lg: '1024px', xl: '1280px' },
  },
  dependencies: ['tailwindcss', 'autoprefixer', 'postcss'],
};

export const designSystemRegistry: DSRegistry = {
  shadcn,
  mui: materialUI,
  chakra,
  tailwind,
};

export function getDesignSystem(name: string): DesignSystemConfig | undefined {
  return designSystemRegistry[name];
}

export function listDesignSystems(): string[] {
  return Object.keys(designSystemRegistry);
}

export function getComponentSpec(designSystem: string, componentName: string) {
  const ds = designSystemRegistry[designSystem];
  if (!ds) return undefined;
  return ds.components.find((c) => c.name.toLowerCase() === componentName.toLowerCase());
}
