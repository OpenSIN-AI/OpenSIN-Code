import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import type { TemplateOptions, AgentCreateResult } from './types.js';

const AGENT_TEMPLATE = `import { Agent, AgentBuilder } from '@opensin/agent-sdk';
import { createTool } from '@opensin/agent-sdk';

const agent = new AgentBuilder()
  .setId('{{AGENT_ID}}')
  .setName('{{AGENT_NAME}}')
  .setDescription('{{AGENT_DESCRIPTION}}')
  .setVersion('{{AGENT_VERSION}}')
  .build();

async function main() {
  await agent.start();
  console.log('Agent {{AGENT_NAME}} started');
  await agent.stop();
}

main().catch(console.error);
`;

const PACKAGE_JSON_TEMPLATE = `{
  "name": "{{AGENT_NAME}}",
  "version": "{{AGENT_VERSION}}",
  "type": "module",
  "scripts": {
    "build": "tsc",
    "start": "node dist/index.js",
    "dev": "tsc --watch"
  },
  "dependencies": {
    "@opensin/agent-sdk": "^0.1.0"
  },
  "devDependencies": {
    "typescript": "^5.4.0"
  }
}
`;

const TSCONFIG_TEMPLATE = `{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "declaration": true
  },
  "include": ["src/**/*"]
}
`;

export async function generateTemplate(options: TemplateOptions): Promise<string> {
  const {
    agentName,
    description = 'A custom OpenSIN agent',
    author = 'unknown',
    version = '0.1.0',
    outputDir = './' + agentName.toLowerCase().replace(/\s+/g, '-'),
  } = options;

  const agentId = agentName.toLowerCase().replace(/\s+/g, '-');

  const files: Record<string, string> = {
    'src/index.ts': AGENT_TEMPLATE
      .replace('{{AGENT_ID}}', agentId)
      .replace('{{AGENT_NAME}}', agentName)
      .replace('{{AGENT_DESCRIPTION}}', description)
      .replace('{{AGENT_VERSION}}', version),
    'package.json': PACKAGE_JSON_TEMPLATE
      .replace('{{AGENT_NAME}}', agentId)
      .replace('{{AGENT_VERSION}}', version),
    'tsconfig.json': TSCONFIG_TEMPLATE,
    'README.md': `# ${agentName}\n\n${description}\n\nAuthor: ${author}\nVersion: ${version}\n`,
    '.gitignore': 'node_modules/\ndist/\n',
  };

  const absDir = resolve(outputDir);
  await mkdir(join(absDir, 'src'), { recursive: true });

  for (const [filename, content] of Object.entries(files)) {
    await writeFile(join(absDir, filename), content, 'utf-8');
  }

  return absDir;
}

export async function createAgentFromTemplate(
  options: TemplateOptions
): Promise<AgentCreateResult> {
  try {
    const outputDir = await generateTemplate(options);

    const files = [
      'src/index.ts',
      'package.json',
      'tsconfig.json',
      'README.md',
      '.gitignore',
    ];

    return {
      success: true,
      message: `Agent "${options.agentName}" created at ${outputDir}`,
      files,
      outputDir,
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : String(error),
      files: [],
      outputDir: options.outputDir || './' + options.agentName.toLowerCase().replace(/\s+/g, '-'),
    };
  }
}
