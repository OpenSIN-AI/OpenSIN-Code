#!/usr/bin/env node
/**
 * research_synthesizer.mjs
 * 
 * Merges rapid web search results with A2A-SIN-Research deep research artifacts
 * into a structured, cited answer with confidence scoring.
 * 
 * Usage:
 *   node research_synthesizer.mjs --web /tmp/web_results.json --deep /tmp/deep_results.json --query "..."
 *   echo '{"web":[...],"deep":{...},"query":"..."}' | node research_synthesizer.mjs
 * 
 * Output: Structured markdown answer with citations, source table, and confidence.
 */

import { readFileSync } from 'node:fs';

// ── Citation builder ─────────────────────────────────────────────────
function buildCitationMap(webSources, deepSources) {
  const citations = new Map();
  let idx = 1;

  // Web sources first (already ranked by source_validator)
  if (Array.isArray(webSources)) {
    for (const src of webSources) {
      const key = src.normalizedUrl || src.url;
      if (!citations.has(key)) {
        citations.set(key, {
          index: idx++,
          url: src.url,
          title: src.title || '(untitled)',
          authority: src.authority || 'unknown',
          authorityScore: src.authorityScore || 0,
          date: src.date || null,
          staleness: src.staleness || 'unknown',
          provider: (src.providers || []).join(', ') || src.provider || 'web',
          type: 'web',
        });
      }
    }
  }

  // Deep research sources (from SIN-Research run artifacts)
  if (deepSources && Array.isArray(deepSources.sources)) {
    for (const src of deepSources.sources) {
      const key = src.url || src.id || `deep-${idx}`;
      if (!citations.has(key)) {
        citations.set(key, {
          index: idx++,
          url: src.url || '',
          title: src.title || src.name || '(deep research source)',
          authority: src.type === 'notebook' ? 'authoritative' : 'general',
          authorityScore: src.type === 'notebook' ? 85 : 60,
          date: src.date || null,
          staleness: 'fresh',
          provider: 'SIN-Research',
          type: 'deep',
        });
      }
    }
  }

  return citations;
}

// ── Confidence calculator ────────────────────────────────────────────
function calculateConfidence(webSources, deepSources, citations) {
  let score = 0;
  const factors = [];

  // Source count factor
  const totalSources = citations.size;
  if (totalSources >= 10) { score += 25; factors.push('10+ sources cross-referenced'); }
  else if (totalSources >= 5) { score += 15; factors.push(`${totalSources} sources found`); }
  else if (totalSources >= 2) { score += 8; factors.push(`Only ${totalSources} sources`); }
  else { score += 2; factors.push('Very few sources — low confidence'); }

  // Authority factor
  const highAuthority = [...citations.values()].filter(c => c.authorityScore >= 80).length;
  if (highAuthority >= 3) { score += 25; factors.push(`${highAuthority} high-authority sources`); }
  else if (highAuthority >= 1) { score += 15; factors.push(`${highAuthority} high-authority source(s)`); }
  else { score += 5; factors.push('No high-authority sources'); }

  // Freshness factor
  const freshCount = [...citations.values()].filter(c => c.staleness === 'fresh').length;
  const freshRatio = totalSources > 0 ? freshCount / totalSources : 0;
  if (freshRatio >= 0.7) { score += 20; factors.push('Mostly fresh sources'); }
  else if (freshRatio >= 0.4) { score += 12; factors.push('Mixed freshness'); }
  else { score += 3; factors.push('Mostly stale or undated sources'); }

  // Deep research factor
  if (deepSources && deepSources.status === 'completed') {
    score += 20; factors.push('Deep research run completed');
  } else if (deepSources && deepSources.plan) {
    score += 10; factors.push('Deep research planned but not executed');
  } else {
    score += 5; factors.push('Rapid search only');
  }

  // Cross-provider factor
  const providers = new Set();
  for (const c of citations.values()) {
    if (c.provider) {
      for (const p of c.provider.split(', ')) {
        providers.add(p);
      }
    }
  }
  if (providers.size >= 3) { score += 10; factors.push(`${providers.size} search providers used`); }
  else if (providers.size >= 2) { score += 5; factors.push('2 search providers'); }

  const level = score >= 75 ? 'HIGH' : score >= 45 ? 'MEDIUM' : 'LOW';

  return { score: Math.min(score, 100), level, factors };
}

