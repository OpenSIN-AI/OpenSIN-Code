import { z } from 'zod';

export type PermissionLevel = 'ReadOnly' | 'WorkspaceWrite' | 'DangerFullAccess';

export interface ToolInputSchema {
  type: 'object';
  properties: Record<string, unknown>;
  required?: string[];
  additionalProperties: boolean;
}

export interface ToolOutput {
  content: Array<{ type: 'text'; text: string }>;
  isError?: boolean;
}

export interface ToolDefinition {
  name: string;
  description: string;
  inputSchema: ToolInputSchema;
  requiredPermission: PermissionLevel;
  handler: (input: unknown) => Promise<ToolOutput>;
}

const createToolOutput = (text: string, isError = false): ToolOutput => ({
  content: [{ type: 'text', text }],
  isError,
});

const createErrorOutput = (text: string): ToolOutput => createToolOutput(text, true);

const readFileSchema = z.object({
  path: z.string(),
  offset: z.number().min(0).optional(),
  limit: z.number().min(1).optional(),
});

const writeFileSchema = z.object({
  path: z.string(),
  content: z.string(),
});

const editFileSchema = z.object({
  path: z.string(),
  old_string: z.string(),
  new_string: z.string(),
  replace_all: z.boolean().optional(),
});

const globSchema = z.object({
  pattern: z.string(),
  path: z.string().optional(),
});

const grepSchema = z.object({
  pattern: z.string(),
  path: z.string().optional(),
  glob: z.string().optional(),
  output_mode: z.string().optional(),
  context: z.number().min(0).optional(),
  '-n': z.boolean().optional(),
  '-i': z.boolean().optional(),
  type: z.string().optional(),
  head_limit: z.number().min(1).optional(),
  multiline: z.boolean().optional(),
});

const webFetchSchema = z.object({
  url: z.string(),
  prompt: z.string().optional(),
});

const webSearchSchema = z.object({
  query: z.string().min(2),
  allowed_domains: z.array(z.string()).optional(),
  blocked_domains: z.array(z.string()).optional(),
});

const todoWriteSchema = z.object({
  todos: z.array(z.object({
    content: z.string(),
    activeForm: z.string(),
    status: z.enum(['pending', 'in_progress', 'completed']),
  })),
});

const agentSchema = z.object({
  description: z.string(),
  prompt: z.string(),
  subagent_type: z.string().optional(),
  name: z.string().optional(),
  model: z.string().optional(),
});

const bashSchema = z.object({
  command: z.string(),
  timeout: z.number().min(1).optional(),
  description: z.string().optional(),
  run_in_background: z.boolean().optional(),
  dangerouslyDisableSandbox: z.boolean().optional(),
});

// DISABLED: async function executeGlob(pattern: string, searchPath?: string): Promise<string[]> {
//   // const { glob } = await import('path'); // Fixed: glob not in path
//   const fs = await import('fs/promises');
//   const path = await import('path');
  
  const basePath = searchPath || process.cwd();
  const matches: string[] = [];
  
  try {
    const files = await fs.readdir(basePath, { withFileTypes: true });
    const searchPattern = pattern.replace(/^\*\*/g, '**').replace(/\*/g, '*');
    
    for (const file of files) {
      const fullPath = path.join(basePath, file.name);
      const relativePath = path.relative(basePath, fullPath);
      
      if (file.isDirectory() && !file.name.startsWith('.') && !file.name.includes('node_modules')) {
        const subMatches = await executeGlob(pattern, fullPath);
        matches.push(...subMatches);
      } else if (file.isFile()) {
        const regex = new RegExp('^' + searchPattern.replace(/\*/g, '.*').replace(/\?/g, '.') + '$');
        if (regex.test(file.name) || searchPattern === file.name || searchPattern === '*') {
          matches.push(relativePath);
        }
      }
    }
  } catch {
    return [];
  }
  
  return matches.slice(0, 100);
}

