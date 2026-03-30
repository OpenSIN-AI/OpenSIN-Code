#!/usr/bin/env node

import { spawn } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { buildEvidenceIndex, generateDeterministicJudge } from "./design_zeugnis_engine.mjs";
import {
  makeFailureJudgePayload,
  validateAndNormalizeJudgePayload,
} from "./design_judge_schema.mjs";
import { runCodexAppJudge } from "./design_judge_codex_app.mjs";
import { runQwenJudge } from "./design_judge_qwen_nim.mjs";
import { fuseDualModelJudges, renderDesignZeugnisMarkdown } from "./design_fusion.mjs";

const __filename = fileURLToPath(import.meta.url);

const DANGEROUS_ACTION_RE =
  /\b(delete|remove|erase|destroy|pay|purchase|checkout|submit order|unsubscribe|transfer|confirm)\b/i;
const TRACKING_PARAM_RE =
  /^(utm_|fbclid$|gclid$|yclid$|mc_cid$|mc_eid$|_hs|mkt_tok$|vero_|ga_|igshid$)/i;
const LINK_OPEN_MODES = new Set(["browser", "http", "both"]);

const DEFAULTS = {
  outDir: "output/browser-crashtest",
  workers: Math.max(2, Math.min(8, os.cpus().length)),
  maxPages: 80,
  maxDepth: 3,
  maxActionsPerPage: 24,
  maxLinksPerPage: 40,
  actionWorkers: 4,
  linkWorkers: 6,
  linkOpenMode: "browser",
  timeoutMs: 12000,
  browser: "chromium",
  headed: false,
  axe: true,
  lighthouse: true,
  lighthousePages: 4,
  allowExternal: false,
  designZeugnis: true,
  designLlmRequired: true,
  designJuryMode: "dual",
  designCodexJudgeMode: "chat",
  designCodexCliBin: "codex",
  designCodexModel: "gpt-5.3-codex",
  designCodexTimeoutMs: 180000,
  designCodexAttempts: 3,
  designQwenModel: "qwen3.5-397b-a17b",
  designQwenBaseUrl: "https://integrate.api.nvidia.com/v1",
  designQwenEndpoint: "",
  designQwenApiKeyEnv: "NVIDIA_API_KEY",
  designQwenAttempts: 3,
  designFusionMode: "union",
  designTone: "professor",
  designViewports: "390x844,768x1024,1440x900",
  designMinScoreFail: 920,
  designMaxEvidenceImages: 18,
  designCodexMaxEvidenceImages: 6,
  designQwenMaxEvidenceImages: 18,
  designCodexJudgeFile: "",
  designBrandRulesFile: "",
  designQwenTimeoutMs: 120000,
};

function printUsage() {
  console.log(`Usage:
  node browser_crashtest_audit.mjs --url <https://target> [options]

Core options:
  --url <url>                    Target URL (required in coordinator mode)
  --out-dir <path>               Output directory (default: ${DEFAULTS.outDir})
  --workers <n>                  Parallel worker processes (default: ${DEFAULTS.workers})
  --max-pages <n>                Max discovered pages (default: ${DEFAULTS.maxPages})
  --max-depth <n>                Discovery BFS depth (default: ${DEFAULTS.maxDepth})
  --max-actions-per-page <n>     Max click actions per page (default: ${DEFAULTS.maxActionsPerPage})
  --max-links-per-page <n>       Max links per page (default: ${DEFAULTS.maxLinksPerPage})
  --action-workers <n>           Parallel click micro-workers per page (default: ${DEFAULTS.actionWorkers})
  --link-workers <n>             Parallel link micro-workers per page (default: ${DEFAULTS.linkWorkers})
  --link-open-mode <mode>        Link mode: browser|http|both (default: ${DEFAULTS.linkOpenMode})
  --timeout-ms <n>               Navigation/probe timeout ms (default: ${DEFAULTS.timeoutMs})
  --browser <chromium|firefox|webkit> (default: ${DEFAULTS.browser})
  --headed                       Run headed browser
  --allow-external               Include off-origin links in probes
  --no-axe                       Disable axe accessibility pass
  --no-lighthouse                Disable Lighthouse sampling pass
  --lighthouse-pages <n>         Pages sampled by Lighthouse (default: ${DEFAULTS.lighthousePages})
  --design-zeugnis               Enable dual-judge design zeugnis (default: on)
  --no-design-zeugnis            Disable design zeugnis
  --design-llm-required          Require codex+qwen judges (default: on)
  --no-design-llm-required       Do not hard fail if a model judge is missing
  --design-jury-mode <mode>      Jury mode (default: ${DEFAULTS.designJuryMode})
  --design-codex-judge-mode <m>  Codex judge mode: auto|exec|chat|file (default: ${DEFAULTS.designCodexJudgeMode})
  --design-codex-cli-bin <cmd>   Codex CLI binary (default: ${DEFAULTS.designCodexCliBin})
  --design-codex-model <name>    Optional codex model override
  --design-codex-timeout-ms <n>  Codex judge timeout (default: ${DEFAULTS.designCodexTimeoutMs})
  --design-codex-attempts <n>    Codex judge attempts (default: ${DEFAULTS.designCodexAttempts})
  --design-qwen-model <name>     Qwen model (default: ${DEFAULTS.designQwenModel})
  --design-qwen-base-url <url>   Qwen API base URL
  --design-qwen-endpoint <url>   Explicit Qwen endpoint override (optional)
  --design-qwen-api-key-env <e>  Env var for Qwen API key (default: ${DEFAULTS.designQwenApiKeyEnv})
  --design-qwen-timeout-ms <n>   Qwen request timeout (default: ${DEFAULTS.designQwenTimeoutMs})
  --design-qwen-attempts <n>     Qwen judge attempts (default: ${DEFAULTS.designQwenAttempts})
  --design-fusion-mode <mode>    Fusion mode (default: ${DEFAULTS.designFusionMode})
  --design-tone <mode>           Report tone (default: ${DEFAULTS.designTone})
  --design-viewports <csv>       Viewports for design evidence (default: ${DEFAULTS.designViewports})
  --design-min-score-fail <n>    Hard fail threshold on 1000-scale (default: ${DEFAULTS.designMinScoreFail})
  --design-max-evidence-images <n> Max evidence images sent to judges (default: ${DEFAULTS.designMaxEvidenceImages})
  --design-codex-max-evidence-images <n> Max evidence images for Codex judge (default: ${DEFAULTS.designCodexMaxEvidenceImages})
  --design-qwen-max-evidence-images <n> Max evidence images for Qwen judge (default: ${DEFAULTS.designQwenMaxEvidenceImages})
  --design-codex-judge-file <p>  Path to codex judge JSON (optional)
  --design-brand-rules-file <p>  Optional project design rules file

Worker mode (internal):
  --worker-mode --urls-file <file> --worker-id <n> --total-workers <n>

Examples:
  node browser_crashtest_audit.mjs --url http://localhost:3000 --workers 6 --link-open-mode both --design-zeugnis
  node browser_crashtest_audit.mjs --url https://example.com --headed --max-pages 30
`);
}

