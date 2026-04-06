import { CommandSpec, CommandCategory } from './index';

async function handleReview(args?: string): Promise<string> {
  return `Code review${args ? ` scope: ${args}` : ''}`;
}

async function handleGit(args?: string): Promise<string> {
  if (!args) return 'Usage: /git <command>';
  return `Git: ${args}`;
}

async function handlePackage(args?: string): Promise<string> {
  if (!args) return 'Usage: /package <install|update|remove> <package>';
  return `Package: ${args || 'list'}`;
}

async function handleDocs(args?: string): Promise<string> {
  return `Docs${args ? `: ${args}` : ''}`;
}

async function handleTest(args?: string): Promise<string> {
  return `Running tests${args ? ` with: ${args}` : ''}`;
}

async function handleBuild(args?: string): Promise<string> {
  return `Building project${args ? ` with: ${args}` : ''}`;
}

async function handleLint(args?: string): Promise<string> {
  return `Linting code${args ? ` with: ${args}` : ''}`;
}

export const projectCommands: CommandSpec[] = [
  {
    name: 'review',
    aliases: [],
    description: 'Code review',
    argumentHint: '[scope]',
    resumeSupported: false,
    category: CommandCategory.Project,
    handler: handleReview,
  },
  {
    name: 'git',
    aliases: [],
    description: 'Git operations',
    argumentHint: '<command>',
    resumeSupported: false,
    category: CommandCategory.Project,
    handler: handleGit,
  },
  {
    name: 'package',
    aliases: [],
    description: 'Package management',
    argumentHint: '<action> [package]',
    resumeSupported: false,
    category: CommandCategory.Project,
    handler: handlePackage,
  },
  {
    name: 'docs',
    aliases: [],
    description: 'Documentation',
    argumentHint: '[topic]',
    resumeSupported: true,
    category: CommandCategory.Project,
    handler: handleDocs,
  },
  {
    name: 'test',
    aliases: [],
    description: 'Run tests',
    argumentHint: '[args]',
    resumeSupported: false,
    category: CommandCategory.Project,
    handler: handleTest,
  },
  {
    name: 'build',
    aliases: [],
    description: 'Build project',
    argumentHint: '[args]',
    resumeSupported: false,
    category: CommandCategory.Project,
    handler: handleBuild,
  },
  {
    name: 'lint',
    aliases: [],
    description: 'Lint code',
    argumentHint: '[args]',
    resumeSupported: false,
    category: CommandCategory.Project,
    handler: handleLint,
  },
];