async function executeGrep(
  pattern: string,
  searchPath?: string,
  options?: {
    glob?: string;
    context?: number;
    '-n'?: boolean;
    '-i'?: boolean;
    type?: string;
    head_limit?: number;
    multiline?: boolean;
  }
): Promise<string> {
  const fs = await import('fs/promises');
  const path = await import('path');
  const basePath = searchPath || process.cwd();
  const results: string[] = [];
  const flags = (options?.['-i'] ? 'i' : '') + (options?.multiline ? 'm' : '');
  const regex = new RegExp(pattern, flags);
  
  async function searchFile(filePath: string): Promise<void> {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const lines = content.split('\n');
      const ctx = options?.context || 0;
      
      for (let i = 0; i < lines.length; i++) {
        if (regex.test(lines[i])) {
          const lineNum = options?.['-n'] ? `${i + 1}: ` : '';
          const before = ctx > 0 ? lines.slice(Math.max(0, i - ctx), i).map(l => `  ${l}`).join('\n') : '';
          const after = ctx > 0 ? lines.slice(i + 1, i + ctx + 1).map(l => `  ${l}`).join('\n') : '';
          
          results.push(`${lineNum}${lines[i]}`);
          if (before) results.push(before);
          if (after) results.push(after);
        }
      }
    } catch {
      // Skip files that can't be read
    }
  }
  
  async function walkDir(dir: string): Promise<void> {
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.name.startsWith('.') || entry.name.includes('node_modules')) continue;
        
        if (entry.isDirectory()) {
          await walkDir(fullPath);
        } else if (entry.isFile()) {
          if (options?.type) {
            const ext = path.extname(entry.name).slice(1);
            if (ext !== options.type) continue;
          }
          await searchFile(fullPath);
        }
      }
    } catch {
      // Skip directories that can't be read
    }
  }
  
  await walkDir(basePath);
  
  const limit = options?.head_limit || 50;
  return results.slice(0, limit).join('\n') || 'No matches found';
}

async function executeWebFetch(url: string, prompt?: string): Promise<string> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'OpenSIN-Code/1.0',
      },
    });
    const text = await response.text();
    
    let content = text;
    if (text.includes('<html')) {
      content = text.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    }
    
    if (prompt?.toLowerCase().includes('title')) {
      const titleMatch = text.match(/<title[^>]*>([^<]+)<\/title>/i);
      if (titleMatch) {
        return `Title: ${titleMatch[1]}\n\nContent preview:\n${content.slice(0, 1000)}`;
      }
    }
    
    return `Fetched ${url}\n\nContent preview:\n${content.slice(0, 2000)}`;
  } catch (error) {
    throw new Error(`Failed to fetch ${url}: ${error}`);
  }
}

async function executeWebSearch(query: string): Promise<string> {
  try {
    const searchUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
    const response = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'OpenSIN-Code/1.0',
      },
    });
    const html = await response.text();
    
    const results: string[] = [];
    const regex = /href="([^"]+)".*?result__a[^>]*>([\s\S]*?)<\/a>/gi;
    let match;
    
    while ((match = regex.exec(html)) !== null && results.length < 8) {
      const url = match[1];
      const title = match[2].replace(/<[^>]*>/g, '').trim();
      if (url && title) {
        results.push(`- [${title}](${url})`);
      }
    }
    
    if (results.length === 0) {
      return `No web search results matched the query "${query}".`;
    }
    
    return `Search results for "${query}". Include a Sources section in the final answer.\n\n${results.join('\n')}`;
  } catch (error) {
    throw new Error(`Web search failed: ${error}`);
  }
}

async function executeReadFile(
  filePath: string,
  offset?: number,
  limit?: number
): Promise<string> {
  const fs = await import('fs/promises');
  let content: string;
  
  try {
    content = await fs.readFile(filePath, 'utf-8');
  } catch (error) {
    throw new Error(`Failed to read file: ${error}`);
  }
  
  const lines = content.split('\n');
  const start = offset || 0;
  const end = limit ? start + limit : lines.length;
  
  return lines.slice(start, end).join('\n');
}

async function executeWriteFile(filePath: string, content: string): Promise<string> {
  const fs = await import('fs/promises');
  const path = await import('path');
  
  try {
    const dir = path.dirname(filePath);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(filePath, content, 'utf-8');
    return `File written successfully: ${filePath}`;
  } catch (error) {
    throw new Error(`Failed to write file: ${error}`);
  }
}

async function executeEditFile(
  filePath: string,
  oldString: string,
  newString: string,
  replaceAll = false
): Promise<string> {
  const fs = await import('fs/promises');
  
  try {
    let content = await fs.readFile(filePath, 'utf-8');
    const regex = new RegExp(oldString.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), replaceAll ? 'g' : '');
    
    if (!regex.test(content)) {
      throw new Error('Old string not found in file');
    }
    
    content = content.replace(regex, newString);
    await fs.writeFile(filePath, content, 'utf-8');
    
    return `File edited successfully: ${filePath}`;
  } catch (error) {
    throw new Error(`Failed to edit file: ${error}`);
  }
}

