import * as vscode from "vscode"
import type { AcpClient } from "./acp-client"

interface PendingDiff {
  id: string
  path: string
  original: string
  modified: string
  uri: vscode.Uri
}

export class DiffRenderer {
  private diffs = new Map<string, PendingDiff>()
  private activeDiffEditor?: vscode.TextEditor
  private decorationType: vscode.TextEditorDecorationType

  constructor(
    private context: vscode.ExtensionContext,
    private client: AcpClient,
  ) {
    this.decorationType = vscode.window.createTextEditorDecorationType({
      isWholeLine: true,
      backgroundColor: new vscode.ThemeColor("diffEditor.insertedTextBackground"),
    })

    this.context.subscriptions.push(
      this.decorationType,
      vscode.commands.registerCommand("opensin.diff.apply", (diffId: string) => this.apply(diffId)),
      vscode.commands.registerCommand("opensin.diff.discard", (diffId: string) => this.discard(diffId)),
    )

    this.client.onFileEdit((edit) => {
      this.showDiff(edit)
    })
  }

  async showDiff(edit: { path: string; oldText: string; newText: string }) {
    const config = vscode.workspace.getConfiguration("opensin")
    if (!config.get<boolean>("diff.autoOpen", true)) return

    const id = `diff_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
    const uri = vscode.Uri.file(edit.path)

    const originalDoc = await vscode.workspace.openTextDocument(uri).catch(() => null)
    const original = originalDoc ? originalDoc.getText() : edit.oldText

    const diff: PendingDiff = {
      id,
      path: edit.path,
      original,
      modified: edit.newText,
      uri,
    }

    this.diffs.set(id, diff)

    const originalUri = vscode.Uri.parse(`opensin:original/${edit.path}`).with({
      query: Buffer.from(original).toString("base64"),
    })

    const modifiedUri = vscode.Uri.parse(`opensin:modified/${edit.path}`).with({
      query: Buffer.from(edit.newText).toString("base64"),
    })

    vscode.commands.executeCommand(
      "vscode.diff",
      originalUri,
      modifiedUri,
      `OpenSIN: ${edit.path}`,
      { preview: true },
    )

    vscode.window.showInformationMessage(
      `OpenSIN suggests changes to ${edit.path}`,
      "Accept",
      "Reject",
    ).then((choice) => {
      if (choice === "Accept") {
        this.apply(id)
      } else if (choice === "Reject") {
        this.discard(id)
      }
    })
  }

  async openLatest() {
    const latest = Array.from(this.diffs.values()).pop()
    if (!latest) {
      vscode.window.showInformationMessage("No pending diffs")
      return
    }

    const originalUri = vscode.Uri.parse(`opensin:original/${latest.path}`).with({
      query: Buffer.from(latest.original).toString("base64"),
    })

    const modifiedUri = vscode.Uri.parse(`opensin:modified/${latest.path}`).with({
      query: Buffer.from(latest.modified).toString("base64"),
    })

    vscode.commands.executeCommand(
      "vscode.diff",
      originalUri,
      modifiedUri,
      `OpenSIN: ${latest.path}`,
    )
  }

  async accept() {
    const editor = vscode.window.activeTextEditor
    if (!editor) return

    const path = editor.document.uri.fsPath
    const diff = Array.from(this.diffs.values()).find((d) => d.path === path)
    if (!diff) return

    await this.apply(diff.id)
  }

  async reject() {
    const editor = vscode.window.activeTextEditor
    if (!editor) return

    const path = editor.document.uri.fsPath
    const diff = Array.from(this.diffs.values()).find((d) => d.path === path)
    if (!diff) return

    await this.discard(diff.id)
  }

  private async apply(id: string) {
    const diff = this.diffs.get(id)
    if (!diff) return

    const edit = new vscode.WorkspaceEdit()
    edit.replace(
      diff.uri,
      new vscode.Range(
        new vscode.Position(0, 0),
        new vscode.Position(diff.original.split("\n").length, 0),
      ),
      diff.modified,
    )

    await vscode.workspace.applyEdit(edit)
    this.diffs.delete(id)
    vscode.window.showInformationMessage(`Applied changes to ${diff.path}`)
  }

  private discard(id: string) {
    this.diffs.delete(id)
  }
}
