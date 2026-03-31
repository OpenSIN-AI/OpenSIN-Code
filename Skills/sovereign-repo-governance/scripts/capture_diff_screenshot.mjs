#!/usr/bin/env node
import { execSync } from 'node:child_process';
import { writeFileSync, unlinkSync } from 'node:fs';

const [inputFile, outputName] = process.argv.slice(2);

if (!inputFile || !outputName) {
  console.error("Usage: node capture_diff_screenshot.mjs <input_file> <output_name>");
  process.exit(1);
}

const assetName = outputName
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '_')
  .replace(/^_+|_+$/g, '');
const carbonImage = `/tmp/${assetName}.png`;
const watermarkedImage = `/tmp/${assetName}_watermarked.png`;
const logoPath = `${process.env.HOME}/.config/opencode/skills/imagegen/aiometrics_logo.png`;

console.log(`📸 Capturing screenshot of ${inputFile}...`);

try {
  execSync(`npx carbon-now-cli "${inputFile}" --save-to /tmp --save-as "${assetName}" --disable-headless`, { stdio: 'inherit' });
  console.log(`💧 Applying AIometrics Enterprise watermark...`);
  execSync(`python3 ${process.env.HOME}/.config/opencode/skills/imagegen/scripts/add_watermark.py "${carbonImage}" "${watermarkedImage}" "${logoPath}"`, { stdio: 'inherit' });

  console.log(`☁️ Uploading to public GitHub Release...`);
  execSync(`gh release upload auto-screenshots "${watermarkedImage}" -R Delqhi/opencode --clobber`, { stdio: 'inherit' });

  const publicUrl = `https://github.com/Delqhi/opencode/releases/download/auto-screenshots/${assetName}_watermarked.png`;
  
  console.log(`\n✅ Success! Markdown Snippet:\n`);
  const markdown = `![${assetName}](${publicUrl})`;
  console.log(markdown);

  writeFileSync(`/tmp/${assetName}_markdown.txt`, markdown);
  
} catch (err) {
  console.error(`❌ Failed to generate or upload screenshot: ${err.message}`);
  process.exit(1);
} finally {
  try { unlinkSync(carbonImage); } catch (e) {}
}
