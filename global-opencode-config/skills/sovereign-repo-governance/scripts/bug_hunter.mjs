#!/usr/bin/env node
import { execSync } from 'child_process';
import fs from 'fs';

const REPOS = ['anomalyco/opencode', 'code-yeongyu/oh-my-openagent'];

async function hunt() {
    console.log("🚀 Sovereign Bug Hunter starting... 🚀\n");

    for (const repo of REPOS) {
        console.log(`--- Checking ${repo} for fixable issues ---`);
        try {
            const cmd = `gh issue list --repo ${repo} --limit 10 --json number,title,labels,body`;
            const issues = JSON.parse(execSync(cmd, { encoding: 'utf-8' }));
            
            issues.forEach(issue => {
                const labels = issue.labels.map(l => l.name).join(', ');
                console.log(`\n[#${issue.number}] ${issue.title}`);
                console.log(`Labels: ${labels}`);
                
                // Heuristic: Check if we have code related to this
                // (This is a simplified version, real agent would grep codebase)
                console.log(`Potential candidates found for local Grep analysis.`);
            });
        } catch (e) {
            console.error(`Failed to fetch issues for ${repo}`);
        }
        console.log("\n");
    }
}
hunt();
