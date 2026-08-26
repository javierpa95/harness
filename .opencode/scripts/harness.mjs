#!/usr/bin/env node
// harness.mjs - Interactive dashboard + CLI for managing this SDD agent harness.
// Zero dependencies. Works on Linux, macOS and Windows (Node >= 18).
//
// Usage:
//   node .opencode/scripts/harness.mjs                  -> interactive dashboard (needs a real TTY)
//   node .opencode/scripts/harness.mjs models           -> list agents + their model + detected OpenCode setup
//   node .opencode/scripts/harness.mjs model <agent> <provider/model|inherit>
//   node .opencode/scripts/harness.mjs skills           -> list available skills
//   node .opencode/scripts/harness.mjs backlog [project|harness]  -> open backlog items
//   node .opencode/scripts/harness.mjs help

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import readlinePromises from 'node:readline/promises'; // promise-based question()
import { emitKeypressEvents } from 'node:readline'; // raw key events (NOT in /promises)
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const AGENTS_DIR = path.join(ROOT, '.opencode', 'agents');
const SKILLS_DIR = path.join(ROOT, '.opencode', 'skills');
const HARNESS_BACKLOG_FILE = path.join(ROOT, 'docs', 'harness', 'BACKLOG.md');
const PROJECT_BACKLOG_FILE = path.join(ROOT, 'docs', 'BACKLOG.md');

// ---------- generic helpers ----------

/** Read and split an agent file into { fmLines, body, eol }. */
function readAgentFile(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8');
  const eol = raw.includes('\r\n') ? '\r\n' : '\n';
  const lines = raw.split(/\r?\n/);
  const open = lines.indexOf('---');
  const close = lines.indexOf('---', open + 1);
  if (open !== 0 || close === -1) return { fmLines: null, body: lines, eol };
  return { fmLines: lines.slice(open + 1, close), body: lines, eol };
}

