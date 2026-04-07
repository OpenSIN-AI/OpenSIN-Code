import * as vscode from 'vscode';

export interface OpenSINCodeAction extends vscode.CodeAction {
  actionType: 'refactor' | 'fix' | 'explain' | 'optimize' | 'generate';
}

export class CodeActions {
  private outputChannel: vscode.OutputChannel;
  private provider: vscode.Disposable;

  constructor(outputChannel: vscode.OutputChannel) {
    this.outputChannel = outputChannel;
    this.provider = vscode.languages.registerCodeActionsProvider(
      [
        { scheme: 'file', language: 'typescript' },
        { scheme: 'file', language: 'javascript' },
        { scheme: 'file', language: 'python' },
        { scheme: 'file', language: 'go' },
        { scheme: 'file', language: 'rust' }
      ],
      new OpenSINCodeActionProvider(outputChannel),
      {
        providedCodeActionKinds: OpenSINCodeActionProvider.providedCodeActionKinds
      }
    );
  }

  getProvider(): vscode.Disposable {
    return this.provider;
  }
}

class OpenSINCodeActionProvider implements vscode.CodeActionProvider {
  public static readonly providedCodeActionKinds = [
    vscode.CodeActionKind.Refactor,
    vscode.CodeActionKind.QuickFix,
    vscode.CodeActionKind.Source
  ];

  private outputChannel: vscode.OutputChannel;

  constructor(outputChannel: vscode.OutputChannel) {
    this.outputChannel = outputChannel;
  }

  provideCodeActions(
    document: vscode.TextDocument,
    range: vscode.Range | vscode.Selection,
    context: vscode.CodeActionContext
  ): vscode.CodeAction[] {
    const actions: vscode.CodeAction[] = [];
    const selectedText = document.getText(range);

    if (!selectedText || selectedText.trim().length === 0) {
      return this.getContextActions(document);
    }

    const refactorAction = this.createAction(
      'OpenSIN: Refactor Selection',
      vscode.CodeActionKind.Refactor,
      document,
      range,
      'refactor',
      selectedText
    );
    actions.push(refactorAction);

    const explainAction = this.createAction(
      'OpenSIN: Explain Selection',
      vscode.CodeActionKind.QuickFix,
      document,
      range,
      'explain',
      selectedText
    );
    actions.push(explainAction);

    const optimizeAction = this.createAction(
      'OpenSIN: Optimize Selection',
      vscode.CodeActionKind.RefactorRewrite,
      document,
      range,
      'optimize',
      selectedText
    );
    actions.push(optimizeAction);

    if (context.diagnostics.length > 0) {
      for (const diagnostic of context.diagnostics) {
        if (range.intersection(diagnostic.range)) {
          const fixAction = this.createAction(
            `OpenSIN: Fix — ${diagnostic.message.substring(0, 50)}`,
            vscode.CodeActionKind.QuickFix,
            document,
            diagnostic.range,
            'fix',
            document.getText(diagnostic.range)
          );
          fixAction.diagnostics = [diagnostic];
          actions.push(fixAction);
        }
      }
    }

    return actions;
  }

  private getContextActions(document: vscode.TextDocument): vscode.CodeAction[] {
    const actions: vscode.CodeAction[] = [];

    const generateAction = this.createAction(
      'OpenSIN: Generate Function',
      vscode.CodeActionKind.Source,
      document,
      new vscode.Range(0, 0, 0, 0),
      'generate',
      ''
    );
    actions.push(generateAction);

    const reviewAction = this.createAction(
      'OpenSIN: Review File',
      vscode.CodeActionKind.Source,
      document,
      new vscode.Range(0, 0, document.lineCount - 1, 0),
      'explain',
      document.getText()
    );
    actions.push(reviewAction);

    return actions;
  }

  private createAction(
    title: string,
    kind: vscode.CodeActionKind,
    document: vscode.TextDocument,
    range: vscode.Range,
    actionType: string,
    selectedText: string
  ): vscode.CodeAction {
    const action = new vscode.CodeAction(title, kind);
    action.command = {
      command: 'opensin.dispatch',
      title: title,
      arguments: [
        {
          actionType,
          filePath: document.fileName,
          range: {
            start: { line: range.start.line, character: range.start.character },
            end: { line: range.end.line, character: range.end.character }
          },
          selectedText,
          language: document.languageId
        }
      ]
    };
    return action;
  }
}
