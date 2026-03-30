import crypto from "node:crypto";

const VERDICTS = new Set(["PASS", "WARN", "FAIL"]);
const SEVERITIES = new Set(["P0", "P1", "P2", "P3"]);
const PILLARS = new Set([
  "Accessibility & Compliance",
  "Visual System Discipline",
  "Interaction & Usability",
  "Performance & Runtime Quality",
  "Premium Aesthetic Coherence",
]);
const PILLAR_ALIASES = new Map([
  ["Accessibility & Compliance", "Accessibility & Compliance"],
  ["Visual System Discipline", "Visual System Discipline"],
  ["Interaction & Usability", "Interaction & Usability"],
  ["Performance & Runtime", "Performance & Runtime Quality"],
  ["Performance & Runtime Quality", "Performance & Runtime Quality"],
  ["Premium Aesthetic Coherence", "Premium Aesthetic Coherence"],
]);
const STRICT_TOP_LEVEL_FIELDS = new Set([
  "judgeVerdict",
  "judgeScore",
  "summary",
  "hardFailReasons",
  "confidence",
  "findings",
]);
const STRICT_REQUIRED_TOP_LEVEL_FIELDS = [
  "judgeVerdict",
  "judgeScore",
  "summary",
  "hardFailReasons",
  "confidence",
  "findings",
];
const STRICT_FINDING_FIELDS = new Set([
  "id",
  "severity",
  "pillar",
  "title",
  "evidence",
  "whyItMatters",
  "fix",
  "standardRef",
  "confidence",
]);
const STRICT_REQUIRED_FINDING_FIELDS = [
  "severity",
  "pillar",
  "title",
  "evidence",
  "whyItMatters",
  "fix",
  "standardRef",
  "confidence",
];

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function asString(value, fallback = "") {
  if (typeof value === "string") {
    return value.trim();
  }
  if (value === undefined || value === null) {
    return fallback;
  }
  return String(value).trim();
}

function asNumber(value, fallback = 0) {
  const parsed = Number(value);
  if (Number.isNaN(parsed)) {
    return fallback;
  }
  return parsed;
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function normalizeVerdict(value, fallback = "WARN") {
  const verdict = asString(value, fallback).toUpperCase();
  if (!VERDICTS.has(verdict)) {
    return fallback;
  }
  return verdict;
}

function normalizeSeverity(value, fallback = "P2") {
  const severity = asString(value, fallback).toUpperCase();
  if (!SEVERITIES.has(severity)) {
    return fallback;
  }
  return severity;
}

function normalizePillar(value, fallback = "Visual System Discipline") {
  const pillar = asString(value, fallback);
  const mapped = PILLAR_ALIASES.get(pillar);
  if (mapped && PILLARS.has(mapped)) {
    return mapped;
  }

  if (!fallback) {
    return "";
  }
  const fallbackMapped = PILLAR_ALIASES.get(asString(fallback));
  if (fallbackMapped && PILLARS.has(fallbackMapped)) {
    return fallbackMapped;
  }
  return fallback;
}

function normalizeStringList(value) {
  if (Array.isArray(value)) {
    return value.map((entry) => asString(entry)).filter(Boolean);
  }
  const single = asString(value);
  if (!single) {
    return [];
  }
  return [single];
}

function stableId(sourceJudge, title, index) {
  return `${sourceJudge}-${index + 1}-${crypto
    .createHash("sha1")
    .update(`${sourceJudge}:${title}:${index}`)
    .digest("hex")
    .slice(0, 8)}`;
}

function assertFiniteNumberInRange(value, label, min, max) {
  const number = Number(value);
  assert(Number.isFinite(number), `${label} must be a finite number`);
  assert(number >= min && number <= max, `${label} must be between ${min} and ${max}`);
}

function validateStrictFinding(finding, index, sourceJudge) {
  const prefix = `Invalid finding at index ${index} for ${sourceJudge}`;
  assert(isPlainObject(finding), `${prefix}: must be an object`);

  for (const key of Object.keys(finding)) {
    assert(STRICT_FINDING_FIELDS.has(key), `${prefix}: unexpected field '${key}'`);
  }

  for (const key of STRICT_REQUIRED_FINDING_FIELDS) {
    assert(Object.prototype.hasOwnProperty.call(finding, key), `${prefix}: missing required field '${key}'`);
  }

  if (Object.prototype.hasOwnProperty.call(finding, "id")) {
    assert(asString(finding.id).length > 0, `${prefix}: id must be a non-empty string when provided`);
  }

  const severity = normalizeSeverity(finding.severity, "");
  assert(Boolean(severity), `${prefix}: severity must be one of P0|P1|P2|P3`);

  const pillar = normalizePillar(finding.pillar, "");
  assert(Boolean(pillar), `${prefix}: pillar is invalid`);

  assert(asString(finding.title).length > 0, `${prefix}: title must be a non-empty string`);
  assert(asString(finding.evidence).length > 0, `${prefix}: evidence must be a non-empty string`);
  assert(asString(finding.whyItMatters).length > 0, `${prefix}: whyItMatters must be a non-empty string`);
  assert(asString(finding.fix).length > 0, `${prefix}: fix must be a non-empty string`);
  assert(asString(finding.standardRef).length > 0, `${prefix}: standardRef must be a non-empty string`);
  assertFiniteNumberInRange(finding.confidence, `${prefix}: confidence`, 0, 1);
}

function validateStrictJudgePayload(payload, sourceJudge) {
  assert(isPlainObject(payload), `Invalid judge payload for ${sourceJudge}: must be an object`);

  for (const key of Object.keys(payload)) {
    assert(STRICT_TOP_LEVEL_FIELDS.has(key), `Invalid judge payload for ${sourceJudge}: unexpected field '${key}'`);
  }

  for (const key of STRICT_REQUIRED_TOP_LEVEL_FIELDS) {
    assert(Object.prototype.hasOwnProperty.call(payload, key), `Invalid judge payload for ${sourceJudge}: missing '${key}'`);
  }

  const verdict = normalizeVerdict(payload.judgeVerdict, "");
  assert(Boolean(verdict), `Invalid judge payload for ${sourceJudge}: judgeVerdict is invalid`);
  assertFiniteNumberInRange(payload.judgeScore, `Invalid judge payload for ${sourceJudge}: judgeScore`, 0, 1000);
  assert(
    asString(payload.summary).length > 0,
    `Invalid judge payload for ${sourceJudge}: summary must be a non-empty string`,
  );

  assert(
    Array.isArray(payload.hardFailReasons),
    `Invalid judge payload for ${sourceJudge}: hardFailReasons must be an array`,
  );
  for (let i = 0; i < payload.hardFailReasons.length; i += 1) {
    const value = asString(payload.hardFailReasons[i]);
    assert(value.length > 0, `Invalid judge payload for ${sourceJudge}: hardFailReasons[${i}] must be a non-empty string`);
  }

  assertFiniteNumberInRange(payload.confidence, `Invalid judge payload for ${sourceJudge}: confidence`, 0, 1);

  assert(
    Array.isArray(payload.findings),
    `Invalid judge payload for ${sourceJudge}: findings must be an array`,
  );
  payload.findings.forEach((entry, index) => {
    validateStrictFinding(entry, index, sourceJudge);
  });
}

export function extractJsonObject(rawText) {
  const text = asString(rawText);
  if (!text) {
    throw new Error("Judge output is empty");
  }

  let candidate = text;
  if (candidate.startsWith("```")) {
    candidate = candidate.replace(/^```[a-zA-Z0-9_-]*\n?/, "").replace(/\n?```$/, "");
  }

  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) {
    throw new Error("Judge output does not contain a JSON object");
  }

  const fragment = candidate.slice(start, end + 1);
  const parsed = JSON.parse(fragment);
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("Judge output JSON must be an object");
  }
  return parsed;
}

