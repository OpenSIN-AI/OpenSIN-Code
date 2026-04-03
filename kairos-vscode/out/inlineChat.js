"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InlineChatProvider = void 0;
const vscode = require("vscode");
const cliBridge_1 = require("./cliBridge");
class InlineChatProvider {
    bridge = new cliBridge_1.SinCodeBridge();
    async provideInlineCompletionItems(document, position, _context, _token) {
        const prefix = document.getText(new vscode.Range(new vscode.Position(0, 0), position));
        try {
            let suggestion = '';
            await this.bridge.call(`Complete the code at cursor position. Return ONLY the completion (max 5 lines):\n\n${prefix}`, 'code', (chunk) => { suggestion += chunk; });
            const trimmed = suggestion.trim();
            if (!trimmed)
                return null;
            return [new vscode.InlineCompletionItem(trimmed)];
        }
        catch {
            return null;
        }
    }
    dispose() { }
}
exports.InlineChatProvider = InlineChatProvider;
//# sourceMappingURL=inlineChat.js.map