export const BashTool: ToolDefinition = {
  name: 'bash',
  description: 'Execute a shell command in the current workspace.',
  inputSchema: {
    type: 'object',
    properties: {
      command: { type: 'string' },
      timeout: { type: 'integer', minimum: 1 },
      description: { type: 'string' },
      run_in_background: { type: 'boolean' },
      dangerouslyDisableSandbox: { type: 'boolean' },
    },
    required: ['command'],
    additionalProperties: false,
  },
  requiredPermission: 'DangerFullAccess',
  handler: async (input) => {
    const parsed = bashSchema.parse(input);
    const { command, timeout, run_in_background } = parsed;
    
    try {
      const { exec } = await import('child_process');
      const util = await import('util');
      const execPromise = util.promisify(exec);
      
      const result = await execPromise(command, {
        timeout: timeout || 30000,
        maxBuffer: 10 * 1024 * 1024,
      });
      
      return createToolOutput(result.stdout || result.stderr);
    } catch (error: unknown) {
      const err = error as { message?: string; stderr?: string };
      return createErrorOutput(err.message || err.stderr || 'Command execution failed');
    }
  },
};

export const ReadTool: ToolDefinition = {
  name: 'read_file',
  description: 'Read a text file from the workspace.',
  inputSchema: {
    type: 'object',
    properties: {
      path: { type: 'string' },
      offset: { type: 'integer', minimum: 0 },
      limit: { type: 'integer', minimum: 1 },
    },
    required: ['path'],
    additionalProperties: false,
  },
  requiredPermission: 'ReadOnly',
  handler: async (input) => {
    const parsed = readFileSchema.parse(input);
    try {
      const content = await executeReadFile(parsed.path, parsed.offset, parsed.limit);
      return createToolOutput(content);
    } catch (error: unknown) {
      return createErrorOutput(String(error));
    }
  },
};

export const WriteTool: ToolDefinition = {
  name: 'write_file',
  description: 'Write a text file in the workspace.',
  inputSchema: {
    type: 'object',
    properties: {
      path: { type: 'string' },
      content: { type: 'string' },
    },
    required: ['path', 'content'],
    additionalProperties: false,
  },
  requiredPermission: 'WorkspaceWrite',
  handler: async (input) => {
    const parsed = writeFileSchema.parse(input);
    try {
      const result = await executeWriteFile(parsed.path, parsed.content);
      return createToolOutput(result);
    } catch (error: unknown) {
      return createErrorOutput(String(error));
    }
  },
};

export const EditTool: ToolDefinition = {
  name: 'edit_file',
  description: 'Replace text in a workspace file.',
  inputSchema: {
    type: 'object',
    properties: {
      path: { type: 'string' },
      old_string: { type: 'string' },
      new_string: { type: 'string' },
      replace_all: { type: 'boolean' },
    },
    required: ['path', 'old_string', 'new_string'],
    additionalProperties: false,
  },
  requiredPermission: 'WorkspaceWrite',
  handler: async (input) => {
    const parsed = editFileSchema.parse(input);
    try {
      const result = await executeEditFile(
        parsed.path,
        parsed.old_string,
        parsed.new_string,
        parsed.replace_all
      );
      return createToolOutput(result);
    } catch (error: unknown) {
      return createErrorOutput(String(error));
    }
  },
};

export const GlobTool: ToolDefinition = {
  name: 'glob_search',
  description: 'Find files by glob pattern.',
  inputSchema: {
    type: 'object',
    properties: {
      pattern: { type: 'string' },
      path: { type: 'string' },
    },
    required: ['pattern'],
    additionalProperties: false,
  },
  requiredPermission: 'ReadOnly',
  handler: async (input) => {
    const parsed = globSchema.parse(input);
    try {
      const matches = await executeGlob(parsed.pattern, parsed.path);
      return createToolOutput(JSON.stringify(matches, null, 2));
    } catch (error: unknown) {
      return createErrorOutput(String(error));
    }
  },
};

export const GrepTool: ToolDefinition = {
  name: 'grep_search',
  description: 'Search file contents with a regex pattern.',
  inputSchema: {
    type: 'object',
    properties: {
      pattern: { type: 'string' },
      path: { type: 'string' },
      glob: { type: 'string' },
      output_mode: { type: 'string' },
      context: { type: 'integer', minimum: 0 },
      '-n': { type: 'boolean' },
      '-i': { type: 'boolean' },
      type: { type: 'string' },
      head_limit: { type: 'integer', minimum: 1 },
      multiline: { type: 'boolean' },
    },
    required: ['pattern'],
    additionalProperties: false,
  },
  requiredPermission: 'ReadOnly',
  handler: async (input) => {
    const parsed = grepSchema.parse(input);
    try {
      const results = await executeGrep(parsed.pattern, parsed.path, {
        glob: parsed.glob,
        context: parsed.context,
        '-n': parsed['-n'],
        '-i': parsed['-i'],
        type: parsed.type,
        head_limit: parsed.head_limit,
        multiline: parsed.multiline,
      });
      return createToolOutput(results);
    } catch (error: unknown) {
      return createErrorOutput(String(error));
    }
  },
};

