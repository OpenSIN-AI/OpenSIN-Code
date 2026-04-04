// Core
export { OpenSINClient } from "./client.js";
export type { ConnectionConfig, ConnectionStatus } from "./client.js";

// Agent SDK re-export

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
export { CommandSafetyFilterImpl as CommandSafetyFilter, AuditTrail, TurboMode, turboMode } from "./turbo/index.js";
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

// A2A SIN Agents
export {
  sinAgentRegistry,
  registerBuiltInAgents,
  registerAllAgents,
  BUILT_IN_AGENTS,
  SIN_EXPLORER,
  SIN_PLANNER,
  SIN_VERIFIER,
  SIN_CREATOR,
  SIN_IMAGE_GEN,
  SIN_VIDEO_GEN,
  SIN_TEAM_LEAD,
  SIN_RESEARCHER,
  SIN_GUIDE,
} from "./agents/index.js";
export type {
  SinAgentDefinition,
  SpawnedAgent,
  SpawnAgentRequest,
  SpawnAgentResult,
  AgentColorName,
  AgentSource,
  AgentIsolation,
  AgentMemory,
  AgentModel,
  PermissionMode,
  AgentMcpServerSpec,
  HooksSetting,
} from "./agents/index.js";

// A2A SIN Agents
export {
  sinAgentRegistry,
  registerBuiltInAgents,
  registerAllAgents,
  BUILT_IN_AGENTS,
  SIN_EXPLORER,
  SIN_PLANNER,
  SIN_VERIFIER,
  SIN_CREATOR,
  SIN_IMAGE_GEN,
  SIN_VIDEO_GEN,
  SIN_TEAM_LEAD,
  SIN_RESEARCHER,
  SIN_GUIDE,
} from "./agents/index.js";
export type {
  SinAgentDefinition,
  SpawnedAgent,
  SpawnAgentRequest,
  SpawnAgentResult,
  AgentColorName,
  AgentSource,
  AgentIsolation,
  AgentMemory,
  AgentModel,
  PermissionMode,
  AgentMcpServerSpec,
  HooksSetting,
} from "./agents/index.js";


// Hooks v2 (from sin-claude)
export * from "./hooks_v2/index.js";

// Ink UI Framework (from sin-claude)
export * from "./ink_v2/index.js";

// CLI v2 Framework (from sin-claude)
export * from "./cli_v2/index.js";

// CLI v2 Framework (from sin-claude)
export * from "./cli_v2/index.js";

// CLI v2 framework (from sin-claude)
export * from "./cli_v2/index.js";

// CLI v2 framework (from sin-claude)
export * from "./cli_v2/index.js";

// Tools v2 (from sin-claude)
export * from "./tools_v2/index.js";

// Tools v2 (from sin-claude)
export * from "./tools_v2/index.js";
export * from './utils_v2';

// JetBrains IDE Plugin (Multi-IDE Support like Windsurf)
export { JetBrainsPlugin, getJetBrainsPlugin, resetJetBrainsPlugin } from "./jetbrains/index.js";
export { ProtocolClient, ProtocolMessageType, ProtocolSerializer } from "./jetbrains/index.js";
export type {
  JetBrainsConfig,
  JetBrainsEditorState,
  JetBrainsFileChange,
  JetBrainsModule,
  JetBrainsNotification,
  JetBrainsProjectInfo,
  JetBrainsTerminalState,
  JetBrainsToolWindow,
  Position,
  Range,
} from "./jetbrains/index.js";

// JetBrains IDE Plugin (Multi-IDE Support like Windsurf)
export { JetBrainsPlugin, getJetBrainsPlugin, resetJetBrainsPlugin } from "./jetbrains/index.js";
export { ProtocolClient, ProtocolMessageType, ProtocolSerializer } from "./jetbrains/index.js";
export type {
  JetBrainsConfig,
  JetBrainsEditorState,
  JetBrainsFileChange,
  JetBrainsModule,
  JetBrainsNotification,
  JetBrainsProjectInfo,
  JetBrainsTerminalState,
  JetBrainsToolWindow,
  Position,
  Range,
} from "./jetbrains/index.js";

