#!/usr/bin/env node

import { run } from './main.js';

run().catch((error) => {
  console.error(`Error: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});
