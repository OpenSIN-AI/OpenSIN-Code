#!/usr/bin/env node
/**
 * source_validator.mjs
 * 
 * Deduplicates, authority-scores, date-checks, and ranks sources collected
 * from multiple search providers (google_search, Exa, webfetch, GitHub).
 * 
 * Usage:
 *   echo '<json array of sources>' | node source_validator.mjs
 *   node source_validator.mjs --file /tmp/raw_sources.json
 *   node source_validator.mjs --stdin
 * 
 * Input format (array of objects):
 *   [{ "url": "https://...", "title": "...", "snippet": "...", "date": "2026-03-21", "provider": "google" }]
 * 
 * Output: ranked, deduplicated sources with authority scores and staleness warnings.
 */

import { readFileSync } from 'node:fs';
import { URL } from 'node:url';

// ── Authority tiers ──────────────────────────────────────────────────
const AUTHORITY_TIERS = {
  // Tier 1: Official documentation & standards bodies
  official: {
    score: 95,
    patterns: [
      /docs\.github\.com/i, /developer\.mozilla\.org/i, /docs\.python\.org/i,
      /nodejs\.org\/api/i, /typescriptlang\.org\/docs/i, /react\.dev/i,
      /nextjs\.org\/docs/i, /developers\.google\.com/i, /cloud\.google\.com\/docs/i,
      /docs\.aws\.amazon\.com/i, /learn\.microsoft\.com/i, /docs\.oracle\.com/i,
      /docs\.nvidia\.com/i, /huggingface\.co\/docs/i, /platform\.openai\.com\/docs/i,
      /docs\.anthropic\.com/i, /vercel\.com\/docs/i, /developers\.cloudflare\.com/i,
      /w3\.org/i, /rfc-editor\.org/i, /tc39\.es/i,
    ],
  },
  // Tier 2: Authoritative community & curated sources
  authoritative: {
    score: 80,
    patterns: [
      /github\.com\/[^/]+\/[^/]+\/(blob|tree|issues|pull|discussions)/i,
      /arxiv\.org/i, /dl\.acm\.org/i, /ieee\.org/i, /nature\.com/i,
      /stackoverflow\.com\/questions\/\d+/i, /engineering\..+\.com/i,
      /blog\.(google|github|cloudflare|vercel|openai|anthropic)\./i,
      /medium\.com\/@/i, /dev\.to\//i,
    ],
  },
  // Tier 3: General tech content
  general: {
    score: 60,
    patterns: [
      /\.com/i, /\.dev/i, /\.io/i, /\.org/i, /\.net/i,
    ],
  },
  // Tier 4: Forums, social, unverified
  community: {
    score: 40,
    patterns: [
      /reddit\.com/i, /news\.ycombinator\.com/i, /twitter\.com/i, /x\.com/i,
      /discord\.com/i, /slack\.com/i, /quora\.com/i,
    ],
  },
};

// ── Staleness thresholds ──────────────────────────────────────────────
const STALE_MONTHS = 6;
const VERY_STALE_MONTHS = 18;

function parseDate(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? null : d;
}

function monthsAgo(date) {
  if (!date) return null;
  const now = new Date();
  return (now.getFullYear() - date.getFullYear()) * 12 + (now.getMonth() - date.getMonth());
}

function stalenessLabel(months) {
  if (months === null) return 'unknown';
  if (months <= STALE_MONTHS) return 'fresh';
  if (months <= VERY_STALE_MONTHS) return 'aging';
  return 'stale';
}

// ── Authority scoring ────────────────────────────────────────────────
function scoreAuthority(url) {
  for (const [tier, config] of Object.entries(AUTHORITY_TIERS)) {
    for (const pattern of config.patterns) {
      if (pattern.test(url)) {
        return { tier, score: config.score };
      }
    }
  }
  return { tier: 'unknown', score: 30 };
}

// ── URL normalization for dedup ──────────────────────────────────────
function normalizeUrl(raw) {
  try {
    const u = new URL(raw);
    // Strip tracking params, anchors, trailing slashes
    u.hash = '';
    ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'ref', 'source'].forEach(p => { u.searchParams.delete(p); });
    let path = u.pathname.replace(/\/+$/, '') || '/';
    return `${u.protocol}//${u.hostname}${path}${u.search}`;
  } catch {
    return raw;
  }
}

