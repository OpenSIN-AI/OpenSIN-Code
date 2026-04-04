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

// ============================================================================
// OpenSIN Enhanced Features (v2)
// ============================================================================

// OpenSIN Buddy System — Enhanced companion with sprites and notifications
export { roll, rollWithSeed, getCompanionFromStored, calculateLevel, addXP, renderSprite, spriteFrameCount, renderFace, CompanionSprite, useBuddyNotification, findBuddyTriggerPositions, getBuddyEmotionForEvent, isBuddyTeaserWindow, isBuddyLive, setNotificationManager } from './buddy_v2/index.js'
export type { Rarity, Species, Eye, Hat, StatName, Emotion, CompanionBones, CompanionSoul, Companion, StoredCompanion } from './buddy_v2/index.js'
export { RARITIES, SPECIES, EYES, HATS, STAT_NAMES, EMOTIONS, RARITY_WEIGHTS, RARITY_STARS, RARITY_COLORS, XP_PER_LEVEL, MAX_LEVEL } from './buddy_v2/index.js'

// OpenSIN Vim Mode — Full vim keybindings for terminal editing
export { resolveMotion, isInclusiveMotion, isLinewiseMotion } from './vim_mode/motions.js'
export type { Cursor } from './vim_mode/motions.js'
export { executeOperatorMotion, executeOperatorFind, executeOperatorTextObj, executeLineOp, executeX, executeReplace, executeToggleCase, executeJoin, executePaste, executeIndent, executeOpenLine, executeOperatorG, executeOperatorGg } from './vim_mode/operators.js'
export type { OperatorContext } from './vim_mode/operators.js'
export { findTextObject } from './vim_mode/textObjects.js'
export type { TextObjectRange } from './vim_mode/textObjects.js'
export { transition } from './vim_mode/transitions.js'
export type { TransitionContext, TransitionResult } from './vim_mode/transitions.js'
export type { Operator, FindType, TextObjScope, VimState, CommandState, PersistentState, RecordedChange } from './vim_mode/types.js'
export { OPERATORS, SIMPLE_MOTIONS, FIND_KEYS, TEXT_OBJ_SCOPES, TEXT_OBJ_TYPES, MAX_VIM_COUNT, isOperatorKey, isTextObjScopeKey, createInitialVimState, createInitialPersistentState } from './vim_mode/types.js'

// OpenSIN Advanced Keybindings — Customizable chords and context-aware bindings
export { parseKeySequence, parseKeybindingString, formatKeybinding, keysMatch, isPrefixOf, VALID_CONTEXTS, RESERVED_SHORTCUTS, validateBinding, validateConfig, DEFAULT_KEYBINDINGS, getDefaultBindings, KeybindingResolver, useKeybinding } from './keybindings_v2/index.js'
export type { Modifier, KeyChord, KeySequence, KeyBinding, ResolvedBinding, KeybindingConfig, BindingMatch, ConflictInfo, KeybindingContext } from './keybindings_v2/index.js'

// OpenSIN Enhanced Voice — Push-to-talk with activity detection and commands
export { isVoiceModeSupported, isVoiceModeEnabled, getVoiceModeStatus, useVoice, useVoiceIntegration } from './voice_v2/index.js'
export type { VoiceState, VoiceConfig, VoiceTranscript, VoiceCommand, VoiceEvent } from './voice_v2/index.js'
export { DEFAULT_VOICE_CONFIG } from './voice_v2/index.js'

// OpenSIN Comprehensive Hooks — 20+ React hooks for terminal UI
export { useApiKeyVerification, useAssistantHistory, useBackgroundTaskNavigation, useCancelRequest, useCommandQueue, useCopyOnSelect, useDiffData, useElapsedTime, useHistorySearch, useMemoryUsage, usePromptSuggestion, useRemoteSession, useScheduledTasks, useSessionBackgrounding, useTasksV2, useTerminalSize, useTextInput, useTurnDiffs, useTypeahead, useVirtualScroll } from './hooks_v2/index.js'
export type { HookResult, PaginationState, SearchState, TerminalSize, MemoryUsage, DiffType, DiffData, TaskItem, ScheduledTask, TypeaheadOption, VirtualScrollItem } from './hooks_v2/index.js'

