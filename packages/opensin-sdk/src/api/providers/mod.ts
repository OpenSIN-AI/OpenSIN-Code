import type { MessageRequest, MessageResponse, StreamEvent } from "../types.js";
import { ProviderKind } from "./sin_provider.js";

export type { Provider, ProviderStream } from "./sin_provider.js";

export { ProviderKind };

export interface ProviderMetadata {
  provider: ProviderKind;
  authEnv: string;
  baseUrlEnv: string;
  defaultBaseUrl: string;
}

const MODEL_REGISTRY: Array<[string, ProviderMetadata]> = [
  [
    "opus",
    {
      provider: ProviderKind.SinApi,
      authEnv: "OPENAI_API_KEY",
      baseUrlEnv: "OPENAI_BASE_URL",
      defaultBaseUrl: "http://92.5.60.87:4100/v1",
    },
  ],
  [
    "sonnet",
    {
      provider: ProviderKind.SinApi,
      authEnv: "OPENAI_API_KEY",
      baseUrlEnv: "OPENAI_BASE_URL",
      defaultBaseUrl: "http://92.5.60.87:4100/v1",
    },
  ],
  [
    "haiku",
    {
      provider: ProviderKind.SinApi,
      authEnv: "OPENAI_API_KEY",
      baseUrlEnv: "OPENAI_BASE_URL",
      defaultBaseUrl: "http://92.5.60.87:4100/v1",
    },
  ],
  [
    "gpt-5.2",
    {
      provider: ProviderKind.OpenAi,
      authEnv: "OPENAI_API_KEY",
      baseUrlEnv: "OPENAI_BASE_URL",
      defaultBaseUrl: "https://api.openai.com/v1",
    },
  ],
  [
    "gpt-4",
    {
      provider: ProviderKind.OpenAi,
      authEnv: "OPENAI_API_KEY",
      baseUrlEnv: "OPENAI_BASE_URL",
      defaultBaseUrl: "https://api.openai.com/v1",
    },
  ],
  [
    "grok",
    {
      provider: ProviderKind.Xai,
      authEnv: "XAI_API_KEY",
      baseUrlEnv: "XAI_BASE_URL",
      defaultBaseUrl: "https://api.x.ai/v1",
    },
  ],
  [
    "grok-3",
    {
      provider: ProviderKind.Xai,
      authEnv: "XAI_API_KEY",
      baseUrlEnv: "XAI_BASE_URL",
      defaultBaseUrl: "https://api.x.ai/v1",
    },
  ],
  [
    "grok-mini",
    {
      provider: ProviderKind.Xai,
      authEnv: "XAI_API_KEY",
      baseUrlEnv: "XAI_BASE_URL",
      defaultBaseUrl: "https://api.x.ai/v1",
    },
  ],
  [
    "grok-3-mini",
    {
      provider: ProviderKind.Xai,
      authEnv: "XAI_API_KEY",
      baseUrlEnv: "XAI_BASE_URL",
      defaultBaseUrl: "https://api.x.ai/v1",
    },
  ],
];

export function resolveModelAlias(model: string): string {
  const trimmed = model.trim().toLowerCase();

  for (const [alias, metadata] of MODEL_REGISTRY) {
    if (alias === trimmed) {
      switch (metadata.provider) {
        case ProviderKind.SinApi:
          if (alias === "opus") return "gpt-5.2";
          if (alias === "sonnet") return "gpt-4";
          if (alias === "haiku") return "gpt-4o-mini";
          break;
        case ProviderKind.Xai:
          if (alias === "grok" || alias === "grok-3") return "grok-3";
          if (alias === "grok-mini" || alias === "grok-3-mini")
            return "grok-3-mini";
          break;
        case ProviderKind.OpenAi:
          break;
      }
      return model;
    }
  }

  return model;
}

export function metadataForModel(
  model: string
): ProviderMetadata | undefined {
  const canonical = resolveModelAlias(model);
  const lower = canonical.toLowerCase();

  for (const [alias, metadata] of MODEL_REGISTRY) {
    if (alias === lower) {
      return metadata;
    }
  }

  if (lower.startsWith("grok")) {
    return {
      provider: ProviderKind.Xai,
      authEnv: "XAI_API_KEY",
      baseUrlEnv: "XAI_BASE_URL",
      defaultBaseUrl: "https://api.x.ai/v1",
    };
  }

  return undefined;
}

export function detectProviderKind(model: string): ProviderKind {
  const metadata = metadataForModel(model);
  if (metadata) {
    return metadata.provider;
  }

  if (hasApiKey("OPENAI_API_KEY")) {
    return ProviderKind.OpenAi;
  }
  if (hasApiKey("XAI_API_KEY")) {
    return ProviderKind.Xai;
  }

  return ProviderKind.SinApi;
}

export function maxTokensForModel(model: string): number {
  const canonical = resolveModelAlias(model);
  if (canonical.includes("opus") || canonical.includes("gpt-5")) {
    return 32000;
  }
  return 64000;
}

function hasApiKey(key: string): boolean {
  return process.env[key] !== undefined && process.env[key] !== "";
}

export function readBaseUrl(config: {
  baseUrlEnv: string;
  defaultBaseUrl: string;
}): string {
  return process.env[config.baseUrlEnv] ?? config.defaultBaseUrl;
}
