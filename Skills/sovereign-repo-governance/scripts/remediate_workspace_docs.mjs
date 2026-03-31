#!/usr/bin/env node
import { execSync } from 'child_process';
import fs from 'fs';

const AGENT_CLI = '/Users/jeremy/dev/SIN-Solver/a2a/team-infratructur/A2A-SIN-Google-Apps/dist/src/cli.js';
const TEAM_MAP_PATH = '/tmp/team_folder_map.json';

const teamFolders = JSON.parse(fs.readFileSync(TEAM_MAP_PATH, 'utf8'));

for (const [teamSlug, folderObj] of Object.entries(teamFolders)) {
  if (teamSlug.includes('__SIN')) continue;

  console.log(`\n--- Remediating: ${folderObj.name} ---`);
  const docTitle = `${folderObj.name} Docs`;
  
  // 1. Create or Find Doc
  const listAction = {
      action: "google.drive.list_folder",
      authMode: "user_oauth",
      accountKey: "workspace-admin",
      folderId: folderObj.id
  };
  fs.writeFileSync('/tmp/list_action.json', JSON.stringify(listAction));
  const listOut = JSON.parse(execSync(`node ${AGENT_CLI} run-action "$(cat /tmp/list_action.json)"`, { encoding: 'utf-8' }));
  let docId = listOut.files.find(f => f.name === docTitle)?.id;

  if (!docId) {
      console.log(`Creating fresh doc: ${docTitle}`);
      const createAction = {
        action: "google.drive.create_file",
        authMode: "user_oauth",
        accountKey: "workspace-admin",
        name: docTitle,
        fileType: "doc",
        parentFolderId: folderObj.id,
        confirm: true
      };
      fs.writeFileSync('/tmp/create_action.json', JSON.stringify(createAction));
      const createOut = JSON.parse(execSync(`node ${AGENT_CLI} run-action "$(cat /tmp/create_action.json)"`, { encoding: 'utf-8' }));
      docId = createOut.fileId;
  }

  if (docId) {
      console.log(`Ensuring tabs for Doc: ${docId}`);
      const tabs = ["Overview", "Dev Docs", "Installation", "Governance"];
      for (const tabTitle of tabs) {
          const tabAction = {
              action: "google.docs.ensure_tab",
              authMode: "user_oauth",
              accountKey: "workspace-admin",
              documentId: docId,
              title: tabTitle,
              confirm: true
          };
          fs.writeFileSync('/tmp/tab_action.json', JSON.stringify(tabAction));
          try {
              execSync(`node ${AGENT_CLI} run-action "$(cat /tmp/tab_action.json)"`);
              console.log(`  ✅ Tab ensured: ${tabTitle}`);
          } catch (e) {
              console.log(`  ⚠️ Tab already exists or failed: ${tabTitle}`);
          }
      }
  }
}