// OpenSIN Extended Tools — 20+ additional agent tools
export { AskUserQuestionTool, BriefTool, EnterPlanModeTool, EnterWorktreeTool, ExitPlanModeTool, ExitWorktreeTool, NotebookEditTool, REPLTool, RemoteTriggerTool, ScheduleCronTool, SendMessageTool, SkillTool, SleepTool, TaskCreateTool, TaskGetTool, TodoWriteTool, ToolSearchTool, WebFetchTool, WebSearchTool, ALL_TOOLS } from './tools_v2/index.js'
export type { ToolDefinition, ToolResult, ToolCall, ToolCategory } from './tools_v2/index.js'

// OpenSIN Advanced Skills — Directory scanning, MCP builders, bundled skills
export { BUNDLED_SKILLS, getBundledSkills, getBundledSkill, buildMCPSkill, buildMCPSkills, isMCPSkill, getMCPServerSkills, loadSkillsFromDirectory, loadAllSkills, matchSkill } from './skills_v2/index.js'
export type { Skill, MCPSkillConfig, SkillMatch, SkillImprovement, SkillDirectory } from './skills_v2/index.js'

// ============================================================================
// OpenSIN Enhanced Features (v2)
// ============================================================================

// OpenSIN Buddy System — Enhanced companion with sprites and notifications
export { roll, rollWithSeed, getCompanionFromStored, calculateLevel, addXP, renderSprite, spriteFrameCount, renderFace, CompanionSprite, useBuddyNotification, findBuddyTriggerPositions, getBuddyEmotionForEvent, isBuddyTeaserWindow, isBuddyLive, setNotificationManager } from './buddy_v2/index.js'
export type { Rarity, Species, Eye, Hat, StatName, Emotion, CompanionBones, CompanionSoul, Companion, StoredCompanion } from './buddy_v2/index.js'
export { RARITIES, SPECIES, EYES, HATS, STAT_NAMES, EMOTIONS, RARITY_WEIGHTS, RARITY_STARS, RARITY_COLORS, XP_PER_LEVEL, MAX_LEVEL } from './buddy_v2/index.js'

// OpenSIN Vim Mode — Full vim keybindings for terminal editing
export { resolveMotion, isInclusiveMotion, isLinewiseMotion } from './vim_mode/motions.js'
export type { Cursor } from './vim_mode/motions.js'
export { executeOperatorMotion, executeOperatorFind, executeOperatorTextObj, executeLineOp, executeX, executeReplace, executeToggleCase, executeJoin, executePaste, executeIndent, executeOpenLine, executeOperatorG, executeOperatorGg } from './vim_mode/operators.js'
export type { OperatorContext } from './vim_mode/operators.js'
export { findTextObject } from './vim_mode/textObjects.js'
export type { TextObjectRange } from './vim_mode/textObjects.js'
export { transition } from './vim_mode/transitions.js'
export type { TransitionContext, TransitionResult } from './vim_mode/transitions.js'
export type { Operator, FindType, TextObjScope, VimState, CommandState, PersistentState, RecordedChange } from './vim_mode/types.js'
export { OPERATORS, SIMPLE_MOTIONS, FIND_KEYS, TEXT_OBJ_SCOPES, TEXT_OBJ_TYPES, MAX_VIM_COUNT, isOperatorKey, isTextObjScopeKey, createInitialVimState, createInitialPersistentState } from './vim_mode/types.js'

