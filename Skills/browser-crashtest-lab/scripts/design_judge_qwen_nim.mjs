import fs from "node:fs/promises";
import path from "node:path";
import { extractJsonObject, validateAndNormalizeJudgePayload } from "./design_judge_schema.mjs";

function asString(value, fallback = "") {
  if (typeof value === "string") {
    return value.trim();
  }
  if (value === undefined || value === null) {
    return fallback;
  }
  return String(value).trim();
}

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function guessMimeFromPath(filePath) {
  const lower = filePath.toLowerCase();
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
  if (lower.endsWith(".webp")) return "image/webp";
  if (lower.endsWith(".gif")) return "image/gif";
  return "image/png";
}

async function toDataUrl(filePath) {
  const absolute = path.resolve(filePath);
  const blob = await fs.readFile(absolute);
  const mime = guessMimeFromPath(absolute);
  return `data:${mime};base64,${blob.toString("base64")}`;
}

async function postJson({
  url,
  apiKey,
  payload,
  timeoutMs,
}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    const raw = await response.text();
    if (!response.ok) {
      const error = new Error(`HTTP ${response.status}: ${raw.slice(0, 800)}`);
      error.status = response.status;
      throw error;
    }

    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch (error) {
      throw new Error(`Qwen response was not valid JSON: ${error.message}`);
    }

    return parsed;
  } finally {
    clearTimeout(timer);
  }
}

function buildEndpointCandidates(baseUrl, explicitEndpoint) {
  const explicit = asString(explicitEndpoint);
  if (explicit) {
    return [explicit];
  }

  const normalized = asString(baseUrl).replace(/\/$/, "");
  if (!normalized) {
    return [];
  }

  const candidates = new Set();
  candidates.add(`${normalized}/chat/completions`);
  if (!/\/v1$/i.test(normalized)) {
    candidates.add(`${normalized}/v1/chat/completions`);
  }
  candidates.add(`${normalized}/openai/chat/completions`);
  return [...candidates];
}

function buildModelsEndpoint(baseUrl, explicitEndpoint) {
  const normalizedBase = asString(baseUrl).replace(/\/$/, "");
  if (normalizedBase) {
    if (/\/v1$/i.test(normalizedBase)) {
      return `${normalizedBase}/models`;
    }
    return `${normalizedBase}/v1/models`;
  }

  const explicit = asString(explicitEndpoint);
  if (!explicit) {
    return "";
  }

  try {
    const parsed = new URL(explicit);
    if (parsed.pathname.endsWith("/chat/completions")) {
      parsed.pathname = parsed.pathname.replace(/\/chat\/completions$/, "/models");
      return parsed.toString();
    }
  } catch {
    return "";
  }

  return "";
}

function buildModelCandidates(modelName) {
  const raw = asString(modelName, "qwen3.5-397b-a17b");
  const candidates = [];

  if (raw) {
    candidates.push(raw);
  }

  if (raw && !raw.includes("/")) {
    candidates.push(`qwen/${raw}`);
    candidates.push(`openai/qwen/${raw}`);
  }

  return [...new Set(candidates.filter(Boolean))];
}

async function fetchAvailableModelIds({
  modelsEndpoint,
  apiKey,
  timeoutMs,
}) {
  const endpoint = asString(modelsEndpoint);
  if (!endpoint) {
    return null;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(endpoint, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Accept: "application/json",
      },
      signal: controller.signal,
    });

    if (!response.ok) {
      return null;
    }

    const payload = await response.json();
    const rows = Array.isArray(payload?.data) ? payload.data : [];
    const ids = rows
      .map((entry) => asString(entry?.id))
      .filter(Boolean);

    return ids.length > 0 ? new Set(ids) : null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

function selectModelCandidates(rawCandidates, availableModelIds) {
  if (!availableModelIds || availableModelIds.size === 0) {
    return rawCandidates;
  }

  const exact = rawCandidates.filter((entry) => availableModelIds.has(entry));
  if (exact.length > 0) {
    return exact;
  }

  const lowerToOriginal = new Map();
  for (const item of availableModelIds) {
    lowerToOriginal.set(item.toLowerCase(), item);
  }

  const caseInsensitive = rawCandidates
    .map((entry) => lowerToOriginal.get(entry.toLowerCase()))
    .filter(Boolean);
  if (caseInsensitive.length > 0) {
    return [...new Set(caseInsensitive)];
  }

  const qwenPreferred = [...availableModelIds].filter((entry) =>
    entry.toLowerCase().includes("qwen3.5-397b-a17b"),
  );
  if (qwenPreferred.length > 0) {
    return qwenPreferred;
  }

  return rawCandidates;
}

function extractCompletionText(payload) {
  const choices = Array.isArray(payload?.choices) ? payload.choices : [];
  if (choices.length === 0) {
    throw new Error("Qwen response did not contain choices");
  }

  const content = choices[0]?.message?.content;
  if (typeof content === "string") {
    return content;
  }

  if (Array.isArray(content)) {
    const chunks = content
      .filter((entry) => entry && typeof entry === "object")
      .map((entry) => (typeof entry.text === "string" ? entry.text : ""))
      .filter(Boolean);

    if (chunks.length > 0) {
      return chunks.join("\n");
    }
  }

  throw new Error("Qwen response message content was empty");
}

