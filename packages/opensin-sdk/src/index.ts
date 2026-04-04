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
  SubAgentRegistry,
  getSubAgentRegistry,
  resetSubAgentRegistry,
  extractMentions,
  hasMention,
  removeMentions,
  getMentionAtPosition,
  getMentionPrefix,
  replaceMentionWithAgent,
  insertMention,
} from "./named_subagents/index.js";
export type {
  NamedSubAgent,
  SubAgentMention,
  TypeaheadSuggestion,
  AgentRegistryConfig,
} from "./named_subagents/index.js";

// Context Optimizer
export {
  ContextAnalyzer,
  ContextOptimizer,
  getBuiltinTips,
  getTipsByCategory,
  getTipById,
} from "./context_optimizer/index.js";
export type {
  ContextTool,
  ContextMetrics,
  ContextWarning,
  OptimizationTip,
  ContextAnalysis,
  ContextOptimizerConfig,
} from "./context_optimizer/index.js";

// Color Picker
export { ColorPicker, ThemeApplier, applyPromptBarColor, resetPromptBarColor } from "./color_picker/index.js";
export { COLOR_PRESETS, DEFAULT_SESSION_COLOR } from "./color_picker/index.js";
export type {
  ColorPreset,
  SessionColor,
  ColorPickerState,
  ColorPickerConfig,
} from "./color_picker/index.js";

// Live Status
export { StatusMonitor, StatusDisplay, renderLiveStatus } from "./live_status/index.js";
export type {
  LiveStatusSnapshot,
  TokenUsage,
  CostInfo,
  ModelInfo as LiveModelInfo,
  TurnInfo,
  StatusDisplayMode,
  StatusMonitorConfig,
  StreamingStatusUpdate,
} from "./live_status/index.js";

// Effort Control
export { EffortManager } from "./effort_control/index.js";
export {
  renderEffortStatusBar,
  renderEffortHelp,
  renderEffortConfirmation,
  formatEffortForPrompt,
} from "./effort_control/index.js";
export type {
  EffortLevel,
  EffortConfig,
  EffortState,
  EffortFrontmatter,
  EffortChangeEvent,
} from "./effort_control/index.js";
export { EFFORT_CONFIGS } from "./effort_control/index.js";

// Session Naming
export { SessionNamer, AutoNamer } from "./session_naming/index.js";
export type {
  SessionName,
  SessionNameConfig,
  SessionNameEvent,
  SessionNamingStrategy,
  AutoNameRequest,
  RenameRequest,
} from "./session_naming/index.js";

// Rate Limit Status
export { RateLimitMonitor } from "./rate_limit_status/index.js";
export {
  renderRateLimitStatusline,
  renderRateLimitBanner,
  formatRateLimitDetails,
} from "./rate_limit_status/index.js";
export type {
  RateLimitWindow,
  RateLimitWindowInfo,
  RateLimitStatus,
  RateLimitConfig,
  RateLimitEvent,
} from "./rate_limit_status/index.js";
export { DEFAULT_RATE_LIMIT_CONFIG } from "./rate_limit_status/index.js";

// Effort Control
export { EffortManager } from "./effort_control/index.js";
export {
  renderEffortStatusBar,
  renderEffortHelp,
  renderEffortConfirmation,
  formatEffortForPrompt,
} from "./effort_control/index.js";
export type {
  EffortLevel,
  EffortConfig,
  EffortState,
  EffortFrontmatter,
  EffortChangeEvent,
} from "./effort_control/index.js";
export { EFFORT_CONFIGS } from "./effort_control/index.js";

// Session Naming
export { SessionNamer, AutoNamer } from "./session_naming/index.js";
export type {
  SessionName,
  SessionNameConfig,
  SessionNameEvent,
  SessionNamingStrategy,
  AutoNameRequest,
  RenameRequest,
} from "./session_naming/index.js";

// Rate Limit Status
export { RateLimitMonitor } from "./rate_limit_status/index.js";
export {
  renderRateLimitStatusline,
  renderRateLimitBanner,
  formatRateLimitDetails,
} from "./rate_limit_status/index.js";
export type {
  RateLimitWindow,
  RateLimitWindowInfo,
  RateLimitStatus,
  RateLimitConfig,
  RateLimitEvent,
} from "./rate_limit_status/index.js";
export { DEFAULT_RATE_LIMIT_CONFIG } from "./rate_limit_status/index.js";

// Copy Command
export { CopyCommand, getCopyCommand, resetCopyCommand } from "./copy_command/index.js";
export { ClipboardManager, getClipboardManager, resetClipboardManager } from "./copy_command/index.js";
export type { CopyCommandConfig, CopyResult, ClipboardFormat, AssistantResponse } from "./copy_command/index.js";

