import * as vscode from "vscode"
import type { AcpClient } from "./acp-client"

export class ToolActivity {
  private statusBarItem: vscode.StatusBarItem
  private outputChannel: vscode.OutputChannel
  private activeTools = new Map<string, { name: string; started: number }>()

  constructor(
    private context: vscode.ExtensionContext,
    private client: AcpClient,
  ) {
    this.statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100)
    this.statusBarItem.command = "opensin.chat.focus"
    this.statusBarItem.show()

    this.outputChannel = vscode.window.createOutputChannel("OpenSIN Activity")
    this.context.subscriptions.push(this.outputChannel, this.statusBarItem)

    this.client.onToolCall((call) => {
      this.handleToolCall(call)
    })
  }

  private handleToolCall(call: { toolCallId: string; title: string; status: string }) {
    switch (call.status) {
      case "pending":
      case "in_progress":
        this.activeTools.set(call.toolCallId, { name: call.title, started: Date.now() })
        break
      case "completed":
      case "failed":
        this.activeTools.delete(call.toolCallId)
        break
    }

    this.updateStatusBar()
    this.logActivity(call)
  }

  private updateStatusBar() {
    const count = this.activeTools.size
    if (count === 0) {
      this.statusBarItem.text = "$(check) OpenSIN idle"
      this.statusBarItem.tooltip = "OpenSIN is idle"
    } else {
      const names = Array.from(this.activeTools.values()).map((t) => t.name)
      this.statusBarItem.text = `$(sync~spin) OpenSIN: ${count} active`
      this.statusBarItem.tooltip = `Active tools: ${names.join(", ")}`
    }
  }

  private logActivity(call: { toolCallId: string; title: string; status: string }) {
    const timestamp = new Date().toISOString()
    const icon = call.status === "completed" ? "✓" : call.status === "failed" ? "✗" : "⟳"
    this.outputChannel.appendLine(`[${timestamp}] ${icon} ${call.title} (${call.status})`)
  }

  showOutput() {
    this.outputChannel.show()
  }
}
