import * as vscode from "vscode";

const name = "opencode";
const view = "opencode.chat";
const ports = new WeakMap<vscode.Terminal, number>();
const live = new Map<string, { port: number; session: string }>();
const modes = ["Architect", "Code", "Debug", "Ask"] as const;
const models = [
  "openrouter/qwen/qwen3.6-plus:free",
  "openrouter/qwen/qwen3.6-plus-preview:free",
  "opencode/qwen3.6-plus-free",
  "openai/gpt-5.4",
] as const;

type Mode = (typeof modes)[number]

type State = {
  mode: Mode
  model: string
  proactive: boolean
  buddy: number
}

type Msg = {
  type: string
  text?: string
  value?: string | boolean
}

type SimoneKind = "symbol" | "refs"

const guide: Record<Mode, string> = {
  Architect: "You are in Architect mode. Focus on structure, tradeoffs, plans, and design decisions before code.",
  Code: "You are in Code mode. Prefer direct implementation, minimal diffs, and concrete validation.",
  Debug: "You are in Debug mode. Focus on root cause, reproduction, logs, failing assumptions, and the smallest safe fix.",
  Ask: "You are in Ask mode. Prioritize explanation, references, and concise direct answers over code changes.",
};

export function activate(ctx: vscode.ExtensionContext) {
  const panel = new Panel(ctx);

  const a = vscode.commands.registerCommand("opencode.openNewTerminal", async () => {
    await open(ctx, panel.state.model, true);
  });

  const b = vscode.commands.registerCommand("opencode.openTerminal", async () => {
    const term = vscode.window.terminals.find((x: vscode.Terminal) => x.name === name);
    if (term) {
      term.show();
      return;
    }
    await open(ctx, panel.state.model, false);
  });

  const c = vscode.commands.registerCommand("opencode.addFilepathToTerminal", async () => {
    const ref = file();
    if (!ref) {return;}
    const term = vscode.window.activeTerminal;
    if (!term) {return;}
    if (term.name !== name) {return;}
    const port = ports.get(term);
    if (!port) {
      term.sendText(ref, false);
      term.show();
      return;
    }
    await append(port, ref);
    term.show();
  });

  const d = vscode.commands.registerCommand("opencode.toggleKairos", async () => {
    panel.state.proactive = !panel.state.proactive;
    await panel.save();
    panel.sync();
    vscode.window.showInformationMessage(`KAIROS Proactive Mode ${panel.state.proactive ? "enabled" : "disabled"}`);
  });

  const e = vscode.window.registerWebviewViewProvider(view, panel);

  const f = vscode.workspace.onDidSaveTextDocument(async (doc: vscode.TextDocument) => {
    if (!panel.state.proactive) {return;}
    await panel.proactive(doc);
  });

  ctx.subscriptions.push(a, b, c, d, e, f);
}

export function deactivate() {}

class Panel implements vscode.WebviewViewProvider {
  state: State;
  web?: vscode.WebviewView;

  constructor(private ctx: vscode.ExtensionContext) {
    this.state = {
      mode: ctx.workspaceState.get<Mode>("kairos.mode") ?? "Code",
      model:
        ctx.workspaceState.get<string>("kairos.model") ??
        "openrouter/qwen/qwen3.6-plus:free",
      proactive: ctx.workspaceState.get<boolean>("kairos.proactive") ?? false,
      buddy: ctx.workspaceState.get<number>("kairos.buddy") ?? 0,
    };
  }

  async save() {
    await this.ctx.workspaceState.update("kairos.mode", this.state.mode);
    await this.ctx.workspaceState.update("kairos.model", this.state.model);
    await this.ctx.workspaceState.update("kairos.proactive", this.state.proactive);
    await this.ctx.workspaceState.update("kairos.buddy", this.state.buddy);
  }

  sync() {
    this.web?.webview.postMessage({ type: "state", value: this.state });
  }

  resolveWebviewView(web: vscode.WebviewView) {
    this.web = web;
    web.webview.options = { enableScripts: true };
    web.webview.html = html(this.state);
    this.sync();

    web.webview.onDidReceiveMessage(async (msg: Msg) => {
      if (msg.type === "chat" && msg.text) {
        web.webview.postMessage({ type: "reply", value: await this.run(msg.text) });
        return;
      }
      if (msg.type === "mode" && typeof msg.value === "string" && modes.includes(msg.value as Mode)) {
        this.state.mode = msg.value as Mode;
        await this.save();
        this.sync();
        return;
      }
      if (msg.type === "model" && typeof msg.value === "string") {
        this.state.model = msg.value;
        await this.save();
        this.sync();
        return;
      }
      if (msg.type === "proactive") {
        this.state.proactive = Boolean(msg.value);
        await this.save();
        this.sync();
        return;
      }
      if (msg.type === "background" && msg.text) {
        web.webview.postMessage({ type: "reply", value: await this.run(`KAIROS background task: ${msg.text}`) });
        return;
      }
      if (msg.type === "simone" && typeof msg.value === "string") {
        web.webview.postMessage({ type: "reply", value: await this.simone(msg.value as SimoneKind) });
      }
    });
  }

