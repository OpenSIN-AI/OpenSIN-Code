import * as vscode from 'vscode';
import { SinCodeBridge } from './cliBridge';

export class InlineChatProvider implements vscode.InlineCompletionItemProvider {
    private bridge = new SinCodeBridge();

    async provideInlineCompletionItems(
        document: vscode.TextDocument,
        position: vscode.Position,
        _context: vscode.InlineCompletionContext,
        _token: vscode.CancellationToken
    ): Promise<vscode.InlineCompletionItem[] | vscode.InlineCompletionList | null> {
        const prefix = document.getText(new vscode.Range(
            new vscode.Position(0, 0), position
        ));

        try {
            let suggestion = '';
            await this.bridge.call(
                `Complete the code at cursor position. Return ONLY the completion (max 5 lines):\n\n${prefix}`,
                'code',
                (chunk) => { suggestion += chunk; }
            );

            const trimmed = suggestion.trim();
            if (!trimmed) return null;

            return [new vscode.InlineCompletionItem(trimmed)];
        } catch {
            return null;
        }
    }

    public dispose() {}
}