function parseArgs(argv) {
  const args = {
    ...DEFAULTS,
    workerMode: false,
    help: false,
    url: "",
    urlsFile: "",
    workerId: 0,
    totalWorkers: 1,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    switch (token) {
      case "--help":
      case "-h":
        args.help = true;
        break;
      case "--url":
        args.url = argv[++i] ?? "";
        break;
      case "--out-dir":
        args.outDir = argv[++i] ?? DEFAULTS.outDir;
        break;
      case "--workers":
        args.workers = toInt(argv[++i], DEFAULTS.workers);
        break;
      case "--max-pages":
        args.maxPages = toInt(argv[++i], DEFAULTS.maxPages);
        break;
      case "--max-depth":
        args.maxDepth = toInt(argv[++i], DEFAULTS.maxDepth);
        break;
      case "--max-actions-per-page":
        args.maxActionsPerPage = toInt(argv[++i], DEFAULTS.maxActionsPerPage);
        break;
      case "--max-links-per-page":
        args.maxLinksPerPage = toInt(argv[++i], DEFAULTS.maxLinksPerPage);
        break;
      case "--action-workers":
        args.actionWorkers = toInt(argv[++i], DEFAULTS.actionWorkers);
        break;
      case "--link-workers":
        args.linkWorkers = toInt(argv[++i], DEFAULTS.linkWorkers);
        break;
      case "--link-open-mode":
        args.linkOpenMode = (argv[++i] ?? DEFAULTS.linkOpenMode).toLowerCase();
        break;
      case "--timeout-ms":
        args.timeoutMs = toInt(argv[++i], DEFAULTS.timeoutMs);
        break;
      case "--browser":
        args.browser = argv[++i] ?? DEFAULTS.browser;
        break;
      case "--lighthouse-pages":
        args.lighthousePages = toInt(argv[++i], DEFAULTS.lighthousePages);
        break;
      case "--design-zeugnis":
        args.designZeugnis = true;
        break;
      case "--no-design-zeugnis":
        args.designZeugnis = false;
        break;
      case "--design-llm-required":
        args.designLlmRequired = true;
        break;
      case "--no-design-llm-required":
        args.designLlmRequired = false;
        break;
      case "--design-jury-mode":
        args.designJuryMode = (argv[++i] ?? DEFAULTS.designJuryMode).toLowerCase();
        break;
      case "--design-codex-judge-mode":
        args.designCodexJudgeMode = (argv[++i] ?? DEFAULTS.designCodexJudgeMode).toLowerCase();
        break;
      case "--design-codex-cli-bin":
        args.designCodexCliBin = argv[++i] ?? DEFAULTS.designCodexCliBin;
        break;
      case "--design-codex-model":
        args.designCodexModel = argv[++i] ?? DEFAULTS.designCodexModel;
        break;
      case "--design-codex-timeout-ms":
        args.designCodexTimeoutMs = toInt(argv[++i], DEFAULTS.designCodexTimeoutMs);
        break;
      case "--design-codex-attempts":
        args.designCodexAttempts = toInt(argv[++i], DEFAULTS.designCodexAttempts);
        break;
      case "--design-qwen-model":
        args.designQwenModel = argv[++i] ?? DEFAULTS.designQwenModel;
        break;
      case "--design-qwen-base-url":
        args.designQwenBaseUrl = argv[++i] ?? DEFAULTS.designQwenBaseUrl;
        break;
      case "--design-qwen-endpoint":
        args.designQwenEndpoint = argv[++i] ?? DEFAULTS.designQwenEndpoint;
        break;
      case "--design-qwen-api-key-env":
        args.designQwenApiKeyEnv = argv[++i] ?? DEFAULTS.designQwenApiKeyEnv;
        break;
      case "--design-fusion-mode":
        args.designFusionMode = (argv[++i] ?? DEFAULTS.designFusionMode).toLowerCase();
        break;
      case "--design-tone":
        args.designTone = (argv[++i] ?? DEFAULTS.designTone).toLowerCase();
        break;
      case "--design-viewports":
        args.designViewports = argv[++i] ?? DEFAULTS.designViewports;
        break;
      case "--design-min-score-fail":
        args.designMinScoreFail = toInt(argv[++i], DEFAULTS.designMinScoreFail);
        break;
      case "--design-max-evidence-images":
        args.designMaxEvidenceImages = toInt(argv[++i], DEFAULTS.designMaxEvidenceImages);
        break;
      case "--design-codex-max-evidence-images":
        args.designCodexMaxEvidenceImages = toInt(
          argv[++i],
          DEFAULTS.designCodexMaxEvidenceImages,
        );
        break;
      case "--design-qwen-max-evidence-images":
        args.designQwenMaxEvidenceImages = toInt(
          argv[++i],
          DEFAULTS.designQwenMaxEvidenceImages,
        );
        break;
      case "--design-codex-judge-file":
        args.designCodexJudgeFile = argv[++i] ?? "";
        break;
      case "--design-brand-rules-file":
        args.designBrandRulesFile = argv[++i] ?? "";
        break;
      case "--design-qwen-timeout-ms":
        args.designQwenTimeoutMs = toInt(argv[++i], DEFAULTS.designQwenTimeoutMs);
        break;
      case "--design-qwen-attempts":
        args.designQwenAttempts = toInt(argv[++i], DEFAULTS.designQwenAttempts);
        break;
      case "--headed":
        args.headed = true;
        break;
      case "--allow-external":
        args.allowExternal = true;
        break;
      case "--no-axe":
        args.axe = false;
        break;
      case "--no-lighthouse":
        args.lighthouse = false;
        break;
      case "--worker-mode":
        args.workerMode = true;
        break;
      case "--urls-file":
        args.urlsFile = argv[++i] ?? "";
        break;
      case "--worker-id":
        args.workerId = toInt(argv[++i], 0);
        break;
      case "--total-workers":
        args.totalWorkers = toInt(argv[++i], 1);
        break;
      default:
        throw new Error(`Unknown argument: ${token}`);
    }
  }

  args.workers = clampInt(args.workers, 1, 64);
  args.maxPages = clampInt(args.maxPages, 1, 2000);
  args.maxDepth = clampInt(args.maxDepth, 0, 10);
  args.maxActionsPerPage = clampInt(args.maxActionsPerPage, 1, 200);
  args.maxLinksPerPage = clampInt(args.maxLinksPerPage, 1, 400);
  args.actionWorkers = clampInt(args.actionWorkers, 1, 32);
  args.linkWorkers = clampInt(args.linkWorkers, 1, 32);
  args.timeoutMs = clampInt(args.timeoutMs, 2000, 120000);
  args.lighthousePages = clampInt(args.lighthousePages, 1, 20);
  args.totalWorkers = clampInt(args.totalWorkers, 1, 128);
  args.designMinScoreFail = clampInt(args.designMinScoreFail, 0, 1000);
  args.designMaxEvidenceImages = clampInt(args.designMaxEvidenceImages, 1, 120);
  args.designCodexMaxEvidenceImages = clampInt(args.designCodexMaxEvidenceImages, 1, 120);
  args.designQwenMaxEvidenceImages = clampInt(args.designQwenMaxEvidenceImages, 1, 120);
  args.designCodexTimeoutMs = clampInt(args.designCodexTimeoutMs, 5000, 360000);
  args.designQwenTimeoutMs = clampInt(args.designQwenTimeoutMs, 5000, 240000);
  args.designCodexAttempts = clampInt(args.designCodexAttempts, 1, 6);
  args.designQwenAttempts = clampInt(args.designQwenAttempts, 1, 6);
  args.designViewportsList = parseViewportList(args.designViewports);

  if (!LINK_OPEN_MODES.has(args.linkOpenMode)) {
    throw new Error(`Invalid --link-open-mode: ${args.linkOpenMode}`);
  }
  if (!["dual"].includes(args.designJuryMode)) {
    throw new Error(`Invalid --design-jury-mode: ${args.designJuryMode}`);
  }
  if (!["auto", "exec", "chat", "file"].includes(args.designCodexJudgeMode)) {
    throw new Error(`Invalid --design-codex-judge-mode: ${args.designCodexJudgeMode}`);
  }
  if (!["union"].includes(args.designFusionMode)) {
    throw new Error(`Invalid --design-fusion-mode: ${args.designFusionMode}`);
  }
  if (!["professor", "neutral", "direct"].includes(args.designTone)) {
    throw new Error(`Invalid --design-tone: ${args.designTone}`);
  }

  return args;
}

function toInt(value, fallback) {
  const parsed = Number.parseInt(value ?? "", 10);
  if (Number.isNaN(parsed)) {
    return fallback;
  }
  return parsed;
}

function clampInt(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function parseViewportList(rawValue) {
  const value = String(rawValue ?? "").trim();
  if (!value) {
    return [
      { width: 390, height: 844 },
      { width: 768, height: 1024 },
      { width: 1440, height: 900 },
    ];
  }

  const parsed = value
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) => {
      const match = entry.match(/^(\d{2,5})x(\d{2,5})$/i);
      if (!match) {
        return null;
      }
      const width = clampInt(Number.parseInt(match[1], 10), 240, 3840);
      const height = clampInt(Number.parseInt(match[2], 10), 240, 3840);
      return { width, height };
    })
    .filter(Boolean);

  if (parsed.length === 0) {
    throw new Error(`Invalid --design-viewports: ${rawValue}`);
  }

  return parsed;
}

function normalizeUrl(raw, base = undefined) {
  try {
    const url = base ? new URL(raw, base) : new URL(raw);
    if (!["http:", "https:"].includes(url.protocol)) {
      return null;
    }

    url.hash = "";
    for (const key of [...url.searchParams.keys()]) {
      if (TRACKING_PARAM_RE.test(key)) {
        url.searchParams.delete(key);
      }
    }
    if (url.searchParams.toString() === "") {
      url.search = "";
    }

    if (url.pathname.length > 1 && url.pathname.endsWith("/")) {
      url.pathname = url.pathname.slice(0, -1);
    }
    return url.toString();
  } catch {
    return null;
  }
}

function sameOrigin(urlA, urlB) {
  try {
    return new URL(urlA).origin === new URL(urlB).origin;
  } catch {
    return false;
  }
}

function hashText(value) {
  return crypto.createHash("sha1").update(value).digest("hex").slice(0, 12);
}

function toPct(value) {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return null;
  }
  return Math.round(value * 100);
}

