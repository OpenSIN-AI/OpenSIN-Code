/**
 * OpenSIN Background Agents — Tests
 *
 * Tests for the background agent delegation system.
 *
 * Phase 3.2 — Background Agents Plugin (Async agent delegation)
 * Issue: #362
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import * as os from "node:os";
import {
  BackgroundAgentManager,
  BackgroundAgentStdinHandler,
  BACKGROUND_AGENT_HELP,
  isTerminalStatus,
  isActiveStatus,
  DEFAULT_BACKGROUND_AGENT_CONFIG,
  DEFAULT_MAX_RUN_TIME_MS,
  DEFAULT_READ_POLL_INTERVAL_MS,
  DEFAULT_TERMINAL_WAIT_GRACE_MS,
  DEFAULT_ALL_COMPLETE_QUIET_PERIOD_MS,
} from "../background_agents/index.js";
import type { SpawnAgentInput, CommandContext, BackgroundAgentEvent } from "../background_agents/index.js";

// ============================================================
// Test Helpers
// ============================================================

function createTempDir(): string {
  return path.join(os.tmpdir(), `opensin-bg-test-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`);
}

function createTestContext(overrides: Partial<CommandContext> = {}): CommandContext {
  return {
    sessionId: "test-session-001",
    messageId: "test-message-001",
    agentName: "sin-researcher",
    ...overrides,
  };
}

function createSpawnInput(overrides: Partial<SpawnAgentInput> = {}): SpawnAgentInput {
  return {
    prompt: "Research TypeScript best practices for 2026",
    parentSessionId: "test-session-001",
    parentMessageId: "test-message-001",
    parentAgent: "sin-researcher",
    ...overrides,
  };
}

// ============================================================
// Tests
// ============================================================

describe("Background Agents — Types", () => {
  it("isTerminalStatus returns true for terminal states", () => {
    expect(isTerminalStatus("complete")).toBe(true);
    expect(isTerminalStatus("error")).toBe(true);
    expect(isTerminalStatus("cancelled")).toBe(true);
    expect(isTerminalStatus("timeout")).toBe(true);
  });

  it("isTerminalStatus returns false for active states", () => {
    expect(isTerminalStatus("registered")).toBe(false);
    expect(isTerminalStatus("running")).toBe(false);
  });

  it("isActiveStatus returns true for active states", () => {
    expect(isActiveStatus("registered")).toBe(true);
    expect(isActiveStatus("running")).toBe(true);
  });

  it("isActiveStatus returns false for terminal states", () => {
    expect(isActiveStatus("complete")).toBe(false);
    expect(isActiveStatus("error")).toBe(false);
    expect(isActiveStatus("cancelled")).toBe(false);
    expect(isActiveStatus("timeout")).toBe(false);
  });

  it("DEFAULT_BACKGROUND_AGENT_CONFIG has correct defaults", () => {
    expect(DEFAULT_MAX_RUN_TIME_MS).toBe(15 * 60 * 1000);
    expect(DEFAULT_READ_POLL_INTERVAL_MS).toBe(250);
    expect(DEFAULT_TERMINAL_WAIT_GRACE_MS).toBe(10_000);
    expect(DEFAULT_ALL_COMPLETE_QUIET_PERIOD_MS).toBe(50);
    expect(DEFAULT_BACKGROUND_AGENT_CONFIG.maxRunTimeMs).toBe(15 * 60 * 1000);
    expect(DEFAULT_BACKGROUND_AGENT_CONFIG.autoMetadata).toBe(true);
  });
});

describe("BackgroundAgentManager — Lifecycle", () => {
  let tempDir: string;
  let manager: BackgroundAgentManager;

  beforeEach(async () => {
    tempDir = createTempDir();
    await fs.mkdir(tempDir, { recursive: true });
    manager = new BackgroundAgentManager({ baseDir: tempDir });
  });

  afterEach(() => {
    manager.dispose();
  });

  it("spawns a background agent with readable ID", async () => {
    const input = createSpawnInput();
    const agent = await manager.spawn(input);

    expect(agent.id).toBeDefined();
    expect(agent.id).toMatch(/^[a-z]+-[a-z]+-[a-z]+$/); // readable ID pattern
    expect(agent.status).toBe("running");
    expect(agent.prompt).toBe(input.prompt);
    expect(agent.parentSessionId).toBe(input.parentSessionId);
    expect(agent.agent).toBe("sin-researcher");
    expect(agent.sessionId).toBeDefined();
    expect(agent.createdAt).toBeDefined();
    expect(agent.timeoutAt).toBeDefined();
  });

  it("spawns agents with unique IDs", async () => {
    const ids = new Set<string>();
    for (let i = 0; i < 10; i++) {
      const agent = await manager.spawn(createSpawnInput({ prompt: `Task ${i}` }));
      expect(ids.has(agent.id)).toBe(false);
      ids.add(agent.id);
    }
    expect(ids.size).toBe(10);
  });

  it("completes an agent with result", async () => {
    const agent = await manager.spawn(createSpawnInput());
    await manager.complete(agent.id, "TypeScript 2026 best practices: use strict mode, ES modules, and native decorators.");

    const updated = manager.findById(agent.id);
    expect(updated).toBeDefined();
    expect(updated!.status).toBe("complete");
    expect(updated!.result).toContain("TypeScript 2026 best practices");
    expect(updated!.completedAt).toBeDefined();
    expect(updated!.title).toBeDefined();
    expect(updated!.description).toBeDefined();
  });

  it("fails an agent with error", async () => {
    const agent = await manager.spawn(createSpawnInput());
    await manager.fail(agent.id, "Network connection failed");

    const updated = manager.findById(agent.id);
    expect(updated!.status).toBe("error");
    expect(updated!.error).toBe("Network connection failed");
  });

  it("cancels a running agent", async () => {
    const agent = await manager.spawn(createSpawnInput());
    await manager.cancel(agent.id);

    const updated = manager.findById(agent.id);
    expect(updated!.status).toBe("cancelled");
  });

  it("cannot cancel an already terminal agent", async () => {
    const agent = await manager.spawn(createSpawnInput());
    await manager.complete(agent.id, "Done");
    await manager.cancel(agent.id); // Should be no-op

    const updated = manager.findById(agent.id);
    expect(updated!.status).toBe("complete"); // Still complete, not cancelled
  });

  it("cannot transition from terminal to non-terminal", async () => {
    const agent = await manager.spawn(createSpawnInput());
    await manager.complete(agent.id, "Done");
    await manager.complete(agent.id, "Done again"); // Should be no-op

    const updated = manager.findById(agent.id);
    expect(updated!.result).toBe("Done"); // Original result preserved
  });
});

describe("BackgroundAgentManager — Query Methods", () => {
  let tempDir: string;
  let manager: BackgroundAgentManager;

  beforeEach(async () => {
    tempDir = createTempDir();
    await fs.mkdir(tempDir, { recursive: true });
    manager = new BackgroundAgentManager({ baseDir: tempDir });
  });

  afterEach(() => {
    manager.dispose();
  });

  it("lists all agents", async () => {
    await manager.spawn(createSpawnInput({ prompt: "Task 1" }));
    await manager.spawn(createSpawnInput({ prompt: "Task 2" }));

    expect(manager.listAll().length).toBe(2);
  });

  it("lists active and terminal agents correctly", async () => {
    const a1 = await manager.spawn(createSpawnInput({ prompt: "Task 1" }));
    const a2 = await manager.spawn(createSpawnInput({ prompt: "Task 2" }));
    await manager.complete(a1.id, "Done");

    expect(manager.listActive().length).toBe(1);
    expect(manager.listTerminal().length).toBe(1);
  });

  it("lists agents by parent session", async () => {
    await manager.spawn(createSpawnInput({ parentSessionId: "session-a", prompt: "A1" }));
    await manager.spawn(createSpawnInput({ parentSessionId: "session-a", prompt: "A2" }));
    await manager.spawn(createSpawnInput({ parentSessionId: "session-b", prompt: "B1" }));

    expect(manager.listByParentSession("session-a").length).toBe(2);
    expect(manager.listByParentSession("session-b").length).toBe(1);
  });

  it("finds agent by ID", async () => {
    const agent = await manager.spawn(createSpawnInput());
    const found = manager.findById(agent.id);
    expect(found).toBeDefined();
    expect(found!.id).toBe(agent.id);
  });

  it("finds agent by session ID", async () => {
    const agent = await manager.spawn(createSpawnInput());
    const found = manager.findBySession(agent.sessionId);
    expect(found).toBeDefined();
    expect(found!.id).toBe(agent.id);
  });

  it("returns undefined for non-existent agent", () => {
    expect(manager.findById("non-existent")).toBeUndefined();
    expect(manager.findBySession("non-existent")).toBeUndefined();
  });

  it("gets status summary", async () => {
    const a1 = await manager.spawn(createSpawnInput({ prompt: "1" }));
    const a2 = await manager.spawn(createSpawnInput({ prompt: "2" }));
    const a3 = await manager.spawn(createSpawnInput({ prompt: "3" }));
    await manager.complete(a1.id, "Done");
    await manager.fail(a2.id, "Error");

    const summary = manager.getStatusSummary();
    expect(summary.total).toBe(3);
    expect(summary.active).toBe(1);
    expect(summary.completed).toBe(1);
    expect(summary.errors).toBe(1);
  });

  it("gets agent list in CLI format", async () => {
    const agent = await manager.spawn(createSpawnInput());
    await manager.complete(agent.id, "Research complete");

    const list = manager.getAgentList("test-session-001");
    expect(list.length).toBe(1);
    expect(list[0].id).toBe(agent.id);
    expect(list[0].status).toBe("complete");
    expect(list[0].title).toBeDefined();
  });
});

describe("BackgroundAgentManager — Persistence", () => {
  let tempDir: string;
  let manager: BackgroundAgentManager;

  beforeEach(async () => {
    tempDir = createTempDir();
    await fs.mkdir(tempDir, { recursive: true });
    manager = new BackgroundAgentManager({ baseDir: tempDir });
  });

  afterEach(() => {
    manager.dispose();
  });

  it("persists agent output to disk on completion", async () => {
    const agent = await manager.spawn(createSpawnInput());
    await manager.complete(agent.id, "This is the research result.");

    // Wait a moment for file system
    await new Promise((r) => setTimeout(r, 100));

    const content = await manager.readPersistedArtifact(agent.artifact.filePath);
    expect(content).toBeDefined();
    expect(content!).toContain("This is the research result.");
    expect(content!).toContain("OpenSIN Background Agent");
    expect(content!).toContain(agent.id);
  });

  it("artifact file contains metadata header", async () => {
    const agent = await manager.spawn(createSpawnInput({
      prompt: "Analyze the performance of React 19",
    }));
    await manager.complete(agent.id, "React 19 introduces Server Components as the default.");

    await new Promise((r) => setTimeout(r, 100));

    const content = await manager.readPersistedArtifact(agent.artifact.filePath);
    expect(content).toBeDefined();
    expect(content!).toContain("# "); // Title header
    expect(content!).toContain("**ID:**");
    expect(content!).toContain("**Agent:**");
    expect(content!).toContain("**Status:** complete");
    expect(content!).toContain("---");
    expect(content!).toContain("React 19 introduces Server Components");
  });

  it("tracks artifact byte length", async () => {
    const agent = await manager.spawn(createSpawnInput());
    await manager.complete(agent.id, "Result content");

    await new Promise((r) => setTimeout(r, 100));

    const updated = manager.findById(agent.id);
    expect(updated!.artifact.byteLength).toBeGreaterThan(0);
    expect(updated!.artifact.persistedAt).toBeDefined();
    expect(updated!.artifact.persistError).toBeUndefined();
  });
});

describe("BackgroundAgentManager — Result Retrieval", () => {
  let tempDir: string;
  let manager: BackgroundAgentManager;

  beforeEach(async () => {
    tempDir = createTempDir();
    await fs.mkdir(tempDir, { recursive: true });
    manager = new BackgroundAgentManager({ baseDir: tempDir });
  });

  afterEach(() => {
    manager.dispose();
  });

  it("retrieves result from completed agent", async () => {
    const agent = await manager.spawn(createSpawnInput());
    await manager.complete(agent.id, "Final research findings.");

    const result = await manager.getResult(agent.id, "reader-session");
    expect(result).toContain("Final research findings.");
  });

  it("retrieves persisted artifact when available", async () => {
    const agent = await manager.spawn(createSpawnInput());
    await manager.complete(agent.id, "Persisted content here.");

    await new Promise((r) => setTimeout(r, 100));

    const result = await manager.getResult(agent.id, "reader-session");
    expect(result).toContain("Persisted content here.");
    expect(result).toContain("OpenSIN Background Agent");
  });

  it("throws for non-existent agent", async () => {
    await expect(manager.getResult("non-existent")).rejects.toThrow("not found");
  });

  it("tracks retrieval count", async () => {
    const agent = await manager.spawn(createSpawnInput());
    await manager.complete(agent.id, "Result");

    await manager.getResult(agent.id, "reader-1");
    await manager.getResult(agent.id, "reader-2");

    const updated = manager.findById(agent.id);
    expect(updated!.retrieval.retrievalCount).toBe(2);
  });

  it("returns waiting message for running agent", async () => {
    const agent = await manager.spawn(createSpawnInput());

    // Use very short terminal wait grace period
    const result = await manager.getResult(agent.id, undefined);
    expect(result).toContain("still running");
  });
});

describe("BackgroundAgentManager — Events", () => {
  let tempDir: string;
  let manager: BackgroundAgentManager;

  beforeEach(async () => {
    tempDir = createTempDir();
    await fs.mkdir(tempDir, { recursive: true });
    manager = new BackgroundAgentManager({ baseDir: tempDir });
  });

  afterEach(() => {
    manager.dispose();
  });

  it("emits spawned event", async () => {
    const events: BackgroundAgentEvent[] = [];
    manager.onEvent((e) => events.push(e));

    const agent = await manager.spawn(createSpawnInput());

    const spawned = events.find((e) => e.type === "agent:spawned");
    expect(spawned).toBeDefined();
    expect((spawned as any).agent.id).toBe(agent.id);
  });

  it("emits started event", async () => {
    const events: BackgroundAgentEvent[] = [];
    manager.onEvent((e) => events.push(e));

    await manager.spawn(createSpawnInput());

    const started = events.find((e) => e.type === "agent:started");
    expect(started).toBeDefined();
  });

  it("emits complete event", async () => {
    const events: BackgroundAgentEvent[] = [];
    manager.onEvent((e) => events.push(e));

    const agent = await manager.spawn(createSpawnInput());
    await manager.complete(agent.id, "Done");

    const complete = events.find((e) => e.type === "agent:complete");
    expect(complete).toBeDefined();
    expect((complete as any).agentId).toBe(agent.id);
  });

  it("emits error event", async () => {
    const events: BackgroundAgentEvent[] = [];
    manager.onEvent((e) => events.push(e));

    const agent = await manager.spawn(createSpawnInput());
    await manager.fail(agent.id, "Something broke");

    const error = events.find((e) => e.type === "agent:error");
    expect(error).toBeDefined();
    expect((error as any).error).toBe("Something broke");
  });

  it("emits cancelled event", async () => {
    const events: BackgroundAgentEvent[] = [];
    manager.onEvent((e) => events.push(e));

    const agent = await manager.spawn(createSpawnInput());
    await manager.cancel(agent.id);

    const cancelled = events.find((e) => e.type === "agent:cancelled");
    expect(cancelled).toBeDefined();
  });

  it("emits retrieved event", async () => {
    const events: BackgroundAgentEvent[] = [];
    manager.onEvent((e) => events.push(e));

    const agent = await manager.spawn(createSpawnInput());
    await manager.complete(agent.id, "Done");
    await manager.getResult(agent.id, "reader");

    const retrieved = events.find((e) => e.type === "agent:retrieved");
    expect(retrieved).toBeDefined();
  });

  it("can remove event listener", async () => {
    const events: BackgroundAgentEvent[] = [];
    const listener = (e: BackgroundAgentEvent) => events.push(e);
    manager.onEvent(listener);
    manager.offEvent(listener);

    await manager.spawn(createSpawnInput());
    expect(events.length).toBe(0);
  });
});

describe("BackgroundAgentManager — Timeout", () => {
  let tempDir: string;
  let manager: BackgroundAgentManager;

  beforeEach(async () => {
    tempDir = createTempDir();
    await fs.mkdir(tempDir, { recursive: true });
    // Use very short timeout for testing (50ms)
    manager = new BackgroundAgentManager({
      baseDir: tempDir,
      maxRunTimeMs: 50,
    });
  });

  afterEach(() => {
    manager.dispose();
  });

  it("times out agent after maxRunTimeMs", async () => {
    const agent = await manager.spawn(createSpawnInput());

    // Wait for timeout (maxRunTimeMs = 50ms, so 200ms is plenty)
    await new Promise((r) => setTimeout(r, 200));

    const updated = manager.findById(agent.id);
    expect(updated!.status).toBe("timeout");
  });
});

describe("BackgroundAgentManager — Terminal Wait", () => {
  let tempDir: string;
  let manager: BackgroundAgentManager;

  beforeEach(async () => {
    tempDir = createTempDir();
    await fs.mkdir(tempDir, { recursive: true });
    manager = new BackgroundAgentManager({ baseDir: tempDir });
  });

  afterEach(() => {
    manager.dispose();
  });

  it("returns terminal immediately for completed agent", async () => {
    const agent = await manager.spawn(createSpawnInput());
    await manager.complete(agent.id, "Done");

    const result = await manager.waitForTerminal(agent.id, 1000);
    expect(result).toBe("terminal");
  });

  it("returns timeout for running agent", async () => {
    const agent = await manager.spawn(createSpawnInput());

    // The waiter is created but won't resolve until the agent completes
    // Since the agent is still running, we should get timeout
    const result = await manager.waitForTerminal(agent.id, 50);
    expect(result).toBe("timeout");
  });

  it("returns timeout for non-existent agent", async () => {
    const result = await manager.waitForTerminal("non-existent", 50);
    expect(result).toBe("timeout");
  });
});

describe("BackgroundAgentManager — Parent Notification", () => {
  let tempDir: string;
  let manager: BackgroundAgentManager;

  beforeEach(async () => {
    tempDir = createTempDir();
    await fs.mkdir(tempDir, { recursive: true });
    manager = new BackgroundAgentManager({
      baseDir: tempDir,
      allCompleteQuietPeriodMs: 10,
    });
  });

  afterEach(() => {
    manager.dispose();
  });

  it("tracks pending count", async () => {
    await manager.spawn(createSpawnInput({ prompt: "1" }));
    await manager.spawn(createSpawnInput({ prompt: "2" }));

    // Both agents should be in the pending set
    expect(manager.getPendingCount("test-session-001")).toBe(2);
  });

  it("decrements pending count on completion", async () => {
    const a1 = await manager.spawn(createSpawnInput({ prompt: "1" }));
    await manager.spawn(createSpawnInput({ prompt: "2" }));

    await manager.complete(a1.id, "Done");
    expect(manager.getPendingCount("test-session-001")).toBe(1);
  });

  it("emits all-complete when all agents in cycle complete", async () => {
    const events: BackgroundAgentEvent[] = [];
    manager.onEvent((e) => events.push(e));

    const a1 = await manager.spawn(createSpawnInput({ prompt: "1" }));
    const a2 = await manager.spawn(createSpawnInput({ prompt: "2" }));

    await manager.complete(a1.id, "Done 1");
    await manager.complete(a2.id, "Done 2");

    // Wait for all-complete quiet period
    await new Promise((r) => setTimeout(r, 100));

    const allComplete = events.find((e) => e.type === "agent:all-complete");
    expect(allComplete).toBeDefined();
  });
});

describe("BackgroundAgentManager — Unread Tracking", () => {
  let tempDir: string;
  let manager: BackgroundAgentManager;

  beforeEach(async () => {
    tempDir = createTempDir();
    await fs.mkdir(tempDir, { recursive: true });
    manager = new BackgroundAgentManager({ baseDir: tempDir });
  });

  afterEach(() => {
    manager.dispose();
  });

  it("marks agent as unread after completion", async () => {
    const agent = await manager.spawn(createSpawnInput());
    await manager.complete(agent.id, "Done");

    const list = manager.getAgentList("test-session-001");
    expect(list[0].unread).toBe(true);
  });

  it("marks agent as read after retrieval", async () => {
    const agent = await manager.spawn(createSpawnInput());
    await manager.complete(agent.id, "Done");
    await manager.getResult(agent.id, "reader-session");

    const list = manager.getAgentList("test-session-001");
    expect(list[0].unread).toBe(false);
  });
});

describe("BackgroundAgentManager — Dispose", () => {
  let tempDir: string;
  let manager: BackgroundAgentManager;

  beforeEach(async () => {
    tempDir = createTempDir();
    await fs.mkdir(tempDir, { recursive: true });
    manager = new BackgroundAgentManager({ baseDir: tempDir });
  });

  it("cleans up resources on dispose", async () => {
    await manager.spawn(createSpawnInput());
    manager.dispose();

    // After dispose, no timers should fire
    await new Promise((r) => setTimeout(r, 200));
    // If we get here without errors, dispose worked
    expect(true).toBe(true);
  });
});

describe("BackgroundAgentCommands — CLI Commands", () => {
  let tempDir: string;
  let manager: BackgroundAgentManager;
  let ctx: CommandContext;

  beforeEach(async () => {
    tempDir = createTempDir();
    await fs.mkdir(tempDir, { recursive: true });
    manager = new BackgroundAgentManager({ baseDir: tempDir });
    ctx = createTestContext();
  });

  afterEach(() => {
    manager.dispose();
  });

  it("spawn command creates agent", async () => {
    const { BackgroundAgentCommands } = await import("../background_agents/commands.js");
    const cmds = new BackgroundAgentCommands(manager);

    const result = await cmds.spawn("Research React 19", ctx);
    expect(result.success).toBe(true);
    expect(result.output).toContain("Background Agent Spawned");
    expect(result.output).toContain("sin-researcher");
  });

  it("spawn command fails with empty prompt", async () => {
    const { BackgroundAgentCommands } = await import("../background_agents/commands.js");
    const cmds = new BackgroundAgentCommands(manager);

    const result = await cmds.spawn("", ctx);
    expect(result.success).toBe(false);
    expect(result.error).toContain("Usage: /spawn");
  });

  it("list command shows agents", async () => {
    const { BackgroundAgentCommands } = await import("../background_agents/commands.js");
    const cmds = new BackgroundAgentCommands(manager);

    await manager.spawn(createSpawnInput({ prompt: "Task 1" }));
    await manager.spawn(createSpawnInput({ prompt: "Task 2" }));

    const result = cmds.list(ctx);
    expect(result.success).toBe(true);
    expect(result.output).toContain("Background Agents");
    expect(result.output).toContain("2 total");
  });

  it("list command shows empty state", async () => {
    const { BackgroundAgentCommands } = await import("../background_agents/commands.js");
    const cmds = new BackgroundAgentCommands(manager);

    const result = cmds.list(ctx);
    expect(result.success).toBe(true);
    expect(result.output).toContain("No background agents");
  });

  it("status command shows summary", async () => {
    const { BackgroundAgentCommands } = await import("../background_agents/commands.js");
    const cmds = new BackgroundAgentCommands(manager);

    await manager.spawn(createSpawnInput({ prompt: "1" }));
    await manager.spawn(createSpawnInput({ prompt: "2" }));

    const result = cmds.status(undefined, ctx);
    expect(result.success).toBe(true);
    expect(result.output).toContain("Status");
  });

  it("status command shows specific agent", async () => {
    const { BackgroundAgentCommands } = await import("../background_agents/commands.js");
    const cmds = new BackgroundAgentCommands(manager);

    const agent = await manager.spawn(createSpawnInput({ prompt: "Research" }));

    const result = cmds.status(agent.id, ctx);
    expect(result.success).toBe(true);
    expect(result.output).toContain(agent.id);
    expect(result.output).toContain("Research");
  });

  it("status command fails for non-existent agent", async () => {
    const { BackgroundAgentCommands } = await import("../background_agents/commands.js");
    const cmds = new BackgroundAgentCommands(manager);

    const result = cmds.status("non-existent", ctx);
    expect(result.success).toBe(false);
    expect(result.error).toContain("not found");
  });

  it("kill command cancels running agent", async () => {
    const { BackgroundAgentCommands } = await import("../background_agents/commands.js");
    const cmds = new BackgroundAgentCommands(manager);

    const agent = await manager.spawn(createSpawnInput());

    const result = await cmds.kill(agent.id);
    expect(result.success).toBe(true);
    expect(result.output).toContain("cancelled");
  });

  it("kill command fails for non-existent agent", async () => {
    const { BackgroundAgentCommands } = await import("../background_agents/commands.js");
    const cmds = new BackgroundAgentCommands(manager);

    const result = await cmds.kill("non-existent");
    expect(result.success).toBe(false);
  });

  it("kill command fails for already terminal agent", async () => {
    const { BackgroundAgentCommands } = await import("../background_agents/commands.js");
    const cmds = new BackgroundAgentCommands(manager);

    const agent = await manager.spawn(createSpawnInput());
    await manager.complete(agent.id, "Done");

    const result = await cmds.kill(agent.id);
    expect(result.success).toBe(false);
    expect(result.error).toContain("already in terminal state");
  });

  it("result command retrieves output", async () => {
    const { BackgroundAgentCommands } = await import("../background_agents/commands.js");
    const cmds = new BackgroundAgentCommands(manager);

    const agent = await manager.spawn(createSpawnInput());
    await manager.complete(agent.id, "Research findings here.");

    const result = await cmds.result(agent.id, ctx);
    expect(result.success).toBe(true);
    expect(result.output).toContain("Research findings here.");
  });

  it("wait command completes for finished agent", async () => {
    const { BackgroundAgentCommands } = await import("../background_agents/commands.js");
    const cmds = new BackgroundAgentCommands(manager);

    const agent = await manager.spawn(createSpawnInput());
    await manager.complete(agent.id, "Done");

    const result = await cmds.wait(agent.id, 1000);
    expect(result.success).toBe(true);
    expect(result.output).toContain("Agent Complete");
  });

  it("wait command times out for running agent", async () => {
    const { BackgroundAgentCommands } = await import("../background_agents/commands.js");
    const cmds = new BackgroundAgentCommands(manager);

    const agent = await manager.spawn(createSpawnInput());

    const result = await cmds.wait(agent.id, 50);
    expect(result.success).toBe(true);
    expect(result.output).toContain("Still Running");
  });
});

describe("BackgroundAgentStdinHandler — Command Parsing", () => {
  let tempDir: string;
  let manager: BackgroundAgentManager;
  let handler: BackgroundAgentStdinHandler;
  let ctx: CommandContext;

  beforeEach(async () => {
    tempDir = createTempDir();
    await fs.mkdir(tempDir, { recursive: true });
    manager = new BackgroundAgentManager({ baseDir: tempDir });
    handler = new BackgroundAgentStdinHandler(manager);
    ctx = createTestContext();
  });

  afterEach(() => {
    handler.dispose();
  });

  it("consumes /spawn command", async () => {
    const result = await handler.handleInput("/spawn Research TypeScript", ctx);
    expect(result.consumed).toBe(true);
    expect(result.result?.success).toBe(true);
  });

  it("consumes /spawn with --agent option", async () => {
    const result = await handler.handleInput("/spawn Research --agent sin-explorer", ctx);
    expect(result.consumed).toBe(true);
    expect(result.result?.success).toBe(true);
  });

  it("consumes /agents list command", async () => {
    const result = await handler.handleInput("/agents list", ctx);
    expect(result.consumed).toBe(true);
    expect(result.result?.success).toBe(true);
  });

  it("consumes /agents status command", async () => {
    const result = await handler.handleInput("/agents status", ctx);
    expect(result.consumed).toBe(true);
    expect(result.result?.success).toBe(true);
  });

  it("consumes /agents kill command", async () => {
    const agent = await manager.spawn(createSpawnInput());
    const result = await handler.handleInput(`/agents kill ${agent.id}`, ctx);
    expect(result.consumed).toBe(true);
    expect(result.result?.success).toBe(true);
  });

  it("consumes /agents result command", async () => {
    const agent = await manager.spawn(createSpawnInput());
    await manager.complete(agent.id, "Done");
    const result = await handler.handleInput(`/agents result ${agent.id}`, ctx);
    expect(result.consumed).toBe(true);
    expect(result.result?.success).toBe(true);
  });

  it("does not consume non-agent commands", async () => {
    const result = await handler.handleInput("/help", ctx);
    expect(result.consumed).toBe(false);
  });

  it("does not consume regular text input", async () => {
    const result = await handler.handleInput("Hello, how are you?", ctx);
    expect(result.consumed).toBe(false);
  });

  it("handles unknown /agents subcommand", async () => {
    const result = await handler.handleInput("/agents unknown", ctx);
    expect(result.consumed).toBe(true);
    expect(result.result?.success).toBe(false);
    expect(result.result?.error).toContain("Unknown");
  });
});

describe("Branding — OpenSIN/sincode", () => {
  it("help text contains OpenSIN branding", () => {
    expect(BACKGROUND_AGENT_HELP).toContain("OpenSIN");
  });

  it("manager uses OpenSIN in artifact headers", async () => {
    const tempDir = createTempDir();
    await fs.mkdir(tempDir, { recursive: true });
    const manager = new BackgroundAgentManager({ baseDir: tempDir });

    const agent = await manager.spawn(createSpawnInput());
    await manager.complete(agent.id, "Test result");

    await new Promise((r) => setTimeout(r, 100));

    const content = await manager.readPersistedArtifact(agent.artifact.filePath);
    expect(content).toContain("OpenSIN Background Agent");

    manager.dispose();
  });

  it("notifications use sin-agent-notification tag", async () => {
    const tempDir = createTempDir();
    await fs.mkdir(tempDir, { recursive: true });
    const manager = new BackgroundAgentManager({ baseDir: tempDir });

    const notifications: string[] = [];
    const handler = new BackgroundAgentStdinHandler(manager, {
      onNotification: (n) => notifications.push(n),
    });

    const agent = await manager.spawn(createSpawnInput());
    await manager.complete(agent.id, "Done");

    // Wait for notification
    await new Promise((r) => setTimeout(r, 100));

    const hasSinTag = notifications.some((n) => n.includes("sin-agent-notification"));
    expect(hasSinTag).toBe(true);

    handler.dispose();
  });
});
