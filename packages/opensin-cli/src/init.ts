import { existsSync, mkdirSync, readFileSync, writeFileSync, readdirSync } from 'fs';
import { join, basename } from 'path';
import { cwd } from 'process';

export enum InitStatus {
  Created = 'created',
  Updated = 'updated',
  Skipped = 'skipped',
}

export interface InitArtifact {
  name: string;
  status: InitStatus;
}

export interface InitReport {
  projectRoot: string;
  artifacts: InitArtifact[];
}

export function initializeRepo(cwdPath: string): InitReport {
  const artifacts: InitArtifact[] = [];
  const cwd = cwdPath || process.cwd();

  const sinDir = join(cwd, '.sin');
  artifacts.push({
    name: '.sin/',
    status: ensureDir(sinDir),
  });

  const sinJson = join(cwd, '.sin.json');
  artifacts.push({
    name: '.sin.json',
    status: writeFileIfMissing(sinJson, STARTER_SIN_JSON),
  });

  const gitignore = join(cwd, '.gitignore');
  artifacts.push({
    name: '.gitignore',
    status: ensureGitignoreEntries(gitignore),
  });

  const sinMd = join(cwd, 'SIN.md');
  const content = renderSinMd(cwd);
  artifacts.push({
    name: 'SIN.md',
    status: writeFileIfMissing(sinMd, content),
  });

  const clawJson = join(cwd, '.claw.json');
  if (!existsSync(clawJson)) {
    artifacts.push({
      name: '.claw.json (compat)',
      status: writeFileIfMissing(clawJson, STARTER_SIN_JSON),
    });
  }

  return {
    projectRoot: cwd,
    artifacts,
  };
}

const STARTER_SIN_JSON = JSON.stringify({
  permissions: {
    defaultMode: 'dontAsk',
  },
}, null, 2);

const GITIGNORE_COMMENT = '# OpenSIN Code local artifacts';
const GITIGNORE_ENTRIES = ['.sin/settings.local.json', '.sin/sessions/'];

function ensureDir(path: string): InitStatus {
  if (existsSync(path)) {
    return InitStatus.Skipped;
  }
  mkdirSync(path, { recursive: true });
  return InitStatus.Created;
}

function writeFileIfMissing(path: string, content: string): InitStatus {
  if (existsSync(path)) {
    return InitStatus.Skipped;
  }
  writeFileSync(path, content);
  return InitStatus.Created;
}

function ensureGitignoreEntries(path: string): InitStatus {
  if (!existsSync(path)) {
    const lines = [GITIGNORE_COMMENT, ...GITIGNORE_ENTRIES];
    writeFileSync(path, lines.join('\n') + '\n');
    return InitStatus.Created;
  }

  const existing = readFileSync(path, 'utf-8');
  const lines = existing.split('\n').map(l => l.trim());
  let changed = false;

  if (!lines.includes(GITIGNORE_COMMENT)) {
    lines.push(GITIGNORE_COMMENT);
    changed = true;
  }

  for (const entry of GITIGNORE_ENTRIES) {
    if (!lines.includes(entry)) {
      lines.push(entry);
      changed = true;
    }
  }

  if (!changed) {
    return InitStatus.Skipped;
  }

  writeFileSync(path, lines.join('\n') + '\n');
  return InitStatus.Updated;
}

export function renderSinMd(cwdPath: string): string {
  const detection = detectRepo(cwdPath);
  const lines: string[] = [];

  lines.push('# SIN.md');
  lines.push('');
  lines.push('This file provides guidance to OpenSIN Code when working with code in this repository.');
  lines.push('');

  const detectedLanguages = detectedLanguages_(detection);
  const detectedFrameworks = detectedFrameworks_(detection);

  lines.push('## Detected stack');
  if (detectedLanguages.length === 0) {
    lines.push('- No specific language markers were detected yet; document the primary language and verification commands once the project structure settles.');
  } else {
    lines.push(`- Languages: ${detectedLanguages.join(', ')}.`);
  }
  if (detectedFrameworks.length === 0) {
    lines.push('- Frameworks: none detected from the supported starter markers.');
  } else {
    lines.push(`- Frameworks/tooling markers: ${detectedFrameworks.join(', ')}.`);
  }
  lines.push('');

  const verificationLines = verificationLines_(cwdPath, detection);
  if (verificationLines.length > 0) {
    lines.push('## Verification');
    lines.push(...verificationLines);
    lines.push('');
  }

  const structureLines = repositoryShapeLines(detection);
  if (structureLines.length > 0) {
    lines.push('## Repository shape');
    lines.push(...structureLines);
    lines.push('');
  }

  const frameworkLines = frameworkNotes(detection);
  if (frameworkLines.length > 0) {
    lines.push('## Framework notes');
    lines.push(...frameworkLines);
    lines.push('');
  }

  lines.push('## Working agreement');
  lines.push('- Prefer small, reviewable changes and keep generated bootstrap files aligned with actual repo workflows.');
  lines.push('- Keep shared defaults in `.sin.json`; reserve `.sin/settings.local.json` for machine-local overrides.');
  lines.push('- Do not overwrite existing `SIN.md` content automatically; update it intentionally when repo workflows change.');
  lines.push('');

  return lines.join('\n');
}