function getFrontmatterValue(fmLines, key) {
  if (!fmLines) return undefined;
  const re = new RegExp(`^${key}:\\s*(.+?)\\s*$`);
  for (const line of fmLines) {
    const m = line.match(re);
    if (m) return m[1].replace(/^['"]|['"]$/g, '');
  }
  return undefined;
}

function listAgentFiles() {
  if (!fs.existsSync(AGENTS_DIR)) return [];
  return fs.readdirSync(AGENTS_DIR).filter((f) => f.endsWith('.md')).sort();
}

function agentSummary(fileName) {
  const { fmLines } = readAgentFile(path.join(AGENTS_DIR, fileName));
  return {
    file: fileName,
    name: getFrontmatterValue(fmLines, 'name') || fileName.replace(/\.md$/, ''),
    mode: getFrontmatterValue(fmLines, 'mode') || '(default)',
    model: getFrontmatterValue(fmLines, 'model') || null,
  };
}

const MODEL_RE = /^[a-zA-Z0-9._-]+\/[a-zA-Z0-9._:-]+$/;

function projectName() {
  try {
    const agents = fs.readFileSync(path.join(ROOT, 'AGENTS.md'), 'utf8').split(/\r?\n/);
    const line = agents.find((l) => l.startsWith('**Proyecto:**'));
    if (line) {
      const m = line.match(/\*\*Proyecto:\*\*\s*(.+?)\s*[—-]/);
      if (m && m[1] && !m[1].startsWith('[')) return m[1];
    }
  } catch { /* fall through */ }
  return path.basename(ROOT);
}

function gitStatus() {
  try {
    const branch = execSync('git branch --show-current', { cwd: ROOT, encoding: 'utf8' }).trim() || '?';
    const dirty = execSync('git status --porcelain', { cwd: ROOT, encoding: 'utf8' }).trim();
    const n = dirty ? dirty.split('\n').length : 0;
    return { branch, dirty: n };
  } catch {
    return { branch: 'no-git', dirty: 0 };
  }
}

// ---------- OpenCode setup detection ----------
// SECURITY: we only ever read provider NAMES and model IDs. Never print or log
// the contents of auth.json / provider options — they hold API keys.

/** Strip // and /* *\/ comments while respecting string literals. */
export function stripJsonc(text) {
  let out = '';
  let inStr = false;
  let inEsc = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    const n = text[i + 1];
    if (inStr) {
      out += c;
      if (inEsc) inEsc = false;
      else if (c === '\\') inEsc = true;
      else if (c === '"') inStr = false;
      continue;
    }
    if (c === '"') { inStr = true; out += c; continue; }
    if (c === '/' && n === '/') { while (i < text.length && text[i] !== '\n') i++; out += '\n'; continue; }
    if (c === '/' && n === '*') { i += 2; while (i < text.length && !(text[i] === '*' && text[i + 1] === '/')) i++; i++; continue; }
    out += c;
  }
  return out;
}

function parseJsoncFile(p) {
  try {
    return JSON.parse(stripJsonc(fs.readFileSync(p, 'utf8')));
  } catch {
    return null;
  }
}

let _setupCache;

/** Detect the user's OpenCode installation: configs + authenticated providers. */
function detectOpencodeSetup() {
  if (_setupCache) return _setupCache;
  const home = os.homedir();

  const globalPaths = [
    process.env.OPENCODE_CONFIG,
    path.join(home, '.config', 'opencode', 'opencode.jsonc'),
    path.join(home, '.config', 'opencode', 'opencode.json'),
  ].filter(Boolean);

  const projectPaths = [
    path.join(ROOT, 'opencode.jsonc'),
    path.join(ROOT, 'opencode.json'),
    path.join(AGENTS_DIR.replace(/[\\/]agents$/, ''), 'opencode.jsonc'),
  ];

  const findFirst = (paths) => paths.find((p) => p && fs.existsSync(p)) || null;

  const globalPath = findFirst(globalPaths);
  const projectPath = findFirst(projectPaths);
  const g = globalPath ? parseJsoncFile(globalPath) || {} : {};
  const p = projectPath ? parseJsoncFile(projectPath) || {} : {};

  const providers = new Set([
    ...Object.keys(g.provider || {}),
    ...Object.keys(p.provider || {}),
  ]);

  // Model IDs explicitly declared in configs (custom/compatible providers).
  // Standard providers get theirs from the models.dev registry instead.
  const declaredModels = {};
  for (const src of [g.provider || {}, p.provider || {}]) {
    for (const [k, v] of Object.entries(src)) {
      const ids = Object.keys((v && v.models) || {});
      declaredModels[k] = [...new Set([...(declaredModels[k] || []), ...ids])];
    }
  }

  const agentOverrides = [];
  for (const [srcName, src] of [['global', g], ['proyecto', p]]) {
    for (const [name, cfg] of Object.entries(src.agent || {})) {
      if (cfg && cfg.model) agentOverrides.push(`${name}=${cfg.model} (${srcName})`);
    }
  }

  let authed = [];
  const authPath = path.join(home, '.local', 'share', 'opencode', 'auth.json');
  try {
    const auth = JSON.parse(fs.readFileSync(authPath, 'utf8'));
    // Names only — never touch the values.
    authed = Object.keys(auth).sort();
    authed.forEach((a) => providers.add(a));
  } catch { /* no auth yet */ }

  _setupCache = {
    globalPath,
    projectPath,
    model: p.model || g.model || null,
    smallModel: p.small_model || g.small_model || null,
    configuredProviders: [...providers].sort(),
    authedProviders: authed,
    declaredModels,
    agentOverrides,
  };
  return _setupCache;
}

// ---------- CLI commands ----------

function cmdModels() {
  console.log('');
  console.log('Agentes (.opencode/agents/)');
  console.log('='.repeat(60));
  for (const a of listAgentFiles().map(agentSummary)) {
    const model = a.model || '(hereda el modelo global)';
    const tag = a.mode === 'primary' ? '[primary]' : '[subagent]';
    console.log(`  ${a.name.padEnd(22)} ${tag.padEnd(11)} ${model}`);
  }
  console.log('='.repeat(60));

  const s = detectOpencodeSetup();
  console.log('');
  console.log('Instalacion OpenCode detectada:');
  console.log(`  Config global       ${s.globalPath || '(no encontrada)'}`);
  console.log(`  Config proyecto     ${s.projectPath || '(no encontrada)'}`);
  console.log(`  Modelo por defecto  ${s.model || '(no fijado)'}`);
  console.log(`  small_model         ${s.smallModel || '(no fijado)'}`);
  console.log(`  Con auth            ${s.authedProviders.length ? s.authedProviders.join(', ') : '(ninguno — usa "opencode auth login")'}`);
  const onlyCfg = s.configuredProviders.filter((x) => !s.authedProviders.includes(x));
  if (onlyCfg.length) console.log(`  Solo en config      ${onlyCfg.join(', ')}`);
  const declEntries = Object.entries(s.declaredModels).filter(([, v]) => v.length);
  if (declEntries.length) {
    console.log('  Modelos declarados:');
    for (const [k, ids] of declEntries) {
      console.log(`    ${k.padEnd(16)} ${ids.slice(0, 4).join(', ')}${ids.length > 4 ? `, +${ids.length - 4} mas` : ''}`);
    }
  }
  if (s.agentOverrides.length) {
    console.log('  Overrides json      ' + s.agentOverrides.join(', '));
  }
  console.log('');
  console.log('Catalogo completo de modelos disponibles: comando "opencode models"');
  console.log('Cambia un modelo con: make model AGENT=<nombre> MODEL=<provider/model>');
  console.log('');
}

function applyModelChange(fileName, modelArg) {
  const filePath = path.join(AGENTS_DIR, fileName);
  const { fmLines, body, eol } = readAgentFile(filePath);
  if (!fmLines) throw new Error(`${fileName} no tiene frontmatter valido`);

  const open = body.indexOf('---');
  const close = body.indexOf('---', open + 1);

  const clear = ['inherit', 'none', '--clear'].includes(modelArg.toLowerCase());
  if (!clear && !MODEL_RE.test(modelArg)) {
    throw new Error(`Modelo invalido "${modelArg}" — formato: provider/model-id`);
  }

  let fm = [...fmLines];
  const idx = fm.findIndex((l) => /^model:\s*/.test(l));

  if (clear) {
    if (idx === -1) return `${fileName.replace(/\.md$/, '')}: ya hereda el modelo global.`;
    fm.splice(idx, 1);
  } else if (idx >= 0) {
    fm[idx] = `model: ${modelArg}`;
  } else {
    const modeIdx = fm.findIndex((l) => /^mode:\s*/.test(l));
    fm.splice(modeIdx >= 0 ? modeIdx + 1 : 0, 0, `model: ${modelArg}`);
  }

  const nextBody = [...body.slice(0, open + 1), ...fm, ...body.slice(close)];
  fs.writeFileSync(filePath, nextBody.join(eol), 'utf8');

  return clear
    ? `${fileName.replace(/\.md$/, '')}: modelo eliminado, hereda el global.`
    : `${fileName.replace(/\.md$/, '')}: model -> ${modelArg} (reinicia OpenCode)`;
}

function cmdModel(agentArg, modelArg) {
  if (!agentArg || !modelArg) {
    console.error('Uso: make model AGENT=<agente> MODEL=<provider/model | inherit>');
    console.error('      (o directamente: node .opencode/scripts/harness.mjs model <agente> <modelo>)');
    process.exit(1);
  }
  const wanted = agentArg.replace(/\.md$/, '');
  const file = listAgentFiles().find((f) => f.replace(/\.md$/, '') === wanted);
  if (!file) {
    console.error(`[ERROR] Agente no encontrado: "${wanted}"`);
    console.error('Agentes disponibles:');
    for (const f of listAgentFiles()) console.error(`  - ${f.replace(/\.md$/, '')}`);
    process.exit(1);
  }
  try {
    console.log(`[OK] ${applyModelChange(file, modelArg)}`);
  } catch (e) {
    console.error(`[ERROR] ${e.message}`);
    process.exit(1);
  }
}

function skillSummaries() {
  if (!fs.existsSync(SKILLS_DIR)) return [];
  return fs.readdirSync(SKILLS_DIR)
    .filter((d) => fs.existsSync(path.join(SKILLS_DIR, d, 'SKILL.md')))
    .sort()
    .map((d) => {
      const raw = fs.readFileSync(path.join(SKILLS_DIR, d, 'SKILL.md'), 'utf8');
      const m = raw.match(/^description:\s*(.+?)$/m);
      return { name: d, desc: m ? m[1].trim() : '(sin descripcion)' };
    });
}

function cmdSkills() {
  console.log('');
  console.log('Skills disponibles (.opencode/skills/)');
  console.log('='.repeat(60));
  for (const s of skillSummaries()) console.log(`  ${s.name.padEnd(20)} ${s.desc.slice(0, 90)}`);
  console.log('');
}

function backlogItems(file) {
  if (!fs.existsSync(file)) return [];
  return fs.readFileSync(file, 'utf8')
    .split(/\r?\n/)
    .filter((l) => /^\s*- \[ \]/.test(l))
    .map((l) => l.replace(/^\s*- \[ \]\s*/, '').trim());
}

function cmdBacklog(source = 'project') {
  const isHarness = String(source).toLowerCase().startsWith('harness');
  const file = isHarness ? HARNESS_BACKLOG_FILE : PROJECT_BACKLOG_FILE;
  const items = backlogItems(file);
  console.log('');
  console.log(`Backlog ${isHarness ? 'del harness' : 'del proyecto'} (${items.length}) — ${path.relative(ROOT, file)}`);
  console.log('='.repeat(60));
  if (!items.length) console.log(isHarness ? '  (vacio)' : '  (vacio — las ideas futuras del proyecto van aqui)');
  for (const it of items.slice(0, 20)) console.log(`  [ ] ${it}`);
  console.log('');
}

function cmdHelp() {
  console.log(`
harness.mjs - gestor del harness SDD

Comandos:
  models                       Agentes, modelos y deteccion de tu instalacion OpenCode
  model <agente> <modelo>      Fija el modelo de un agente (provider/model-id)
                               Usa "inherit" para volver al modelo global
  skills                       Lista las skills disponibles
  backlog [project|harness]    Items abiertos (default: proyecto)
  doctor                       Auditoria de salud: permisos, modelos, config
  mode [auto|seguro]           Muestra o cambia el modo de permisos bash
  tui                          Dashboard interactivo (igual que sin argumentos)
  help                         Esta ayuda
`);
}

// ---------- permission mode manager (managed bash block in opencode.jsonc) ----------

const BASH_START = /\/\/\s*harness:bash:start\s*modo=(\w+)/;
const BASH_END_MARKER = '// harness:bash:end';

// Value of permission.bash per mode. Lines are prefixed with the block indent
// by setMode(); keep them relative and simple.
const MODE_PRESETS = {
  auto: [
    // sin coma final: bash es la ultima propiedad de "permission"
    '"bash": {',
    '  "*": "allow",',
    '  // suelo anti-desastres: preguntan aunque estes en AUTO',
    '  "rm -rf *": "ask",',
    '  "sudo *": "ask",',
    '  "git push --force*": "ask",',
    '  "git reset --hard*": "ask"',
    '}'
  ],
  seguro: [
    '"bash": {',
    '  "*": "ask"',
    '}'
  ],
};

function configPath() {
  return path.join(ROOT, '.opencode', 'opencode.jsonc');
}

function getMode() {
  try {
    const raw = fs.readFileSync(configPath(), 'utf8');
    const m = raw.match(BASH_START);
    return m && m[1] === 'auto' ? 'auto' : 'seguro';
  } catch {
    return 'seguro';
  }
}

function setMode(mode) {
  if (!MODE_PRESETS[mode]) throw new Error(`Modo desconocido: "${mode}" (usa auto | seguro)`);
  const raw = fs.readFileSync(configPath(), 'utf8');
  const eol = raw.includes('\r\n') ? '\r\n' : '\n';
  const lines = raw.split(/\r?\n/);
  const si = lines.findIndex((l) => BASH_START.test(l));
  const ei = lines.findIndex((l) => l.trim() === BASH_END_MARKER);
  if (si === -1 || ei === -1 || ei < si) throw new Error('Bloque gestionado harness:bash no encontrado en opencode.jsonc');

  const indent = lines[si].match(/^\s*/)[0];
  const replacement = [
    indent + `// harness:bash:start modo=${mode}`,
    ...MODE_PRESETS[mode].map((l) => indent + l),
    indent + BASH_END_MARKER,
  ];
  lines.splice(si, ei - si + 1, ...replacement);

  const out = lines.join(eol);
  // OpenCode tolera comas colgantes (schema allowTrailingCommas): validar en
  // modo tolerante para no rechazar configs legitimas del usuario.
  JSON.parse(stripJsonc(out).replace(/,\s*([}\]])/g, '$1'));
  fs.writeFileSync(configPath(), out, 'utf8');
  return mode;
}

