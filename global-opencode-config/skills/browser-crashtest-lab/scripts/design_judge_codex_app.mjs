import { spawn } from "node:child_process";
import fs from "node:fs/promises";
import os from "node:os";
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

function trimText(value, max = 1800) {
  const text = asString(value);
  if (text.length <= max) {
    return text;
  }
  const head = Math.floor(max * 0.45);
  const tail = Math.floor(max * 0.45);
  return `${text.slice(0, head)} ... ${text.slice(-tail)}`;
}

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function isNonRetryableCodexFailure(message) {
  const text = asString(message).toLowerCase();
  return (
    text.includes("usage limit") ||
    text.includes("upgrade to plus") ||
    text.includes("no last agent message")
  );
}

function extractCodexFailureSummary(stderr, stdout) {
  const combined = `${asString(stderr)}\n${asString(stdout)}`.trim();
  if (!combined) {
    return "Unknown codex exec failure";
  }

  const lines = combined
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const errorLine = [...lines].reverse().find((line) => /^ERROR[:\s]/i.test(line));
  if (errorLine) {
    return errorLine;
  }

  const noAgentLine = [...lines].reverse().find((line) =>
    /no last agent message/i.test(line),
  );
  if (noAgentLine) {
    return noAgentLine;
  }

  return trimText(combined, 600);
}

function buildSchema() {
  return {
    type: "object",
    additionalProperties: false,
    required: [
      "judgeVerdict",
      "judgeScore",
      "summary",
      "hardFailReasons",
      "confidence",
      "findings",
    ],
    properties: {
      judgeVerdict: {
        type: "string",
        enum: ["PASS", "WARN", "FAIL"],
      },
      judgeScore: {
        type: "number",
        minimum: 0,
        maximum: 1000,
      },
      summary: {
        type: "string",
        minLength: 1,
      },
      hardFailReasons: {
        type: "array",
        items: {
          type: "string",
        },
      },
      confidence: {
        type: "number",
        minimum: 0,
        maximum: 1,
      },
      findings: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          required: [
            "severity",
            "pillar",
            "title",
            "evidence",
            "whyItMatters",
            "fix",
            "standardRef",
            "confidence",
          ],
          properties: {
            id: { type: "string" },
            severity: {
              type: "string",
              enum: ["P0", "P1", "P2", "P3"],
            },
            pillar: {
              type: "string",
              enum: [
                "Accessibility & Compliance",
                "Visual System Discipline",
                "Interaction & Usability",
                "Performance & Runtime Quality",
                "Premium Aesthetic Coherence",
              ],
            },
            title: { type: "string", minLength: 1 },
            evidence: { type: "string", minLength: 1 },
            whyItMatters: { type: "string", minLength: 1 },
            fix: { type: "string", minLength: 1 },
            standardRef: { type: "string", minLength: 1 },
            confidence: {
              type: "number",
              minimum: 0,
              maximum: 1,
            },
          },
        },
      },
    },
  };
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

  const evidence = evidenceIndex.map((entry, index) => ({
    evidenceId: `E${index + 1}`,
    url: entry.url,
    viewport: entry.viewport,
    imagePath: entry.path,
  }));

  const toneLine =
    tone === "professor"
      ? "Use a professor-level, skeptical, evidence-first style. Strict, factual, no softening."
      : "Use a strict, factual audit style.";

  return [
    "You are a forensic visual design examiner.",
    toneLine,
    "Output JSON only and exactly follow the output schema.",
    "No markdown, no code fences, no prose outside the JSON object.",
    "Every finding must include concrete visual evidence and concrete fix steps.",
    "If a release-blocking defect exists, mark it P0 and set judgeVerdict=FAIL.",
    `Deterministic baseline: ${JSON.stringify(deterministicSummary)}`,
    brandRulesText
      ? `Project brand rules: ${trimText(brandRulesText, 5000)}`
      : "Project brand rules: none provided.",
    `Evidence index (images attached in same order): ${JSON.stringify(evidence)}`,
  ].join("\n");
}

