import * as vscode from "vscode"
import { ChatPanel } from "./chat-panel"
import { ToolActivity } from "./tool-activity"
import { DiffRenderer } from "./diff-renderer"
import { AcpClient } from "./acp-client"

export function activate(context: vscode.ExtensionContext) {
  const config = vscode.workspace.getConfiguration("opensin")
  const serverUrl = config.get<string>("server.url", "http://localhost:4096")

  const acpClient = new AcpClient(serverUrl)
  const chatPanel = new ChatPanel(context, acpClient)
  const toolActivity = new ToolActivity(context, acpClient)
  const diffRenderer = new DiffRenderer(context, acpClient)

  context.subscriptions.push(
    vscode.commands.registerCommand("opensin.chat.focus", () => chatPanel.focus()),
    vscode.commands.registerCommand("opensin.chat.new", () => chatPanel.newSession()),
    vscode.commands.registerCommand("opensin.diff.open", () => diffRenderer.openLatest()),
    vscode.commands.registerCommand("opensin.acceptDiff", () => diffRenderer.accept()),
    vscode.commands.registerCommand("opensin.rejectDiff", () => diffRenderer.reject()),
    vscode.commands.registerCommand("opensin.server.connect", () => acpClient.connect()),
    vscode.commands.registerCommand("opensin.server.disconnect", () => acpClient.disconnect()),
    chatPanel,
    toolActivity,
    diffRenderer,
    acpClient,
  )

  if (config.get<boolean>("server.autoConnect", true)) {
    acpClient.connect()
  }
}

export function deactivate() {}
