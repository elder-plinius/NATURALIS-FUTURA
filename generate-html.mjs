/**
 * generate-html.mjs — Generates a standalone index.html from TS data files
 * Strategy: eval TS data → JSON → embed in HTML
 */
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const SRC = join(process.cwd(), 'src/data');

// ── Strip TS and extract arrays ──
function extractArray(filePath, varName) {
  let src = readFileSync(filePath, 'utf-8');
  src = src.replace(/^import\s+.*$/gm, '');
  src = src.replace(/:\s*(Creature|Region|CompoundThreat|HopeCreature|ThreatSignal|WatchSource|EvolutionEvent|ThreatSubmission)\[\]/g, '');
  src = src.replace(/:\s*(Creature|Region|CompoundThreat|HopeCreature|ThreatSignal|WatchSource|EvolutionEvent|ThreatSubmission)(?=\s)/g, '');
  src = src.replace(/export\s+const\s+/g, 'const ');
  const re = new RegExp('const\\s+' + varName + '\\s*=\\s*(\\[[\\s\\S]*?\\]);');
  const m = src.match(re);
  if (!m) throw new Error('Could not find ' + varName + ' in ' + filePath);
  return eval('(' + m[1] + ')');
}

function extractMultiple(filePath, varNames) {
  let src = readFileSync(filePath, 'utf-8');
  src = src.replace(/^import\s+.*$/gm, '');
  src = src.replace(/:\s*(ThreatSignal|WatchSource|EvolutionEvent|ThreatSubmission)\[\]/g, '');
  src = src.replace(/export\s+const\s+/g, 'const ');
  const results = {};
  for (const vn of varNames) {
    const re = new RegExp('const\\s+' + vn + '\\s*=\\s*(\\[[\\s\\S]*?\\]);');
    const m = src.match(re);
    if (!m) throw new Error('Could not find ' + vn);
    results[vn] = eval('(' + m[1] + ')');
  }
  return results;
}

console.log('Loading data...');
const regions = extractArray(join(SRC, 'regions.ts'), 'regions');
const abyss = extractArray(join(SRC, 'creatures-abyss.ts'), 'abyssCreatures');
const siren = extractArray(join(SRC, 'creatures-siren-sea.ts'), 'sirenSeaCreatures');
const hive = extractArray(join(SRC, 'creatures-hive.ts'), 'hiveCreatures');
const mirror = extractArray(join(SRC, 'creatures-mirror-dark.ts'), 'mirrorDarkCreatures');
const spawning = extractArray(join(SRC, 'creatures-spawning.ts'), 'spawningCreatures');
const colosseum = extractArray(join(SRC, 'creatures-colosseum.ts'), 'colosseumCreatures');
const throne = extractArray(join(SRC, 'creatures-throne.ts'), 'throneCreatures');
const catacombs = extractArray(join(SRC, 'creatures-catacombs.ts'), 'catacombsCreatures');
const compounds = extractArray(join(SRC, 'compounds.ts'), 'compoundThreats');
const hope = extractArray(join(SRC, 'hope.ts'), 'hopeCreatures');
const sig = extractMultiple(join(SRC, 'signals.ts'), ['threatSignals', 'watchSources', 'evolutionEvents', 'sampleSubmissions']);

const allCreatures = [...abyss, ...siren, ...hive, ...mirror, ...spawning, ...colosseum, ...throne, ...catacombs];

console.log('Creatures:', allCreatures.length);
console.log('Regions:', regions.length);
console.log('Compounds:', compounds.length);
console.log('Hope:', hope.length);
console.log('Signals:', sig.threatSignals.length);

const DATA = JSON.stringify({
  regions,
  allCreatures,
  compounds,
  hope,
  signals: sig.threatSignals,
  watchSources: sig.watchSources,
  evoEvents: sig.evolutionEvents,
  submissions: sig.sampleSubmissions,
});

// ── Read the CSS and JS template parts ──
const FONTS = readFileSync(join(process.cwd(), 'templates/fonts.css'), 'utf-8');
const CSS = FONTS + '\n' + readFileSync(join(process.cwd(), 'templates/style.css'), 'utf-8');
const JS = readFileSync(join(process.cwd(), 'templates/app.js'), 'utf-8');

