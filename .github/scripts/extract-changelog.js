// Extracts the section for a given version from CHANGELOG.md (Keep a Changelog
// format, headings like "## [1.0.0] - 2026-09-24") and prints it to stdout.
// Used by release.yml so a tag push (vX.Y.Z) auto-fills the GitHub Release body
// with that version's changelog entry, no manual copy-paste needed.
'use strict';
const fs = require('fs');
const path = require('path');

const version = process.argv[2];
if (!version) {
  console.error('Usage: node extract-changelog.js <version>');
  process.exit(1);
}

const file = path.join(__dirname, '..', '..', 'CHANGELOG.md');
const content = fs.readFileSync(file, 'utf8');
const lines = content.split('\n');

const startRe = new RegExp('^##\\s*\\[' + version.replace(/\./g, '\\.') + '\\]');
let start = -1;
for (let i = 0; i < lines.length; i++) {
  if (startRe.test(lines[i])) { start = i; break; }
}
if (start === -1) {
  console.error(`No CHANGELOG.md section found for version ${version}`);
  process.exit(1);
}

let end = lines.length;
for (let i = start + 1; i < lines.length; i++) {
  if (/^##\s*\[/.test(lines[i])) { end = i; break; }
}

// Drop the "## [x.y.z] - date" heading itself (the Release title already shows the version)
// and trailing reference-link lines like "[1.0.0]: https://...".
const body = lines
  .slice(start + 1, end)
  .filter((l) => !/^\[\d+\.\d+\.\d+\]:/.test(l))
  .join('\n')
  .trim();

if (!body) {
  console.error(`Section for version ${version} is empty`);
  process.exit(1);
}

console.log(body);
