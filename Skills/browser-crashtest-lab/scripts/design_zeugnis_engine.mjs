import { validateAndNormalizeJudgePayload } from "./design_judge_schema.mjs";

const PILLAR_WEIGHTS = {
  "Accessibility & Compliance": 280,
  "Visual System Discipline": 240,
  "Interaction & Usability": 210,
  "Performance & Runtime Quality": 170,
  "Premium Aesthetic Coherence": 100,
};

const SEVERITY_DEDUCTION = {
  P0: 120,
  P1: 45,
  P2: 10,
  P3: 3,
};

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function gradeFromScore(score) {
  if (score >= 960) return "A+";
  if (score >= 920) return "A";
  if (score >= 860) return "B";
  if (score >= 780) return "C";
  if (score >= 700) return "D";
  return "F";
}

function finding({
  severity,
  pillar,
  title,
  evidence,
  whyItMatters,
  fix,
  standardRef,
  confidence = 0.9,
}) {
  return {
    severity,
    pillar,
    title,
    evidence,
    whyItMatters,
    fix,
    standardRef,
    confidence,
  };
}

function lighthouseFinding(metric, value, threshold, title, severity) {
  return finding({
    severity,
    pillar: "Performance & Runtime Quality",
    title,
    evidence: `${metric}=${value} (threshold ${threshold})`,
    whyItMatters: "Poor core web vitals directly reduce perceived polish and trust.",
    fix: `Improve ${metric} below ${threshold} on core pages before release.`,
    standardRef: "https://web.dev/articles/vitals",
    confidence: 0.95,
  });
}