const html = [
  '<!DOCTYPE html>',
  '<html lang="en">',
  '<head>',
  '<meta charset="UTF-8">',
  '<meta name="viewport" content="width=device-width, initial-scale=1.0">',
  '<title>NATURALIS FUTURA \u2014 An Encyclopaedia of the Latent World</title>',
  '<style>',
  CSS,
  '</style>',
  '</head>',
  '<body>',
  '<svg xmlns="http://www.w3.org/2000/svg" style="display:none">',
  '  <symbol id="icon-expand" viewBox="0 0 24 24"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></symbol>',
  '  <symbol id="icon-collapse" viewBox="0 0 24 24"><polyline points="4 14 10 14 10 20"/><polyline points="20 10 14 10 14 4"/><line x1="14" y1="10" x2="21" y2="3"/><line x1="3" y1="21" x2="10" y2="14"/></symbol>',
  '</svg>',
  '<div id="app">',
  '  <div id="atlas-rail">',
  '    <div id="rail-brand" title="Naturalis Futura">N·F</div>',
  '    <div id="rail-tabs">',
  '      <button class="atlas-tab active" data-view="map" onclick="switchView(\'map\')">Tabvla</button>',
  '      <button class="atlas-tab" data-view="risk-matrix" onclick="switchView(\'risk-matrix\')">I · Matrix</button>',
  '      <button class="atlas-tab" data-view="bestiary" onclick="switchView(\'bestiary\')">II · EncyclopÆdia</button>',
  '      <button class="atlas-tab" data-view="compounds" onclick="switchView(\'compounds\')">III · Compovnds</button>',
  '      <button class="atlas-tab" data-view="observatory" onclick="switchView(\'observatory\')">IV · Observatory</button>',
  '      <button class="atlas-tab" data-view="field-guide" onclick="switchView(\'field-guide\')">V · Field Gvide</button>',
  '      <button class="atlas-tab" data-view="technical" onclick="switchView(\'technical\')">VI · Technical</button>',
  '    </div>',
  '    <div class="rail-spacer"></div>',
  '    <div class="rail-util">',
  '      <button class="rail-btn" id="hope-toggle" onclick="toggleHope()" title="Reveal the hope creatures">Lvmen</button>',
  '      <span class="flr">❧</span>',
  '      <button class="rail-btn" onclick="toggleSearch()" title="Search ( / )">Qvære</button>',
  '      <span class="flr">❧</span>',
  '      <button class="rail-btn" onclick="toggleLegend()" title="How to read this chart">Legenda</button>',
  '      <span class="flr">❧</span>',
  '      <button class="rail-btn" id="theme-toggle" onclick="toggleTheme()" title="Day / candlelight">Nox</button>',
  '      <span class="flr">❧</span>',
  '      <select id="view-mode" onchange="setViewMode(this.value)" title="Reading depth">',
  '        <option value="novice">Novice</option>',
  '        <option value="scholar" selected>Scholar</option>',
  '        <option value="cartographer">Cartographer</option>',
  '      </select>',
  '    </div>',
  '  </div>',
  '  <div id="main-area">',
  '    <div id="map-layer"></div>',
  '    <div id="view-container"></div>',
  '    <div id="detail-panel"></div>',
  '  </div>',
  '</div>',
  '<div id="search-overlay" onclick="if(event.target===this)toggleSearch()">',
  '  <div id="search-box">',
  '    <input id="search-input" type="text" placeholder="Search creatures, regions, threat classes..." oninput="onSearch(this.value)" onkeydown="onSearchKey(event)">',
  '    <div id="search-results"></div>',
  '  </div>',
  '</div>',
  '<script>',
  'const __RAW_DATA__ = ' + DATA + ';',
  JS,
  '</script>',
  '</body>',
  '</html>',
].join('\n');

writeFileSync(join(process.cwd(), 'index.html'), html, 'utf-8');
const bytes = Buffer.byteLength(html, 'utf-8');
console.log('Generated index.html: ' + html.split('\n').length + ' lines, ' + (bytes/1024).toFixed(1) + 'KB');