interface RepoDetection {
  rustWorkspace: boolean;
  rustRoot: boolean;
  python: boolean;
  packageJson: boolean;
  typescript: boolean;
  nextjs: boolean;
  react: boolean;
  vite: boolean;
  nest: boolean;
  srcDir: boolean;
  testsDir: boolean;
  rustDir: boolean;
}

function detectRepo(cwdPath: string): RepoDetection {
  let packageJsonContents = '';
  
  try {
    packageJsonContents = readFileSync(join(cwdPath, 'package.json'), 'utf-8').toLowerCase();
  } catch {
    // ignore
  }

  return {
    rustWorkspace: existsSync(join(cwdPath, 'rust', 'Cargo.toml')),
    rustRoot: existsSync(join(cwdPath, 'Cargo.toml')),
    python: existsSync(join(cwdPath, 'pyproject.toml')) ||
            existsSync(join(cwdPath, 'requirements.txt')) ||
            existsSync(join(cwdPath, 'setup.py')),
    packageJson: existsSync(join(cwdPath, 'package.json')),
    typescript: existsSync(join(cwdPath, 'tsconfig.json')) ||
                packageJsonContents.includes('typescript'),
    nextjs: packageJsonContents.includes('"next"'),
    react: packageJsonContents.includes('"react"'),
    vite: packageJsonContents.includes('"vite"'),
    nest: packageJsonContents.includes('@nestjs'),
    srcDir: existsSync(join(cwdPath, 'src')),
    testsDir: existsSync(join(cwdPath, 'tests')),
    rustDir: existsSync(join(cwdPath, 'rust')),
  };
}

function detectedLanguages_(detection: RepoDetection): string[] {
  const languages: string[] = [];
  if (detection.rustWorkspace || detection.rustRoot) {
    languages.push('Rust');
  }
  if (detection.python) {
    languages.push('Python');
  }
  if (detection.typescript) {
    languages.push('TypeScript');
  } else if (detection.packageJson) {
    languages.push('JavaScript/Node.js');
  }
  return languages;
}

function detectedFrameworks_(detection: RepoDetection): string[] {
  const frameworks: string[] = [];
  if (detection.nextjs) frameworks.push('Next.js');
  if (detection.react) frameworks.push('React');
  if (detection.vite) frameworks.push('Vite');
  if (detection.nest) frameworks.push('NestJS');
  return frameworks;
}

function verificationLines_(cwdPath: string, detection: RepoDetection): string[] {
  const lines: string[] = [];
  if (detection.rustWorkspace) {
    lines.push('- Run Rust verification from `rust/`: `cargo fmt`, `cargo clippy --workspace --all-targets -- -D warnings`, `cargo test --workspace`');
  } else if (detection.rustRoot) {
    lines.push('- Run Rust verification from the repo root: `cargo fmt`, `cargo clippy --workspace --all-targets -- -D warnings`, `cargo test --workspace`');
  }
  if (detection.python) {
    if (existsSync(join(cwdPath, 'pyproject.toml'))) {
      lines.push('- Run the Python project checks declared in `pyproject.toml` (for example: `pytest`, `ruff check`, and `mypy` when configured).');
    } else {
      lines.push('- Run the repo\'s Python test/lint commands before shipping changes.');
    }
  }
  if (detection.packageJson) {
    lines.push('- Run the JavaScript/TypeScript checks from `package.json` before shipping changes (`npm test`, `npm run lint`, `npm run build`, or the repo equivalent).');
  }
  if (detection.testsDir && detection.srcDir) {
    lines.push('- `src/` and `tests/` are both present; update both surfaces together when behavior changes.');
  }
  return lines;
}

function repositoryShapeLines(detection: RepoDetection): string[] {
  const lines: string[] = [];
  if (detection.rustDir) {
    lines.push('- `rust/` contains the Rust workspace and active CLI/runtime implementation.');
  }
  if (detection.srcDir) {
    lines.push('- `src/` contains source files that should stay consistent with generated guidance and tests.');
  }
  if (detection.testsDir) {
    lines.push('- `tests/` contains validation surfaces that should be reviewed alongside code changes.');
  }
  return lines;
}

function frameworkNotes(detection: RepoDetection): string[] {
  const lines: string[] = [];
  if (detection.nextjs) {
    lines.push('- Next.js detected: preserve routing/data-fetching conventions and verify production builds after changing app structure.');
  }
  if (detection.react && !detection.nextjs) {
    lines.push('- React detected: keep component behavior covered with focused tests and avoid unnecessary prop/API churn.');
  }
  if (detection.vite) {
    lines.push('- Vite detected: validate the production bundle after changing build-sensitive configuration or imports.');
  }
  if (detection.nest) {
    lines.push('- NestJS detected: keep module/provider boundaries explicit and verify controller/service wiring after refactors.');
  }
  return lines;
}

export function renderInitReport(report: InitReport): string {
  const lines = [
    'Init',
    `  Project          ${report.projectRoot}`,
  ];
  
  for (const artifact of report.artifacts) {
    lines.push(`  ${artifact.name.padStart(16)}  ${artifact.status}`);
  }
  
  lines.push('  Next step        Review and tailor the generated guidance');
  
  return lines.join('\n');
}

export function initReportRender(this: InitReport): string {
  return renderInitReport(this);
}

export function initStatusLabel(this: InitStatus): string {
  return this === InitStatus.Created ? 'created' :
         this === InitStatus.Updated ? 'updated' :
         'skipped (already exists)';
}