function evaluatePages(pages) {
  const findings = [];

  for (const page of pages) {
    const prefix = page.url;

    if (page.status !== "ok") {
      findings.push(
        finding({
          severity: "P0",
          pillar: "Performance & Runtime Quality",
          title: "Page navigation failure",
          evidence: `${prefix}: status=${page.status}; error=${page.navigationError ?? "n/a"}`,
          whyItMatters: "A page that cannot load invalidates all visual quality claims.",
          fix: "Stabilize routing/server errors so every audited page consistently renders.",
          standardRef: "internal:page-availability",
          confidence: 1,
        }),
      );
    }

    if ((page.pageErrors?.length ?? 0) > 0) {
      findings.push(
        finding({
          severity: "P0",
          pillar: "Performance & Runtime Quality",
          title: "Runtime JavaScript crash signals",
          evidence: `${prefix}: pageErrors=${page.pageErrors.length}`,
          whyItMatters: "Runtime crashes create broken and inconsistent visual states.",
          fix: "Fix all unhandled exceptions and rerun the crash test.",
          standardRef: "internal:runtime-stability",
          confidence: 0.98,
        }),
      );
    }

    if ((page.brokenLinks?.length ?? 0) > 0) {
      findings.push(
        finding({
          severity: "P1",
          pillar: "Interaction & Usability",
          title: "Broken link journey",
          evidence: `${prefix}: brokenLinks=${page.brokenLinks.length}`,
          whyItMatters: "Broken navigation paths reduce user trust and product credibility.",
          fix: "Repair link targets and redirect chains for all broken URLs.",
          standardRef: "https://www.nngroup.com/articles/ten-usability-heuristics/",
          confidence: 0.94,
        }),
      );
    }

    if ((page.failedClicks ?? 0) > 0) {
      findings.push(
        finding({
          severity: "P1",
          pillar: "Interaction & Usability",
          title: "Primary interactions fail under test",
          evidence: `${prefix}: failedClicks=${page.failedClicks}`,
          whyItMatters: "High-value interface actions must be reliable under normal interaction.",
          fix: "Stabilize click handlers, loading states, and DOM timing around controls.",
          standardRef: "https://www.nngroup.com/articles/ten-usability-heuristics/",
          confidence: 0.93,
        }),
      );
    }

    if (page.designMetrics?.hasHorizontalOverflow) {
      findings.push(
        finding({
          severity: "P1",
          pillar: "Visual System Discipline",
          title: "Horizontal overflow / reflow failure",
          evidence: `${prefix}: horizontalOverflow=true`,
          whyItMatters: "Broken reflow causes clipped content and poor mobile quality.",
          fix: "Eliminate horizontal overflow across breakpoints and enforce responsive constraints.",
          standardRef: "https://www.w3.org/WAI/WCAG22/Understanding/reflow.html",
          confidence: 0.95,
        }),
      );
    }

    if ((page.designMetrics?.smallTapTargets ?? 0) >= 3) {
      const count = page.designMetrics.smallTapTargets;
      findings.push(
        finding({
          severity: count >= 6 ? "P1" : "P2",
          pillar: "Accessibility & Compliance",
          title: "Tap targets below minimum size",
          evidence: `${prefix}: smallTapTargets=${count}`,
          whyItMatters: "Small targets significantly harm usability and accessibility on touch devices.",
          fix: "Raise all interactive targets to at least 44x44 CSS pixels.",
          standardRef: "https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html",
          confidence: 0.96,
        }),
      );
    }

    if ((page.designMetrics?.missingAlt ?? 0) > 0) {
      findings.push(
        finding({
          severity: "P2",
          pillar: "Accessibility & Compliance",
          title: "Images missing alt text",
          evidence: `${prefix}: missingAlt=${page.designMetrics.missingAlt}`,
          whyItMatters: "Missing alt text breaks non-visual comprehension and semantic quality.",
          fix: "Add meaningful alt text for informative images and empty alt for decorative images.",
          standardRef: "https://www.w3.org/TR/WCAG22/#non-text-content",
          confidence: 0.9,
        }),
      );
    }

    if ((page.designMetrics?.uniqueFonts ?? 0) > 4) {
      findings.push(
        finding({
          severity: "P2",
          pillar: "Visual System Discipline",
          title: "Typography system drift",
          evidence: `${prefix}: uniqueFonts=${page.designMetrics.uniqueFonts}`,
          whyItMatters: "Uncontrolled font usage reduces coherence and premium perception.",
          fix: "Constrain typography to a deliberate tokenized type scale and font stack.",
          standardRef: "https://atlassian.design/foundations/typography/",
          confidence: 0.86,
        }),
      );
    }

    if ((page.designMetrics?.buttonStyleVariants ?? 0) > 18) {
      findings.push(
        finding({
          severity: "P3",
          pillar: "Visual System Discipline",
          title: "Button style inconsistency",
          evidence: `${prefix}: buttonStyleVariants=${page.designMetrics.buttonStyleVariants}`,
          whyItMatters: "Inconsistent controls weaken hierarchy and interaction predictability.",
          fix: "Consolidate controls into a tokenized component system with clear variants.",
          standardRef: "https://fluent2.microsoft.design/components/button/usage",
          confidence: 0.87,
        }),
      );
    }

    if (page.axe?.enabled && Array.isArray(page.axe.violations) && page.axe.violations.length > 0) {
      const benignModerateSet = new Set([
        "landmark-complementary-is-top-level",
        "heading-order",
      ]);
      const maxImpact = page.axe.violations.reduce((impact, entry) => {
        const current = String(entry.impact ?? "unknown").toLowerCase();
        const order = ["minor", "moderate", "serious", "critical"];
        const left = order.indexOf(impact);
        const right = order.indexOf(current);
        return right > left ? current : impact;
      }, "minor");

      const onlyBenignModerate =
        maxImpact === "moderate" &&
        page.axe.violations.every((entry) => benignModerateSet.has(String(entry.id ?? "")));
      const severity = onlyBenignModerate
        ? "P3"
        : maxImpact === "critical"
          ? "P0"
          : maxImpact === "serious"
            ? "P1"
            : "P2";
      findings.push(
        finding({
          severity,
          pillar: "Accessibility & Compliance",
          title: "Axe accessibility violations detected",
          evidence: `${prefix}: axeViolations=${page.axe.violations.length}, maxImpact=${maxImpact}`,
          whyItMatters: onlyBenignModerate
            ? "Moderate semantic issues should be cleaned up, but they are not equivalent to runtime or journey failures."
            : "Critical accessibility violations are release blockers for enterprise quality.",
          fix: onlyBenignModerate
            ? "Clean up the remaining semantic landmark and heading issues, then re-run accessibility validation."
            : "Fix all serious/critical axe findings, then re-run accessibility validation.",
          standardRef: "https://www.w3.org/TR/WCAG22/",
          confidence: 0.97,
        }),
      );
    }
  }

  return findings;
}

