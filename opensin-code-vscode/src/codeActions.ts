import * as vscode from 'vscode';

export class OpenSINCodeActionProvider implements vscode.CodeActionProvider {
  public static readonly providedCodeActionKinds = [
    vscode.CodeActionKind.QuickFix,
    vscode.CodeActionKind.Refactor,
  ];

  provideCodeActions(
    document: vscode.TextDocument,
    range: vscode.Range | vscode.Selection,
    context: vscode.CodeActionContext,
    token: vscode.CancellationToken
  ): vscode.CodeAction[] {
    const actions: vscode.CodeAction[] = [];

    // AI-powered quick fixes for diagnostics
    for (const diagnostic of context.diagnostics) {
      const fix = this.createAIFix(document, diagnostic);
      if (fix) actions.push(fix);
    }

    // Refactoring suggestions
    const refactor = this.createRefactorAction(document, range);
    if (refactor) actions.push(refactor);

    // AI explain action
    const explain = this.createExplainAction(document, range);
    if (explain) actions.push(explain);

    return actions;
  }

  private createAIFix(
    document: vscode.TextDocument,
    diagnostic: vscode.Diagnostic
  ): vscode.CodeAction | null {
    const action = new vscode.CodeAction(
      `🏛️ OpenSIN: AI Fix - ${diagnostic.message}`,
      vscode.CodeActionKind.QuickFix
    );
    action.diagnostics = [diagnostic];
    action.isPreferred = true;
    action.command = {
      command: 'opensin-code.aiFix',
      title: 'AI Fix',
      arguments: [document.uri, diagnostic],
    };
    return action;
  }

  private createRefactorAction(
    document: vscode.TextDocument,
    range: vscode.Range
  ): vscode.CodeAction | null {
    const selectedText = document.getText(range);
    if (!selectedText || selectedText.length < 10) return null;

    const action = new vscode.CodeAction(
      '🏛️ OpenSIN: AI Refactor Selection',
      vscode.CodeActionKind.RefactorRewrite
    );
    action.command = {
      command: 'opensin-code.aiRefactor',
      title: 'AI Refactor',
      arguments: [document.uri, range, selectedText],
    };
    return action;
  }

  private createExplainAction(
    document: vscode.TextDocument,
    range: vscode.Range
  ): vscode.CodeAction | null {
    const selectedText = document.getText(range);
    if (!selectedText) return null;

    const action = new vscode.CodeAction(
      '🏛️ OpenSIN: Explain This Code',
      vscode.CodeActionKind.QuickFix
    );
    action.command = {
      command: 'opensin-code.explainCode',
      title: 'Explain Code',
      arguments: [document.uri, range, selectedText],
    };
    return action;
  }
}
