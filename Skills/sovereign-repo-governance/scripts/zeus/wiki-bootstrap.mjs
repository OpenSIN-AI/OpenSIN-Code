#!/usr/bin/env node

/**
 * Enterprise GitHub Wiki Bootstrapper
 * Automatically clones, structures, and pushes a best-practice wiki for a given repository.
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const args = process.argv.slice(2);
const getArg = (flag) => {
    const idx = args.indexOf(flag);
    return idx !== -1 ? args[idx + 1] : null;
};

const org = getArg('--org');
const repo = getArg('--repo');
const type = getArg('--type') || 'backend';

if (!org || !repo) {
    console.error("Usage: node wiki-bootstrap.mjs --org <Organization> --repo <Repository> --type <frontend|backend|library|monorepo>");
    process.exit(1);
}

const wikiUrl = `git@github.com:${org}/${repo}.wiki.git`;
const cloneDir = path.join('/tmp', `${repo}-wiki`);

console.log(`[Wiki Bootstrap] Cloning wiki repository: ${wikiUrl}`);

try {
    if (fs.existsSync(cloneDir)) fs.rmSync(cloneDir, { recursive: true, force: true });
    
    // Check if wiki exists by attempting to clone. If it fails, the wiki might need to be enabled in GitHub settings first.
    try {
        execSync(`git clone ${wikiUrl} ${cloneDir}`, { stdio: 'pipe' });
    } catch (e) {
        console.log(`[Wiki Bootstrap] Wiki repo not found or empty. Initializing new wiki locally...`);
        fs.mkdirSync(cloneDir, { recursive: true });
        execSync(`git init`, { cwd: cloneDir });
        execSync(`git remote add origin ${wikiUrl}`, { cwd: cloneDir });
    }

    fs.mkdirSync(path.join(cloneDir, 'assets'), { recursive: true });
    fs.mkdirSync(path.join(cloneDir, 'Architecture'), { recursive: true });
    fs.mkdirSync(path.join(cloneDir, 'Guides'), { recursive: true });
    fs.mkdirSync(path.join(cloneDir, 'Operations'), { recursive: true });
    fs.mkdirSync(path.join(cloneDir, 'API'), { recursive: true });
    fs.mkdirSync(path.join(cloneDir, 'Usage'), { recursive: true });

    let sidebarContent = `## 📚 ${repo} Documentation\n\n- [[Home]]\n`;
    let filesToCreate = {
        'Home.md': `# ${repo}\n\nWelcome to the official documentation for ${repo}.\n\n## Overview\n\n## Getting Started\n\n`
    };

    if (type === 'frontend') {
        sidebarContent += `- **Architecture**\n  - [[State Management|Architecture/State-Management]]\n  - [[Component Library|Architecture/Component-Library]]\n`;
        sidebarContent += `- **Guides**\n  - [[Styling Conventions|Guides/Styling-Conventions]]\n`;
        
        filesToCreate['Architecture/State-Management.md'] = `# State Management\n\nDefine how global and local state is handled in this frontend app.`;
        filesToCreate['Architecture/Component-Library.md'] = `# Component Library\n\nDetails on UI components and Storybook integration.`;
        filesToCreate['Guides/Styling-Conventions.md'] = `# Styling Conventions\n\nTailwind, CSS-in-JS, or global stylesheet rules.`;
    } 
    else if (type === 'library') {
        sidebarContent += `- **Usage**\n  - [[Quickstart|Usage/Quickstart]]\n`;
        sidebarContent += `- **API**\n  - [[Reference|API/Reference]]\n`;
        sidebarContent += `- **Guides**\n  - [[Contributing|Guides/Contributing]]\n`;
        
        filesToCreate['Usage/Quickstart.md'] = `# Quickstart\n\nInstallation and basic usage examples.`;
        filesToCreate['API/Reference.md'] = `# API Reference\n\nDetailed API documentation.`;
        filesToCreate['Guides/Contributing.md'] = `# Contributing\n\nHow to build and test this library locally.`;
    }
    else if (type === 'monorepo') {
        sidebarContent += `- **Architecture**\n  - [[Package Boundaries|Architecture/Package-Boundaries]]\n`;
        sidebarContent += `- **Operations**\n  - [[CI/CD Pipelines|Operations/CI-CD-Pipelines]]\n`;
        sidebarContent += `- **Guides**\n  - [[Tooling|Guides/Tooling]]\n`;
        
        filesToCreate['Architecture/Package-Boundaries.md'] = `# Package Boundaries\n\nRules for cross-package imports and dependency sharing.`;
        filesToCreate['Operations/CI-CD-Pipelines.md'] = `# CI/CD Pipelines\n\nTurborepo cache, build steps, and deployment.`;
        filesToCreate['Guides/Tooling.md'] = `# Tooling\n\nLinter, formatter, and workspace script configurations.`;
    }
    else { // backend/service (default)
        sidebarContent += `- **Architecture**\n  - [[System Design|Architecture/System-Design]]\n  - [[Database Schema|Architecture/Database-Schema]]\n`;
        sidebarContent += `- **API**\n  - [[Endpoints|API/Endpoints]]\n`;
        sidebarContent += `- **Operations**\n  - [[Runbooks|Operations/Runbooks]]\n`;
        
        filesToCreate['Architecture/System-Design.md'] = `# System Design\n\nHigh-level architecture diagram and service dependencies.`;
        filesToCreate['Architecture/Database-Schema.md'] = `# Database Schema\n\nCore tables, relationships, and migrations.`;
        filesToCreate['API/Endpoints.md'] = `# API Endpoints\n\nREST/GraphQL definitions.`;
        filesToCreate['Operations/Runbooks.md'] = `# Runbooks\n\nTroubleshooting, alerts, and deployment processes.`;
    }

    filesToCreate['_Sidebar.md'] = sidebarContent;

    for (const [filepath, content] of Object.entries(filesToCreate)) {
        const fullPath = path.join(cloneDir, filepath);
        if (!fs.existsSync(fullPath)) {
            fs.writeFileSync(fullPath, content);
            console.log(`[Wiki Bootstrap] Created ${filepath}`);
        }
    }

    console.log(`[Wiki Bootstrap] Committing and pushing to Wiki repository...`);
    execSync(`git add .`, { cwd: cloneDir });
    try {
        execSync(`git commit -m "docs: bootstrap enterprise wiki structure for ${type}"`, { cwd: cloneDir, stdio: 'pipe' });
        execSync(`git push origin main -f || git push origin master -f`, { cwd: cloneDir, stdio: 'pipe' });
        console.log(`[Wiki Bootstrap] ✅ Successfully pushed Wiki structure!`);
    } catch (e) {
        console.log(`[Wiki Bootstrap] No changes to commit or push failed (make sure Wiki feature is enabled in repo settings).`);
    }

} catch (err) {
    console.error(`[Wiki Bootstrap] Error:`, err.message);
    process.exit(1);
}