// OpenSIN Advanced Keybindings — Customizable chords and context-aware bindings
export { parseKeySequence, parseKeybindingString, formatKeybinding, keysMatch, isPrefixOf, VALID_CONTEXTS, RESERVED_SHORTCUTS, validateBinding, validateConfig, DEFAULT_KEYBINDINGS, getDefaultBindings, KeybindingResolver, useKeybinding } from './keybindings_v2/index.js'
export type { Modifier, KeyChord, KeySequence, KeyBinding, ResolvedBinding, KeybindingConfig, BindingMatch, ConflictInfo, KeybindingContext } from './keybindings_v2/index.js'

// OpenSIN Enhanced Voice — Push-to-talk with activity detection and commands
export { isVoiceModeSupported, isVoiceModeEnabled, getVoiceModeStatus, useVoice, useVoiceIntegration } from './voice_v2/index.js'
export type { VoiceState, VoiceConfig, VoiceTranscript, VoiceCommand, VoiceEvent } from './voice_v2/index.js'
export { DEFAULT_VOICE_CONFIG } from './voice_v2/index.js'

// OpenSIN Comprehensive Hooks — 20+ React hooks for terminal UI
export { useApiKeyVerification, useAssistantHistory, useBackgroundTaskNavigation, useCancelRequest, useCommandQueue, useCopyOnSelect, useDiffData, useElapsedTime, useHistorySearch, useMemoryUsage, usePromptSuggestion, useRemoteSession, useScheduledTasks, useSessionBackgrounding, useTasksV2, useTerminalSize, useTextInput, useTurnDiffs, useTypeahead, useVirtualScroll } from './hooks_v2/index.js'
export type { HookResult, PaginationState, SearchState, TerminalSize, MemoryUsage, DiffType, DiffData, TaskItem, ScheduledTask, TypeaheadOption, VirtualScrollItem } from './hooks_v2/index.js'

// OpenSIN Extended Tools — 20+ additional agent tools
export { AskUserQuestionTool, BriefTool, EnterPlanModeTool, EnterWorktreeTool, ExitPlanModeTool, ExitWorktreeTool, NotebookEditTool, REPLTool, RemoteTriggerTool, ScheduleCronTool, SendMessageTool, SkillTool, SleepTool, TaskCreateTool, TaskGetTool, TodoWriteTool, ToolSearchTool, WebFetchTool, WebSearchTool, ALL_TOOLS } from './tools_v2/index.js'
export type { ToolDefinition, ToolResult, ToolCall, ToolCategory } from './tools_v2/index.js'

// OpenSIN Advanced Skills — Directory scanning, MCP builders, bundled skills
export { BUNDLED_SKILLS, getBundledSkills, getBundledSkill, buildMCPSkill, buildMCPSkills, isMCPSkill, getMCPServerSkills, loadSkillsFromDirectory, loadAllSkills, matchSkill } from './skills_v2/index.js'
export type { Skill, MCPSkillConfig, SkillMatch, SkillImprovement, SkillDirectory } from './skills_v2/index.js'

// ============================================================================
// OpenSIN Assistant Orchestration — Multi-assistant coordination and lifecycle
// ============================================================================

export type {
  AssistantId,
  AssistantStatus,
  AssistantRole,
  AssistantConfig,
  AssistantState,
  TaskAssignment,
  RoutingRule,
  RoutingDecision,
  OrchestrationEvent,
  OrchestrationConfig,
  LifecycleState,
  LifecycleTransition,
  LifecycleEvent,
  SpawnOptions,
  PauseOptions,
  ResumeOptions,
  KillOptions,
  AssistantRegistry,
  TaskRouter,
  Orchestrator,
  OrchestratorEvents,
} from './assistant_orchestration/index.js'

export { Orchestrator, TaskRouter, createDefaultRouter, AssistantLifecycle, spawnAssistant, pauseAssistant, resumeAssistant, killAssistant, getLifecycleState, onLifecycleEvent } from './assistant_orchestration/index.js'

// ============================================================================
// OpenSIN Bootstrap System — Initialization, config loading, plugin discovery
// ============================================================================

