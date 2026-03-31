#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const DOCS_ROOT = '/Users/jeremy/dev/docs';

// Find all repair-docs.md recursively
function findRepairDocs(dir, list = []) {
  if (!fs.existsSync(dir)) return list;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      findRepairDocs(fullPath, list);
    } else if (file === 'repair-docs.md') {
      list.push(fullPath);
    }
  }
  return list;
}

function parseBugs(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const bugs = [];
  // Updated regex to catch more variations and include the ID
  const bugRegex = /## (BUG-\w+): (.*)\n\*\*Aufgetreten:\*\*.*\*\*Status:\*\*.*✅ GEFIXT\n\*\*Symptom:\*\* (.*)\n\*\*Ursache:\*\* (.*)\n\*\*Fix:\*\* (.*)\n\*\*Datei:\*\* (.*)/g;
  let match;
  while ((match = bugRegex.exec(content)) !== null) {
    bugs.push({
      id: match[1],
      title: match[2].trim(),
      symptom: match[3].trim(),
      cause: match[4].trim(),
      fix: match[5].trim(),
      file: match[6].trim(),
      sourceFile: filePath
    });
  }
  return bugs;
}

const docFiles = findRepairDocs(DOCS_ROOT);
console.log(`Found ${docFiles.length} projects with repair-docs.md`);

for (const docFile of docFiles) {
  const projectName = path.basename(path.dirname(docFile));
  console.log(`\n--- Project: ${projectName} ---`);
  const bugs = parseBugs(docFile);
  
  if (bugs.length === 0) {
    console.log("No undocumented fixes found.");
    continue;
  }

  for (const bug of bugs) {
    console.log(`[${bug.id}] ${bug.title}`);
    // Check if we already have a GitHub URL in the doc (simple check)
    if (fs.readFileSync(docFile, 'utf-8').includes(`github.com/`)) {
        // This is a naive check, ideally we check per bug block
    }
  }
}