export const WebFetchToolDef: ToolDefinition = {
  name: 'WebFetch',
  description: 'Fetch a URL, convert it into readable text, and answer a prompt about it.',
  inputSchema: {
    type: 'object',
    properties: {
      url: { type: 'string', format: 'uri' },
      prompt: { type: 'string' },
    },
    required: ['url'],
    additionalProperties: false,
  },
  requiredPermission: 'ReadOnly',
  handler: async (input) => {
    const parsed = webFetchSchema.parse(input);
    try {
      const result = await executeWebFetch(parsed.url, parsed.prompt);
      return createToolOutput(result);
    } catch (error: unknown) {
      return createErrorOutput(String(error));
    }
  },
};

export const WebSearchToolDef: ToolDefinition = {
  name: 'WebSearch',
  description: 'Search the web for current information and return cited results.',
  inputSchema: {
    type: 'object',
    properties: {
      query: { type: 'string', minLength: 2 },
      allowed_domains: {
        type: 'array',
        items: { type: 'string' },
      },
      blocked_domains: {
        type: 'array',
        items: { type: 'string' },
      },
    },
    required: ['query'],
    additionalProperties: false,
  },
  requiredPermission: 'ReadOnly',
  handler: async (input) => {
    const parsed = webSearchSchema.parse(input);
    try {
      const result = await executeWebSearch(parsed.query);
      return createToolOutput(result);
    } catch (error: unknown) {
      return createErrorOutput(String(error));
    }
  },
};

export const TodoTool: ToolDefinition = {
  name: 'TodoWrite',
  description: 'Update the structured task list for the current session.',
  inputSchema: {
    type: 'object',
    properties: {
      todos: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            content: { type: 'string' },
            activeForm: { type: 'string' },
            status: {
              type: 'string',
              enum: ['pending', 'in_progress', 'completed'],
            },
          },
          required: ['content', 'activeForm', 'status'],
          additionalProperties: false,
        },
      },
    },
    required: ['todos'],
    additionalProperties: false,
  },
  requiredPermission: 'WorkspaceWrite',
  handler: async (input) => {
    const parsed = todoWriteSchema.parse(input);
    
    const todos = parsed.todos.map(t => ({
      content: t.content,
      activeForm: t.activeForm,
      status: t.status,
    }));
    
    return createToolOutput(JSON.stringify({
      newTodos: todos,
      oldTodos: [],
    }, null, 2));
  },
};

export const AgentTool: ToolDefinition = {
  name: 'Agent',
  description: 'Launch a specialized agent task and persist its handoff metadata.',
  inputSchema: {
    type: 'object',
    properties: {
      description: { type: 'string' },
      prompt: { type: 'string' },
      subagent_type: { type: 'string' },
      name: { type: 'string' },
      model: { type: 'string' },
    },
    required: ['description', 'prompt'],
    additionalProperties: false,
  },
  requiredPermission: 'DangerFullAccess',
  handler: async (input) => {
    const parsed = agentSchema.parse(input);
    
    const timestamp = Date.now();
    const agentId = `agent-${timestamp}`;
    
    return createToolOutput(JSON.stringify({
      agentId,
      name: parsed.name || parsed.description.toLowerCase().replace(/\s+/g, '-'),
      description: parsed.description,
      subagentType: parsed.subagent_type || 'general-purpose',
      model: parsed.model || 'openai/gpt-5.4',
      status: 'spawned',
      createdAt: new Date().toISOString(),
    }, null, 2));
  },
};

export const TOOL_REGISTRY: ToolDefinition[] = [
  BashTool,
  ReadTool,
  WriteTool,
  EditTool,
  GlobTool,
  GrepTool,
  WebFetchToolDef,
  WebSearchToolDef,
  TodoTool,
  AgentTool,
];

export function getToolByName(name: string): ToolDefinition | undefined {
  return TOOL_REGISTRY.find(tool => tool.name === name);
}

export function getToolsByPermission(permission: PermissionLevel): ToolDefinition[] {
  return TOOL_REGISTRY.filter(tool => tool.requiredPermission === permission);
}

export function getToolDefinitions(): Array<{ name: string; description: string; inputSchema: ToolInputSchema }> {
  return TOOL_REGISTRY.map(tool => ({
    name: tool.name,
    description: tool.description,
    inputSchema: tool.inputSchema,
  }));
}

export async function executeTool(name: string, input: unknown): Promise<ToolOutput> {
  const tool = getToolByName(name);
  if (!tool) {
    return createErrorOutput(`Unknown tool: ${name}`);
  }
  
  try {
    return await tool.handler(input);
  } catch (error: unknown) {
    return createErrorOutput(String(error));
  }
}