// ── Depth classifier ─────────────────────────────────────────────────
function classifyDepth(webSources, deepSources) {
  if (deepSources && deepSources.status === 'completed') return 'DEEP';
  if (webSources && webSources.length >= 5) return 'STANDARD';
  return 'RAPID';
}

// ── Source table renderer ────────────────────────────────────────────
function renderSourceTable(citations) {
  const rows = [...citations.values()]
    .sort((a, b) => a.index - b.index)
    .map(c => {
      const dateStr = c.date || 'unknown';
      const shortUrl = c.url.length > 60 ? c.url.slice(0, 57) + '...' : c.url;
      return `| ${c.index} | ${c.title.slice(0, 40)} | ${c.authority} | ${dateStr} | ${shortUrl} |`;
    });

  return [
    '| # | Source | Authority | Date | URL |',
    '|---|--------|-----------|------|-----|',
    ...rows,
  ].join('\n');
}

// ── Main synthesizer ─────────────────────────────────────────────────
function synthesize(input) {
  const { query, web, deep } = input;

  const webSources = web?.sources || web || [];
  const citations = buildCitationMap(webSources, deep);
  const confidence = calculateConfidence(webSources, deep, citations);
  const depth = classifyDepth(webSources, deep);

  const sourceTable = renderSourceTable(citations);

  // Build the synthesis report
  const report = [];
  report.push(`## Research Synthesis: ${query || '(no query provided)'}`);
  report.push('');

  // Key findings from web
  if (webSources.length > 0) {
    report.push('### Web Search Findings');
    const topSources = webSources.slice(0, 5);
    for (const src of topSources) {
      const citation = [...citations.values()].find(c => c.url === src.url);
      const ref = citation ? `[${citation.index}]` : '';
      report.push(`- **${src.title || '(untitled)'}** ${ref}`);
      if (src.snippet) report.push(`  ${src.snippet.slice(0, 150)}`);
    }
    report.push('');
  }

  // Deep research findings
  if (deep && deep.status === 'completed' && deep.findings) {
    report.push('### Deep Research Findings');
    if (Array.isArray(deep.findings)) {
      for (const finding of deep.findings) {
        report.push(`- ${finding.text || finding}`);
      }
    } else if (typeof deep.findings === 'string') {
      report.push(deep.findings);
    }
    report.push('');
  }

  // Artifacts
  if (deep && deep.artifacts && deep.artifacts.length > 0) {
    report.push('### Research Artifacts');
    for (const artifact of deep.artifacts) {
      report.push(`- ${artifact.name || artifact.path}: ${artifact.description || 'Persisted to Drive'}`);
    }
    report.push('');
  }

  // Source table
  report.push('### Sources');
  report.push(sourceTable);
  report.push('');

  // Confidence
  report.push(`### Confidence: ${confidence.level} (${confidence.score}/100)`);
  for (const factor of confidence.factors) {
    report.push(`- ${factor}`);
  }
  report.push('');
  report.push(`### Research Depth: ${depth}`);

  return {
    markdown: report.join('\n'),
    confidence,
    depth,
    citationCount: citations.size,
    query,
  };
}

// ── CLI entrypoint ───────────────────────────────────────────────────
const args = process.argv.slice(2);
let input;

if (args.includes('--web') || args.includes('--deep')) {
  const webPath = args.includes('--web') ? args[args.indexOf('--web') + 1] : null;
  const deepPath = args.includes('--deep') ? args[args.indexOf('--deep') + 1] : null;
  const queryIdx = args.indexOf('--query');
  const query = queryIdx >= 0 ? args[queryIdx + 1] : '';

  input = {
    query,
    web: webPath ? JSON.parse(readFileSync(webPath, 'utf-8')) : [],
    deep: deepPath ? JSON.parse(readFileSync(deepPath, 'utf-8')) : null,
  };
} else {
  // Read from stdin
  const chunks = [];
  process.stdin.setEncoding('utf-8');
  for await (const chunk of process.stdin) {
    chunks.push(chunk);
  }
  input = JSON.parse(chunks.join(''));
}

try {
  const result = synthesize(input);
  console.log(result.markdown);
  console.error(JSON.stringify({ confidence: result.confidence, depth: result.depth, citations: result.citationCount }, null, 2));
} catch (err) {
  console.error(`Error: ${err.message}`);
  process.exit(1);
}
