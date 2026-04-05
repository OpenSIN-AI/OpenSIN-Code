import type { Message, ToolDefinition } from '../core/types.js';

export interface ToolDescription {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
}

export interface LLMOptions {
  model?: string;
  tools?: ToolDescription[];
  temperature?: number;
  maxTokens?: number;
}

export async function callLLM(
  messages: Message[],
  options: LLMOptions = {}
): Promise<Message | null> {
  const model = options.model || process.env.SINCODE_MODEL || 'openai/gpt-4o';

  if (process.env.SINCODE_USE_OPENCODE === 'true') {
    return callViaOpenCode(messages, options);
  }

  return callViaOpenAI(messages, options);
}

async function callViaOpenCode(
  messages: Message[],
  options: LLMOptions
): Promise<Message | null> {
  const { exec } = await import('node:child_process');
  const { promisify } = await import('node:util');
  const execAsync = promisify(exec);

  const lastUserMessage = messages.filter((m) => m.role === 'user').pop();
  if (!lastUserMessage?.content) {
    return null;
  }

  try {
    const { stdout } = await execAsync(
      `opencode run ${JSON.stringify(lastUserMessage.content)} --format json`,
      { timeout: 120000 }
    );

    let textResponse = '';
    for (const line of stdout.split('\n')) {
      try {
        const event = JSON.parse(line);
        if (event.type === 'text' && event.part?.text) {
          textResponse += event.part.text;
        }
      } catch {
        continue;
      }
    }

    return {
      role: 'assistant',
      content: textResponse.trim() || null,
    };
  } catch (error) {
    throw new Error(`OpenCode CLI call failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

async function callViaOpenAI(
  messages: Message[],
  options: LLMOptions
): Promise<Message | null> {
  const { OpenAI } = await import('openai');

  const apiKey = process.env.OPENAI_API_KEY || process.env.SINCODE_API_KEY;
  if (!apiKey) {
    throw new Error(
      'No API key found. Set OPENAI_API_KEY or SINCODE_API_KEY, or use SINCODE_USE_OPENCODE=true.'
    );
  }

  const baseURL = process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1';
  const client = new OpenAI({ apiKey, baseURL });

  const apiMessages = messages
    .filter((m) => m.role !== 'tool')
    .map((m) => {
      const base: Record<string, unknown> = { role: m.role, content: m.content };
      if (m.tool_calls) (base as any).tool_calls = m.tool_calls;
      if (m.tool_call_id) (base as any).tool_call_id = m.tool_call_id;
      if (m.name) (base as any).name = m.name;
      return base as any;
    });

  const toolDefinitions = options.tools?.map((t: ToolDescription) => ({
    type: 'function' as const,
    function: {
      name: t.name,
      description: t.description,
      parameters: t.parameters,
    },
  }));

  const modelName = (options.model || process.env.SINCODE_MODEL || 'gpt-4o').includes('/')
    ? (options.model || process.env.SINCODE_MODEL || 'gpt-4o').split('/')[1]
    : (options.model || process.env.SINCODE_MODEL || 'gpt-4o');

  const response = await client.chat.completions.create({
    model: modelName,
    messages: apiMessages,
    tools: toolDefinitions,
    temperature: options.temperature ?? 0.7,
    max_tokens: options.maxTokens ?? 4096,
    stream: false,
  });

  const choice = response.choices[0];
  if (!choice?.message) {
    return null;
  }

  return {
    role: choice.message.role as Message['role'],
    content: choice.message.content,
    tool_calls: choice.message.tool_calls as Message['tool_calls'],
  };
}