  async proactive(doc: vscode.TextDocument) {
    const root = vscode.workspace.getWorkspaceFolder(doc.uri)?.uri.fsPath;
    const out = await this.exec(`KAIROS proactive review for ${doc.fileName}: inspect the latest saved file for obvious bugs, regressions, and missing tests. Return a compact result.`, root);
    this.bump(2);
    this.web?.webview.postMessage({ type: "reply", value: `[KAIROS] ${out}` });
  }

  async run(text: string) {
    const root = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
    const ref = file();
    const ctx = ref ? `\n\nCurrent file context: ${ref}` : "";
    const intel = this.state.mode === "Architect" || this.state.mode === "Debug" ? await this.intel() : "";
    const out = await this.exec(`${guide[this.state.mode]}${intel}${ctx}\n\n${text}`, root);
    this.bump(1);
    return out;
  }

  async simone(kind: SimoneKind) {
    const root = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
    const item = active();
    if (!item) {return "No active symbol or file context for Simone.";}

    const prompt = kind === "symbol"
      ? `Use Simone MCP to find the symbol \"${item.name}\"${item.file ? ` in ${item.file}` : ""}. Return a concise result with file and line references.`
      : `Use Simone MCP to find references for the symbol \"${item.name}\"${item.file ? ` in ${item.file}` : ""}. Return a concise result with file and line references.`;

    const out = await this.side(prompt, root);
    this.bump(2);
    return `[Simone:${kind}] ${out}`;
  }

  async intel() {
    const item = active();
    if (!item) {return "";}

    const root = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
    const out = await this.side(
      `Use Simone MCP to summarize the active symbol \"${item.name}\"${item.file ? ` in ${item.file}` : ""}. Return only the most relevant symbol location and a short explanation.`,
      root,
    );
    return `\n\nSimone context:\n${out}`;
  }

  async exec(text: string, cwd?: string) {
    const cli = "opencode";
    try {
      const out = await exec(cli, ["run", text, "--model", this.state.model], {
        cwd,
        maxBuffer: 1024 * 1024 * 8,
      });
      const txt = `${out.stdout ?? ""}${out.stderr ?? ""}`.trim();
      if (txt) {return txt;}
      return "No output";
    } catch (err) {
      const e = err as Error & { stdout?: string; stderr?: string };
      const txt = `${e.stdout ?? ""}${e.stderr ?? ""}`.trim();
      if (txt) {return txt;}
      return `CLI bridge error: ${e.message}`;
    }
  }

  async side(text: string, cwd?: string) {
    try {
      const out = await exec("sincode", ["run", text], {
        cwd,
        maxBuffer: 1024 * 1024 * 8,
      });
      const txt = `${out.stdout ?? ""}${out.stderr ?? ""}`.trim();
      if (txt) {return txt;}
      return "No Simone output";
    } catch (err) {
      const e = err as Error & { stdout?: string; stderr?: string };
      const txt = `${e.stdout ?? ""}${e.stderr ?? ""}`.trim();
      if (txt) {return txt;}
      return `Simone bridge error: ${e.message}`;
    }
  }

  bump(n: number) {
    this.state.buddy += n;
    void this.save();
    this.sync();
  }
}

async function open(ctx: vscode.ExtensionContext, model: string, fresh: boolean) {
  if (!fresh) {
    const existing = vscode.window.terminals.find((x: vscode.Terminal) => x.name === name);
    if (existing) {
      existing.show();
      return existing;
    }
  }

  const port = Math.floor(Math.random() * (65535 - 16384 + 1)) + 16384;
  const term = vscode.window.createTerminal({
    name,
    iconPath: {
      light: vscode.Uri.file(ctx.asAbsolutePath("images/button-dark.svg")),
      dark: vscode.Uri.file(ctx.asAbsolutePath("images/button-light.svg")),
    },
    location: {
      viewColumn: vscode.ViewColumn.Beside,
      preserveFocus: false,
    },
    env: {
      _EXTENSION_OPENCODE_PORT: port.toString(),
      _EXTENSION_OPENCODE_MODEL: model,
      OPENCODE_CALLER: "vscode",
    },
  });

  term.show();
  ports.set(term, port);
  term.sendText(`opencode --port ${port} --model ${model}`);

  const ref = file();
  if (!ref) {return term;}

  let tries = 10;
  let ok = false;
  do {
    await new Promise((r) => setTimeout(r, 200));
    try {
      await fetch(`http://localhost:${port}/app`);
      ok = true;
      break;
    } catch {}
    tries -= 1;
  } while (tries > 0);

  if (ok) {
    await append(port, `In ${ref}`);
    term.show();
  }

  return term;
}

async function append(port: number, text: string) {
  await fetch(`http://localhost:${port}/tui/append-prompt`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });
}