function avg(values) {
  if (!values.length) {
    return 0;
  }
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function safeError(error) {
  if (!error) {
    return "Unknown error";
  }
  if (typeof error === "string") {
    return error;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

function verdictRank(value) {
  if (value === "FAIL") return 2;
  if (value === "WARN") return 1;
  return 0;
}

function mergeOverallVerdict(current, incoming) {
  return verdictRank(incoming) > verdictRank(current) ? incoming : current;
}

function isBrokenLinkCheck(check) {
  if (check.error) {
    return true;
  }
  if (typeof check.status === "number") {
    return check.status >= 400;
  }
  return check.ok === false;
}

function emptyAuditResult(url, status, message) {
  return {
    url,
    status,
    navigationError: message,
    consoleMessages: [],
    pageErrors: [],
    requestFailures: [],
    linksDiscovered: 0,
    linksTested: 0,
    linkChecks: [],
    brokenLinks: [],
    buttonChecks: [],
    failedClicks: 0,
    designMetrics: {
      hasHorizontalOverflow: false,
      brokenImages: 0,
      missingAlt: 0,
      smallTapTargets: 0,
      headingJumps: 0,
      uniqueFonts: 0,
      buttonStyleVariants: 0,
    },
    designScore: 0,
    designGrade: "high-risk",
    axe: { enabled: false, skipped: message },
    screenshot: null,
    designViewportScreenshots: [],
    linkOpenMode: null,
  };
}

async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true });
}

