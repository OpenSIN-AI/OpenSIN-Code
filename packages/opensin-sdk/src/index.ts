// ============================================================
// OpenSIN SDK - Main Entry Point
// ============================================================

// Agent Loop
export { AgentLoop, createAgentLoop, AgentLoopContext } from './agent_loop';
export type { AgentLoopConfig, AgentLoopResult, ToolHandler } from './agent_loop';

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