export type {
  PluginId,
  PluginState,
  ConfigSource,
  PluginManifest,
  ResolvedPlugin,
  ConfigValue,
  ConfigStore,
  BootstrapOptions,
  BootstrapResult,
  PluginLoader,
  ConfigLoader,
  Initializer,
  BootstrapEvent,
} from './bootstrap_system/index.js'

export { OpenSINConfigLoader, createConfigLoader, OpenSINPluginLoader, createPluginLoader, OpenSINInitializer, createInitializer } from './bootstrap_system/index.js'

// ============================================================================
// OpenSIN Bridge System — Cross-process communication and transport layer
// ============================================================================

export type {
  MessageId,
  SessionId,
  TransportType,
  ConnectionState,
  MessageDirection,
  BridgeMessage,
  BridgeRequest,
  BridgeResponse,
  BridgeNotification,
  BridgeError,
  TransportConfig,
  Transport,
  ProtocolHandler,
  ProtocolAdapter,
  BridgeConfig,
  BridgeState,
  BridgeEvent,
} from './bridge_system/index.js'

export { StdioTransport, WebSocketTransport, HttpTransport, createTransport, OpenSINProtocol, ProtocolError, OpenSINBridge, JsonRpcAdapter, NdjsonAdapter, createBridge } from './bridge_system/index.js'

// ============================================================================
// OpenSIN CLI Framework — Command parsing, help system, execution
// ============================================================================

export type {
  ArgType,
  CommandOption,
  CommandArgument,
  CommandContext,
  CommandHandler,
  CommandDefinition,
  CommandGroup,
  ParsedCommand,
  HelpOptions,
  CliConfig,
  CliResult,
  CliEvent,
} from './cli_framework/index.js'

export { OpenSINParser, createParser, OpenSINExecutor, createExecutor, generateHelp, generateCommandHelp } from './cli_framework/index.js'

// ============================================================================
// OpenSIN Context Management — Window management, compression, persistence
// ============================================================================

export type {
  ContextId,
  ContextRole,
  ContextEntry,
  ContextWindow,
  CompressionStrategy,
  CompressionResult,
  ContextStoreConfig,
  ContextSnapshot,
  ContextEvent,
} from './context_mgmt/index.js'

export { OpenSINContextManager, OpenSINContextCompressor, createCompressor, OpenSINContextStore, createContextStore } from './context_mgmt/index.js'

// ============================================================================
// OpenSIN Coordinator — Task scheduling, dispatch, and monitoring
// ============================================================================

export type {
  TaskId,
  AgentId,
  TaskStatus,
  TaskPriority,
  Task,
  AgentState,
  ScheduleEntry,
  DispatchResult,
  AgentMetrics,
  CoordinatorConfig,
  CoordinatorEvent,
} from './coordinator/index.js'

export { OpenSINScheduler, createScheduler, OpenSINDispatcher, createDispatcher, OpenSINMonitor, createMonitor } from './coordinator/index.js'

// ============================================================================
// OpenSIN Ink Terminal UI — React-based terminal rendering
// ============================================================================

export type {
  TextAlign,
  BorderStyle,
  FlexDirection,
  FlexAlign,
  JustifyContent,
  TextStyle,
  BoxStyle,
  TerminalSize,
  RenderContext,
  OutputCell,
  OutputFrame,
  LayoutNode,
  ComponentProps,
  ReactNode,
  OpenSINComponent,
  UIEvent,
  ThemeColors,
} from './ink_ui/index.js'

export { OPENSIN_THEME, OpenSINRenderer, createRenderer, Box, Text, Spinner, ProgressBar, List, Divider, Table, StatusBar, Input, box, text, spinner, progressBar, list, divider, table, statusBar, input, OpenSINLayoutEngine, createLayoutEngine } from './ink_ui/index.js'

// ============================================================================
// OpenSIN Assistant Orchestration — Multi-assistant coordination and lifecycle
// ============================================================================

