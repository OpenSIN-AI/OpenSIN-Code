/**
 * Result returned to the caller after constructing an OAuth authorization URL.
 */
export interface AntigravityAuthorization {
    url: string;
    verifier: string;
    projectId: string;
}
interface AntigravityTokenExchangeSuccess {
    type: "success";
    refresh: string;
    access: string;
    expires: number;
    email?: string;
    projectId: string;
}
interface AntigravityTokenExchangeFailure {
    type: "failed";
    error: string;
}
export type AntigravityTokenExchangeResult = AntigravityTokenExchangeSuccess | AntigravityTokenExchangeFailure;
/**
 * Build the Antigravity OAuth authorization URL including PKCE and optional project metadata.
 */
export declare function authorizeAntigravity(projectId?: string): Promise<AntigravityAuthorization>;
/**
 * Exchange an authorization code for Antigravity CLI access and refresh tokens.
 */
export declare function exchangeAntigravity(code: string, state: string): Promise<AntigravityTokenExchangeResult>;
/**
 * Result returned after constructing a Gemini CLI OAuth authorization URL.
 */
export interface GeminiCliAuthorization {
    url: string;
    verifier: string;
}
/**
 * Build the Gemini CLI OAuth authorization URL.
 * Uses the Gemini CLI's public client credentials to trigger Gemini Code Assist provisioning.
 * The login_hint parameter pre-selects the Google account in the consent screen.
 */
export declare function authorizeGeminiCli(redirectUri: string, loginHint?: string): Promise<GeminiCliAuthorization>;
interface GeminiCliTokenExchangeSuccess {
    type: "success";
    email?: string;
}
interface GeminiCliTokenExchangeFailure {
    type: "failed";
    error: string;
}
export type GeminiCliTokenExchangeResult = GeminiCliTokenExchangeSuccess | GeminiCliTokenExchangeFailure;
/**
 * Exchange a Gemini CLI authorization code for tokens.
 * We don't need to save the tokens — the act of completing the OAuth consent
 * provisions the Gemini Code Assist API for the account server-side at Google.
 */
export declare function exchangeGeminiCli(code: string, verifier: string, redirectUri: string): Promise<GeminiCliTokenExchangeResult>;
export {};
//# sourceMappingURL=oauth.d.ts.map