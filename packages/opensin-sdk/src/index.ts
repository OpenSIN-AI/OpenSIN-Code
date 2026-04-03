// Core
export { OpenSINClient } from "./client.js";
export type { ConnectionConfig, ConnectionStatus } from "./client.js";

// Types
export type {
  SessionId,
  ModelId,
  RequestId,
  ProtocolVersion,
  Implementation,
  Meta,
  Position,
  Range,
  Role,
  TextContent,
  ImageContent,
  AudioContent,
  ResourceLink,
  TextResourceContents,
  BlobResourceContents,
  EmbeddedResource,
  ContentBlock,
  Annotations,
  Content,
  ContentChunk,
  StopReason,
  Usage,
  Cost,
  PlanEntryPriority,
  PlanEntryStatus,
  PlanEntry,
  Plan,
  Diff,
  ToolCall,
  SessionModeId,
  SessionMode,
  SessionModeState,
  ModelInfo,
  SessionModelState,
  SessionConfigOption,
  SessionInfo,
  PromptCapabilities,
  FileSystemCapabilities,
  ClientCapabilities,
  McpServerHttp,
  McpServerSse,
  McpServerStdio,
  McpServer,
  AgentCapabilities,
  SessionCapabilities,
  InitializeRequest,
  InitializeResponse,
  AuthMethodAgent,
  AuthMethod,
  NewSessionRequest,
  NewSessionResponse,
  LoadSessionRequest,
  LoadSessionResponse,
  ListSessionsRequest,
  ListSessionsResponse,
  CloseSessionRequest,
  CloseSessionResponse,
  PromptRequest,
  PromptResponse,
  CancelNotification,
  SessionUpdate,
  CurrentModeUpdate,
  ConfigOptionUpdate,
  SessionNotification,
  JsonRpcError,
  JsonRpcRequest,
  JsonRpcResponse,
  JsonRpcNotification,
  ProviderConfig,
  StreamEvent,
  StreamChunk,
  StreamError,
  DocumentEvent,
  DidOpenDocumentNotification,
  DidCloseDocumentNotification,
  DidFocusDocumentNotification,
  TextDocumentContentChangeEvent,
  DidChangeDocumentNotification,
  DidSaveDocumentNotification,
} from "./types.js";

// Session
export {
  SessionManager,
  createSessionId,
  serializeSession,
  deserializeSession,
} from "./session.js";
export type { SessionRecord, SessionManagerOptions } from "./session.js";

// Events
export { EventStream, EventMultiplexer, parseSSELine, streamSSE } from "./events.js";

// Providers
export type { IProvider as Provider, ProviderName } from "./providers.js";
export {
  BaseProvider,
  OpenAIProvider,
  AnthropicProvider,
  createProvider,
  ProviderRegistry,
  ProviderError,
} from "./providers.js";

// Autonomy
export { AutonomyLevel } from "./autonomy/index.js";
export type {
  AutonomyConfig,
  AutonomyPermissions,
  AdminAutonomyPolicy,
  AutonomyState,
  AutonomyChangeEvent,
} from "./autonomy/index.js";
export { AutonomySlider } from "./autonomy/index.js";
export { PermissionMatrix, resolvePermissions } from "./autonomy/index.js";

// CLI
export { handleAutonomyCommand, parseAutonomyCommand } from "./cli/index.js";
export type { AutonomyCommandResult } from "./cli/index.js";
export { StatusBarRenderer } from "./cli/index.js";
export type { StatusBarConfig } from "./cli/index.js";

// Hooks
export { HookEvent } from "./hooks/index.js";
export type {
  HookConfig,
  HookDefinition,
  HookResult,
  HookExecutionContext,
  HooksConfig,
  BuiltinHookOptions,
} from "./hooks/index.js";
export { HookRegistry, HookExecutor, registerBuiltinHooks } from "./hooks/index.js";