async function runCodexExec({
  cmd,
  args,
  stdinText,
  timeoutMs,
}) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, {
      env: process.env,
      stdio: ["pipe", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";
    let finished = false;
    let timedOut = false;
    let killTimer = null;

    const timer = setTimeout(() => {
      if (finished) {
        return;
      }
      timedOut = true;
      finished = true;
      child.kill("SIGTERM");
      killTimer = setTimeout(() => {
        if (timedOut) {
          child.kill("SIGKILL");
        }
      }, 1500);
      reject(new Error(`codex exec timeout after ${timeoutMs}ms`));
    }, timeoutMs);

    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });

    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    child.on("error", (error) => {
      if (finished) {
        if (killTimer) {
          clearTimeout(killTimer);
        }
        return;
      }
      finished = true;
      clearTimeout(timer);
      if (killTimer) {
        clearTimeout(killTimer);
      }
      reject(error);
    });

    child.on("close", (code) => {
      if (finished) {
        if (killTimer) {
          clearTimeout(killTimer);
        }
        return;
      }
      finished = true;
      clearTimeout(timer);
      if (killTimer) {
        clearTimeout(killTimer);
      }
      resolve({ code: code ?? 1, stdout, stderr });
    });

    child.stdin.write(stdinText);
    child.stdin.end();
  });
}

export async function runCodexAppJudge({
  evidenceIndex,
  deterministicJudge,
  config,
  brandRulesText = "",
}) {
  const codexBin = asString(config.designCodexCliBin, "codex");
  const outputMode = asString(config.designCodexExecOutputMode, "none").toLowerCase();
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "crashlab-codex-judge-"));
  const schemaPath = path.join(tempDir, "judge.schema.json");
  const outputPath = path.join(tempDir, "judge.output.json");

  try {
    await fs.writeFile(schemaPath, `${JSON.stringify(buildSchema(), null, 2)}\n`, "utf8");

    const prompt = buildPrompt({
      deterministicJudge,
      evidenceIndex,
      tone: config.designTone,
      brandRulesText,
    });

    const args = [
      "exec",
      "--skip-git-repo-check",
      "--ephemeral",
      "--sandbox",
      "read-only",
      "--color",
      "never",
      "--output-last-message",
      outputPath,
    ];

    if (outputMode === "schema") {
      args.push("--output-schema", schemaPath);
    }

    const model = asString(config.designCodexModel);
    if (model) {
      args.push("--model", model);
    }

    for (const entry of evidenceIndex) {
      args.push("--image", path.resolve(entry.path));
    }

    args.push("-");

    const attempts = Math.max(1, Math.min(6, Number(config.designCodexAttempts) || 3));
    let attempted = 0;
    const errors = [];
    for (let attempt = 1; attempt <= attempts; attempt += 1) {
      attempted = attempt;
      try {
        const result = await runCodexExec({
          cmd: codexBin,
          args,
          stdinText: `${prompt}\n`,
          timeoutMs: Number(config.designCodexTimeoutMs) || 180000,
        });

        if (result.code !== 0) {
          const summary = extractCodexFailureSummary(result.stderr, result.stdout);
          throw new Error(`codex exec exited ${result.code}. ${summary}`);
        }

        let raw = "";
        try {
          raw = await fs.readFile(outputPath, "utf8");
        } catch {
          raw = result.stdout;
        }

        const parsed = extractJsonObject(raw);
        return validateAndNormalizeJudgePayload(parsed, "codex_app", { strict: true });
      } catch (error) {
        const message = error?.message ?? "unknown error";
        errors.push(`attempt ${attempt}: ${message}`);
        if (isNonRetryableCodexFailure(message)) {
          break;
        }
        if (attempt < attempts) {
          await sleep(500 * attempt * attempt);
        }
      }
    }

    throw new Error(
      `codex judge failed after ${attempted} attempt(s): ${errors.slice(-3).join(" | ")}`,
    );
  } finally {
    await fs.rm(tempDir, { recursive: true, force: true });
  }
}
