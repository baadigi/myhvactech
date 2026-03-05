#!/usr/bin/env node
/**
 * Patch: Fix SITE_URL from www.myhvactech.com → myhvac.tech
 * Run: cd ~/Downloads/Myhvactech/myhvactech && node sitemap-fix-patch.js
 */
const fs = require('fs');
const path = require('path');

const patches = [
  {
    file: 'src/lib/constants.ts',
    find: "export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.myhvactech.com'",
    replace: "export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://myhvac.tech'"
  }
];

let applied = 0;
let failed = 0;

for (const p of patches) {
  const filePath = path.join(process.cwd(), p.file);
  if (!fs.existsSync(filePath)) {
    console.error(`✗ File not found: ${p.file}`);
    failed++;
    continue;
  }

  let content = fs.readFileSync(filePath, 'utf8');
  if (!content.includes(p.find)) {
    // Maybe already patched
    if (content.includes(p.replace)) {
      console.log(`⊘ Already patched: ${p.file}`);
      applied++;
      continue;
    }
    console.error(`✗ Could not find target string in: ${p.file}`);
    failed++;
    continue;
  }

  content = content.replace(p.find, p.replace);
  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`✓ Patched: ${p.file}`);
  applied++;
}

console.log(`\nDone: ${applied} patched, ${failed} failed`);
if (failed > 0) process.exit(1);