export type {
  AssistantId,
  AssistantState,
  AssistantRole,
  AssistantPriority,
  AssistantDescriptor,
  TaskDescriptor,
  TaskRoutingRule,
  OrchestrationConfig,
  LifecycleEvent,
  LifecycleEventType,
  AssistantSpawnRequest,
  AssistantSpawnResult,
  AssistantPauseRequest,
  AssistantResumeRequest,
  AssistantKillRequest,
  TaskAssignment,
  RoutingDecision,
  OrchestrationState,
} from './assistant_orchestration/index.js';

export { Orchestrator } from './assistant_orchestration/index.js';
export { TaskRouter, createDefaultRouter } from './assistant_orchestration/index.js';
export {
  AssistantLifecycle,
  spawnAssistant,
  pauseAssistant,
  resumeAssistant,
  killAssistant,
} from './assistant_orchestration/index.js';

// ============================================================================
// OpenSIN Bootstrap System — Initialization, config loading, plugin discovery
// ============================================================================

export type {
  BootstrapConfig,
  ConfigOverride,
  LoadedConfig,
  ConfigSource,
  PluginManifest,
  PluginInfo,
  PluginRegistry,
  PluginLoadError,
  BootstrapResult,
  BootstrapHook,
  BootstrapContext,
  DefaultConfigEntry,
} from './bootstrap_system/index.js';

export { BootstrapInitializer, bootstrap } from './bootstrap_system/index.js';
export { ConfigLoader } from './bootstrap_system/index.js';
export { PluginLoader } from './bootstrap_system/index.js';

// ============================================================================
// OpenSIN Bridge System — Cross-process communication and transport layer
// ============================================================================

export type {
  TransportType,
  BridgeConfig,
  BridgeMessage,
  BridgeRequest,
  BridgeResponse,
  BridgeNotification,
  BridgeError,
  Transport,
  ProtocolHandler,
  AdapterConfig,
  BridgeAdapter,
  BridgeState,
  BridgeStats,
} from './bridge_system/index.js';

export { createTransport } from './bridge_system/index.js';
export { BridgeProtocol } from './bridge_system/index.js';
export { OpenSINBridgeAdapter, createBridgeAdapter } from './bridge_system/index.js';

// ============================================================================
// OpenSIN CLI Framework — Command parsing, help system, execution
// ============================================================================

export type {
  ArgType,
  CliOption,
  CliArgument,
  CliCommand,
  ParsedArgs,
  CliConfig,
  HelpSection,
  CommandResult,
  ParseResult,
} from './cli_framework/index.js';

export { CliParser } from './cli_framework/index.js';
export { CliExecutor, runCli } from './cli_framework/index.js';
export { generateHelp } from './cli_framework/index.js';

// ============================================================================
// OpenSIN Context Management — Window management, compression, persistence
// ============================================================================

export type {
  ContextRole,
  ContextMessage,
  ContextWindow,
  ContextConfig,
  CompressionResult,
  ContextSnapshot,
  ContextStoreEntry,
  ContextStore,
  ContextStats,
} from './context_mgmt/index.js';

export { ContextManager } from './context_mgmt/index.js';
export { ContextCompressor } from './context_mgmt/index.js';
export { ContextStore as ContextPersistentStore } from './context_mgmt/index.js';

// ============================================================================
// OpenSIN Coordinator — Task scheduling, dispatch, and monitoring
// ============================================================================

export type {
  TaskStatus,
  TaskPriority,
  AgentStatus,
  ScheduleStrategy,
  Task,
  AgentDescriptor,
  ScheduleEntry,
  DispatchResult,
  MonitorReport,
  CoordinatorConfig,
  CoordinatorState,
} from './coordinator/index.js';

export { TaskScheduler } from './coordinator/index.js';
export { WorkDispatcher } from './coordinator/index.js';
export { CoordinatorMonitor } from './coordinator/index.js';

// ============================================================================
// OpenSIN Assistant Orchestration — Multi-assistant coordination and lifecycle
// ============================================================================