function evaluateLighthouse(lighthouseResults) {
  const findings = [];

  for (const result of lighthouseResults) {
    if (result.status !== "ok") {
      findings.push(
        finding({
          severity: "P1",
          pillar: "Performance & Runtime Quality",
          title: "Lighthouse run failed",
          evidence: `${result.url}: ${result.error ?? "unknown error"}`,
          whyItMatters: "Missing performance diagnostics obscures critical launch risks.",
          fix: "Resolve Lighthouse execution issues and rerun sampled pages.",
          standardRef: "https://raw.githubusercontent.com/GoogleChrome/lighthouse-ci/main/docs/configuration.md",
          confidence: 0.9,
        }),
      );
      continue;
    }

    const perf = Number(result.scores?.performance ?? 0);
    const a11y = Number(result.scores?.accessibility ?? 0);
    const best = Number(result.scores?.bestPractices ?? 0);
    const seo = Number(result.scores?.seo ?? 0);

    if (perf < 50) {
      findings.push(lighthouseFinding("performance", perf, "50", "Severely low Lighthouse performance", "P1"));
    } else if (perf < 70) {
      findings.push(lighthouseFinding("performance", perf, "70", "Subpar Lighthouse performance", "P2"));
    }

    if (a11y < 90) {
      findings.push(
        finding({
          severity: a11y < 80 ? "P1" : "P2",
          pillar: "Accessibility & Compliance",
          title: "Lighthouse accessibility below enterprise bar",
          evidence: `${result.url}: accessibility=${a11y}`,
          whyItMatters: "Accessibility debt undermines usability and compliance confidence.",
          fix: "Raise accessibility score to 90+ with semantic, contrast, and keyboard fixes.",
          standardRef: "https://www.w3.org/TR/WCAG22/",
          confidence: 0.91,
        }),
      );
    }

    if (best < 90) {
      findings.push(
        finding({
          severity: "P2",
          pillar: "Performance & Runtime Quality",
          title: "Best-practices score below enterprise threshold",
          evidence: `${result.url}: bestPractices=${best}`,
          whyItMatters: "Best-practice gaps increase long-term reliability and trust risk.",
          fix: "Address flagged best-practice diagnostics until score reaches 90+.",
          standardRef: "https://github.com/GoogleChrome/lighthouse/blob/main/docs/scoring.md",
          confidence: 0.88,
        }),
      );
    }

    if (seo < 80) {
      findings.push(
        finding({
          severity: "P3",
          pillar: "Interaction & Usability",
          title: "SEO baseline weak",
          evidence: `${result.url}: seo=${seo}`,
          whyItMatters: "Low discoverability can hide product value despite good visuals.",
          fix: "Improve meta tags, crawlability, and semantic structure.",
          standardRef: "https://github.com/GoogleChrome/lighthouse/blob/main/docs/scoring.md",
          confidence: 0.75,
        }),
      );
    }

    const lcp = Number(result.vitals?.lcpMs ?? 0);
    const inp = Number(result.vitals?.inpMs ?? 0);
    const cls = Number(result.vitals?.cls ?? 0);

    if (lcp > 4000) {
      findings.push(lighthouseFinding("LCP(ms)", lcp, "<=4000", "Core Web Vitals LCP in poor range", "P0"));
    }
    if (inp > 500) {
      findings.push(lighthouseFinding("INP(ms)", inp, "<=500", "Core Web Vitals INP in poor range", "P0"));
    }
    if (cls > 0.25) {
      findings.push(lighthouseFinding("CLS", cls, "<=0.25", "Core Web Vitals CLS in poor range", "P0"));
    }
  }

  return findings;
}

