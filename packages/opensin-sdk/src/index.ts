// ============================================================
// OpenSIN SDK - Main Entry Point
// ============================================================

// Agent Loop
export { AgentLoop, createAgentLoop, AgentLoopContext } from './agent_loop';
export type { AgentLoopConfig, AgentLoopResult, ToolHandler } from './agent_loop';

// CLI Agent
export { CLIAgent, SessionManager, ToolRegistry, createBuiltinTools } from './cli-agent';
export type { CLIAgentConfig, CLIAgentSession, CLIMessage, CLIContext, CLITool, ToolCallRecord, ToolResult as CLIToolResult, CLICommand, CLICommandOptions, CLIAgentState, CLIEvent } from './cli-agent';

// Model Routing
export { SmartModelRouter } from './model_routing';
export type { ModelConfig, RoutingConfig, RoutingDecision, TaskComplexity } from './model_routing';

// Context Management
export { OpenSINContextManager, OpenSINContextCompressor, createCompressor } from './context_mgmt';

// Memory
export { MemoryManager, FileMemoryProvider, createMemoryManager, createFileProvider } from './memory';
export type { MemoryEntry, MemoryProvider } from './memory';

// Safety
export { SafetyDetector, createSafetyDetector } from './safety';
export type { SafetyCheck } from './safety';

// Permissions
export { PermissionEvaluator, ApprovalGate, AuditLogger } from './permissions';
export type { PermissionRule, PermissionDecision } from './permissions';

// Session Persistence
export { SessionStore, SessionManager } from './session_persistence';
export type { SessionMessage, SessionMetadata, SessionData } from './session_persistence';

// Hook System
export { HookRegistry, executeHook } from './hook_system';
export type { HookEvent, HookResult, HookDefinition } from './hook_system';

// Parallel Tools
export { ParallelToolExecutor, createParallelExecutor } from './parallel_tools';
export type { ToolCall, ToolResult, ParallelConfig } from './parallel_tools';

// Usage Pricing
export { UsagePricing } from './usage_pricing';
export type { UsageRecord, UsageSummary } from './usage_pricing';

// Prompt Builder
export { PromptBuilder, optimizeSections, injectContext } from './prompt_builder';
export type { PromptSection, PromptTemplate, PromptContext } from './prompt_builder';

// Skill System
export { SkillRegistry, SkillActivator, parseSkillFile, loadSkillFile } from './skill_system';
export type { SkillMetadata, SkillDefinition, SkillRegistryOptions } from './skill_system';

// A2A Transport Layer
export { A2AServer, A2AClient } from './transport';
export type { A2ATaskPayload, A2ATaskResponse, A2AHealthCheck } from './transport';

// Heartbeat System
export { HeartbeatSystem, createHeartbeatSystem } from './heartbeat';
export type { HeartbeatConfig, HeartbeatState, HeartbeatEvent, HeartbeatStatus, QueuedTask, TaskResult, TaskProcessor, TaskQueuePoller } from './heartbeat';

// Failover Model Router
export { FailoverRouter, createFailoverRouter, OPENSIN_MODELS, DEFAULT_CHAINS } from './model_routing/failover';
export type { FailoverModelConfig, FailoverChain, FailoverResult, FailoverEvent } from './model_routing/failover';

// Cron Scheduler
export { CronScheduler, createCronScheduler, parseCronExpression, getNextExecution } from './cron';
export type { CronTask, CronExecution, CronExecutor, CronEvent } from './cron';

// Approval Hooks
export { ApprovalHooks, createApprovalHooks, DEFAULT_RULES as DEFAULT_APPROVAL_RULES } from './approval';
export type { ApprovalRule, ApprovalRequest, ApprovalDecision, ApprovalEvent, RiskLevel, ApprovalCondition } from './approval';

// Agent Orchestrator
export { AgentOrchestrator, createOrchestrator } from './orchestrator';
export type { OrchestratorConfig, OrchestratorState, OrchestratorEvent, OrchestratorCallback } from './orchestrator';

// V2 Modules (experimental)
export * from './hooks_v2';
export * from './ink_v2';
export * from './cli_v2';
export * from './tools_v2';
export * from './utils_v2';
export * from './components_v2';
