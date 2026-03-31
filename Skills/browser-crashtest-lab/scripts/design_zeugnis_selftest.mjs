#!/usr/bin/env node

import assert from "node:assert/strict";
import { fuseDualModelJudges } from "./design_fusion.mjs";
import {
  extractJsonObject,
  makeFailureJudgePayload,
  validateAndNormalizeJudgePayload,
} from "./design_judge_schema.mjs";

function judge({
  sourceJudge,
  verdict = "PASS",
  score = 950,
  findings = [],
  hardFailReasons = [],
}) {
  return validateAndNormalizeJudgePayload(
    {
      judgeVerdict: verdict,
      judgeScore: score,
      summary: `${sourceJudge} summary`,
      hardFailReasons,
      confidence: 0.9,
      findings,
    },
    sourceJudge,
  );
}

function fuse({
  deterministic = judge({ sourceJudge: "deterministic_engine", verdict: "PASS", score: 960 }),
  codex = judge({ sourceJudge: "codex_app", verdict: "PASS", score: 960 }),
  qwen = judge({ sourceJudge: "qwen_nim", verdict: "PASS", score: 960 }),
  minScoreFail = 920,
}) {
  return fuseDualModelJudges({
    deterministicJudge: deterministic,
    codexJudge: codex,
    qwenJudge: qwen,
    minScoreFail,
    fusionMode: "union",
  });
}

function run() {
  {
    const result = fuse({});
    assert.equal(result.overallVerdict, "PASS", "both model judges PASS should allow PASS");
  }

  {
    const result = fuse({
      codex: judge({ sourceJudge: "codex_app", verdict: "PASS", score: 960 }),
      qwen: judge({
        sourceJudge: "qwen_nim",
        verdict: "FAIL",
        score: 500,
        findings: [
          {
            severity: "P1",
            pillar: "Visual System Discipline",
            title: "Critical visual inconsistency",
            evidence: "E2",
            whyItMatters: "Trust signal loss",
            fix: "Unify styles",
            standardRef: "https://fluent2.microsoft.design/",
            confidence: 0.9,
          },
        ],
      }),
    });
    assert.equal(result.overallVerdict, "FAIL", "Qwen FAIL must force overall FAIL");
  }

  {
    const result = fuse({
      codex: judge({ sourceJudge: "codex_app", verdict: "FAIL", score: 400 }),
      qwen: judge({ sourceJudge: "qwen_nim", verdict: "PASS", score: 960 }),
    });
    assert.equal(result.overallVerdict, "FAIL", "Codex FAIL must force overall FAIL");
  }

  {
    const missingCodex = makeFailureJudgePayload("codex_app", "codex judge missing");
    const result = fuse({
      codex: missingCodex,
      qwen: judge({ sourceJudge: "qwen_nim", verdict: "PASS", score: 960 }),
    });
    assert.equal(result.overallVerdict, "FAIL", "missing codex judge must fail");
  }

  {
    const missingQwen = makeFailureJudgePayload("qwen_nim", "qwen judge missing");
    const result = fuse({
      codex: judge({ sourceJudge: "codex_app", verdict: "PASS", score: 960 }),
      qwen: missingQwen,
    });
    assert.equal(result.overallVerdict, "FAIL", "missing qwen judge must fail");
  }

  {
    assert.throws(
      () => extractJsonObject("not-json"),
      /JSON|object/i,
      "invalid JSON must throw",
    );
  }

  {
    const deterministicP0 = judge({
      sourceJudge: "deterministic_engine",
      verdict: "FAIL",
      score: 940,
      findings: [
        {
          severity: "P0",
          pillar: "Accessibility & Compliance",
          title: "Critical contrast failure",
          evidence: "E1",
          whyItMatters: "Unreadable content",
          fix: "Raise contrast to WCAG AA",
          standardRef: "https://www.w3.org/TR/WCAG22/",
          confidence: 0.95,
        },
      ],
      hardFailReasons: ["Deterministic engine found at least one P0 issue."],
    });
    const result = fuse({
      deterministic: deterministicP0,
      codex: judge({ sourceJudge: "codex_app", verdict: "PASS", score: 960 }),
      qwen: judge({ sourceJudge: "qwen_nim", verdict: "PASS", score: 960 }),
    });
    assert.equal(result.overallVerdict, "FAIL", "deterministic P0 must fail");
  }

  {
    const result = fuse({
      deterministic: judge({ sourceJudge: "deterministic_engine", verdict: "PASS", score: 955 }),
      codex: judge({ sourceJudge: "codex_app", verdict: "WARN", score: 940 }),
      qwen: judge({ sourceJudge: "qwen_nim", verdict: "PASS", score: 945 }),
      minScoreFail: 900,
    });
    assert.equal(result.overallVerdict, "WARN", "single WARN without P0 must produce WARN");
  }

  {
    const result = fuse({
      deterministic: judge({ sourceJudge: "deterministic_engine", verdict: "PASS", score: 890 }),
      codex: judge({ sourceJudge: "codex_app", verdict: "PASS", score: 900 }),
      qwen: judge({ sourceJudge: "qwen_nim", verdict: "PASS", score: 910 }),
      minScoreFail: 920,
    });
    assert.equal(result.overallVerdict, "FAIL", "score below threshold must fail");
  }

  {
    const payload = extractJsonObject('{"judgeVerdict":"PASS","judgeScore":955,"summary":"ok","hardFailReasons":[],"confidence":0.9,"findings":[]}');
    const normalized = validateAndNormalizeJudgePayload(payload, "codex_app");
    assert.equal(normalized.judgeVerdict, "PASS");
    assert.equal(normalized.judgeScore, 955);
  }

  {
    assert.throws(
      () =>
        validateAndNormalizeJudgePayload(
          {
            judgeVerdict: "PASS",
            judgeScore: 950,
            summary: "invalid schema sample",
            hardFailReasons: [],
            confidence: 0.9,
            findings: [{ title: "missing required fields" }],
          },
          "codex_app",
          { strict: true },
        ),
      /missing|required|invalid/i,
      "strict schema mode must reject malformed findings",
    );
  }

  {
    const normalized = validateAndNormalizeJudgePayload(
      {
        judgeVerdict: "PASS",
        judgeScore: 940,
        summary: "alias normalization",
        hardFailReasons: [],
        confidence: 0.9,
        findings: [
          {
            severity: "P2",
            pillar: "Performance & Runtime",
            title: "Alias pillar check",
            evidence: "E1",
            whyItMatters: "Consistent pillar naming is required",
            fix: "Normalize pillar names",
            standardRef: "internal:test",
            confidence: 0.8,
          },
        ],
      },
      "qwen_nim",
      { strict: true },
    );
    assert.equal(normalized.findings[0].pillar, "Performance & Runtime Quality");
  }

  console.log("design_zeugnis_selftest: PASS");
}

run();