function scorePillars(findings) {
  const pillars = {
    "Accessibility & Compliance": PILLAR_WEIGHTS["Accessibility & Compliance"],
    "Visual System Discipline": PILLAR_WEIGHTS["Visual System Discipline"],
    "Interaction & Usability": PILLAR_WEIGHTS["Interaction & Usability"],
    "Performance & Runtime Quality": PILLAR_WEIGHTS["Performance & Runtime Quality"],
    "Premium Aesthetic Coherence": PILLAR_WEIGHTS["Premium Aesthetic Coherence"],
  };

  for (const item of findings) {
    const deduction = SEVERITY_DEDUCTION[item.severity] ?? 25;
    const pillar = item.pillar;
    pillars[pillar] = clamp(pillars[pillar] - deduction, 0, PILLAR_WEIGHTS[pillar]);
  }

  const total = Object.values(pillars).reduce((sum, value) => sum + value, 0);
  return {
    pillarScores: pillars,
    totalScore: clamp(Math.round(total), 0, 1000),
  };
}

function summarizeFindings(findings) {
  if (findings.length === 0) {
    return "Deterministic engine found no critical design issues.";
  }

  const counts = findings.reduce(
    (acc, findingItem) => {
      acc[findingItem.severity] += 1;
      return acc;
    },
    { P0: 0, P1: 0, P2: 0, P3: 0 },
  );

  return `Deterministic engine found ${findings.length} issues (P0=${counts.P0}, P1=${counts.P1}, P2=${counts.P2}, P3=${counts.P3}).`;
}

export function generateDeterministicJudge({ pages, lighthouseResults, minScoreFail }) {
  const pageFindings = evaluatePages(pages);
  const lighthouseFindings = evaluateLighthouse(lighthouseResults);
  const rawFindings = [...pageFindings, ...lighthouseFindings];

  const normalized = validateAndNormalizeJudgePayload(
    {
      judgeVerdict: "WARN",
      judgeScore: 700,
      summary: summarizeFindings(rawFindings),
      hardFailReasons: [],
      findings: rawFindings,
      confidence: 1,
    },
    "deterministic_engine",
  );

  const { pillarScores, totalScore } = scorePillars(normalized.findings);
  const hasP0 = normalized.findings.some((item) => item.severity === "P0");
  const hasP1 = normalized.findings.some((item) => item.severity === "P1");

  const hardFailReasons = [...normalized.hardFailReasons];
  if (hasP0) {
    hardFailReasons.push("Deterministic engine found at least one P0 issue.");
  }
  if (totalScore < minScoreFail && (hasP0 || hasP1)) {
    hardFailReasons.push(`Deterministic score ${totalScore} is below min fail threshold ${minScoreFail}.`);
  }

  let judgeVerdict = "PASS";
  if (hardFailReasons.length > 0) {
    judgeVerdict = "FAIL";
  } else if (hasP1 || hasP0) {
    judgeVerdict = "WARN";
  } else if (normalized.findings.length > 0) {
    judgeVerdict = totalScore >= 900 ? "PASS" : "WARN";
  }

  if (!hasP0 && !hasP1 && totalScore >= 900) {
    judgeVerdict = "PASS";
  } else if (!hasP0 && !hasP1 && totalScore >= 820) {
    judgeVerdict = "WARN";
  }

  return {
    ...normalized,
    judgeVerdict,
    judgeScore: totalScore,
    hardFailReasons,
    pillarScores,
    grade: gradeFromScore(totalScore),
  };
}

export function buildEvidenceIndex(pages, maxEvidenceImages) {
  const evidence = [];

  for (const page of pages) {
    if (typeof page.screenshot === "string" && page.screenshot) {
      evidence.push({
        url: page.url,
        viewport: "default",
        path: page.screenshot,
      });
    }

    if (Array.isArray(page.designViewportScreenshots)) {
      for (const view of page.designViewportScreenshots) {
        if (view && typeof view.path === "string" && view.path) {
          evidence.push({
            url: page.url,
            viewport: `${view.width}x${view.height}`,
            path: view.path,
          });
        }
      }
    }
  }

  return evidence.slice(0, Math.max(1, maxEvidenceImages));
}
