import { spawn, type ChildProcessWithoutNullStreams } from "child_process";
import { Readable, Writable } from "stream";
import * as vscode from "vscode";

type Mode = "Architect" | "Code" | "Debug" | "Ask"

type RequestPermissionRequest = {
  options: Array<{ name: string; kind: string; optionId: string }>
  toolCall: { title: string }
  sessionId: string
}

type RequestPermissionResponse = {
  outcome: { outcome: "cancelled" } | { outcome: "selected"; optionId: string }
}

type SessionNotification = {
  sessionId: string
  update:
    | { sessionUpdate: "agent_message_chunk"; content: { type: "text"; text: string } }
    | { sessionUpdate: string }
}

type NewSessionResponse = {
  sessionId: string
  modes?: { availableModes?: Array<{ id: string; name: string }> }
}

type Client = {
  requestPermission: (params: RequestPermissionRequest) => Promise<RequestPermissionResponse>
  sessionUpdate: (params: SessionNotification) => Promise<void>
  readTextFile: (params: { path: string }) => Promise<{ content: string }>
  writeTextFile: (params: { path: string; content: string }) => Promise<Record<string, never>>
}

type State = {
  proc: ChildProcessWithoutNullStreams
  conn: {
    prompt: (params: { sessionId: string; prompt: Array<{ type: "text"; text: string }> }) => Promise<{ stopReason: string }>
    unstable_didSaveDocument?: (params: { sessionId: string; uri: string }) => Promise<void>
    setSessionMode?: (params: { sessionId: string; modeId: string }) => Promise<void | unknown>
    unstable_setSessionModel?: (params: { sessionId: string; modelId: string }) => Promise<void | unknown>
  }
  session: string
  root: string
  model: string
  modes: Array<{ id: string; name: string }>
  text: string
}

const lanes = new Map<string, State>();

export async function prompt(root: string, model: string, mode: Mode, text: string) {
  const state = await ensure(root, model);
  state.text = "";
  await setMode(state, mode);
  await setModel(state, model);
  const res = await state.conn.prompt({
    sessionId: state.session,
    prompt: [{ type: "text", text }],
  });
  if (state.text.trim()) {return state.text.trim();}
  return `Prompt finished with stopReason=${res.stopReason}`;
}

export async function saved(root: string, uri: string) {
  const state = lanes.get(root);
  if (!state) {return;}
  if (!state.conn.unstable_didSaveDocument) {return;}
  await state.conn.unstable_didSaveDocument({
    sessionId: state.session,
    uri,
  });
}

async function ensure(root: string, model: string) {
  const current = lanes.get(root);
  if (current && !current.proc.killed) {return current;}

  const proc = spawn("opencode", ["acp", "--cwd", root], {
    stdio: ["pipe", "pipe", "pipe"],
  });

  const sdk = await import("@agentclientprotocol/sdk");

  const state = {} as State;
  const client: Client = {
    requestPermission: async (params: RequestPermissionRequest): Promise<RequestPermissionResponse> => {
      const items = params.options.map((item) => ({
        label: item.name,
        description: item.kind,
        id: item.optionId,
      }));
      const pick = await vscode.window.showQuickPick(items, {
        placeHolder: `${params.toolCall.title} requires permission`,
      });
      if (!pick) {return { outcome: { outcome: "cancelled" } };}
      return { outcome: { outcome: "selected", optionId: pick.id } };
    },
    sessionUpdate: async (params: SessionNotification) => {
      if (params.sessionId !== state.session) {return;}
      const update = params.update;
      if (update.sessionUpdate === "agent_message_chunk" && "content" in update && update.content.type === "text") {
        state.text += update.content.text;
      }
      if (update.sessionUpdate === "current_mode_update") {
        return;
      }
    },
    readTextFile: async (params) => {
      const buf = await vscode.workspace.fs.readFile(vscode.Uri.file(params.path));
      return { content: Buffer.from(buf).toString("utf8") };
    },
    writeTextFile: async (params) => {
      await vscode.workspace.fs.writeFile(vscode.Uri.file(params.path), Buffer.from(params.content, "utf8"));
      return {};
    },
  };

  const stream = sdk.ndJsonStream(
    Writable.toWeb(proc.stdin) as WritableStream<Uint8Array>,
    Readable.toWeb(proc.stdout) as ReadableStream<Uint8Array>,
  );
  const conn = new sdk.ClientSideConnection(() => client, stream);
  const init = await conn.initialize({
    protocolVersion: 1,
    clientInfo: { name: "OpenSIN VS Code", version: "1.3.15" },
    clientCapabilities: {
      fs: { readTextFile: true, writeTextFile: true },
    },
  });
  const created: NewSessionResponse = await conn.newSession({
    cwd: root,
    mcpServers: [],
  });

  state.proc = proc;
  state.conn = conn;
  state.session = created.sessionId;
  state.root = root;
  state.model = model;
  state.modes = created.modes?.availableModes ?? [];
  state.text = "";

  proc.on("exit", () => {
    lanes.delete(root);
  });

  lanes.set(root, state);
  await setModel(state, model);
  if (init.agentCapabilities?.sessionCapabilities?.resume) {
    // no-op: initialization is enough, but reading this keeps capability drift visible
  }
  return state;
}

async function setMode(state: State, mode: Mode) {
  if (!state.conn.setSessionMode) {return;}
  const pick = state.modes.find((item) => item.name === mode || item.id === mode || item.id === mode.toLowerCase());
  if (!pick) {return;}
  await state.conn.setSessionMode({ sessionId: state.session, modeId: pick.id });
}

async function setModel(state: State, model: string) {
  if (!state.conn.unstable_setSessionModel) {return;}
  await state.conn.unstable_setSessionModel({
    sessionId: state.session,
    modelId: model,
  });
}
