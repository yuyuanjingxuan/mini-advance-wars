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

const storage = new Map();

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
  localStorage: {
    getItem: key => storage.has(key) ? storage.get(key) : null,
    setItem: (key, value) => storage.set(key, String(value)),
    removeItem: key => storage.delete(key),
    clear: () => storage.clear(),
  },
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
  crypto: { getRandomValues(values) { values[0] = 0x12345678; return values; } },
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

// --- Regression checks for rules that have previously drifted or broken ---
try {
  const missingKeys = vm.runInContext(`Object.keys(I18N.zh).filter(k=>!(k in I18N.en))
    .concat(Object.keys(I18N.en).filter(k=>!(k in I18N.zh)))`, sandbox);
  if (missingKeys.length) fail(`i18n key mismatch: ${missingKeys.join(', ')}`);
  else ok('Chinese and English i18n keys match');

  const scenariosValid = vm.runInContext(`Object.keys(SCENARIOS).length===5&&Object.values(SCENARIOS).every(s=>
    VALID_MAP_SIZES.includes(s.size)&&Number.isInteger(s.seed)&&s.goal&&Array.isArray(s.tiles)&&Array.isArray(s.units)&&
    s.units.every(u=>['P','E'].includes(u[0])&&UNIT_TYPES[u[1]]&&u[2]>=0&&u[2]<s.size&&u[3]>=0&&u[3]<s.size))`, sandbox);
  if (!scenariosValid) fail('academy scenario definitions are invalid');
  else ok('all five academy scenario definitions are structurally valid');

  const scenarioStarts = vm.runInContext(`Object.keys(SCENARIOS).every(id=>{
    gameModeChoice='academy';scenarioChoice=id;newGame(10);
    return G.scenario.id===id&&G.size===SCENARIOS[id].size&&G.units.length===SCENARIOS[id].units.length;
  })`, sandbox);
  if (!scenarioStarts) fail('one or more academy scenarios failed to initialize');
  else ok('all academy scenarios initialize from their data definitions');

  const scenarioGoal = vm.runInContext(`
    gameModeChoice='academy';scenarioChoice='basics';newGame(8);
    const goal=G.scenario.goal;G.caps.get(goal.x+','+goal.y).owner='P';checkEnd();G.over;
  `, sandbox);
  if (!scenarioGoal) fail('scenario capture objective did not end the game');
  else ok('scenario-specific capture objective ends the game');
  vm.runInContext(`gameModeChoice='skirmish';`, sandbox);

  vm.runInContext(`
    newGame(8);
    G.map=Array.from({length:8},()=>Array(8).fill('plain'));
    G.caps=new Map();
    const gun=makeUnit('E','artillery',1,1);
    const target=makeUnit('P','infantry',5,1);
    G.units=[gun,target];
  `, sandbox);
  const indirectTarget = vm.runInContext('aiPlan(gun).target', sandbox);
  if (indirectTarget) fail('indirect-fire AI planned an attack that requires moving first');
  else ok('indirect-fire AI does not plan move-and-fire attacks');

  vm.runInContext(`
    newGame(8);
    G.map[1][1]='city';
    G.caps=new Map([['1,1',{owner:'P',prog:0}]]);
    const actor=makeUnit('E','engineer',1,1);
    const victim=makeUnit('P','infantry',2,1);
    const damaged=makeUnit('E','tank',1,2); damaged.hp=4;
    G.units=[actor,victim,damaged];
  `, sandbox);
  const mainAction = vm.runInContext('aiMainActionKind(actor,victim,true)', sandbox);
  if (mainAction !== 'attack') fail(`AI selected ${mainAction} instead of its single attack action`);
  else ok('AI chooses exactly one prioritized main action');

  vm.runInContext(`
    newGame(8);
    const owned=[...G.caps].find(([,cap])=>cap.owner==='E');
    const [hx,hy]=owned[0].split(',').map(Number);
    const resting=makeUnit('E','infantry',hx,hy); resting.hp=4;
    G.units=[resting];
    healOwnedUnits('E');
  `, sandbox);
  const healedHp = vm.runInContext('resting.hp', sandbox);
  if (healedHp !== 6) fail(`enemy-owned building healed to ${healedHp}, expected 6`);
  else ok('owned-building healing applies to the enemy side');

  vm.runInContext(`
    newGame(8);
    const enemyHq=[...G.caps].find(([key,cap])=>{
      const [x,y]=key.split(',').map(Number);
      return cap.owner==='E'&&G.map[y][x]==='hq';
    });
    const [qx,qy]=enemyHq[0].split(',').map(Number);
    const capturer=makeUnit('P','infantry',qx,qy); capturer.hp=20;
    G.units=[capturer,makeUnit('E','infantry',0,0)];
    tryCapture(capturer); checkEnd();
  `, sandbox);
  const hqWon = vm.runInContext("G.over&&capAt(qx,qy).owner==='P'", sandbox);
  if (!hqWon) fail('capturing the enemy HQ did not end the game immediately');
  else ok('enemy HQ capture ends the game immediately');

  const bareRandom = scripts.some(code => /Math\.random\s*\(/.test(code));
  if (bareRandom) fail('production code contains a bare Math.random() call');
  else ok('all gameplay randomness uses explicit seeded RNG streams');

  vm.runInContext(`newGame(10,0x7F3A91C2); deterministicMapA=JSON.stringify(G.map); deterministicUnitsA=JSON.stringify(G.units);`, sandbox);
  vm.runInContext(`newGame(10,0x7F3A91C2); deterministicMapB=JSON.stringify(G.map); deterministicUnitsB=JSON.stringify(G.units);`, sandbox);
  const deterministic = vm.runInContext('deterministicMapA===deterministicMapB&&deterministicUnitsA===deterministicUnitsB', sandbox);
  if (!deterministic) fail('same seed did not reproduce the same map and starting roster');
  else ok('same seed reproduces the same map and starting roster');

  const mapCodeOk = vm.runInContext(`
    const code=encodeMapCode(10,0x7F3A91C2), parsed=decodeMapCode(code);
    code==='MAW-M1-10-7F3A91C2'&&parsed.size===10&&parsed.seed===0x7F3A91C2&&!decodeMapCode('MAW-M9-10-7F3A91C2')&&!decodeMapCode('bad');
  `, sandbox);
  if (!mapCodeOk) fail('map-code encode/decode validation failed');
  else ok('map-code encode/decode accepts current codes and rejects invalid versions/input');

  const rngRestored = vm.runInContext(`
    const r=createRng(123);r.next();const state=r.getState();const expected=r.next();
    const restored=createRng(state);restored.next()===expected;
  `, sandbox);
  if (!rngRestored) fail('RNG state did not restore the next value');
  else ok('RNG state restoration preserves the future sequence');

  vm.runInContext(`
    gameModeChoice='academy';scenarioChoice='transport';newGame(8,0x10203040);
    G.turn=4;G.funds.P=777;G.units[0].hp=3;
    const savedRngState=gameRng.getState();saveGame();
    const expectedNext=gameRandom();
    G=null;restoreGame();
    restoredSnapshot={turn:G.turn,funds:G.funds.P,hp:G.units[0].hp,caps:G.caps instanceof Map,rng:gameRandom(),state:savedRngState};
  `, sandbox);
  const saveRoundTrip = vm.runInContext(`restoredSnapshot.turn===4&&restoredSnapshot.funds===777&&restoredSnapshot.hp===3&&restoredSnapshot.caps&&restoredSnapshot.rng===expectedNext&&G.scenario.id==='transport'`, sandbox);
  if (!saveRoundTrip) fail('versioned save did not round-trip gameplay state and RNG');
  else ok('versioned save round-trips gameplay state, Map data, and RNG state');

  const badSaveRejected = vm.runInContext(`
    localStorage.setItem(SAVE_KEY,'{bad json');const badJson=readSave()===null;
    localStorage.setItem(SAVE_KEY,JSON.stringify({schema:999}));badJson&&readSave()===null;
  `, sandbox);
  if (!badSaveRejected) fail('bad JSON or unsupported save schema was accepted');
  else ok('bad JSON and unsupported save schemas are rejected safely');
} catch (e) {
  fail(`rule regression checks threw: ${e.message}`);
}

if (failed) {
  console.error('\nCI check failed.');
  process.exit(1);
} else {
  console.log('\nAll checks passed.');
}
