import * as vscode from "vscode"
import type { AcpClient } from "./acp-client"

export class ChatPanel implements vscode.WebviewViewProvider {
  static readonly viewType = "opensin.chat"

  private view?: vscode.WebviewView
  private sessionID?: string

  constructor(
    private context: vscode.ExtensionContext,
    private client: AcpClient,
  ) {
    this.context.subscriptions.push(
      vscode.window.registerWebviewViewProvider(ChatPanel.viewType, this),
    )
  }

  async resolveWebviewView(
    webviewView: vscode.WebviewView,
    _context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken,
  ) {
    this.view = webviewView

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this.context.extensionUri],
    }

    webviewView.webview.html = this.getHtml()

    webviewView.webview.onDidReceiveMessage(async (msg) => {
      switch (msg.type) {
        case "send_message":
          await this.sendMessage(msg.text)
          break
        case "new_session":
          await this.createSession()
          break
        case "ready":
          await this.sendConfig()
          break
      }
    })

    this.client.onSessionUpdate((update) => {
      this.view?.webview.postMessage(update)
    })

    this.client.onToolCall((call) => {
      this.view?.webview.postMessage({
        type: "tool_call",
        data: call,
      })
    })
  }

  focus() {
    if (this.view) {
      this.view.show(true)
    } else {
      vscode.commands.executeCommand("opensin.chat.focus")
    }
  }

  async newSession() {
    await this.createSession()
  }

  private async createSession() {
    const workspace = vscode.workspace.workspaceFolders?.[0]
    if (!workspace) {
      vscode.window.showErrorMessage("Open a workspace to start an OpenSIN session")
      return
    }

    try {
      const session = await this.client.newSession(workspace.uri.fsPath)
      this.sessionID = session.sessionId
      this.view?.webview.postMessage({
        type: "session_created",
        sessionId: session.sessionId,
      })
    } catch (err) {
      vscode.window.showErrorMessage(`Failed to create session: ${err}`)
    }
  }

  private async sendMessage(text: string) {
    if (!this.sessionID) {
      await this.createSession()
    }

    try {
      await this.client.prompt(this.sessionID!, text)
    } catch (err) {
      vscode.window.showErrorMessage(`Failed to send message: ${err}`)
    }
  }

  private async sendConfig() {
    const workspace = vscode.workspace.workspaceFolders?.[0]
    this.view?.webview.postMessage({
      type: "config",
      serverUrl: this.client.serverUrl,
      connected: this.client.connected,
      workspacePath: workspace?.uri.fsPath,
      sessionId: this.sessionID,
    })
  }

  private getHtml(): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline';">
<style>
  body { font-family: var(--vscode-font-family); padding: 12px; color: var(--vscode-foreground); background: var(--vscode-editor-background); }
  #messages { height: calc(100vh - 120px); overflow-y: auto; margin-bottom: 12px; }
  .message { padding: 8px; margin-bottom: 8px; border-radius: 4px; }
  .message.user { background: var(--vscode-input-background); }
  .message.assistant { background: var(--vscode-editor-inactiveSelectionBackground); }
  .message.tool { background: var(--vscode-terminal-ansiYellow); color: var(--vscode-terminal-foreground); }
  .message.error { background: var(--vscode-inputValidation-errorBackground); color: var(--vscode-inputValidation-errorForeground); }
  #input-area { display: flex; gap: 8px; }
  #input { flex: 1; padding: 8px; border: 1px solid var(--vscode-input-border); background: var(--vscode-input-background); color: var(--vscode-input-foreground); border-radius: 4px; resize: none; }
  #send { padding: 8px 16px; background: var(--vscode-button-background); color: var(--vscode-button-foreground); border: none; border-radius: 4px; cursor: pointer; }
  #send:hover { background: var(--vscode-button-hoverBackground); }
  #status { font-size: 12px; color: var(--vscode-descriptionForeground); margin-bottom: 8px; }
  .tool-call { font-family: var(--vscode-editor-font-family); font-size: 12px; }
  pre { white-space: pre-wrap; word-wrap: break-word; }
</style>
</head>
<body>
<div id="status">Connecting to OpenSIN server...</div>
<div id="messages"></div>
<div id="input-area">
  <textarea id="input" rows="2" placeholder="Ask OpenSIN..."></textarea>
  <button id="send">Send</button>
</div>
<script>
  const vscode = acquireVsCodeApi()
  const messages = document.getElementById("messages")
  const input = document.getElementById("input")
  const status = document.getElementById("status")
  const sendBtn = document.getElementById("send")

  vscode.postMessage({ type: "ready" })

  sendBtn.addEventListener("click", () => sendMessage())
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  })

  function sendMessage() {
    const text = input.value.trim()
    if (!text) return
    appendMessage("user", text)
    input.value = ""
    vscode.postMessage({ type: "send_message", text })
  }

  function appendMessage(role, content) {
    const msg = document.createElement("div")
    msg.className = "message " + role
    if (role === "tool") {
      msg.innerHTML = "<div class='tool-call'><pre>" + escapeHtml(JSON.stringify(content, null, 2)) + "</pre></div>"
    } else {
      msg.textContent = content
    }
    messages.appendChild(msg)
    messages.scrollTop = messages.scrollHeight
  }

  function escapeHtml(text) {
    const div = document.createElement("div")
    div.textContent = text
    return div.innerHTML
  }

  window.addEventListener("message", (e) => {
    const data = e.data
    switch (data.type) {
      case "config":
        status.textContent = data.connected ? "Connected to " + data.serverUrl : "Disconnected"
        break
      case "agent_message_chunk":
        appendMessage("assistant", data.content?.text || "")
        break
      case "tool_call":
        appendMessage("tool", data.data)
        break
      case "session_created":
        status.textContent = "Session: " + data.sessionId
        break
    }
  })
</script>
</body>
</html>`
  }
}