// JetBrains IDE Plugin v2 — Full IDE support like Windsurf/Kilo Code
export {
  JetBrainsPlugin as JetBrainsPluginV2,
  ProtocolClient as JBProtocolClient,
  ProtocolSerializer as JBProtocolSerializer,
  METHODS as JB_METHODS,
  PROTOCOL_VERSION as JB_PROTOCOL_VERSION,
  LifecycleManager,
  DocumentManager,
  EditorManager,
  ProjectManager,
} from "./jetbrains-plugin/index.js";
export type {
  JetBrainsPluginInfo,
  JetBrainsConnectionConfig,
  JetBrainsDocumentInfo,
  JetBrainsEditorState as JBEditorState,
  JetBrainsProjectInfo as JBProjectInfo,
  JetBrainsModuleInfo,
  JetBrainsTerminalState as JBTerminalState,
  JetBrainsActionRequest,
  JetBrainsActionResponse,
  JetBrainsNotification,
  JetBrainsToolWindow,
  JetBrainsProtocolMessage,
  JetBrainsProtocolResponse,
  JetBrainsEventType,
  JetBrainsEvent,
  JetBrainsFileChange,
  JetBrainsLifecycleState,
} from "./jetbrains-plugin/index.js";

// CLI Agent — Terminal-based AI coding like Augment Code/Kilo Code
export {
  CLIAgent,
  SessionManager as CLISessionManager,
  ToolRegistry,
  createBuiltinTools,
  createDefaultConfig,
  loadConfigFromFile,
  saveConfigToFile,
  mergeCommandOptions,
  validateConfig,
  getConfigDefaults,
} from "./cli-agent/index.js";
export type {
  CLIAgentConfig,
  CLIAgentSession,
  CLIMessage,
  CLIContext,
  CLITool,
  ToolCallRecord,
  ToolResult,
  TokenUsage,
  CLICommand,
  CLICommandOptions,
  CLIAgentState,
  CLIEvent,
} from "./cli-agent/index.js";

// Design Mode — UI annotation for agents like Cursor/Replit
export {
  DesignMode,
  activateDesignMode,
  deactivateDesignMode,
  isDesignModeActive,
  Annotator,
  Selector,
  FeedbackCollector,
  sendFeedbackToAgent,
} from "./design-mode/index.js";
export type {
  DesignModeConfig,
  UIElement,
  Annotation,
  SelectionArea,
  FeedbackPayload,
  CoordinateClick,
  DesignModeState,
  ElementSelector,
  AnnotationStyle,
  ScreenshotFallback,
  DesignModeEvent,
} from "./design-mode/index.js";

// Visual Design Canvas — Parallel design while agent builds like Replit/Bolt
export {
  DesignCanvas,
  CanvasRenderer,
  CanvasSync,
  COMPONENT_TEMPLATES,
  createComponentFromTemplate,
  getTemplatesByCategory,
  getAllCategories,
  findTemplateByType,
} from "./design-canvas/index.js";
export type {
  DesignCanvasConfig,
  CanvasComponent,
  CanvasState,
  CanvasHistoryEntry,
  ComponentTemplate,
  CanvasSyncEvent,
  RenderedComponent,
  CanvasEvent,
} from "./design-canvas/index.js";

// Design System Integration — pre-built component libraries like Bolt.new
export {
  designSystemRegistry,
  getDesignSystem,
  listDesignSystems,
  getComponentSpec,
  loadDesignSystem,
  preloadAllDesignSystems,
  clearDesignSystemCache,
  mergeTheme,
  getThemeVariables,
  generateComponent,
  generateAllComponents,
} from "./design-systems/index.js";
