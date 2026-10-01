'use strict';

const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const outputPath = path.join(root, 'index.html');
const inputs = [
  { marker: '{{INLINE_STYLES}}', file: 'src/styles.css', close: '</style>', forbidden: /<\/style/i },
  { marker: '{{INLINE_SCRIPT_CONFIG}}', file: 'src/scripts/01-config.js', close: '</script>', forbidden: /<\/script/i },
  { marker: '{{INLINE_SCRIPT_I18N}}', file: 'src/scripts/02-i18n.js', close: '</script>', forbidden: /<\/script/i },
  { marker: '{{INLINE_SCRIPT_AUDIO}}', file: 'src/scripts/03-audio.js', close: '</script>', forbidden: /<\/script/i },
  { marker: '{{INLINE_SCRIPT_GAME}}', file: 'src/scripts/04-game.js', close: '</script>', forbidden: /<\/script/i },
];

function normalize(text) {
  return text.replace(/\r\n?/g, '\n').replace(/\n*$/, '') + '\n';
}

function read(relativePath) {
  return normalize(fs.readFileSync(path.join(root, relativePath), 'utf8'));
}

function build() {
  let output = read('src/index.template.html');
  for (const input of inputs) {
    const count = output.split(input.marker).length - 1;
    if (count !== 1) throw new Error(`${input.marker} must appear exactly once (found ${count})`);
    const content = read(input.file);
    if (input.forbidden.test(content)) throw new Error(`${input.file} contains forbidden ${input.close} sequence`);
    output = output.replace(input.marker, content);
  }
  const remaining = output.match(/{{INLINE_[A-Z_]+}}/g);
  if (remaining) throw new Error(`Unmapped inline marker(s): ${[...new Set(remaining)].join(', ')}`);
  return normalize(output);
}

const args = process.argv.slice(2);
const unknown = args.filter(arg => arg !== '--check');
if (unknown.length) {
  console.error(`Unknown argument(s): ${unknown.join(' ')}`);
  process.exit(2);
}

try {
  const generated = build();
  if (args.includes('--check')) {
    const current = fs.existsSync(outputPath) ? fs.readFileSync(outputPath, 'utf8') : '';
    if (current !== generated) {
      console.error('index.html is stale. Run node scripts/build.js.');
      process.exit(1);
    }
    console.log('index.html is up to date.');
  } else {
    fs.writeFileSync(outputPath, generated, 'utf8');
    console.log('Built index.html.');
  }
} catch (error) {
  console.error(error.message);
  process.exit(1);
}