async function writeJson(filePath, payload) {
  await fs.writeFile(filePath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
}

async function readJson(filePath) {
  const raw = await fs.readFile(filePath, "utf8");
  return JSON.parse(raw);
}

async function importPlaywright() {
  try {
    return await import("playwright");
  } catch {
    throw new Error(
      "Missing dependency 'playwright'. Install with: npm install -D playwright @axe-core/playwright",
    );
  }
}

async function runCommand(command, args, cwd = process.cwd()) {
  return new Promise((resolve) => {
    const child = spawn(command, args, {
      cwd,
      env: process.env,
      stdio: ["ignore", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (data) => {
      stdout += data.toString();
    });
    child.stderr.on("data", (data) => {
      stderr += data.toString();
    });

    child.on("close", (code) => {
      resolve({ code: code ?? 1, stdout, stderr });
    });
  });
}

async function mapLimit(items, concurrency, mapper) {
  const results = new Array(items.length);
  let cursor = 0;

  async function worker() {
    while (cursor < items.length) {
      const index = cursor;
      cursor += 1;
      results[index] = await mapper(items[index], index);
    }
  }

  const poolSize = Math.max(1, Math.min(concurrency, items.length));
  await Promise.all(Array.from({ length: poolSize }, () => worker()));
  return results;
}

function attachCommonPageGuards(page) {
  page.on("dialog", async (dialog) => {
    try {
      await dialog.dismiss();
    } catch {
      // ignore dismiss failures
    }
  });
}

async function discoverUrls(config) {
  const playwright = await importPlaywright();
  const browserType = playwright[config.browser];
  if (!browserType) {
    throw new Error(`Unsupported browser: ${config.browser}`);
  }

  const startUrl = normalizeUrl(config.url);
  if (!startUrl) {
    throw new Error(`Invalid --url: ${config.url}`);
  }

  const browser = await browserType.launch({ headless: !config.headed });
  const context = await browser.newContext({ ignoreHTTPSErrors: true });
  const page = await context.newPage();
  attachCommonPageGuards(page);

  const queue = [{ url: startUrl, depth: 0 }];
  const queued = new Set([startUrl]);
  const visited = new Set();
  const ordered = [];

  while (queue.length > 0 && ordered.length < config.maxPages) {
    const current = queue.shift();
    if (!current || visited.has(current.url)) {
      continue;
    }
    visited.add(current.url);
    ordered.push(current.url);

    try {
      await page.goto(current.url, {
        waitUntil: "domcontentloaded",
        timeout: config.timeoutMs,
      });
      await page.waitForTimeout(150);
    } catch {
      continue;
    }

    if (current.depth >= config.maxDepth) {
      continue;
    }

    let hrefs = [];
    try {
      hrefs = await page.$$eval("a[href]", (anchors) =>
        anchors.map((anchor) => anchor.getAttribute("href") ?? ""),
      );
    } catch {
      hrefs = [];
    }

    for (const href of hrefs) {
      const normalized = normalizeUrl(href, current.url);
      if (!normalized) {
        continue;
      }
      if (!config.allowExternal && !sameOrigin(normalized, startUrl)) {
        continue;
      }
      if (visited.has(normalized) || queued.has(normalized)) {
        continue;
      }

      queue.push({ url: normalized, depth: current.depth + 1 });
      queued.add(normalized);
      if (queue.length + ordered.length >= config.maxPages * 4) {
        break;
      }
    }
  }

  await browser.close();
  return ordered;
}

async function importAxeBuilderIfAvailable() {
  try {
    const axeModule = await import("@axe-core/playwright");
    return axeModule.default ?? axeModule.AxeBuilder ?? axeModule;
  } catch {
    return null;
  }
}

async function runAxe(page, enabled) {
  if (!enabled) {
    return { enabled: false, skipped: "disabled" };
  }

  const AxeBuilder = await importAxeBuilderIfAvailable();
  if (!AxeBuilder) {
    return { enabled: false, skipped: "@axe-core/playwright not installed" };
  }

  try {
    const axe = new AxeBuilder({ page });
    const result = await axe.analyze();
    const violations = (result.violations ?? []).map((entry) => ({
      id: entry.id,
      impact: entry.impact ?? "unknown",
      help: entry.help ?? "",
      nodes: entry.nodes?.length ?? 0,
    }));
    return {
      enabled: true,
      violationCount: violations.length,
      violations,
    };
  } catch (error) {
    return {
      enabled: false,
      skipped: `axe error: ${safeError(error)}`,
    };
  }
}

async function collectLinks(page, pageUrl, config) {
  let links = [];
  try {
    links = await page.$$eval("a[href]", (anchors) =>
      anchors.map((anchor) => ({
        href: anchor.getAttribute("href") ?? "",
        text: (anchor.textContent ?? "").trim().slice(0, 120),
      })),
    );
  } catch {
    links = [];
  }

  const deduped = [];
  const seen = new Set();
  for (const link of links) {
    const normalized = normalizeUrl(link.href, pageUrl);
    if (!normalized) {
      continue;
    }
    if (!config.allowExternal && !sameOrigin(normalized, config.url)) {
      continue;
    }
    if (seen.has(normalized)) {
      continue;
    }

    deduped.push({ url: normalized, text: link.text });
    seen.add(normalized);

    if (deduped.length >= config.maxLinksPerPage) {
      break;
    }
  }

  return deduped;
}

async function probeLinkHttp(context, url, timeoutMs) {
  const requestOptions = {
    failOnStatusCode: false,
    maxRedirects: 8,
    timeout: timeoutMs,
  };

  try {
    let response = await context.request.fetch(url, {
      ...requestOptions,
      method: "HEAD",
    });

    if ([405, 501].includes(response.status())) {
      response = await context.request.fetch(url, {
        ...requestOptions,
        method: "GET",
      });
    }

    return {
      url,
      ok: response.status() < 400,
      status: response.status(),
      finalUrl: response.url(),
      error: null,
      method: "http",
    };
  } catch (error) {
    return {
      url,
      ok: false,
      status: null,
      finalUrl: null,
      error: safeError(error),
      method: "http",
    };
  }
}

async function probeLinksHttp(context, links, config) {
  return mapLimit(links, config.linkWorkers, async (entry) => {
    const probe = await probeLinkHttp(context, entry.url, config.timeoutMs);
    return {
      ...probe,
      text: entry.text,
    };
  });
}

async function openLinkInBrowser(context, entry, config) {
  const page = await context.newPage();
  attachCommonPageGuards(page);

  const consoleMessages = [];
  const requestFailures = [];

  page.on("console", (message) => {
    const type = message.type();
    if (type === "error" || type === "warning") {
      consoleMessages.push(message.text().slice(0, 260));
    }
  });
  page.on("requestfailed", (request) => {
    requestFailures.push({
      url: request.url(),
      method: request.method(),
      failure: request.failure()?.errorText ?? "unknown",
    });
  });

  try {
    const response = await page.goto(entry.url, {
      waitUntil: "domcontentloaded",
      timeout: config.timeoutMs,
    });
    await page.waitForTimeout(120);

    const status = response ? response.status() : null;
    return {
      url: entry.url,
      text: entry.text,
      ok: status === null || status < 400,
      status,
      finalUrl: page.url(),
      error: null,
      method: "browser",
      consoleIssues: consoleMessages.length,
      requestFailures: requestFailures.length,
    };
  } catch (error) {
    return {
      url: entry.url,
      text: entry.text,
      ok: false,
      status: null,
      finalUrl: null,
      error: safeError(error),
      method: "browser",
      consoleIssues: consoleMessages.length,
      requestFailures: requestFailures.length,
    };
  } finally {
    await page.close();
  }
}

async function openLinksInBrowser(context, links, config) {
  return mapLimit(links, config.linkWorkers, async (entry) =>
    openLinkInBrowser(context, entry, config),
  );
}

function mergeLinkChecks(httpChecks, browserChecks) {
  const browserByUrl = new Map(browserChecks.map((entry) => [entry.url, entry]));
  const merged = [];

  for (const httpEntry of httpChecks) {
    const browserEntry = browserByUrl.get(httpEntry.url);
    if (browserEntry) {
      merged.push({
        ...browserEntry,
        httpStatus: httpEntry.status,
        httpOk: httpEntry.ok,
        httpError: httpEntry.error,
      });
      browserByUrl.delete(httpEntry.url);
    } else {
      merged.push(httpEntry);
    }
  }

  for (const leftover of browserByUrl.values()) {
    merged.push(leftover);
  }

  return merged;
}

async function collectLinkChecks(context, links, config) {
  let httpChecks = [];
  let browserChecks = [];

  if (config.linkOpenMode === "http" || config.linkOpenMode === "both") {
    httpChecks = await probeLinksHttp(context, links, config);
  }
  if (config.linkOpenMode === "browser" || config.linkOpenMode === "both") {
    browserChecks = await openLinksInBrowser(context, links, config);
  }

  let combinedChecks = [];
  if (config.linkOpenMode === "http") {
    combinedChecks = httpChecks;
  } else if (config.linkOpenMode === "browser") {
    combinedChecks = browserChecks;
  } else {
    combinedChecks = mergeLinkChecks(httpChecks, browserChecks);
  }

  return {
    combinedChecks,
    brokenLinks: combinedChecks.filter(isBrokenLinkCheck),
    httpChecks,
    browserChecks,
  };
}

async function locatorMeta(locator, index) {
  try {
    return await locator.evaluate((element, i) => {
      const labelCandidates = [
        element.getAttribute("aria-label"),
        element.getAttribute("title"),
        "value" in element ? element.value : "",
        element.textContent,
      ];
      const raw = labelCandidates.find((item) => item && item.trim().length > 0) ?? "";
      const rect = element.getBoundingClientRect();
      return {
        index: i,
        tag: element.tagName.toLowerCase(),
        label: raw.trim().replace(/\s+/g, " ").slice(0, 100) || `control-${i}`,
        width: Math.round(rect.width),
        height: Math.round(rect.height),
        disabled:
          element.hasAttribute("disabled") ||
          element.getAttribute("aria-disabled") === "true",
      };
    }, index);
  } catch {
    return {
      index,
      tag: "unknown",
      label: `control-${index}`,
      width: 0,
      height: 0,
      disabled: false,
    };
  }
}

async function listClickableCandidates(page, selector, maxActionsPerPage) {
  try {
    const locator = page.locator(selector);
    return await locator.evaluateAll((elements, max) => {
      const isActuallyVisible = (element) => {
        if (!(element instanceof HTMLElement)) {
          return false;
        }
        if (!element.isConnected) {
          return false;
        }
        if (element.hidden || element.getAttribute("aria-hidden") === "true") {
          return false;
        }
        if (element.closest("[hidden],[aria-hidden='true'],[inert]")) {
          return false;
        }
        const style = getComputedStyle(element);
        if (
          style.display === "none" ||
          style.visibility === "hidden" ||
          style.pointerEvents === "none" ||
          Number.parseFloat(style.opacity || "1") === 0
        ) {
          return false;
        }
        const rect = element.getBoundingClientRect();
        if (rect.width <= 0 || rect.height <= 0) {
          return false;
        }
        return true;
      };

      const candidates = [];
      elements.forEach((element, rawIndex) => {
        if (!isActuallyVisible(element)) {
          return;
        }
        const labelCandidates = [
          element.getAttribute("aria-label"),
          element.getAttribute("title"),
          "value" in element ? element.value : "",
          element.textContent,
        ];
        const raw = labelCandidates.find((item) => item && item.trim().length > 0) ?? "";
        candidates.push({
          index: rawIndex,
          tag: element.tagName.toLowerCase(),
          label: raw.trim().replace(/\s+/g, " ").slice(0, 100) || `control-${rawIndex}`,
          disabled:
            element.hasAttribute("disabled") ||
            element.getAttribute("aria-disabled") === "true",
        });
      });
      return candidates.slice(0, max);
    }, maxActionsPerPage);
  } catch {
    return [];
  }
}

async function clickOneControl(context, pageUrl, selector, candidate, config) {
  const page = await context.newPage();
  attachCommonPageGuards(page);
  const index = candidate.index;

  try {
    await page.goto(pageUrl, {
      waitUntil: "domcontentloaded",
      timeout: config.timeoutMs,
    });
    await page.waitForTimeout(120);

    const locator = page.locator(selector).nth(index);
    const exists = await locator.count();
    if (exists === 0) {
      return {
        index,
        label: candidate.label,
        outcome: "skipped",
        reason: "not-found-after-reload",
      };
    }

    const meta = await locatorMeta(locator, index);
    const visible = await locator.isVisible().catch(() => false);
    if (!visible) {
      return {
        index,
        label: meta.label || candidate.label,
        outcome: "skipped",
        reason: "not-visible-after-reload",
      };
    }
    if (meta.disabled) {
      return {
        index,
        label: meta.label,
        outcome: "skipped",
        reason: "disabled",
      };
    }
    if (DANGEROUS_ACTION_RE.test(meta.label)) {
      return {
        index,
        label: meta.label,
        outcome: "skipped",
        reason: "potentially destructive",
      };
    }

    await locator.scrollIntoViewIfNeeded();
    await locator.click({ timeout: config.timeoutMs, noWaitAfter: true });
    await page.waitForTimeout(450);

    const afterUrl = page.url();
    const navigated = normalizeUrl(afterUrl) !== normalizeUrl(pageUrl);

    return {
      index,
      label: meta.label,
      outcome: "ok",
      navigated,
      navigatedTo: navigated ? afterUrl : null,
    };
  } catch (error) {
    return {
      index,
      label: candidate.label,
      outcome: "failed",
      error: safeError(error),
    };
  } finally {
    await page.close();
  }
}

async function clickButtons(context, page, pageUrl, config) {
  const selector =
    "button, [role='button'], input[type='button'], input[type='submit'], a[role='button']";

  const candidates = await listClickableCandidates(page, selector, config.maxActionsPerPage);
  if (candidates.length === 0) {
    return [];
  }

  const results = await mapLimit(candidates, config.actionWorkers, async (candidate) =>
    clickOneControl(context, pageUrl, selector, candidate, config),
  );

  results.sort((left, right) => left.index - right.index);
  return results;
}

async function collectDesignMetrics(page) {
  try {
    return await page.evaluate(() => {
      const doc = document.documentElement;
      const bodyNodes = Array.from(document.querySelectorAll("body *"));
      const clickableSelectors =
        "a,button,[role='button'],input,select,textarea,[onclick]";
      const clickable = Array.from(document.querySelectorAll(clickableSelectors));

      const visible = clickable.filter((element) => {
        const style = getComputedStyle(element);
        const rect = element.getBoundingClientRect();
        return (
          style.display !== "none" &&
          style.visibility !== "hidden" &&
          rect.width > 0 &&
          rect.height > 0
        );
      });

      const smallTapTargets = visible.filter((element) => {
        const rect = element.getBoundingClientRect();
        return rect.width < 44 || rect.height < 44;
      }).length;

      const images = Array.from(document.images);
      const brokenImages = images.filter((image) => image.complete && image.naturalWidth === 0).length;
      const missingAlt = images.filter((image) => !image.hasAttribute("alt")).length;

      const headings = Array.from(document.querySelectorAll("h1,h2,h3,h4,h5,h6")).map((heading) =>
        Number.parseInt(heading.tagName.slice(1), 10),
      );
      let headingJumps = 0;
      for (let i = 1; i < headings.length; i += 1) {
        if (headings[i] - headings[i - 1] > 1) {
          headingJumps += 1;
        }
      }

      const fonts = new Set();
      bodyNodes.slice(0, 700).forEach((element) => {
        const family = getComputedStyle(element).fontFamily ?? "";
        const primary = family
          .split(",")[0]
          ?.replaceAll('"', "")
          ?.replaceAll("'", "")
          ?.trim()
          ?.toLowerCase();
        if (primary) {
          fonts.add(primary);
        }
      });

      const buttonStyles = new Set();
      visible.slice(0, 180).forEach((element) => {
        const style = getComputedStyle(element);
        buttonStyles.add(
          [
            style.backgroundColor,
            style.color,
            style.borderRadius,
            style.fontSize,
            style.fontWeight,
          ].join("|"),
        );
      });

      return {
        hasHorizontalOverflow: doc.scrollWidth - window.innerWidth > 2,
        brokenImages,
        missingAlt,
        smallTapTargets,
        headingJumps,
        uniqueFonts: fonts.size,
        buttonStyleVariants: buttonStyles.size,
      };
    });
  } catch {
    return {
      hasHorizontalOverflow: false,
      brokenImages: 0,
      missingAlt: 0,
      smallTapTargets: 0,
      headingJumps: 0,
      uniqueFonts: 0,
      buttonStyleVariants: 0,
    };
  }
}

async function captureDesignViewportScreenshots({
  page,
  pageUrl,
  outDir,
  pageHash,
  viewports,
  timeoutMs,
}) {
  const shots = [];
  const dir = path.join(outDir, "screenshots", "viewports");
  await ensureDir(dir);

  for (const viewport of viewports) {
    try {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto(pageUrl, {
        waitUntil: "domcontentloaded",
        timeout: timeoutMs,
      });
      await page.waitForTimeout(180);

      const fileName = `${pageHash}-${viewport.width}x${viewport.height}.png`;
      const filePath = path.join(dir, fileName);
      await page.screenshot({
        path: filePath,
        fullPage: true,
      });
      shots.push({
        width: viewport.width,
        height: viewport.height,
        path: filePath,
      });
    } catch {
      // skip failed viewport shot and continue
    }
  }

  return shots;
}

function designScore(metrics, axeViolationCount) {
  let score = 100;

  if (metrics.hasHorizontalOverflow) {
    score -= 20;
  }
  score -= Math.min(20, metrics.brokenImages * 5);
  score -= Math.min(14, metrics.missingAlt * 2);
  score -= Math.min(18, metrics.smallTapTargets * 2);
  score -= Math.min(12, metrics.headingJumps * 2);

  if (metrics.uniqueFonts > 4) {
    score -= Math.min(12, (metrics.uniqueFonts - 4) * 3);
  }
  if (metrics.buttonStyleVariants > 8) {
    score -= Math.min(12, (metrics.buttonStyleVariants - 8) * 2);
  }

  score -= Math.min(30, axeViolationCount * 3);
  score = clampInt(score, 0, 100);

  let grade = "high-risk";
  if (score >= 88) {
    grade = "big-player-quality";
  } else if (score >= 75) {
    grade = "solid";
  } else if (score >= 60) {
    grade = "needs-polish";
  }

  return { score, grade };
}

async function auditPage(context, pageUrl, config) {
  const page = await context.newPage();
  attachCommonPageGuards(page);

  const consoleMessages = [];
  const pageErrors = [];
  const requestFailures = [];

  page.on("console", (message) => {
    const type = message.type();
    if (type === "error" || type === "warning") {
      consoleMessages.push({
        type,
        text: message.text().slice(0, 400),
      });
    }
  });
  page.on("pageerror", (error) => {
    pageErrors.push(safeError(error).slice(0, 400));
  });
  page.on("requestfailed", (request) => {
    requestFailures.push({
      url: request.url(),
      method: request.method(),
      failure: request.failure()?.errorText ?? "unknown",
    });
  });

  let status = "ok";
  let navigationError = null;
  try {
    await page.goto(pageUrl, {
      waitUntil: "domcontentloaded",
      timeout: config.timeoutMs,
    });
    await page.waitForTimeout(250);
  } catch (error) {
    status = "navigation_failed";
    navigationError = safeError(error);
  }

  let links = [];
  let linkChecks = [];
  let brokenLinks = [];
  let buttonChecks = [];
  let designMetrics = {
    hasHorizontalOverflow: false,
    brokenImages: 0,
    missingAlt: 0,
    smallTapTargets: 0,
    headingJumps: 0,
    uniqueFonts: 0,
    buttonStyleVariants: 0,
  };
  let axe = { enabled: false, skipped: "navigation failed" };
  let screenshot = null;
  let designViewportScreenshots = [];

  if (status === "ok") {
    links = await collectLinks(page, pageUrl, config);

    const linkAudit = await collectLinkChecks(context, links, config);
    linkChecks = linkAudit.combinedChecks;
    brokenLinks = linkAudit.brokenLinks;

    buttonChecks = await clickButtons(context, page, pageUrl, config);

    try {
      await page.goto(pageUrl, {
        waitUntil: "domcontentloaded",
        timeout: config.timeoutMs,
      });
      await page.waitForTimeout(150);
    } catch {
      // keep previous data if reset fails
    }

    designMetrics = await collectDesignMetrics(page);
    axe = await runAxe(page, config.axe);

    const pageHash = hashText(pageUrl);
    const screenshotName = `${pageHash}.png`;
    screenshot = path.join(config.outDir, "screenshots", screenshotName);
    try {
      await page.screenshot({
        path: screenshot,
        fullPage: true,
      });
    } catch {
      screenshot = null;
    }

    if (config.designZeugnis) {
      designViewportScreenshots = await captureDesignViewportScreenshots({
        page,
        pageUrl,
        outDir: config.outDir,
        pageHash,
        viewports: config.designViewportsList,
        timeoutMs: config.timeoutMs,
      });
    }
  }

  const axeViolationCount = axe.enabled ? axe.violationCount ?? 0 : 0;
  const score = designScore(designMetrics, axeViolationCount);
  const failedClicks = buttonChecks.filter((entry) => entry.outcome === "failed");

  await page.close();

  return {
    url: pageUrl,
    status,
    navigationError,
    consoleMessages,
    pageErrors,
    requestFailures,
    linksDiscovered: links.length,
    linksTested: linkChecks.length,
    linkChecks,
    brokenLinks,
    buttonChecks,
    failedClicks: failedClicks.length,
    designMetrics,
    designScore: score.score,
    designGrade: score.grade,
    axe,
    screenshot,
    designViewportScreenshots,
    linkOpenMode: config.linkOpenMode,
  };
}

async function runWorker(config) {
  const urls = await readJson(config.urlsFile);
  const subset = urls.filter((_, index) => index % config.totalWorkers === config.workerId);

  const playwright = await importPlaywright();
  const browserType = playwright[config.browser];
  if (!browserType) {
    throw new Error(`Unsupported browser: ${config.browser}`);
  }

  await ensureDir(path.join(config.outDir, "raw"));
  await ensureDir(path.join(config.outDir, "screenshots"));

  const browser = await browserType.launch({
    headless: !config.headed,
  });
  const context = await browser.newContext({
    ignoreHTTPSErrors: true,
    viewport: { width: 1440, height: 900 },
  });

  const results = [];
  for (let i = 0; i < subset.length; i += 1) {
    const pageUrl = subset[i];
    let result;

    try {
      result = await auditPage(context, pageUrl, config);
    } catch (error) {
      result = emptyAuditResult(pageUrl, "audit_failed", safeError(error));
    }

    results.push(result);
    console.log(
      `[worker ${config.workerId}] ${i + 1}/${subset.length} ${result.url} -> ${result.status} score=${result.designScore}`,
    );
  }

  await context.close();
  await browser.close();

  const outputFile = path.join(config.outDir, "raw", `worker-${config.workerId}.json`);
  await writeJson(outputFile, results);
}

function spawnWorkerProcess(config, workerId, totalWorkers, urlsFile) {
  return new Promise((resolve, reject) => {
    const args = [
      __filename,
      "--worker-mode",
      "--url",
      config.url,
      "--out-dir",
      config.outDir,
      "--browser",
      config.browser,
      "--timeout-ms",
      String(config.timeoutMs),
      "--max-actions-per-page",
      String(config.maxActionsPerPage),
      "--max-links-per-page",
      String(config.maxLinksPerPage),
      "--action-workers",
      String(config.actionWorkers),
      "--link-workers",
      String(config.linkWorkers),
      "--link-open-mode",
      String(config.linkOpenMode),
      "--design-viewports",
      String(config.designViewports),
      "--urls-file",
      urlsFile,
      "--worker-id",
      String(workerId),
      "--total-workers",
      String(totalWorkers),
    ];

    if (config.headed) {
      args.push("--headed");
    }
    if (config.allowExternal) {
      args.push("--allow-external");
    }
    if (!config.axe) {
      args.push("--no-axe");
    }
    if (!config.lighthouse) {
      args.push("--no-lighthouse");
    }
    if (config.designZeugnis) {
      args.push("--design-zeugnis");
    } else {
      args.push("--no-design-zeugnis");
    }

    const child = spawn(process.execPath, args, {
      env: process.env,
      stdio: ["ignore", "pipe", "pipe"],
    });

    child.stdout.on("data", (data) => {
      process.stdout.write(`[worker:${workerId}] ${data}`);
    });
    child.stderr.on("data", (data) => {
      process.stderr.write(`[worker:${workerId}] ${data}`);
    });

    child.on("close", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Worker ${workerId} exited with code ${code}`));
      }
    });
  });
}

async function loadWorkerResults(outDir, totalWorkers) {
  const all = [];
  for (let i = 0; i < totalWorkers; i += 1) {
    const file = path.join(outDir, "raw", `worker-${i}.json`);
    try {
      const rows = await readJson(file);
      all.push(...rows);
    } catch {
      // ignore missing files; failures are tracked separately
    }
  }
  return all;
}

async function runLighthouse(url, outDir) {
  const lighthouseDir = path.join(outDir, "lighthouse");
  await ensureDir(lighthouseDir);
  const targetFile = path.join(lighthouseDir, `${hashText(url)}.json`);

  const commandResult = await runCommand("npx", [
    "--yes",
    "lighthouse",
    url,
    "--quiet",
    "--chrome-flags=--headless=new --no-sandbox",
    "--only-categories=performance,accessibility,best-practices,seo",
    "--output=json",
    "--output-path",
    targetFile,
  ]);

  if (commandResult.code !== 0) {
    return {
      url,
      status: "failed",
      error: commandResult.stderr.trim().slice(0, 600) || "lighthouse command failed",
    };
  }

  try {
    const payload = await readJson(targetFile);
    return {
      url,
      status: "ok",
      file: targetFile,
      scores: {
        performance: toPct(payload.categories?.performance?.score),
        accessibility: toPct(payload.categories?.accessibility?.score),
        bestPractices: toPct(payload.categories?.["best-practices"]?.score),
        seo: toPct(payload.categories?.seo?.score),
      },
      vitals: {
        lcpMs: Math.round(Number(payload.audits?.["largest-contentful-paint"]?.numericValue ?? 0)),
        inpMs: Math.round(Number(payload.audits?.["interaction-to-next-paint"]?.numericValue ?? 0)),
        cls: Number(payload.audits?.["cumulative-layout-shift"]?.numericValue ?? 0),
      },
    };
  } catch (error) {
    return {
      url,
      status: "failed",
      error: `unable to parse lighthouse output: ${safeError(error)}`,
    };
  }
}

function summarize(pages, lighthouseResults, config, discoveredCount, workerFailures) {
  const totalConsoleIssues = pages.reduce((sum, page) => sum + page.consoleMessages.length, 0);
  const totalPageErrors = pages.reduce((sum, page) => sum + page.pageErrors.length, 0);
  const totalRequestFailures = pages.reduce((sum, page) => sum + page.requestFailures.length, 0);
  const totalBrokenLinks = pages.reduce((sum, page) => sum + page.brokenLinks.length, 0);
  const totalLinksDiscovered = pages.reduce((sum, page) => sum + page.linksDiscovered, 0);
  const totalLinksTested = pages.reduce((sum, page) => sum + page.linksTested, 0);
  const totalFailedClicks = pages.reduce((sum, page) => sum + page.failedClicks, 0);
  const totalAxeViolations = pages.reduce(
    (sum, page) => sum + (page.axe.enabled ? page.axe.violationCount ?? 0 : 0),
    0,
  );
  const totalAuditFailures = pages.filter((page) => page.status !== "ok").length;
  const avgDesignScore = Math.round(avg(pages.map((page) => page.designScore)));

  const lighthouseOk = lighthouseResults.filter((entry) => entry.status === "ok");
  const lighthouseAverages = {
    performance: Math.round(avg(lighthouseOk.map((entry) => entry.scores.performance ?? 0))),
    accessibility: Math.round(avg(lighthouseOk.map((entry) => entry.scores.accessibility ?? 0))),
    bestPractices: Math.round(avg(lighthouseOk.map((entry) => entry.scores.bestPractices ?? 0))),
    seo: Math.round(avg(lighthouseOk.map((entry) => entry.scores.seo ?? 0))),
  };

  const recommendations = [];
  if (workerFailures > 0) {
    recommendations.push("Some worker processes failed; rerun with fewer workers to isolate unstable pages.");
  }
  if (totalAuditFailures > 0) {
    recommendations.push("Resolve navigation/audit failures before trusting PASS status.");
  }
  if (totalConsoleIssues > 0 || totalPageErrors > 0) {
    recommendations.push("Fix runtime JavaScript errors and console warnings first.");
  }
  if (totalBrokenLinks > 0) {
    recommendations.push("Repair broken links and failing endpoints.");
  }
  if (totalAxeViolations > 0) {
    recommendations.push("Prioritize accessibility violations (axe) with serious/critical impact.");
  }
  if (avgDesignScore < 75) {
    recommendations.push("Improve visual consistency, touch target sizes, and layout stability.");
  }
  if (lighthouseOk.length > 0 && lighthouseAverages.bestPractices < 90) {
    recommendations.push("Raise Lighthouse best-practices score to at least 90.");
  }
  if (recommendations.length === 0) {
    recommendations.push("No critical findings. Re-run after major UI changes.");
  }

  let overall = "PASS";
  if (
    workerFailures > 0 ||
    totalAuditFailures > 0 ||
    totalPageErrors > 0 ||
    totalBrokenLinks > 0 ||
    totalAxeViolations > 0 ||
    avgDesignScore < 60
  ) {
    overall = "FAIL";
  } else if (
    totalConsoleIssues > 0 ||
    totalRequestFailures > 0 ||
    totalFailedClicks > 0 ||
    avgDesignScore < 80
  ) {
    overall = "WARN";
  }

  return {
    generatedAt: new Date().toISOString(),
    target: config.url,
    settings: {
      workers: config.workers,
      maxPages: config.maxPages,
      maxDepth: config.maxDepth,
      maxActionsPerPage: config.maxActionsPerPage,
      maxLinksPerPage: config.maxLinksPerPage,
      actionWorkers: config.actionWorkers,
      linkWorkers: config.linkWorkers,
      linkOpenMode: config.linkOpenMode,
      timeoutMs: config.timeoutMs,
      browser: config.browser,
      axe: config.axe,
      lighthouse: config.lighthouse,
      allowExternal: config.allowExternal,
      designZeugnis: config.designZeugnis,
      designLlmRequired: config.designLlmRequired,
      designJuryMode: config.designJuryMode,
      designCodexJudgeMode: config.designCodexJudgeMode,
      designCodexCliBin: config.designCodexCliBin,
      designCodexModel: config.designCodexModel,
      designCodexTimeoutMs: config.designCodexTimeoutMs,
      designCodexAttempts: config.designCodexAttempts,
      designQwenModel: config.designQwenModel,
      designQwenBaseUrl: config.designQwenBaseUrl,
      designQwenEndpoint: config.designQwenEndpoint,
      designQwenAttempts: config.designQwenAttempts,
      designFusionMode: config.designFusionMode,
      designTone: config.designTone,
      designViewports: config.designViewports,
      designMinScoreFail: config.designMinScoreFail,
      designMaxEvidenceImages: config.designMaxEvidenceImages,
      designCodexMaxEvidenceImages: config.designCodexMaxEvidenceImages,
      designQwenMaxEvidenceImages: config.designQwenMaxEvidenceImages,
      designCodexJudgeFile: config.designCodexJudgeFile,
      designBrandRulesFile: config.designBrandRulesFile,
    },
    totals: {
      discoveredPages: discoveredCount,
      auditedPages: pages.length,
      auditFailures: totalAuditFailures,
      workerFailures,
      linksDiscovered: totalLinksDiscovered,
      linksTested: totalLinksTested,
      runtimeConsoleIssues: totalConsoleIssues,
      pageErrors: totalPageErrors,
      requestFailures: totalRequestFailures,
      brokenLinks: totalBrokenLinks,
      failedClicks: totalFailedClicks,
      axeViolations: totalAxeViolations,
      avgDesignScore,
    },
    lighthouse: {
      sampledPages: lighthouseResults.length,
      successfulRuns: lighthouseOk.length,
      averages: lighthouseAverages,
      results: lighthouseResults,
    },
    overall,
    recommendations,
    pages,
  };
}

function markdownReport(summary) {
  const lines = [];
  lines.push("# Browser Crash Test Report");
  lines.push("");
  lines.push(`- Generated: ${summary.generatedAt}`);
  lines.push(`- Target: ${summary.target}`);
  lines.push(`- Overall: **${summary.overall}**`);
  if (summary.designZeugnis) {
    lines.push(
      `- Design Zeugnis: **${summary.designZeugnis.overallVerdict}** (${summary.designZeugnis.overallScore}/1000, ${summary.designZeugnis.grade})`,
    );
  }
  lines.push("");
  lines.push("## Totals");
  lines.push("");
  lines.push(`- Discovered pages: ${summary.totals.discoveredPages}`);
  lines.push(`- Audited pages: ${summary.totals.auditedPages}`);
  lines.push(`- Audit failures: ${summary.totals.auditFailures}`);
  lines.push(`- Worker failures: ${summary.totals.workerFailures}`);
  lines.push(`- Links discovered: ${summary.totals.linksDiscovered}`);
  lines.push(`- Links tested: ${summary.totals.linksTested} (${summary.settings.linkOpenMode})`);
  lines.push(`- Console issues: ${summary.totals.runtimeConsoleIssues}`);
  lines.push(`- Page errors: ${summary.totals.pageErrors}`);
  lines.push(`- Request failures: ${summary.totals.requestFailures}`);
  lines.push(`- Broken links: ${summary.totals.brokenLinks}`);
  lines.push(`- Failed clicks: ${summary.totals.failedClicks}`);
  lines.push(`- Axe violations: ${summary.totals.axeViolations}`);
  lines.push(`- Avg design score: ${summary.totals.avgDesignScore}`);
  lines.push("");
  lines.push("## Lighthouse");
  lines.push("");
  lines.push(`- Sampled pages: ${summary.lighthouse.sampledPages}`);
  lines.push(`- Successful runs: ${summary.lighthouse.successfulRuns}`);
  lines.push(
    `- Avg scores: perf ${summary.lighthouse.averages.performance}, a11y ${summary.lighthouse.averages.accessibility}, best-practices ${summary.lighthouse.averages.bestPractices}, seo ${summary.lighthouse.averages.seo}`,
  );
  lines.push("");
  lines.push("## Top Findings");
  lines.push("");
  for (const item of summary.recommendations) {
    lines.push(`- ${item}`);
  }
  lines.push("");
  lines.push("## Pages");
  lines.push("");
  lines.push("| URL | Status | Design | Links Tested | Broken Links | Failed Clicks | Console |");
  lines.push("| --- | --- | ---: | ---: | ---: | ---: | ---: |");
  for (const page of summary.pages.slice(0, 80)) {
    lines.push(
      `| ${page.url} | ${page.status} | ${page.designScore} (${page.designGrade}) | ${page.linksTested} | ${page.brokenLinks.length} | ${page.failedClicks} | ${page.consoleMessages.length} |`,
    );
  }
  lines.push("");
  lines.push("_For full detail, inspect report.json and raw worker files._");
  return `${lines.join("\n")}\n`;
}

function codexJudgeTemplatePayload({
  evidenceIndex,
  deterministicJudge,
}) {
  const templateFindings = deterministicJudge.findings.slice(0, 4).map((entry) => ({
    severity: entry.severity,
    pillar: entry.pillar,
    title: entry.title,
    evidence: `Refer to evidence image path(s) and visual detail. Candidate: ${entry.evidence}`,
    whyItMatters: entry.whyItMatters,
    fix: entry.fix,
    standardRef: entry.standardRef,
    confidence: entry.confidence,
  }));

  return {
    judgeVerdict: "WARN",
    judgeScore: 700,
    summary: "Replace this template with codex-app visual judgement.",
    hardFailReasons: [],
    confidence: 0.8,
    findings: templateFindings,
    evidenceIndex: evidenceIndex.map((entry, index) => ({
      evidenceId: `E${index + 1}`,
      url: entry.url,
      viewport: entry.viewport,
      path: entry.path,
    })),
  };
}

function codexJudgeInstructions({
  evidenceIndex,
  deterministicJudge,
}) {
  const lines = [];
  lines.push("# Codex Chat Visual Judge Instructions");
  lines.push("");
  lines.push("1. Open each evidence image in the current Codex chat and inspect visual quality skeptically.");
  lines.push("2. Evaluate hierarchy, spacing rhythm, typography discipline, component consistency, and premium finish.");
  lines.push("3. Write strict JSON to `design-judge-codex.json` using the required schema.");
  lines.push("4. Use `P0` for release blockers.");
  lines.push("5. Keep tone hard and professional (no insults).");
  lines.push("");
  lines.push("## Evidence");
  lines.push("");
  for (let i = 0; i < evidenceIndex.length; i += 1) {
    const entry = evidenceIndex[i];
    lines.push(`- E${i + 1}: ${entry.url} @ ${entry.viewport} -> ${entry.path}`);
  }
  lines.push("");
  lines.push("## Embedded Evidence (for Codex Chat)");
  lines.push("");
  lines.push("If your Codex chat renders local-image Markdown, inspect each image inline below.");
  lines.push("If not, open each absolute path manually and keep the same E1..En ordering.");
  lines.push("");
  for (let i = 0; i < evidenceIndex.length; i += 1) {
    const entry = evidenceIndex[i];
    lines.push(`### E${i + 1} (${entry.viewport})`);
    lines.push(`Source: ${entry.url}`);
    lines.push(`![E${i + 1}](${entry.path})`);
    lines.push("");
  }
  lines.push("");
  lines.push("## Deterministic Baseline");
  lines.push("");
  lines.push(`- Verdict: ${deterministicJudge.judgeVerdict}`);
  lines.push(`- Score: ${deterministicJudge.judgeScore}`);
  lines.push(`- Grade: ${deterministicJudge.grade}`);
  lines.push("");
  lines.push("## Output Contract");
  lines.push("");
  lines.push("Use this exact schema:");
  lines.push("");
  lines.push("```json");
  lines.push(
    JSON.stringify(
      {
        judgeVerdict: "PASS|WARN|FAIL",
        judgeScore: 0,
        summary: "...",
        hardFailReasons: ["..."],
        confidence: 0.0,
        findings: [
          {
            id: "optional",
            severity: "P0|P1|P2|P3",
            pillar:
              "Accessibility & Compliance|Visual System Discipline|Interaction & Usability|Performance & Runtime Quality|Premium Aesthetic Coherence",
            title: "...",
            evidence: "...",
            whyItMatters: "...",
            fix: "...",
            standardRef: "https://...",
            confidence: 0.0,
          },
        ],
      },
      null,
      2,
    ),
  );
  lines.push("```");
  lines.push("");
  return `${lines.join("\n")}\n`;
}

async function loadCodexJudgeFromFile({
  config,
  outDir,
  evidenceIndex,
  deterministicJudge,
}) {
  const configuredPath = String(config.designCodexJudgeFile || "").trim();
  const candidatePath = configuredPath || path.join(outDir, "design-judge-codex.json");

  try {
    const payload = await readJson(candidatePath);
    return validateAndNormalizeJudgePayload(payload, "codex_app", { strict: true });
  } catch {
    const template = codexJudgeTemplatePayload({ evidenceIndex, deterministicJudge });
    const templateJsonPath = path.join(outDir, "design-judge-codex.template.json");
    const templateMdPath = path.join(outDir, "design-judge-codex.instructions.md");
    await writeJson(templateJsonPath, template);
    await fs.writeFile(
      templateMdPath,
      codexJudgeInstructions({ evidenceIndex, deterministicJudge }),
      "utf8",
    );

    const message = [
      "Codex visual judge JSON was not found.",
      `Expected: ${candidatePath}`,
      `Template created: ${templateJsonPath}`,
      `Instructions created: ${templateMdPath}`,
    ].join(" ");

    if (config.designLlmRequired) {
      return makeFailureJudgePayload("codex_app", message);
    }

    return validateAndNormalizeJudgePayload(
      {
        judgeVerdict: "WARN",
        judgeScore: deterministicJudge.judgeScore,
        summary: message,
        hardFailReasons: [],
        confidence: 0.5,
        findings: [],
      },
      "codex_app",
    );
  }
}

async function resolveCodexJudge({
  config,
  outDir,
  evidenceIndex,
  deterministicJudge,
  brandRulesText,
}) {
  const mode = String(config.designCodexJudgeMode || "auto").toLowerCase();

  const errors = [];

  if (mode === "exec" || mode === "auto") {
    try {
      return await runCodexAppJudge({
        evidenceIndex,
        deterministicJudge,
        config,
        brandRulesText,
      });
    } catch (error) {
      const message = `codex exec failed: ${safeError(error)}`;
      if (mode === "exec") {
        throw new Error(message);
      }
      errors.push(message);
    }
  }

  if (mode === "file" || mode === "chat" || mode === "auto") {
    const fileJudge = await loadCodexJudgeFromFile({
      config,
      outDir,
      evidenceIndex,
      deterministicJudge,
    });

    if (errors.length === 0) {
      return fileJudge;
    }

    return {
      ...fileJudge,
      summary: `${errors.join(" | ")} ${fileJudge.summary}`.trim(),
      hardFailReasons: [...new Set([...(fileJudge.hardFailReasons || []), ...errors])],
    };
  }

  throw new Error(`Unsupported codex judge mode: ${mode}`);
}

function toNdjson(rows) {
  return `${rows.map((entry) => JSON.stringify(entry)).join("\n")}\n`;
}

async function runDesignZeugnis({
  config,
  outDir,
  pages,
  lighthouseResults,
  summary,
}) {
  const evidenceIndex = buildEvidenceIndex(pages, config.designMaxEvidenceImages);
  const codexEvidenceIndex = evidenceIndex.slice(
    0,
    Math.max(1, Math.min(config.designCodexMaxEvidenceImages, evidenceIndex.length)),
  );
  const qwenEvidenceIndex = evidenceIndex.slice(
    0,
    Math.max(1, Math.min(config.designQwenMaxEvidenceImages, evidenceIndex.length)),
  );
  const deterministicJudge = generateDeterministicJudge({
    pages,
    lighthouseResults,
    minScoreFail: config.designMinScoreFail,
  });
  let brandRulesText = "";
  if (config.designBrandRulesFile) {
    try {
      const raw = await fs.readFile(path.resolve(config.designBrandRulesFile), "utf8");
      brandRulesText = raw.slice(0, 8000);
    } catch {
      brandRulesText = "";
    }
  }

  let codexJudge;
  try {
    codexJudge = await resolveCodexJudge({
      config,
      outDir,
      evidenceIndex: codexEvidenceIndex,
      deterministicJudge,
      brandRulesText,
    });
  } catch (error) {
    const message = `Codex judge error: ${safeError(error)}`;
    if (config.designLlmRequired) {
      codexJudge = makeFailureJudgePayload("codex_app", message);
    } else {
      codexJudge = validateAndNormalizeJudgePayload(
        {
          judgeVerdict: "WARN",
          judgeScore: deterministicJudge.judgeScore,
          summary: message,
          hardFailReasons: [],
          confidence: 0.5,
          findings: [],
        },
        "codex_app",
      );
    }
  }

  let qwenJudge;
  try {
    qwenJudge = await runQwenJudge({
      evidenceIndex: qwenEvidenceIndex,
      deterministicJudge,
      config,
      brandRulesText,
    });
  } catch (error) {
    const message = `Qwen judge error: ${safeError(error)}`;
    if (config.designLlmRequired) {
      qwenJudge = makeFailureJudgePayload("qwen_nim", message);
    } else {
      qwenJudge = validateAndNormalizeJudgePayload(
        {
          judgeVerdict: "WARN",
          judgeScore: deterministicJudge.judgeScore,
          summary: message,
          hardFailReasons: [],
          confidence: 0.5,
          findings: [],
        },
        "qwen_nim",
      );
    }
  }

  const fused = fuseDualModelJudges({
    deterministicJudge,
    codexJudge,
    qwenJudge,
    minScoreFail: config.designMinScoreFail,
    fusionMode: config.designFusionMode,
  });

  const payload = {
    generatedAt: new Date().toISOString(),
    tone: config.designTone,
    overallVerdict: fused.overallVerdict,
    overallScore: fused.overallScore,
    grade: fused.grade,
    hardFailReasons: fused.hardFailReasons,
    judgeDeterministic: fused.judgeDeterministic,
    judgeCodex: fused.judgeCodex,
    judgeQwenNim: fused.judgeQwenNim,
    fusion: fused.fusion,
    findings: fused.findings,
    evidenceIndex,
    judgeEvidence: {
      codexCount: codexEvidenceIndex.length,
      qwenCount: qwenEvidenceIndex.length,
      totalCaptured: evidenceIndex.length,
    },
  };

  const designZeugnisPath = path.join(outDir, "design-zeugnis.json");
  const designZeugnisMdPath = path.join(outDir, "design-zeugnis.md");
  const codexJudgePath = path.join(outDir, "design-judge-codex.json");
  const qwenJudgePath = path.join(outDir, "design-judge-qwen.json");
  const ndjsonPath = path.join(outDir, "design-findings.ndjson");

  await writeJson(designZeugnisPath, payload);
  await fs.writeFile(designZeugnisMdPath, renderDesignZeugnisMarkdown(payload), "utf8");
  await writeJson(codexJudgePath, codexJudge);
  await writeJson(qwenJudgePath, qwenJudge);
  await fs.writeFile(ndjsonPath, toNdjson(payload.findings), "utf8");

  summary.designZeugnis = {
    overallVerdict: payload.overallVerdict,
    overallScore: payload.overallScore,
    grade: payload.grade,
    hardFailReasons: payload.hardFailReasons,
    judgeDeterministic: payload.judgeDeterministic,
    judgeCodex: payload.judgeCodex,
    judgeQwenNim: payload.judgeQwenNim,
    fusion: payload.fusion,
    findings: payload.findings,
    evidenceIndex: payload.evidenceIndex,
    judgeEvidence: payload.judgeEvidence,
  };
  summary.overall = mergeOverallVerdict(summary.overall, payload.overallVerdict);
  summary.recommendations.unshift(
    payload.overallVerdict === "FAIL"
      ? "Dual-model design jury failed. Resolve design zeugnis hard findings before release."
      : "Dual-model design jury completed. Review design-zeugnis.md before release.",
  );
  if (/JSON was not found/i.test(String(codexJudge?.summary || ""))) {
    summary.recommendations.unshift(
      `Complete Codex chat judge JSON at ${path.join(outDir, "design-judge-codex.json")} and rerun.`,
    );
  }

  return {
    designZeugnisPath,
    designZeugnisMdPath,
    codexJudgePath,
    qwenJudgePath,
    ndjsonPath,
    payload,
  };
}

async function runCoordinator(config) {
  if (!config.url) {
    throw new Error("Missing required argument: --url");
  }

  const start = Date.now();
  await ensureDir(config.outDir);
  await ensureDir(path.join(config.outDir, "raw"));
  await ensureDir(path.join(config.outDir, "screenshots"));

  console.log(`[info] Discovering URLs from ${config.url}`);
  const discoveredUrls = await discoverUrls(config);
  if (discoveredUrls.length === 0) {
    throw new Error("No pages discovered. Verify the URL and app availability.");
  }
  await writeJson(path.join(config.outDir, "discovered-urls.json"), discoveredUrls);
  console.log(`[info] Discovered ${discoveredUrls.length} pages`);

  const workerCount = Math.min(config.workers, discoveredUrls.length);
  const urlsFile = path.join(config.outDir, "discovered-urls.json");

  console.log(`[info] Launching ${workerCount} worker processes`);
  const workerSettled = await Promise.allSettled(
    Array.from({ length: workerCount }, (_, index) =>
      spawnWorkerProcess(config, index, workerCount, urlsFile),
    ),
  );
  const workerFailures = workerSettled.filter((entry) => entry.status === "rejected").length;
  if (workerFailures > 0) {
    console.warn(`[warn] ${workerFailures}/${workerCount} workers failed`);
  }

  const pages = await loadWorkerResults(config.outDir, workerCount);
  pages.sort((left, right) => left.url.localeCompare(right.url));

  if (pages.length === 0) {
    throw new Error("No page results produced by workers.");
  }

  let lighthouseResults = [];
  if (config.lighthouse) {
    const sampleUrls = pages
      .filter((entry) => entry.status === "ok")
      .slice(0, config.lighthousePages)
      .map((entry) => entry.url);

    if (sampleUrls.length > 0) {
      console.log(`[info] Running Lighthouse on ${sampleUrls.length} sampled pages`);
      lighthouseResults = await mapLimit(sampleUrls, 2, async (sampleUrl) =>
        runLighthouse(sampleUrl, config.outDir),
      );
    }
  }

  const summary = summarize(
    pages,
    lighthouseResults,
    config,
    discoveredUrls.length,
    workerFailures,
  );
  summary.durationSeconds = Math.round((Date.now() - start) / 1000);

  let designArtifacts = null;
  if (config.designZeugnis) {
    console.log("[info] Running dual-model design zeugnis (codex_app + qwen_nim)");
    designArtifacts = await runDesignZeugnis({
      config,
      outDir: config.outDir,
      pages,
      lighthouseResults,
      summary,
    });
  }

  const jsonReportPath = path.join(config.outDir, "report.json");
  const mdReportPath = path.join(config.outDir, "report.md");
  await writeJson(jsonReportPath, summary);
  await fs.writeFile(mdReportPath, markdownReport(summary), "utf8");

  console.log(`[done] Overall: ${summary.overall}`);
  console.log(`[done] Report: ${mdReportPath}`);
  console.log(`[done] JSON: ${jsonReportPath}`);
  if (designArtifacts) {
    console.log(`[done] Design Zeugnis: ${designArtifacts.designZeugnisMdPath}`);
    console.log(`[done] Design JSON: ${designArtifacts.designZeugnisPath}`);
    console.log(`[done] Judge Codex JSON: ${designArtifacts.codexJudgePath}`);
    console.log(`[done] Judge Qwen JSON: ${designArtifacts.qwenJudgePath}`);
    console.log(`[done] Findings NDJSON: ${designArtifacts.ndjsonPath}`);
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    printUsage();
    return;
  }

  if (args.workerMode) {
    if (!args.urlsFile) {
      throw new Error("Worker mode requires --urls-file");
    }
    await runWorker(args);
    return;
  }

  await runCoordinator(args);
}

main().catch((error) => {
  console.error(`[fatal] ${safeError(error)}`);
  process.exit(1);
});
