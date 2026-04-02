import * as vscode from 'vscode';
import { SinCodeBridge } from './cliBridge';

export class SINCodeActionProvider implements vscode.CodeActionProvider {
    public bridge = new SinCodeBridge();

    public static readonly providedCodeActionKinds = [
        vscode.CodeActionKind.QuickFix,
        vscode.CodeActionKind.Refactor
    ];

    provideCodeActions(
        document: vscode.TextDocument,
        range: vscode.Range | vscode.Selection,
        context: vscode.CodeActionContext,
        token: vscode.CancellationToken
    ): vscode.CodeAction[] {
        const actions: vscode.CodeAction[] = [];
        
        // Error-based quick fixes
        for (const diagnostic of context.diagnostics) {
            if (diagnostic.severity === vscode.DiagnosticSeverity.Error) {
                const fixAction = new vscode.CodeAction(
                    `🔮 SIN Code: Fix error`,
                    vscode.CodeActionKind.QuickFix
                );
                fixAction.command = {
                    command: 'sincode.fixError',
                    title: 'Fix error with SIN Code',
                    arguments: [document, diagnostic, range]
                };
                fixAction.diagnostics = [diagnostic];
                actions.push(fixAction);
            }
        }

        // Refactor actions (always available)
        const refactorAction = new vscode.CodeAction(
            `🤖 SIN Code: Refactor selection`,
            vscode.CodeActionKind.Refactor
        );
        refactorAction.command = {
            command: 'sincode.refactorSelection',
            title: 'Refactor selection with SIN Code',
            arguments: [document, range]
        };
        actions.push(refactorAction);

        const explainAction = new vscode.CodeAction(
            `📖 SIN Code: Explain code`,
            vscode.CodeActionKind.Refactor
        );
        explainAction.command = {
            command: 'sincode.explainCode',
            title: 'Explain selection with SIN Code',
            arguments: [document, range]
        };
        actions.push(explainAction);

        const genTestsAction = new vscode.CodeAction(
            `✅ SIN Code: Generate tests`,
            vscode.CodeActionKind.Refactor
        );
        genTestsAction.command = {
            command: 'sincode.generateTests',
            title: 'Generate tests for selection',
            arguments: [document, range]
        };
        actions.push(genTestsAction);

        return actions;
    }
}

// Command handlers that apply the AI suggestions
export async function fixError(document: vscode.TextDocument, diagnostic: vscode.Diagnostic, range: vscode.Range) {
    const provider = new SINCodeActionProvider();
    const selectedCode = document.getText(range) || document.getText();
    const prompt = `Fix this error in the code below:\n\nError: ${diagnostic.message}\n\nCode:\n${selectedCode}\n\nReturn ONLY the fixed code, no explanation:`;
    
    let suggestion = '';
    await provider.bridge.call(prompt, 'debug', (chunk) => { suggestion += chunk; });
    
    if (suggestion.trim()) {
        await applyEdit(document, range, suggestion.trim());
    }
}

export async function refactorSelection(document: vscode.TextDocument, range: vscode.Range) {
    const provider = new SINCodeActionProvider();
    const selectedCode = document.getText(range);
    const prompt = `Refactor this code to be cleaner, more maintainable, and follow best practices:\n\n${selectedCode}\n\nReturn ONLY the refactored code, no explanation:`;
    
    let suggestion = '';
    await provider.bridge.call(prompt, 'code', (chunk) => { suggestion += chunk; });
    
    if (suggestion.trim()) {
        await applyEdit(document, range, suggestion.trim());
    }
}

export async function explainCode(document: vscode.TextDocument, range: vscode.Range) {
    const provider = new SINCodeActionProvider();
    const selectedCode = document.getText(range);
    const prompt = `Explain what this code does in simple terms:\n\n${selectedCode}`;
    
    let explanation = '';
    await provider.bridge.call(prompt, 'ask', (chunk) => { explanation += chunk; });
    
    if (explanation.trim()) {
        const panel = vscode.window.createWebviewPanel(
            'sincodeExplain', 'SIN Code: Explanation',
            vscode.ViewColumn.Beside, { enableScripts: true }
        );
        panel.webview.html = `<html><body style="font-family: sans-serif; padding: 20px;">${explanation.replace(/\n/g, '<br>')}</body></html>`;
    }
}

export async function generateTests(document: vscode.TextDocument, range: vscode.Range) {
    const provider = new SINCodeActionProvider();
    const selectedCode = document.getText(range);
    const fileName = document.fileName;
    const prompt = `Generate unit tests for this code:\n\n${selectedCode}\n\nReturn ONLY the test code, no explanation:`;
    
    let testCode = '';
    await provider.bridge.call(prompt, 'code', (chunk) => { testCode += chunk; });
    
    if (testCode.trim()) {
        const testFileName = fileName.replace(/(\.[^.]+)$/, '.test$1');
        const doc = await vscode.workspace.openTextDocument(vscode.Uri.file(testFileName));
        const edit = new vscode.WorkspaceEdit();
        edit.insert(doc.uri, new vscode.Position(0, 0), testCode.trim());
        await vscode.workspace.applyEdit(edit);
        await vscode.window.showTextDocument(doc);
    }
}

async function applyEdit(document: vscode.TextDocument, range: vscode.Range, newText: string) {
    const edit = new vscode.WorkspaceEdit();
    edit.replace(document.uri, range, newText);
    await vscode.workspace.applyEdit(edit);
    vscode.window.showInformationMessage('✅ SIN Code applied the changes!');
}
