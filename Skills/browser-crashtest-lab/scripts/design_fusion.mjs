function gradeFromScore(score) {
  if (score >= 960) return "A+";
  if (score >= 920) return "A";
  if (score >= 860) return "B";
  if (score >= 780) return "C";
  if (score >= 700) return "D";
  return "F";
}

function verdictRank(verdict) {
  if (verdict === "FAIL") return 2;
  if (verdict === "WARN") return 1;
  return 0;
}

function worstVerdict(a, b) {
  return verdictRank(a) >= verdictRank(b) ? a : b;
}

function normalizeFindings(findings, source) {
  if (!Array.isArray(findings)) {
    return [];
  }
  return findings.map((entry) => ({
    ...entry,
    sourceJudge: entry.sourceJudge || source,
  }));
}

export function fuseDualModelJudges({
  deterministicJudge,
  codexJudge,
  qwenJudge,
  minScoreFail,
  fusionMode,
}) {
  const hardFailReasons = [
    ...(deterministicJudge.hardFailReasons || []),
    ...(codexJudge.hardFailReasons || []),
    ...(qwenJudge.hardFailReasons || []),
  ];

  const findings = [
    ...normalizeFindings(deterministicJudge.findings, "deterministic_engine"),
    ...normalizeFindings(codexJudge.findings, "codex_app"),
    ...normalizeFindings(qwenJudge.findings, "qwen_nim"),
  ];

  if (findings.some((entry) => entry.severity === "P0")) {
    hardFailReasons.push("At least one P0 finding exists across the dual-model jury.");
  }

  const scores = [
    deterministicJudge.judgeScore,
    codexJudge.judgeScore,
    qwenJudge.judgeScore,
  ].filter((value) => Number.isFinite(value));
  const overallScore =
    scores.length > 0
      ? Math.round(scores.reduce((sum, value) => sum + value, 0) / scores.length)
      : 0;

  if (overallScore < minScoreFail) {
    hardFailReasons.push(
      `Overall dual-jury score ${overallScore} is below minimum fail threshold ${minScoreFail}.`,
    );
  }

  const baseVerdict = worstVerdict(
    deterministicJudge.judgeVerdict,
    worstVerdict(codexJudge.judgeVerdict, qwenJudge.judgeVerdict),
  );

  let overallVerdict = baseVerdict;
  if (hardFailReasons.length > 0) {
    overallVerdict = "FAIL";
  } else if (fusionMode === "union") {
    if (codexJudge.judgeVerdict === "FAIL" || qwenJudge.judgeVerdict === "FAIL") {
      overallVerdict = "FAIL";
    } else if (codexJudge.judgeVerdict === "WARN" || qwenJudge.judgeVerdict === "WARN") {
      overallVerdict = worstVerdict(overallVerdict, "WARN");
    }
  }

  const disagreement =
    codexJudge.judgeVerdict !== qwenJudge.judgeVerdict ||
    Math.abs((codexJudge.judgeScore ?? 0) - (qwenJudge.judgeScore ?? 0)) >= 120;

  return {
    overallVerdict,
    overallScore,
    grade: gradeFromScore(overallScore),
    hardFailReasons: [...new Set(hardFailReasons)],
    judgeDeterministic: deterministicJudge,
    judgeCodex: codexJudge,
    judgeQwenNim: qwenJudge,
    fusion: {
      mode: fusionMode,
      disagreement,
      judgeVotes: {
        deterministic: deterministicJudge.judgeVerdict,
        codex: codexJudge.judgeVerdict,
        qwen: qwenJudge.judgeVerdict,
      },
    },
    findings,
  };
}

export function renderDesignZeugnisMarkdown(payload) {
  const lines = [];
  lines.push("# Design Zeugnis");
  lines.push("");
  lines.push(`- Overall Verdict: **${payload.overallVerdict}**`);
  lines.push(`- Overall Score: **${payload.overallScore}/1000**`);
  lines.push(`- Grade: **${payload.grade}**`);
  lines.push(`- Fusion Mode: ${payload.fusion.mode}`);
  lines.push(`- Judge Votes: deterministic=${payload.fusion.judgeVotes.deterministic}, codex=${payload.fusion.judgeVotes.codex}, qwen=${payload.fusion.judgeVotes.qwen}`);
  lines.push(`- Disagreement: ${payload.fusion.disagreement ? "yes" : "no"}`);
  lines.push("");

  lines.push("## Hard Fail Reasons");
  lines.push("");
  if (payload.hardFailReasons.length === 0) {
    lines.push("- None");
  } else {
    for (const reason of payload.hardFailReasons) {
      lines.push(`- ${reason}`);
    }
  }
  lines.push("");

  lines.push("## Judge Summaries");
  lines.push("");
  lines.push(`- Deterministic: ${payload.judgeDeterministic.judgeVerdict} (${payload.judgeDeterministic.judgeScore})`);
  lines.push(`- Codex App: ${payload.judgeCodex.judgeVerdict} (${payload.judgeCodex.judgeScore})`);
  lines.push(`- Qwen NIM: ${payload.judgeQwenNim.judgeVerdict} (${payload.judgeQwenNim.judgeScore})`);
  lines.push("");

  lines.push("## Findings");
  lines.push("");
  lines.push("| Severity | Pillar | Source | Title | Evidence |");
  lines.push("| --- | --- | --- | --- | --- |");
  for (const finding of payload.findings.slice(0, 120)) {
    lines.push(
      `| ${finding.severity} | ${finding.pillar} | ${finding.sourceJudge} | ${finding.title.replace(/\|/g, "\\|")} | ${String(finding.evidence || "").replace(/\|/g, "\\|")} |`,
    );
  }

  lines.push("");
  lines.push("## Professoral Conclusion");
  lines.push("");
  if (payload.overallVerdict === "FAIL") {
    lines.push("The current design quality is not release-ready. Resolve all P0/P1 items and rerun dual-jury validation.");
  } else if (payload.overallVerdict === "WARN") {
    lines.push("The design shows progress but still contains material weaknesses that should be corrected before premium release.");
  } else {
    lines.push("The design meets the configured dual-jury quality bar under current evidence.");
  }

  return `${lines.join("\n")}\n`;
}
