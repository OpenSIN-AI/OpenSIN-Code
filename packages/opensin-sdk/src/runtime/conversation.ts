import { compactSession, estimateSessionTokens, CompactionConfig, CompactionResult } from './compact';
import { RuntimeFeatureConfig } from './config';
import { HookRunner, HookRunResult } from './hooks';
import { PermissionOutcome, PermissionPolicy, PermissionPrompter } from './permissions';
import { ContentBlock, ConversationMessage, Session } from './session';
import { TokenUsage, UsageTracker } from './usage';

export interface ApiRequest {
  systemPrompt: string[];
  messages: ConversationMessage[];
}

export type AssistantEvent =
  | { type: 'textDelta'; text: string }
  | { type: 'toolUse'; id: string; name: string; input: string }
  | { type: 'usage'; usage: TokenUsage }
  | { type: 'messageStop' };

export interface ApiClient {
  stream(request: ApiRequest): Promise<AssistantEvent[]>;
}

export interface ToolExecutor {
  execute(toolName: string, input: string): Promise<string>;
}

export class ToolError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ToolError';
  }
}

export class RuntimeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RuntimeError';
  }
}

export interface TurnSummary {
  assistantMessages: ConversationMessage[];
  toolResults: ConversationMessage[];
  iterations: number;
  usage: TokenUsage;
}

export class ConversationRuntime<C extends ApiClient, T extends ToolExecutor> {
  private session: Session;
  private apiClient: C;
  private toolExecutor: T;
  private permissionPolicy: PermissionPolicy;
  private systemPrompt: string[];
  private maxIterations: number = Number.MAX_SAFE_INTEGER;
  private usageTracker: UsageTracker;
  private hookRunner: HookRunner;

  constructor(
    session: Session,
    apiClient: C,
    toolExecutor: T,
    permissionPolicy: PermissionPolicy,
    systemPrompt: string[],
    featureConfig?: RuntimeFeatureConfig
  ) {
    this.session = session;
    this.apiClient = apiClient;
    this.toolExecutor = toolExecutor;
    this.permissionPolicy = permissionPolicy;
    this.systemPrompt = systemPrompt;
    this.usageTracker = UsageTracker.fromSession(session);
    this.hookRunner = HookRunner.fromFeatureConfig(
      featureConfig || RuntimeFeatureConfig.default()
    );
  }

  withMaxIterations(maxIterations: number): this {
    this.maxIterations = maxIterations;
    return this;
  }

  async runTurn(
    userInput: string,
    prompter?: PermissionPrompter
  ): Promise<TurnSummary> {
    this.session.messages.push(ConversationMessage.userText(userInput));

    const assistantMessages: ConversationMessage[] = [];
    const toolResults: ConversationMessage[] = [];
    let iterations = 0;

    while (true) {
      iterations++;
      if (iterations > this.maxIterations) {
        throw new RuntimeError(
          'conversation loop exceeded the maximum number of iterations'
        );
      }

      const request: ApiRequest = {
        systemPrompt: this.systemPrompt,
        messages: [...this.session.messages],
      };
      
      const events = await this.apiClient.stream(request);
      const { assistantMessage, usage } = buildAssistantMessage(events);
      
      if (usage) {
        this.usageTracker.record(usage);
      }

      const pendingToolUses = assistantMessage.blocks
        .filter((block): block is ContentBlock.ToolUse => block.type === 'toolUse')
        .map(block => ({
          id: block.id,
          name: block.name,
          input: block.input,
        }));

      this.session.messages.push(assistantMessage);
      assistantMessages.push(assistantMessage);

      if (pendingToolUses.length === 0) {
        break;
      }

      for (const { id: toolUseId, name: toolName, input } of pendingToolUses) {
        const permissionOutcome = prompter
          ? this.permissionPolicy.authorize(toolName, input, prompter)
          : this.permissionPolicy.authorize(toolName, input, undefined);

        const resultMessage = await this.processToolUse(
          toolUseId,
          toolName,
          input,
          permissionOutcome
        );
        
        this.session.messages.push(resultMessage);
        toolResults.push(resultMessage);
      }
    }

    return {
      assistantMessages,
      toolResults,
      iterations,
      usage: this.usageTracker.cumulativeUsage(),
    };
  }