// ── Main pipeline ────────────────────────────────────────────────────
function validate(rawSources) {
  if (!Array.isArray(rawSources)) {
    console.error('Input must be a JSON array of source objects.');
    process.exit(1);
  }

  // 1. Normalize and deduplicate
  const seen = new Map();
  for (const src of rawSources) {
    if (!src.url) continue;
    const key = normalizeUrl(src.url);
    if (seen.has(key)) {
      // Merge: keep the one with more metadata
      const existing = seen.get(key);
      if (!existing.date && src.date) existing.date = src.date;
      if (!existing.snippet && src.snippet) existing.snippet = src.snippet;
      if (src.provider && !existing.providers.includes(src.provider)) {
        existing.providers.push(src.provider);
      }
      existing.duplicateCount = (existing.duplicateCount || 1) + 1;
    } else {
      seen.set(key, {
        ...src,
        normalizedUrl: key,
        providers: [src.provider || 'unknown'],
        duplicateCount: 1,
      });
    }
  }

  // 2. Score, date-check, rank
  const validated = [];
  for (const [, src] of seen) {
    const authority = scoreAuthority(src.url);
    const parsedDate = parseDate(src.date);
    const months = monthsAgo(parsedDate);
    const staleness = stalenessLabel(months);

    // Composite score: authority * freshness multiplier * cross-reference bonus
    let freshnessMult = 1.0;
    if (staleness === 'aging') freshnessMult = 0.85;
    if (staleness === 'stale') freshnessMult = 0.6;
    if (staleness === 'unknown') freshnessMult = 0.9;

    const crossRefBonus = Math.min((src.providers.length - 1) * 5, 15); // max +15 for appearing in 4+ providers

    const compositeScore = Math.round(authority.score * freshnessMult + crossRefBonus);

    validated.push({
      rank: 0, // filled after sort
      url: src.url,
      normalizedUrl: src.normalizedUrl,
      title: src.title || '(no title)',
      snippet: src.snippet ? src.snippet.slice(0, 200) : '',
      date: src.date || null,
      staleness,
      authority: authority.tier,
      authorityScore: authority.score,
      compositeScore,
      providers: src.providers,
      duplicateCount: src.duplicateCount,
      warnings: [
        ...(staleness === 'stale' ? [`Content is ${months}+ months old — verify currency`] : []),
        ...(staleness === 'aging' ? [`Content is ${months} months old — may be outdated`] : []),
        ...(staleness === 'unknown' ? ['No publication date found — verify manually'] : []),
      ],
    });
  }

  // 3. Sort by composite score descending
  validated.sort((a, b) => b.compositeScore - a.compositeScore);
  validated.forEach((v, i) => { v.rank = i + 1; });

  return {
    totalRaw: rawSources.length,
    totalValidated: validated.length,
    duplicatesRemoved: rawSources.length - validated.length,
    freshCount: validated.filter(v => v.staleness === 'fresh').length,
    agingCount: validated.filter(v => v.staleness === 'aging').length,
    staleCount: validated.filter(v => v.staleness === 'stale').length,
    unknownDateCount: validated.filter(v => v.staleness === 'unknown').length,
    sources: validated,
  };
}

// ── CLI entrypoint ───────────────────────────────────────────────────
const args = process.argv.slice(2);
let input;

if (args.includes('--file')) {
  const filePath = args[args.indexOf('--file') + 1];
  input = readFileSync(filePath, 'utf-8');
} else {
  // Read from stdin
  const chunks = [];
  process.stdin.setEncoding('utf-8');
  for await (const chunk of process.stdin) {
    chunks.push(chunk);
  }
  input = chunks.join('');
}

try {
  const rawSources = JSON.parse(input);
  const result = validate(rawSources);
  console.log(JSON.stringify(result, null, 2));
} catch (err) {
  console.error(`Error: ${err.message}`);
  process.exit(1);
}