function buildPrompt({
  deterministicJudge,
  evidenceIndex,
  tone,
  brandRulesText,
}) {
  const deterministicSummary = {
    verdict: deterministicJudge.judgeVerdict,
    score: deterministicJudge.judgeScore,
    grade: deterministicJudge.grade,
    pillarScores: deterministicJudge.pillarScores,
    topFindings: deterministicJudge.findings.slice(0, 16),
  };

  const evidenceMap = evidenceIndex.map((entry, index) => ({
    evidenceId: `E${index + 1}`,
    url: entry.url,
    viewport: entry.viewport,
    path: entry.path,
  }));

  const styleLine =
    tone === "professor"
      ? "Use a professor-level, skeptical, evidence-first style. Be strict but professional."
      : "Use a strict and professional audit style.";

  return {
    system: [
      "You are a forensic design quality examiner.",
      "You must output valid JSON only.",
      "No markdown. No prose outside JSON.",
      styleLine,
      "Do not use insulting language.",
    ].join(" "),
    user: [
      "Evaluate the UI quality based on screenshots and deterministic metrics.",
      "Return JSON with exactly this schema:",
      '{"judgeVerdict":"PASS|WARN|FAIL","judgeScore":0..1000,"summary":"...","hardFailReasons":["..."],"confidence":0..1,"findings":[{"id":"optional","severity":"P0|P1|P2|P3","pillar":"Accessibility & Compliance|Visual System Discipline|Interaction & Usability|Performance & Runtime Quality|Premium Aesthetic Coherence","title":"...","evidence":"Reference evidenceId like E3 and concrete visual detail.","whyItMatters":"...","fix":"Actionable fix","standardRef":"URL","confidence":0..1}] }',
      "Rules:",
      "- Any release-blocking visual defect must be P0.",
      "- If any P0 exists, judgeVerdict must be FAIL.",
      "- Give concrete fixes, not vague advice.",
      "- Cite standards in standardRef when possible.",
      `Deterministic baseline: ${JSON.stringify(deterministicSummary)}`,
      `Evidence index: ${JSON.stringify(evidenceMap)}`,
      brandRulesText ? `Project-specific brand rules: ${brandRulesText}` : "Project-specific brand rules: none provided.",
    ].join("\n"),
  };
}

function buildMessageContent(prompt, evidenceDataUrls) {
  const content = [{ type: "text", text: prompt.user }];
  for (const url of evidenceDataUrls) {
    content.push({
      type: "image_url",
      image_url: { url },
    });
  }
  return content;
}

export async function runQwenJudge({
  evidenceIndex,
  deterministicJudge,
  config,
  brandRulesText = "",
}) {
  const apiKey = asString(process.env[config.designQwenApiKeyEnv]);
  if (!apiKey) {
    throw new Error(`Missing NVIDIA API key env var: ${config.designQwenApiKeyEnv}`);
  }

  const prompt = buildPrompt({
    deterministicJudge,
    evidenceIndex,
    tone: config.designTone,
    brandRulesText,
  });

  const evidenceDataUrls = [];
  for (const entry of evidenceIndex) {
    evidenceDataUrls.push(await toDataUrl(entry.path));
  }

  const endpointCandidates = buildEndpointCandidates(
    config.designQwenBaseUrl,
    config.designQwenEndpoint,
  );
  if (endpointCandidates.length === 0) {
    throw new Error("Qwen endpoint candidates are empty. Set --design-qwen-base-url.");
  }
  const baseModelCandidates = buildModelCandidates(config.designQwenModel);
  const modelsEndpoint = buildModelsEndpoint(
    config.designQwenBaseUrl,
    config.designQwenEndpoint,
  );
  const availableModelIds = await fetchAvailableModelIds({
    modelsEndpoint,
    apiKey,
    timeoutMs: Math.min(Number(config.designQwenTimeoutMs) || 120000, 15000),
  });
  const modelCandidates = selectModelCandidates(baseModelCandidates, availableModelIds);
  if (modelCandidates.length === 0) {
    throw new Error("Qwen model candidates are empty. Set --design-qwen-model.");
  }

  const attempts = Math.max(1, Math.min(6, Number(config.designQwenAttempts) || 3));
  const errors = [];

  for (const endpoint of endpointCandidates) {
    for (const model of modelCandidates) {
      const payloadBase = {
        model,
        temperature: 0,
        max_tokens: 1800,
        messages: [
          {
            role: "system",
            content: prompt.system,
          },
          {
            role: "user",
            content: buildMessageContent(prompt, evidenceDataUrls),
          },
        ],
      };

      for (let attempt = 1; attempt <= attempts; attempt += 1) {
        try {
          let response;
          try {
            response = await postJson({
              url: endpoint,
              apiKey,
              payload: {
                ...payloadBase,
                response_format: { type: "json_object" },
              },
              timeoutMs: config.designQwenTimeoutMs,
            });
          } catch (error) {
            if (error?.status === 400) {
              response = await postJson({
                url: endpoint,
                apiKey,
                payload: payloadBase,
                timeoutMs: config.designQwenTimeoutMs,
              });
            } else {
              throw error;
            }
          }

          const text = extractCompletionText(response);
          const parsed = extractJsonObject(text);
          return validateAndNormalizeJudgePayload(parsed, "qwen_nim", { strict: true });
        } catch (error) {
          const message = `${endpoint} [model=${model}] :: ${error?.message ?? "unknown error"}`;
          errors.push(message);
          if (error?.status === 401 || error?.status === 403) {
            throw new Error(`Qwen authentication failed: ${message}`);
          }
          if (error?.status === 404) {
            break;
          }
          if (attempt < attempts) {
            await sleep(500 * attempt * attempt);
          }
        }
      }
    }
  }

  throw new Error(`Qwen judge failed: ${errors.slice(-6).join(" | ")}`);
}