// Lint
export {
  LinterAggregator,
  AutoFixEngine,
  RulesManager,
  AutoLintSession,
  createLinter,
  createAutoFixEngine,
  createRulesManager,
  createAutoLintSession,
} from "./lint/index.js";
export type {
  LintError,
  LintFix,
  LintConfig,
  LintResult,
  AutoFixConfig,
  RulesConfig,
  RuleConfig,
  LintEvent,
  LintListener,
  LintSeverity,
  LintSource,
  AutoLintSessionConfig,
} from "./lint/index.js";

// Continue My Work
export {
  ActionHistory,
  ContextRestorer,
  WorkStateSerializer,
  ContinueMyWork,
  continueMyWork,
} from "./continue_work/index.js";
export type { ActionRecord, WorkState, ContinueWorkResult } from "./continue_work/models.js";

// Turbo Mode
export { CommandSafetyFilter, AuditTrail, TurboMode, turboMode } from "./turbo/index.js";
export type { TurboConfig, CommandSafetyFilter as CommandSafetyFilterConfig, AuditEntry, CommandResult } from "./turbo/models.js";

// Continue My Work
export {
  ActionHistory,
  ContextRestorer,
  WorkStateSerializer,
  ContinueMyWork,
  continueMyWork,
} from "./continue_work/index.js";
export type { ActionRecord, WorkState, ContinueWorkResult } from "./continue_work/models.js";

// Turbo Mode
export { CommandSafetyFilter, AuditTrail, TurboMode, turboMode } from "./turbo/index.js";
export type { TurboConfig, CommandSafetyFilter as CommandSafetyFilterConfig, AuditEntry, CommandResult } from "./turbo/models.js";

// i18n
export { I18nEngine, TranslationManager, LanguageSelector, RTLHandler, LocaleDetector } from "./i18n/index.js";
export type { Locale, TranslationEntry, TranslationBundle, LocaleInfo, I18nConfig } from "./i18n/index.js";

// Design Mode
export {
  UIAnnotator,
  ElementSelector,
  FeedbackCollector,
  sendFeedbackToAgent,
  DesignMode,
  activateDesignMode,
  deactivateDesignMode,
  isDesignModeActive,
} from "./design_mode/index.js";
export type {
  DesignModeConfig,
  UIElement,
  Annotation,
  SelectionArea,
  FeedbackPayload,
  CoordinateClick,
  DesignModeState,
  ElementSelector as ElementSelectorType,
  AnnotationStyle,
  ScreenshotFallback,
} from "./design_mode/index.js";

// Powerup
export {
  LessonEngine,
  createLessonEngine,
  DemoRenderer,
  createDemoRenderer,
  ProgressTracker,
  createProgressTracker,
  Powerup,
  activatePowerup,
  deactivatePowerup,
  isPowerupActive,
} from "./powerup/index.js";
export type {
  Lesson,
  LessonStep,
  LessonCategory,
  DemoAnimation,
  DemoAction,
  UserProgress,
  LessonProgress,
  PowerupConfig,
  PowerupState,
  Achievement,
  StepResult,
} from "./powerup/index.js";

// Named Subagents
export {
  NamedSubagentRegistry,
  handleAtMention,
} from "./named_subagents/index.js";
export type {
  NamedSubagent,
  SubagentConfig,
  SubagentCategory,
  MentionMatch,
  RegistryOptions,
} from "./named_subagents/index.js";

// Context Optimizer
export {
  ContextAnalyzer,
  ContextOptimizer,
  optimizeContext,
  generateOptimizationTips,
} from "./context_optimizer/index.js";
export type {
  ContextSnapshot,
  ContextTool,
  MemoryEntry,
  CapacityWarning,
  OptimizationTip,
  OptimizationStrategy,
  ContextMetrics,
  OptimizerConfig,
  OptimizationResult,
} from "./context_optimizer/index.js";
export type {
  ContextSnapshot,
  ContextTool,
  MemoryEntry,
  CapacityWarning,
  OptimizationTip,
  OptimizationStrategy,
  ContextMetrics,
  OptimizerConfig,
  OptimizationResult,
} from "./context_optimizer/index.js";