function file() {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {return;}

  const doc = editor.document;
  const folder = vscode.workspace.getWorkspaceFolder(doc.uri);
  if (!folder) {return;}

  const rel = vscode.workspace.asRelativePath(doc.uri);
  let ref = `@${rel}`;
  const sel = editor.selection;
  if (sel.isEmpty) {return ref;}

  const start = sel.start.line + 1;
  const end = sel.end.line + 1;
  if (start === end) {return `${ref}#L${start}`;}
  return `${ref}#L${start}-${end}`;
}

function active() {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {return;}

  const file = vscode.workspace.asRelativePath(editor.document.uri);
  const text = editor.document.getText(editor.selection).trim();
  if (text) {return { name: text, file };}

  const range = editor.document.getWordRangeAtPosition(editor.selection.active);
  if (!range) {return { name: file, file };}
  const word = editor.document.getText(range).trim();
  if (!word) {return { name: file, file };}
  return { name: word, file };
}

function html(state: State) {
  const mode = JSON.stringify(state.mode);
  const model = JSON.stringify(state.model);
  const proactive = state.proactive ? "true" : "false";
  const buddy = String(state.buddy);
  const opts = models.map((x) => `<option value="${x}">${x}</option>`).join("");
  const lanes = modes.map((x) => `<option value="${x}">${x}</option>`).join("");

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <style>
    body{font-family:var(--vscode-font-family);padding:8px;margin:0;background:var(--vscode-editor-background);color:var(--vscode-editor-foreground)}
    #meta{font-size:12px;opacity:.8;margin-bottom:8px}
    #ctl{display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:8px}
    #chat{height:calc(100vh - 220px);overflow:auto;border:1px solid var(--vscode-input-border);border-radius:6px;padding:8px;margin-bottom:8px}
    #msg,#mode,#model,#proactive,#bg,#symbol,#refs{width:100%;box-sizing:border-box;padding:6px 8px;border:1px solid var(--vscode-input-border);border-radius:6px;background:var(--vscode-input-background);color:var(--vscode-input-foreground)}
    .m{margin:4px 0;padding:6px 8px;border-radius:6px}
    .u{background:var(--vscode-button-background);color:var(--vscode-button-foreground);margin-left:18%}
    .a{background:var(--vscode-editor-inactiveSelectionBackground);margin-right:18%}
  </style>
</head>
<body>
  <div id="meta">Mode: <span id="modev"></span> | Model: <span id="modelv"></span> | KAIROS: <span id="prov"></span> | BUDDY: <span id="buddyv"></span></div>
  <div id="ctl">
    <select id="mode">${lanes}</select>
    <select id="model">${opts}</select>
    <button id="proactive">Toggle KAIROS</button>
    <button id="bg">Run Background Task</button>
    <button id="symbol">Simone Symbol</button>
    <button id="refs">Simone Refs</button>
  </div>
  <div id="chat"></div>
  <input id="msg" placeholder="Ask KAIROS..." />
  <script>
    const vscode = acquireVsCodeApi()
    const chat = document.getElementById('chat')
    const msg = document.getElementById('msg')
    const mode = document.getElementById('mode')
    const model = document.getElementById('model')
    const proactive = document.getElementById('proactive')
    const bg = document.getElementById('bg')
    const symbol = document.getElementById('symbol')
    const refs = document.getElementById('refs')
    const modev = document.getElementById('modev')
    const modelv = document.getElementById('modelv')
    const prov = document.getElementById('prov')
    const buddyv = document.getElementById('buddyv')
    mode.value = ${mode}
    model.value = ${model}
    prov.textContent = ${proactive} ? 'on' : 'off'
    modev.textContent = mode.value
    modelv.textContent = model.value
    buddyv.textContent = ${buddy}
    function add(text, cls){ const d=document.createElement('div'); d.className='m '+cls; d.textContent=text; chat.appendChild(d); chat.scrollTop=chat.scrollHeight }
    msg.addEventListener('keydown', e => { if(e.key==='Enter' && msg.value.trim()){ add(msg.value,'u'); vscode.postMessage({ type:'chat', text: msg.value }); msg.value='' } })
    mode.addEventListener('change', () => vscode.postMessage({ type:'mode', value: mode.value }))
    model.addEventListener('change', () => vscode.postMessage({ type:'model', value: model.value }))
    proactive.addEventListener('click', () => vscode.postMessage({ type:'proactive', value: prov.textContent !== 'on' }))
    bg.addEventListener('click', () => vscode.postMessage({ type:'background', text: 'Review the workspace for the next highest-value change.' }))
    symbol.addEventListener('click', () => vscode.postMessage({ type:'simone', value: 'symbol' }))
    refs.addEventListener('click', () => vscode.postMessage({ type:'simone', value: 'refs' }))
    window.addEventListener('message', e => {
      if(e.data.type==='reply') add(String(e.data.value || ''),'a')
      if(e.data.type==='state'){
        const s = e.data.value || {}
        mode.value = s.mode || mode.value
        model.value = s.model || model.value
        modev.textContent = mode.value
        modelv.textContent = model.value
        prov.textContent = s.proactive ? 'on' : 'off'
        buddyv.textContent = String(s.buddy || 0)
      }
    })
  </script>
</body>
</html>`;
}