// Plugin State
export { PluginStateManager, getPluginStateManager, resetPluginStateManager } from "./plugin_state/index.js";
export { PluginStateStorage, getPluginStateStorage, resetPluginStateStorage } from "./plugin_state/index.js";
export { KeychainManager, getKeychainManager, resetKeychainManager } from "./plugin_state/index.js";
export type {
  PluginState,
  PluginStateConfig,
  SensitiveValue,
  KeychainBackend,
  PluginUninstallPrompt,
} from "./plugin_state/index.js";

// Terminal Notifications
export { TerminalNotifier, getTerminalNotifier, resetTerminalNotifier } from "./terminal_notifications/index.js";
export {
  detectTerminalType,
  createProvider,
  ITerm2Provider,
  KittyProvider,
  GhosttyProvider,
  TmuxProvider,
  UnknownProvider,
} from "./terminal_notifications/index.js";
export type {
  NotificationType,
  TerminalType,
  TerminalNotification,
  NotificationPreferences,
  ProgressState,
  TerminalCapabilities,
} from "./terminal_notifications/index.js";

// Prompt Interrupt and Restore
export { InterruptHandler, PromptRestore } from "./prompt_interrupt/index.js";
export type {
  InterruptState,
  InterruptConfig,
  InterruptEvent,
  RestoreResult,
} from "./prompt_interrupt/index.js";
export { DEFAULT_INTERRUPT_CONFIG } from "./prompt_interrupt/index.js";

// Prompt Interrupt and Restore
export { InterruptHandler, PromptRestore } from "./prompt_interrupt/index.js";
export type {
  InterruptState,
  InterruptConfig,
  InterruptEvent,
  RestoreResult,
} from "./prompt_interrupt/index.js";
export { DEFAULT_INTERRUPT_CONFIG } from "./prompt_interrupt/index.js";

// Buddy - AI Companion
export { BuddyEngine, CompanionUI } from "./buddy/index.js";
export type {
  BuddyState,
  BuddyEmotion,
  BuddyAppearance,
  BuddyConfig,
  BuddyTip,
  BuddyReaction,
} from "./buddy/index.js";

// Bare Mode
export { BareRunner, DEFAULT_BARE_CONFIG, validateBareMode } from "./bare_mode/index.js";
export type {
  BareModeConfig,
  BareModeResult,
  BareModeError,
} from "./bare_mode/index.js";

// Branch Command
export { Brancher, BranchUI } from "./branch_command/index.js";
export type {
  BranchState,
  BranchInfo,
  BranchHistoryEntry,
  BranchCommandResult,
  ForkAliasResult,
} from "./branch_command/index.js";

// Skills as Slash Commands (Roo Code v3.51.0)
export {
  SkillRegistry,
  getSkillRegistry,
  resetSkillRegistry,
  SkillExecutor,
  getSkillExecutor,
  resetSkillExecutor,
  FallbackEngine,
  getFallbackEngine,
  resetFallbackEngine,
  parseSlashCommand,
  isSlashCommand,
  formatSkillHelp,
  formatSkillUsage,
} from "./skill_commands/index.js";
export type {
  SkillDefinition,
  SkillParameter,
  SkillParameterType,
  SkillInvocation,
  SkillResult,
  SkillFallbackResult,
  SkillRegistryConfig,
  SkillCommand,
  SlashCommandParseResult,
  SkillExecutionMode,
} from "./skill_commands/index.js";

// Standalone CLI with Session Resume (Roo Code)
export {
  SessionManager,
  HistoryManager,
  StdinHandler,
  createStandaloneCli,
} from "./standalone_cli/index.js";
export type {
  CliMode,
  CliConfig,
  NdjsonMessage,
  SessionRecord,
  HistoryEntry,
  StdinCommand,
  SessionResumeState,
  CliStatus,
} from "./standalone_cli/index.js";

// Skills as Slash Commands (Roo Code v3.51.0)
export {
  SkillRegistry,
  getSkillRegistry,
  resetSkillRegistry,
  SkillExecutor,
  getSkillExecutor,
  resetSkillExecutor,
  FallbackEngine,
  getFallbackEngine,
  resetFallbackEngine,
  parseSlashCommand,
  isSlashCommand,
  formatSkillHelp,
  formatSkillUsage,
} from "./skill_commands/index.js";
export type {
  SkillDefinition,
  SkillParameter,
  SkillParameterType,
  SkillInvocation,
  SkillResult,
  SkillFallbackResult,
  SkillRegistryConfig,
  SkillCommand,
  SlashCommandParseResult,
  SkillExecutionMode,
} from "./skill_commands/index.js";

// Standalone CLI with Session Resume (Roo Code)
export {
  SessionManager,
  HistoryManager,
  StdinHandler,
  createStandaloneCli,
} from "./standalone_cli/index.js";
export type {
  CliMode,
  CliConfig,
  NdjsonMessage,
  SessionRecord,
  HistoryEntry,
  StdinCommand,
  SessionResumeState,
  CliStatus,
} from "./standalone_cli/index.js";