  private async processToolUse(
    toolUseId: string,
    toolName: string,
    input: string,
    permissionOutcome: PermissionOutcome
  ): Promise<ConversationMessage> {
    if (permissionOutcome.type === 'deny') {
      return ConversationMessage.toolResult(
        toolUseId,
        toolName,
        permissionOutcome.reason,
        true
      );
    }

    const preHookResult = this.hookRunner.runPreToolUse(toolName, input);
    
    if (preHookResult.isDenied()) {
      const denyMessage = `PreToolUse hook denied tool \`${toolName}\``;
      return ConversationMessage.toolResult(
        toolUseId,
        toolName,
        formatHookMessage(preHookResult, denyMessage),
        true
      );
    }

    let output: string;
    let isError: boolean;
    
    try {
      output = await this.toolExecutor.execute(toolName, input);
      isError = false;
    } catch (error) {
      output = error instanceof Error ? error.message : String(error);
      isError = true;
    }

    output = mergeHookFeedback(preHookResult.messages(), output, false);

    const postHookResult = this.hookRunner.runPostToolUse(
      toolName,
      input,
      output,
      isError
    );
    
    if (postHookResult.isDenied()) {
      isError = true;
    }
    
    output = mergeHookFeedback(
      postHookResult.messages(),
      output,
      postHookResult.isDenied()
    );

    return ConversationMessage.toolResult(
      toolUseId,
      toolName,
      output,
      isError
    );
  }

  compact(config: CompactionConfig): CompactionResult {
    return compactSession(this.session, config);
  }

  estimatedTokens(): number {
    return estimateSessionTokens(this.session);
  }

  usage(): UsageTracker {
    return this.usageTracker;
  }

  session(): Session {
    return this.session;
  }

  intoSession(): Session {
    return this.session;
  }
}

function buildAssistantMessage(
  events: AssistantEvent[]
): { assistantMessage: ConversationMessage; usage: TokenUsage | null } {
  let text = '';
  const blocks: ContentBlock[] = [];
  let finished = false;
  let usage: TokenUsage | null = null;

  for (const event of events) {
    switch (event.type) {
      case 'textDelta':
        text += event.text;
        break;
      case 'toolUse':
        flushTextBlock(text, blocks);
        blocks.push({
          type: 'toolUse',
          id: event.id,
          name: event.name,
          input: event.input,
        });
        break;
      case 'usage':
        usage = event.usage;
        break;
      case 'messageStop':
        finished = true;
        break;
    }
  }

  flushTextBlock(text, blocks);

  if (!finished) {
    throw new RuntimeError(
      'assistant stream ended without a message stop event'
    );
  }
  if (blocks.length === 0) {
    throw new RuntimeError('assistant stream produced no content');
  }

  return {
    assistantMessage: ConversationMessage.assistantWithUsage(blocks, usage),
    usage,
  };
}

function flushTextBlock(text: string, blocks: ContentBlock[]): void {
  if (text.length > 0) {
    blocks.push({ type: 'text', text });
  }
}

function formatHookMessage(result: HookRunResult, fallback: string): string {
  if (result.messages().length === 0) {
    return fallback;
  }
  return result.messages().join('\n');
}

function mergeHookFeedback(messages: string[], output: string, denied: boolean): string {
  if (messages.length === 0) {
    return output;
  }

  const sections: string[] = [];
  if (output.trim().length > 0) {
    sections.push(output);
  }
  
  const label = denied ? 'Hook feedback (denied)' : 'Hook feedback';
  sections.push(`${label}:\n${messages.join('\n')}`);
  
  return sections.join('\n\n');
}

export type ToolHandler = (input: string) => Promise<string>;

export class StaticToolExecutor implements ToolExecutor {
  private handlers: Map<string, ToolHandler> = new Map();

  register(toolName: string, handler: ToolHandler): this {
    this.handlers.set(toolName, handler);
    return this;
  }

  async execute(toolName: string, input: string): Promise<string> {
    const handler = this.handlers.get(toolName);
    if (!handler) {
      throw new ToolError(`unknown tool: ${toolName}`);
    }
    return handler(input);
  }
}