export type {
  AssistantId,
  AssistantState,
  AssistantRole,
  AssistantPriority,
  AssistantDescriptor,
  TaskDescriptor,
  TaskRoutingRule,
  OrchestrationConfig,
  LifecycleEvent,
  LifecycleEventType,
  AssistantSpawnRequest,
  AssistantSpawnResult,
  AssistantPauseRequest,
  AssistantResumeRequest,
  AssistantKillRequest,
  TaskAssignment,
  RoutingDecision,
  OrchestrationState,
} from './assistant_orchestration/index.js';

export { Orchestrator } from './assistant_orchestration/index.js';
export { TaskRouter, createDefaultRouter } from './assistant_orchestration/index.js';
export {
  AssistantLifecycle,
  spawnAssistant,
  pauseAssistant,
  resumeAssistant,
  killAssistant,
} from './assistant_orchestration/index.js';

// ============================================================================
// OpenSIN Bootstrap System — Initialization, config loading, plugin discovery
// ============================================================================

export type {
  BootstrapConfig,
  ConfigOverride,
  LoadedConfig,
  ConfigSource,
  PluginManifest,
  PluginInfo,
  PluginRegistry,
  PluginLoadError,
  BootstrapResult,
  BootstrapHook,
  BootstrapContext,
  DefaultConfigEntry,
} from './bootstrap_system/index.js';

export { BootstrapInitializer, bootstrap } from './bootstrap_system/index.js';
export { ConfigLoader } from './bootstrap_system/index.js';
export { PluginLoader } from './bootstrap_system/index.js';

// ============================================================================
// OpenSIN Bridge System — Cross-process communication and transport layer
// ============================================================================

export type {
  TransportType,
  BridgeConfig,
  BridgeMessage,
  BridgeRequest,
  BridgeResponse,
  BridgeNotification,
  BridgeError,
  Transport,
  ProtocolHandler,
  AdapterConfig,
  BridgeAdapter,
  BridgeState,
  BridgeStats,
} from './bridge_system/index.js';

export { createTransport } from './bridge_system/index.js';
export { BridgeProtocol } from './bridge_system/index.js';
export { OpenSINBridgeAdapter, createBridgeAdapter } from './bridge_system/index.js';

// ============================================================================
// OpenSIN CLI Framework — Command parsing, help system, execution
// ============================================================================

export type {
  ArgType,
  CliOption,
  CliArgument,
  CliCommand,
  ParsedArgs,
  CliConfig,
  HelpSection,
  CommandResult,
  ParseResult,
} from './cli_framework/index.js';

export { CliParser } from './cli_framework/index.js';
export { CliExecutor, runCli } from './cli_framework/index.js';
export { generateHelp } from './cli_framework/index.js';

// ============================================================================
// OpenSIN Context Management — Window management, compression, persistence
// ============================================================================

export type {
  ContextRole,
  ContextMessage,
  ContextWindow,
  ContextConfig,
  CompressionResult,
  ContextSnapshot,
  ContextStoreEntry,
  ContextStore,
  ContextStats,
} from './context_mgmt/index.js';

export { ContextManager } from './context_mgmt/index.js';
export { ContextCompressor } from './context_mgmt/index.js';
export { ContextStore as ContextPersistentStore } from './context_mgmt/index.js';

// ============================================================================
// OpenSIN Coordinator — Task scheduling, dispatch, and monitoring
// ============================================================================

export type {
  TaskStatus,
  TaskPriority,
  AgentStatus,
  ScheduleStrategy,
  Task,
  AgentDescriptor,
  ScheduleEntry,
  DispatchResult,
  MonitorReport,
  CoordinatorConfig,
  CoordinatorState,
} from './coordinator/index.js';

export { TaskScheduler } from './coordinator/index.js';
export { WorkDispatcher } from './coordinator/index.js';
export { CoordinatorMonitor } from './coordinator/index.js';
