import { EventEmitter as NodeEventEmitter } from "node:events";
import { ProviderConfig, ModelInfo, PromptRequest, PromptResponse, StreamChunk } from "./types.js";
export type ProviderName = "openai" | "anthropic" | "google" | "ollama" | "custom";
export interface IProvider extends NodeEventEmitter {
    readonly name: ProviderName;
    readonly config: ProviderConfig;
    connected: boolean;
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    complete(request: PromptRequest): Promise<PromptResponse>;
    stream(request: PromptRequest): AsyncIterableIterator<StreamChunk>;
    listModels(): Promise<ModelInfo[]>;
}
export declare class ProviderError extends Error {
    readonly details?: Record<string, unknown> | undefined;
    constructor(message: string, details?: Record<string, unknown> | undefined);
}
export declare abstract class BaseProvider extends NodeEventEmitter implements IProvider {
    #private;
    abstract readonly name: ProviderName;
    constructor(config: ProviderConfig);
    get config(): ProviderConfig;
    get connected(): boolean;
    protected setConnected(value: boolean): void;
    protected get baseUrl(): string;
    protected get apiKey(): string | undefined;
    protected get headers(): Record<string, string>;
    protected get authHeaderValue(): string;
    protected get defaultBaseUrl(): string;
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    protected abstract doConnect(): Promise<void>;
    protected abstract doDisconnect(): Promise<void>;
    abstract complete(request: PromptRequest): Promise<PromptResponse>;
    abstract stream(request: PromptRequest): AsyncIterableIterator<StreamChunk>;
    abstract listModels(): Promise<ModelInfo[]>;
}
export declare class OpenAIProvider extends BaseProvider {
    readonly name: ProviderName;
    protected get defaultBaseUrl(): string;
    protected doConnect(): Promise<void>;
    protected doDisconnect(): Promise<void>;
    complete(request: PromptRequest): Promise<PromptResponse>;
    stream(request: PromptRequest): AsyncIterableIterator<StreamChunk>;
    listModels(): Promise<ModelInfo[]>;
    private buildRequestBody;
    private buildMessages;
}
export declare class AnthropicProvider extends BaseProvider {
    readonly name: ProviderName;
    protected get defaultBaseUrl(): string;
    protected get headers(): Record<string, string>;
    protected doConnect(): Promise<void>;
    protected doDisconnect(): Promise<void>;
    complete(request: PromptRequest): Promise<PromptResponse>;
    stream(request: PromptRequest): AsyncIterableIterator<StreamChunk>;
    listModels(): Promise<ModelInfo[]>;
    private buildRequestBody;
}
export declare function createProvider(config: ProviderConfig): IProvider;
export declare class ProviderRegistry {
    #private;
    register(provider: IProvider): void;
    get(name: ProviderName): IProvider | undefined;
    has(name: ProviderName): boolean;
    list(): IProvider[];
    connectAll(): Promise<void>;
    disconnectAll(): Promise<void>;
}
//# sourceMappingURL=providers.d.ts.map