export function normalizeFinding(rawFinding, index, sourceJudge) {
  const finding = rawFinding && typeof rawFinding === "object" ? rawFinding : {};
  const title = asString(finding.title, `Untitled finding ${index + 1}`);
  const severity = normalizeSeverity(finding.severity, "P2");
  const pillar = normalizePillar(finding.pillar, "Visual System Discipline");
  const evidence = asString(finding.evidence, "No evidence provided");
  const whyItMatters = asString(finding.whyItMatters, "Impact not specified");
  const fix = asString(finding.fix, "No concrete fix provided");
  const standardRef = asString(finding.standardRef, "internal:design-review");
  const confidence = clamp(asNumber(finding.confidence, 0.7), 0, 1);

  return {
    id: asString(finding.id, stableId(sourceJudge, title, index)),
    severity,
    pillar,
    title,
    evidence,
    whyItMatters,
    fix,
    standardRef,
    sourceJudge,
    confidence: Number(confidence.toFixed(3)),
  };
}

export function validateAndNormalizeJudgePayload(payload, sourceJudge, options = {}) {
  const strict = Boolean(options.strict);

  if (strict) {
    validateStrictJudgePayload(payload, sourceJudge);
  }

  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new Error(`Invalid judge payload for ${sourceJudge}`);
  }

  const judgeVerdict = normalizeVerdict(payload.judgeVerdict ?? payload.verdict, "WARN");
  const judgeScore = clamp(Math.round(asNumber(payload.judgeScore ?? payload.score, 700)), 0, 1000);
  const summary = asString(payload.summary, "No summary provided.");
  const hardFailReasons = normalizeStringList(payload.hardFailReasons);
  const rawFindings = Array.isArray(payload.findings) ? payload.findings : [];
  const findings = rawFindings.map((entry, index) =>
    normalizeFinding(entry, index, sourceJudge),
  );
  const confidence = clamp(asNumber(payload.confidence, 0.75), 0, 1);

  return {
    sourceJudge,
    judgeVerdict,
    judgeScore,
    summary,
    hardFailReasons,
    findings,
    confidence: Number(confidence.toFixed(3)),
  };
}

export function makeFailureJudgePayload(sourceJudge, message) {
  return {
    sourceJudge,
    judgeVerdict: "FAIL",
    judgeScore: 0,
    summary: message,
    hardFailReasons: [message],
    findings: [
      {
        id: stableId(sourceJudge, "Judge unavailable", 0),
        severity: "P0",
        pillar: "Premium Aesthetic Coherence",
        title: "Judge unavailable",
        evidence: message,
        whyItMatters: "Dual-model jury cannot issue a trustworthy verdict when one required judge is missing.",
        fix: "Provide the missing judge output and rerun the audit.",
        standardRef: "internal:dual-jury-required",
        sourceJudge,
        confidence: 1,
      },
    ],
    confidence: 1,
  };
}
