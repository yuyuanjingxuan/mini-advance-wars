// Lightweight CI check for a zero-dependency single-file game.
// No npm install, no test framework -- just Node's built-in vm module
// running each embedded <script> block against a minimal DOM shim,
// the same style of check used during manual development
// (see decisions.md / current_status.md for why: py_mini_racer locally,
// Node's vm here so CI needs no extra dependencies).
'use strict';
const fs = require('fs');
const vm = require('vm');
const path = require('path');

const file = path.join(__dirname, '..', '..', 'index.html');
const html = fs.readFileSync(file, 'utf8');

let failed = false;
function fail(msg) {
  console.error('FAIL: ' + msg);
  failed = true;
}
function ok(msg) {
  console.log('OK: ' + msg);
}

// --- Basic structural sanity: key tags must be balanced ---
for (const tag of ['div', 'script', 'style', 'button']) {
  const opens = (html.match(new RegExp('<' + tag + '(\\s[^>]*)?>', 'g')) || []).length;
  const closes = (html.match(new RegExp('</' + tag + '>', 'g')) || []).length;
  if (opens !== closes) fail(`<${tag}> tag mismatch: ${opens} opening vs ${closes} closing`);
  else ok(`<${tag}> tags balanced (${opens})`);
}

// --- Extract and execute every <script> block against a minimal DOM shim ---
const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m => m[1]);
if (scripts.length === 0) fail('no <script> blocks found');
else ok(`found ${scripts.length} <script> blocks`);

function makeEl() {
  return {
    addEventListener() {},
    classList: { add() {}, remove() {}, contains: () => false, toggle() {} },
    style: { setProperty() {} },
    dataset: {},
    textContent: '',
    innerHTML: '',
    children: [],
    querySelectorAll: () => [],
    querySelector: () => null,
    appendChild() {},
    setAttribute() {},
    getAttribute: () => null,
    getContext: () => null,
    cloneNode() { return makeEl(); },
  };
}

const sandbox = {
  window: {},
  document: {
    querySelector: () => makeEl(),
    querySelectorAll: () => [],
    getElementById: () => makeEl(),
    createElement: () => makeEl(),
    createTextNode: (text) => ({ textContent: text, nodeValue: text }),
    addEventListener() {},
    body: makeEl(),
    documentElement: makeEl(),
  },
  localStorage: { getItem: () => null, setItem() {} },
  navigator: { language: 'en' },
  AudioContext: function () {
    return {
      createOscillator: () => ({ connect() {}, start() {}, stop() {}, frequency: { setValueAtTime() {} } }),
      createGain: () => ({ connect() {}, gain: { setValueAtTime() {}, linearRampToValueAtTime() {}, exponentialRampToValueAtTime() {} } }),
      destination: {},
      currentTime: 0,
      close() {},
      resume() {},
    };
  },
  setInterval: () => 0,
  clearInterval() {},
  setTimeout: (fn) => 0,
  clearTimeout() {},
  console,
};
sandbox.window.innerWidth = 1920;
sandbox.window.innerHeight = 1080;
sandbox.window.addEventListener = function () {};
sandbox.webkitAudioContext = sandbox.AudioContext;
vm.createContext(sandbox);

scripts.forEach((code, i) => {
  try {
    vm.runInContext(code, sandbox, { filename: `inline-script-${i}.js` });
    ok(`script block ${i} parsed and executed (${code.length} chars)`);
  } catch (e) {
    fail(`script block ${i} threw: ${e.message}`);
  }
});

// --- Functional smoke test: run a real newGame() across all map sizes/troop tiers ---
try {
  const sizes = [8, 10, 12, 14, 16];
  const tiers = ['none', 'few', 'mid', 'many'];
  for (const size of sizes) {
    for (const tier of tiers) {
      vm.runInContext(`troopsChoice = ${JSON.stringify(tier)}; newGame(${size});`, sandbox);
      const size2 = vm.runInContext('G.size', sandbox);
      const unitCount = vm.runInContext("G.units.filter(u=>u.side==='P').length", sandbox);
      const expected = vm.runInContext(`TROOPS_TIERS[${JSON.stringify(tier)}].count`, sandbox);
      if (size2 !== size) fail(`newGame(${size}) produced G.size=${size2}`);
      if (unitCount !== expected) fail(`size=${size} tier=${tier}: expected ${expected} units, got ${unitCount}`);
    }
  }
  ok(`newGame() smoke test passed across ${sizes.length} sizes x ${tiers.length} troop tiers`);
} catch (e) {
  fail(`newGame() smoke test threw: ${e.message}`);
}

if (failed) {
  console.error('\nCI check failed.');
  process.exit(1);
} else {
  console.log('\nAll checks passed.');
}