function cmdMode(newMode) {
  if (!newMode) {
    const mode = getMode();
    console.log('');
    console.log(`Modo de permisos actual: ${mode === 'auto' ? 'AUTO (todo allow; preguntan rm -rf/sudo/force-push)' : 'SEGURO (bash pregunta)'}`);
    console.log('Cambiar con: make mode MODE=auto   |   make mode MODE=seguro');
    console.log('');
    return;
  }
  const target = String(newMode).toLowerCase();
  const before = getMode();
  setMode(target);
  console.log(`[OK] Modo: ${before} -> ${target}. Reinicia OpenCode para que aplique.`);
  console.log('');
}

// ---------- audit engine (shared by `doctor` CLI and the TUI audit view) ----------

/**
 * Minimal YAML-subset parser for the `permission:` block of our agent
 * frontmatter. Supports exactly the shapes this template uses:
 *   permission:            <- top key
 *     edit:                <- level-1 tool, scalar OR nested map
 *       '*': 'deny'        <- level-2 pattern rules
 */
function parsePermissionBlock(fmLines) {
  const start = fmLines.findIndex((l) => /^permission:\s*$/.test(l));
  if (start === -1) return null;
  const perm = {};
  let current = null;
  for (let i = start + 1; i < fmLines.length; i++) {
    const line = fmLines[i];
    if (!line.trim()) continue;
    const indent = line.length - line.trimStart().length;
    if (indent === 0) break; // next top-level frontmatter key
    const m = line.trim().match(/^'?([^':]+)'?\s*:\s*(.*)$/);
    if (!m) continue;
    const key = m[1].trim();
    const rawVal = m[2].trim().replace(/^['"]|['"]$/g, '');
    if (indent <= 2) {
      if (rawVal) { perm[key] = rawVal; current = null; }
      else { perm[key] = {}; current = perm[key]; }
    } else if (current) {
      current[key] = rawVal;
    }
  }
  return perm;
}

/** OpenCode-style wildcard match: * = zero+ ANY chars (incl. /), ? = one char.
 *  Single pass over tokens — sequential replaces would contaminate each other
 *  (the '?'/'*' inserted by earlier steps being re-transformed by later ones). */
function globMatch(pattern, target) {
  const rx = pattern.replace(/\*\*\/|\*\*|\*|\?|[^*?]+/g, (tok) => {
    if (tok === '**/') return '(?:[\\s\\S]*/)?'; // cero o mas segmentos
    if (tok === '**' || tok === '*') return '[\\s\\S]*';
    if (tok === '?') return '.';
    return tok.replace(/[.+^${}()|[\]\\]/g, '\\$&');
  });
  return new RegExp(`^${rx}$`).test(target);
}

/** Evaluate an edit rules object with "last matching rule wins". */
function evalRules(rules, targetPath) {
  if (!rules || typeof rules !== 'object') return rules || null; // flat string action
  let action = null;
  for (const [pat, act] of Object.entries(rules)) {
    if (globMatch(pat, targetPath)) action = act;
  }
  return action;
}

/** Run health checks for one agent. Returns array of {sev, msg}. */
function auditAgent(sum, bodyText, globalPerm) {
  const issues = [];
  const perm = parsePermissionBlock(sum.fm);

  // 1. Memory writability: instructions mention MEMORY.md but edits deny it.
  if (bodyText.includes(`agent-memory/${sum.name}/MEMORY.md`)) {
    const allowed = evalRules(perm?.edit, `agent-memory/${sum.name}/MEMORY.md`) === 'allow';
    if (!allowed) issues.push({ sev: 'high', msg: 'instruye escribir su MEMORY.md pero edit no lo permite' });
  }

  // 2. Traitor read allow (bypasses the global .env safety net).
  if (/^\s*read:\s*['"]?allow['"]?\s*$/m.test(sum.fm.join('\n'))) {
    issues.push({ sev: 'high', msg: "read:'allow' plano anula el deny global de .env*" });
  }

  // 3. Model format.
  if (sum.model && !MODEL_RE.test(sum.model)) {
    issues.push({ sev: 'med', msg: `model "${sum.model}" no cumple provider/model-id` });
  }

  // 4. Description quality (drives subagent delegation).
  if ((sum.description || '').length < 15) {
    issues.push({ sev: 'low', msg: 'description muy corta: OpenCode delega peor' });
  }

  // 5. Deprecated tools block should be gone.
  if (sum.fm.some((l) => /^tools:\s*$/.test(l))) {
    issues.push({ sev: 'low', msg: 'usa tools: deprecado (v1.1.1 fusion en permission)' });
  }

  return { issues, perm };
}

function collectAudit() {
  const setup = detectOpencodeSetup();
  let globalPerm = null;
  try {
    const cfgPath = path.join(ROOT, '.opencode', 'opencode.jsonc');
    const cfg = JSON.parse(stripJsonc(fs.readFileSync(cfgPath, 'utf8')));
    globalPerm = cfg.permission || null;
  } catch { /* project config unreadable; agent-level checks still run */ }

  return listAgentFiles().map((f) => {
    const raw = fs.readFileSync(path.join(AGENTS_DIR, f), 'utf8');
    const { fmLines, body } = readAgentFile(path.join(AGENTS_DIR, f));
    const s = agentSummary(f);
    s.fm = fmLines || [];
    s.description = getFrontmatterValue(fmLines, 'description');
    const { issues, perm } = auditAgent(s, body.join('\n'), globalPerm);
    s.auditIssues = issues;
    s.effEdit = perm?.edit ?? globalPerm?.edit ?? '(default)';
    s.effBash = perm?.bash ?? globalPerm?.bash ?? '(default)';
    return s;
  });
}

function defaultAgentCheck() {
  try {
    const cfg = JSON.parse(stripJsonc(fs.readFileSync(path.join(ROOT, '.opencode', 'opencode.jsonc'), 'utf8')));
    const name = cfg.default_agent;
    const hit = listAgentFiles().map(agentSummary).find((r) => r.name === name);
    if (!hit) return { ok: false, msg: `default_agent "${name}" no existe entre los agentes` };
    if (hit.mode !== 'primary') return { ok: false, msg: `default_agent "${name}" no es mode: primary` };
    return { ok: true, msg: `default_agent "${name}" (primary, existe)` };
  } catch {
    return { ok: false, msg: 'opencode.jsonc ilegible' };
  }
}

function cmdDoctor() {
  console.log('');
  console.log('Doctor del harness — auditoria de agentes');
  console.log('='.repeat(60));

  const mode = getMode();
  console.log(`  [MODO] ${mode === 'auto' ? 'AUTO — bash permitido salvo suelo anti-desastres' : 'SEGURO — bash pregunta antes de ejecutar'}`);
  const askers = listAgentFiles().map(agentSummary).filter((a) => {
    const { fmLines } = readAgentFile(path.join(AGENTS_DIR, a.file));
    const p = parsePermissionBlock(fmLines || []);
    return typeof p?.bash === 'string' ? p.bash === 'ask' : p?.bash?.['*'] === 'ask';
  });
  console.log(`  Agentes con bash propio que preguntan: ${askers.length ? askers.map((a) => a.name).join(', ') : '(ninguno)'}`);
  console.log('');

  const daCheck = defaultAgentCheck();
  console.log(`  ${daCheck.ok ? '[OK]  ' : '[ALTA]'} ${daCheck.msg}`);

  let total = 0;
  for (const a of collectAudit()) {
    total += a.auditIssues.length;
    const tag = a.auditIssues.length ? `${a.auditIssues.length} aviso(s)` : 'limpio';
    console.log(`  ${a.auditIssues.length ? '[AVISO]' : '[OK]  '} ${a.name.padEnd(20)} ${tag}`);
    for (const it of a.auditIssues) console.log(`         - (${it.sev}) ${it.msg}`);
  }
  console.log('='.repeat(60));
  console.log(total ? `${total} aviso(s). Detalles arriba.` : 'Todo limpio.');
  console.log('');
}

// ---------- interactive dashboard (v1) ----------


// ANSI helpers (no deps). Windows Terminal / modern conhost render these fine.
const C = {
  reset: '\x1b[0m', bold: '\x1b[1m', dim: '\x1b[2m', inverse: '\x1b[7m',
  cyan: '\x1b[36m', green: '\x1b[32m', yellow: '\x1b[33m', red: '\x1b[31m',
};
const HOME = '\x1b[H'; // cursor home (no full clear -> no flicker)
const CLR_EOL = '\x1b[K'; // clear to end of line
const HIDE_CURSOR = '\x1b[?25l';
const SHOW_CURSOR = '\x1b[?25h';
const ENTER_ALT = '\x1b[?1049h'; // alternate screen: terminal restored on exit
const LEAVE_ALT = '\x1b[?1049l';

// Frame geometry: fixed height so switching views never jumps.
const W = 72;
const BODY_ROWS = 15;

function visLen(s) {
  return s.replace(/\x1b\[[0-9;]*m/g, '').length;
}

/** Clamp a decorated string to the inner width; falls back to plain on overflow. */
function fit(content) {
  if (visLen(content) <= W - 4) return content;
  return content.replace(/\x1b\[[0-9;]*m/g, '').slice(0, W - 4);
}

function boxLine(content) {
  const c = fit(content);
  // borders(2) + leading space(1) + content + trailing space(1) = W
  return `│ ${c}${' '.repeat(Math.max(0, W - 4 - visLen(c)))} │`;
}

function boxTop(ch = '┌') {
  return C.dim + ch + '─'.repeat(W - 2) + '┐' + C.reset;
}
function boxBottom() {
  return C.dim + '└' + '─'.repeat(W - 2) + '┘' + C.reset;
}
function boxSep() {
  return C.dim + '├' + '─'.repeat(W - 2) + '┤' + C.reset;
}

function enableRawMode() {
  emitKeypressEvents(process.stdin);
  process.stdin.setRawMode(true);
  process.stdin.resume();
}

function disableRawMode() {
  process.stdin.setRawMode(false);
  process.stdin.pause();
}

/** Wait for one keypress (raw mode must be enabled). */
function nextKey() {
  return new Promise((resolve) => {
    const onData = (str, key) => {
      process.stdin.removeListener('keypress', onData);
      resolve(key || { name: str, str });
    };
    process.stdin.on('keypress', onData);
  });
}

async function askLine(question) {
  // Cooked mode for text input.
  disableRawMode();
  const rl = readlinePromises.createInterface({ input: process.stdin, output: process.stdout });
  try {
    return (await rl.question(question)).trim();
  } finally {
    rl.close();
  }
}

async function cmdTui() {
  // The old v0 failed through `make` because stdin was not a real TTY and the
  // readline loop misbehaved. Guard explicitly and offer the CLI alternative.
  if (!process.stdin.isTTY || !process.stdout.isTTY) {
    console.log('[!] El dashboard interactivo necesita una terminal real (TTY).');
    console.log('    Ejecutalo directamente en tu terminal:');
    console.log('        node .opencode/scripts/harness.mjs');
    console.log('    O usa los subcomandos no interactivos:');
    console.log('        node .opencode/scripts/harness.mjs models|skills|backlog');
    console.log('        node .opencode/scripts/harness.mjs model <agente> <modelo|inherit>');
    return;
  }

  const VIEWS = [
    { id: 'agents', title: 'Agentes', hint: 'Enter=modelo · i=heredar · Esc=volver' },
    { id: 'skills', title: 'Skills', hint: 'Esc=volver' },
    { id: 'backlog', title: 'Backlog', hint: 'b=fuente (proyecto/harness) · Esc=volver' },
    { id: 'providers', title: 'Proveedores', hint: 'Esc=volver' },
    { id: 'audit', title: 'Auditoria', hint: 'Enter=detalle · r=reescribir · Esc=volver' },
    { id: 'help', title: 'Ayuda', hint: 'Esc=volver' },
  ];

  let viewIdx = 0;
  let cursor = 0;
  let status = 'Bienvenido. q para salir.';
  let detail = null; // per-view transient state (e.g. agent action menu)
  let backlogSource = 'project';

  const agents = () => listAgentFiles().map(agentSummary);

  function renderViewBody() {
    const v = VIEWS[viewIdx];
    const lines = [];

    if (v.id === 'agents') {
      if (detail && detail.type === 'agent-actions') {
        const a = agents()[detail.index];
        const opt = (label, selected) =>
          selected ? `  ${C.inverse} ${label} ${C.reset}` : `    ${label}`;
        lines.push(`${C.bold}  ${a.name}${C.reset}  ${C.dim}[${a.mode}]${C.reset}`);
        lines.push(`  Modelo actual: ${a.model ? C.cyan + a.model + C.reset : C.dim + '(hereda el global)' + C.reset}`);
        lines.push('');
        lines.push(opt('Enter: fijar modelo', detail.sel === 0));
        lines.push(opt('i:     heredar (inherit)', detail.sel === 1));
        lines.push(opt('Esc:   volver', detail.sel === 2));
        return lines;
      }
      agents().forEach((a, i) => {
        const cur = i === cursor;
        const marker = cur ? `${C.green}>${C.reset}` : ' ';
        const tag = a.mode === 'primary' ? C.yellow + '[primary]' + C.reset : C.dim + '[sub ]' + C.reset;
        const model = a.model ? C.cyan + a.model.padEnd(28) + C.reset : C.dim + '(hereda)'.padEnd(28) + C.reset;
        const name = cur ? C.bold + a.name.padEnd(20) + C.reset : a.name.padEnd(20);
        lines.push(` ${marker} ${name} ${tag} ${model}`);
      });
      const withModel = agents().filter((a) => a.model).length;
      lines.push('');
      lines.push(C.dim + `  ${agents().length} agentes · ${withModel} con modelo propio · resto hereda` + C.reset);
      return lines;
    }

    if (v.id === 'skills') {
      for (const s of skillSummaries()) {
        lines.push(`  ${C.bold}${s.name.padEnd(20)}${C.reset} ${s.desc.slice(0, 38)}`);
      }
      return lines;
    }

    if (v.id === 'backlog') {
      const file = backlogSource === 'project' ? PROJECT_BACKLOG_FILE : HARNESS_BACKLOG_FILE;
      lines.push(`  Fuente: ${backlogSource === 'project'
        ? C.bold + 'docs/BACKLOG.md (proyecto)' + C.reset
        : C.bold + 'docs/harness/BACKLOG.md (harness)' + C.reset}`);
      lines.push(C.dim + '  [b] alterna entre proyecto y harness' + C.reset);
      lines.push('');
      const items = backlogItems(file);
      if (!items.length) lines.push(`  (sin items abiertos${backlogSource === 'project' ? ' — las ideas futuras van aqui' : ''})`);
      items.slice(0, 8).forEach((it) => lines.push(`  ${C.yellow}[ ]${C.reset} ${it.slice(0, 56)}`));
      if (items.length > 8) lines.push(C.dim + `  ... y ${items.length - 8} mas` + C.reset);
      return lines;
    }

    if (v.id === 'providers') {
      const s = detectOpencodeSetup();
      lines.push(`  Default : ${s.model ? C.cyan + s.model + C.reset : C.dim + '(no fijado)' + C.reset}`);
      lines.push(`  Small   : ${s.smallModel ? C.cyan + s.smallModel + C.reset : C.dim + '(no fijado)' + C.reset}`);
      lines.push('');
      if (s.authedProviders.length) {
        lines.push(`  ${C.green}Con auth:${C.reset}`);
        s.authedProviders.slice(0, 5).forEach((p) => lines.push(`    ${C.green}*${C.reset} ${p}`));
        if (s.authedProviders.length > 5) lines.push(C.dim + `    ... y ${s.authedProviders.length - 5} mas` + C.reset);
      } else {
        lines.push(C.dim + '  Sin proveedores autenticados ("opencode auth login")' + C.reset);
      }
      const onlyCfg = s.configuredProviders.filter((x) => !s.authedProviders.includes(x));
      if (onlyCfg.length) {
        lines.push(`  ${C.dim}Solo en config: ${onlyCfg.join(', ').slice(0, 44)}${C.reset}`);
      }
      const declEntries = Object.entries(s.declaredModels).filter(([, v]) => v.length);
      if (declEntries.length) {
        lines.push('');
        lines.push(`  ${C.bold}Modelos declarados en config:${C.reset}`);
        for (const [k, ids] of declEntries.slice(0, 3)) {
          lines.push(`    ${C.cyan}${k}${C.reset} ${C.dim}: ${ids.slice(0, 3).join(', ').slice(0, 34)}${ids.length > 3 ? `, +${ids.length - 3}` : ''}${C.reset}`);
        }
      }
      return lines;
    }

    if (v.id === 'audit') {
      const rows = collectAudit();
      if (detail && detail.type === 'audit-expand') {
        const a = rows[detail.index];
        lines.push(`${C.bold}  ${a.name}${C.reset}  ${C.dim}[${a.mode}]${C.reset}`);
        const editDesc = typeof a.effEdit === 'string'
          ? a.effEdit
          : `${Object.entries(a.effEdit)[0]?.[1] || '?'} (catch-all) + ${Math.max(0, Object.keys(a.effEdit).length - 1)} reglas`;
        lines.push(`  edit : ${C.cyan}${editDesc}${C.reset}`);
        for (const [pat, act] of Object.entries(typeof a.effEdit === 'object' ? a.effEdit : {})) {
          if (act === 'allow') lines.push(`         ${C.green}+ ${pat}${C.reset}`);
        }
        lines.push(`  bash : ${C.cyan}${typeof a.effBash === 'string' ? a.effBash : 'reglas propias'}${C.reset}`);
        lines.push('');
        if (!a.auditIssues.length) lines.push(`  ${C.green}Sin avisos.${C.reset}`);
        a.auditIssues.forEach((it) => {
          const color = it.sev === 'high' ? C.red : it.sev === 'med' ? C.yellow : C.dim;
          lines.push(`  ${color}* (${it.sev}) ${it.msg}${C.reset}`);
        });
        lines.push('');
        lines.push(C.dim + '  Esc: volver a la lista' + C.reset);
        return lines;
      }
      const da = defaultAgentCheck();
      lines.push(da.ok
        ? `  ${C.green}[OK]${C.reset} ${da.msg}`
        : `  ${C.red}[ALTA]${C.reset} ${da.msg}`);
      lines.push('');
      rows.forEach((a, i) => {
        const cur = i === cursor;
        const marker = cur ? `${C.green}>${C.reset}` : ' ';
        const flag = a.auditIssues.length
          ? `${a.auditIssues.some((x) => x.sev === 'high') ? C.red : C.yellow}!${a.auditIssues.length}${C.reset}`
          : `${C.dim}.${C.reset}`;
        const name = cur ? C.bold + a.name.padEnd(22) + C.reset : a.name.padEnd(22);
        lines.push(` ${marker} ${name} ${flag}`);
      });
      return lines;
    }

    // help
    lines.push('  Que es esto: panel de control del harness SDD.');
    lines.push('');
    lines.push('  Flujo: ANALYZE > SPEC > IMPLEMENT > REVIEW > DECIDE');
    lines.push('  Sesion: /start al abrir · /end al cerrar');
    lines.push('  Pendientes del proyecto: docs/BACKLOG.md (vista Backlog)');
    lines.push('  Dudas de uso: pregunta "que puedo hacer?" y se cargara');
    lines.push('  la skill harness-guide. Config profunda: @harness-arquitect.');
    return lines;
  }

  function draw() {
    const v = VIEWS[viewIdx];
    const g = gitStatus();
    const mode = getMode();
    const modeTxt = mode === 'auto'
      ? `${C.green}AUTO${C.reset}`
      : `${C.yellow}SEGURO${C.reset}`;
    const gitTxt = g.dirty
      ? `${C.yellow}${g.branch}${C.reset} · ${g.dirty} sin commit`
      : `${C.green}${g.branch}${C.reset} · limpio`;

    // Tab bar: compact cells guaranteed to fit even with all six views.
    const tabs = VIEWS.map((x, i) => {
      const label = ` ${i + 1}\u00b7${x.title}`;
      return i === viewIdx ? C.inverse + label + C.reset : C.dim + label + C.reset;
    }).join(' ');

    // Fixed-height body: pad to BODY_ROWS, never overflow.
    const body = renderViewBody();
    while (body.length < BODY_ROWS) body.push('');
    body.length = BODY_ROWS;

    const out = [
      HOME,
      boxTop(),
      boxLine(`${C.bold}${C.cyan}HARNESS${C.reset} ${C.dim}·${C.reset} ${projectName()}   ${C.dim}|${C.reset}   modo:${modeTxt}   ${C.dim}|${C.reset}   ${gitTxt}`),
      boxLine(tabs),
      boxSep(),
      ...body.map((l) => boxLine(l)),
      boxSep(),
      boxLine(C.dim + v.hint + C.reset),
      boxLine(`${C.green}»${C.reset} ${status}`),
      boxBottom(),
    ].join('\n' + CLR_EOL + '\n') + CLR_EOL;

    process.stdout.write(out);
  }

  enableRawMode();
  process.stdout.write(ENTER_ALT + HIDE_CURSOR);
  try {
    for (;;) {
      draw();
      const key = await nextKey();

      if (key.ctrl && key.name === 'c') break;
      if (key.name === 'q') break;

      // Manual refresh from anywhere.
      if (key.name === 'r' && !detail) { status = 'Vista reescrita.'; continue; }

      // Toggle permission mode from anywhere.
      if (key.name === 'm' && !detail) {
        try {
          const next = getMode() === 'auto' ? 'seguro' : 'auto';
          setMode(next);
          status = `Modo cambiado a ${next.toUpperCase()} — reinicia OpenCode para aplicar.`;
        } catch (e) {
          status = `${C.red}${e.message}${C.reset}`;
        }
        continue;
      }

      // Global view switch (only outside sub-menus).
      if (!detail && /^[1-6]$/.test(key.sequence || key.str || key.name)) {
        viewIdx = Number(key.sequence || key.str) - 1;
        cursor = 0;
        continue;
      }

      if (viewIdx === 0 && VIEWS[viewIdx].id === 'agents') {
        if (detail && detail.type === 'agent-actions') {
          if (key.name === 'up') detail.sel = (detail.sel + 2) % 3;
          else if (key.name === 'down') detail.sel = (detail.sel + 1) % 3;
          else if (key.name === 'escape') { detail = null; status = 'Cancelado.'; }
          else if (key.name === 'return') {
            const a = agents()[detail.index];
            if (detail.sel === 1) {
              status = applyModelChange(a.file, 'inherit');
              detail = null;
            } else if (detail.sel === 2) {
              detail = null;
            } else {
              draw();
              const s = detectOpencodeSetup();
              const prov = s.authedProviders;
              const decl = Object.entries(s.declaredModels).filter(([, v]) => v.length);
              let hint = '';
              if (prov.length) hint += `\n Con auth: ${prov.join(', ')}`;
              for (const [k, ids] of decl.slice(0, 3)) {
                hint += `\n ${k}: ${ids.join(', ')}`;
              }
              process.stdout.write(SHOW_CURSOR);
              const answer = await askLine(`${hint ? hint + '\n' : ''} Nuevo modelo para ${a.name} (provider/model-id | inherit | vacio cancela): `);
              enableRawMode(); // askLine dropped us back to cooked mode
              process.stdout.write(HIDE_CURSOR);
              if (!answer) { status = 'Cancelado.'; }
              else {
                try { status = applyModelChange(a.file, answer); }
                catch (e) { status = `${C.red}${e.message}${C.reset}`; }
              }
              detail = null;
            }
          }
          continue;
        }

        const count = agents().length;
        if (key.name === 'up') cursor = (cursor - 1 + count) % count;
        else if (key.name === 'down') cursor = (cursor + 1) % count;
        else if (key.name === 'i') {
          const a = agents()[cursor];
          status = a.model ? applyModelChange(a.file, 'inherit') : `${a.name}: ya hereda.`;
        }
        else if (key.name === 'return') {
          detail = { type: 'agent-actions', index: cursor, sel: 0 };
          status = 'Accion sobre el agente seleccionado.';
        }
      }

      // Backlog source toggle.
      if (viewIdx === 2 && VIEWS[viewIdx].id === 'backlog' && !detail) {
        if (key.name === 'b') {
          backlogSource = backlogSource === 'project' ? 'harness' : 'project';
        }
      }

      // Audit view: navigate and expand per-agent findings.
      if (viewIdx === 4 && VIEWS[viewIdx].id === 'audit') {
        if (detail && detail.type === 'audit-expand') {
          if (key.name === 'escape' || key.name === 'return') {
            detail = null;
            status = 'Lista de la auditoria.';
          }
        } else {
          const count = collectAudit().length;
          if (key.name === 'up') cursor = (cursor - 1 + count) % count;
          else if (key.name === 'down') cursor = (cursor + 1) % count;
          else if (key.name === 'return') {
            detail = { type: 'audit-expand', index: cursor };
            status = 'Hallazgos del agente.';
          }
        }
      }
    }
  } finally {
    disableRawMode();
    process.stdout.write(SHOW_CURSOR + LEAVE_ALT);
  }
  console.log('Dashboard cerrado. Hasta la proxima sesion.');
}

// ---------- entry point ----------

const [, , cmd, ...args] = process.argv;

switch (cmd || 'tui') {
  case 'models':
  case 'agents':
    cmdModels();
    break;
  case 'model':
    cmdModel(args[0], args[1]);
    break;
  case 'skills':
    cmdSkills();
    break;
  case 'backlog':
    cmdBacklog(args[0]);
    break;
  case 'doctor':
    cmdDoctor();
    break;
  case 'mode':
    cmdMode(args[0]);
    break;
  case 'tui':
    await cmdTui();
    break;
  case 'help':
  case '--help':
  case '-h':
    cmdHelp();
    break;
  default:
    console.error(`[ERROR] Comando desconocido: "${cmd}"`);
    cmdHelp();
    process.exit(1);
}
