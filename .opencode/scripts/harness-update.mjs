#!/usr/bin/env node
// harness-update.mjs - Sync harness-owned files from the template checkout into
// a project created from this template. Project-owned files are NEVER touched.
//
// Zero dependencies. Works on Linux, macOS and Windows (Node >= 18).
//
// Usage:
//   node .opencode/scripts/harness-update.mjs --template <path-to-template> [--target <dir>] [--dry]
//
// Model:
//   A whitelist of harness files is synced from the template checkout.
//   A manifest (.opencode/harness-sync.json) stores the hash each synced file
//   had in this project at last sync, enabling 4-way classification:
//     install  - file does not exist yet here
//     update   - untouched locally since last sync -> fast-forward from template
//     current  - identical to template already
//     conflict - changed BOTH locally and upstream -> template written as <file>.new
//   Project-owned paths (docs/, agent-memory/, Makefile, opencode.jsonc,
//   AGENTS.md...) are never written; some are listed at the end as manual review.

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import os from 'node:os';

// ---------- helpers ----------

function sha256(p) {
  return crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
}

/** Strip // and slash-star comments while respecting string literals. */
function stripJsonc(text) {
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

function copyFile(src, dst) {
  fs.mkdirSync(path.dirname(dst), { recursive: true });
  // Preserve target line endings style by copying bytes verbatim.
  fs.copyFileSync(src, dst);
}

// ---------- what gets synced ----------

/** Static whitelist (relative to root). Never includes project-owned files. */
const STATIC_FILES = [
  '.opencode/.gitignore',
  '.opencode/commands/end.md',
  '.opencode/commands/start.md',
  '.opencode/rules/development.md',
  '.opencode/rules/git-workflow.md',
  '.opencode/rules/security.md',
  '.opencode/rules/structure.md',
  '.opencode/scripts/harness.mjs',
  '.opencode/scripts/harness-update.mjs',
  'init.sh',
  'init.ps1',
  'docs/harness/MCP-integration.md',
  'docs/harness/agents-patterns.md',
  'docs/harness/opencode-docs.md',
  'docs/harness/sdd-advanced.md',
];

/** Paths that look syncable but belong to the project or need manual merge. */
const NEVER_TOUCHED = [
  '.opencode/opencode.jsonc  (contiene default_agent y permisos propios del proyecto)',
  'Makefile                  (tus comandos dev/build viven aqui)',
  'AGENTS.md / CLAUDE.md / README.md / CONTEXT.md',
  'docs/BACKLOG.md           (backlog del proyecto)',
  'docs/harness/BACKLOG.md   (evolucion local del harness en este proyecto)',
  'agent-memory/**           (aprendizajes de los agentes)',
  'docs/features|architecture|legal|development, CHANGELOG',
];

function buildSyncList(tplRoot, tgtRoot) {
  const list = []; // { rel, src, dst, transform? }

  for (const rel of STATIC_FILES) {
    const src = path.join(tplRoot, rel);
    if (fs.existsSync(src)) list.push({ rel, src, dst: path.join(tgtRoot, rel) });
  }

  // Agents: map the renamed architect via default_agent in the clone config.
  let architectName = null;
  try {
    const cfg = JSON.parse(stripJsonc(fs.readFileSync(path.join(tgtRoot, '.opencode', 'opencode.jsonc'), 'utf8')));
    architectName = cfg.default_agent || null;
  } catch { /* fall through */ }

  const tplAgents = path.join(tplRoot, '.opencode', 'agents');
  if (fs.existsSync(tplAgents)) {
    for (const f of fs.readdirSync(tplAgents).filter((x) => x.endsWith('.md')).sort()) {
      if (f === 'project-architect.md' && architectName && architectName !== 'project-architect') {
        list.push({
          rel: `.opencode/agents/${architectName}.md`,
          src: path.join(tplAgents, f),
          dst: path.join(tgtRoot, '.opencode', 'agents', `${architectName}.md`),
          transform: (text) => text.replace(/^name: project-architect/m, `name: ${architectName}`),
        });
      } else {
        list.push({ rel: `.opencode/agents/${f}`, src: path.join(tplAgents, f), dst: path.join(tgtRoot, '.opencode', 'agents', f) });
      }
    }
  }

  // Skills: one SKILL.md per directory.
  const tplSkills = path.join(tplRoot, '.opencode', 'skills');
  if (fs.existsSync(tplSkills)) {
    for (const d of fs.readdirSync(tplSkills).sort()) {
      const src = path.join(tplSkills, d, 'SKILL.md');
      if (fs.existsSync(src)) {
        list.push({ rel: `.opencode/skills/${d}/SKILL.md`, src, dst: path.join(tgtRoot, '.opencode', 'skills', d, 'SKILL.md') });
      }
    }
  }

  return list;
}

// ---------- main ----------

const args = process.argv.slice(2);
const getArg = (name) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : null;
};
const dry = args.includes('--dry');
// init.sh/ps1 may have DELETED stack-irrelevant agents (e.g. no frontend).
// By default we respect those deletions and never reinstall them; the flag
// opts in to restoring every agent the template ships.
const restoreAgents = args.includes('--restore-agents');

// The project being updated defaults to cwd but must be explicit-able, since
// this script can also be invoked from the template checkout itself.
const tgtRoot = path.resolve(getArg('--target') || process.cwd());
let tplRoot = getArg('--template');
const MANIFEST_REL = path.join('.opencode', 'harness-sync.json');
const manifestPath = () => path.join(tgtRoot, MANIFEST_REL);

let manifest = { version: 1, updatedAt: null, template: null, files: {} };
if (fs.existsSync(manifestPath())) {
  try { manifest = { ...manifest, ...JSON.parse(fs.readFileSync(manifestPath(), 'utf8')) }; }
  catch { console.error('[WARN] manifest corrupto, se regenera'); }
}

if (!tplRoot) tplRoot = manifest.template || null;
if (!tplRoot) {
  console.error('[ERROR] Falta la ruta del template. Uso:');
  console.error('        make update TEMPLATE=<ruta/al/0.harnes>');
  process.exit(1);
}
tplRoot = path.resolve(tplRoot);
if (!fs.existsSync(path.join(tplRoot, '.opencode', 'agents'))) {
  console.error(`[ERROR] "${tplRoot}" no parece un checkout del template (falta .opencode/agents).`);
  process.exit(1);
}

const targets = buildSyncList(tplRoot, tgtRoot);
const result = { install: [], update: [], current: [], conflict: [], absent: [] };

for (const t of targets) {
  const tplHash = sha256(t.src);
  const existsDst = fs.existsSync(t.dst);
  const curHash = existsDst ? sha256(t.dst) : null;
  const prevHash = manifest.files[t.rel] || null;

  let action;
  if (!existsDst) {
    // Missing locally. If init/user removed an agent on purpose, respect it;
    // otherwise treat as a brand-new file from the template.
    action = (!restoreAgents && t.rel.startsWith('.opencode/agents/')) ? 'absent' : 'install';
  }
  else if (curHash === tplHash) action = 'current';
  else if (prevHash && prevHash === curHash) action = 'update';
  else action = 'conflict'; // locally modified (or first sync of a modified file)

  if (!dry) {
    if (action === 'install' || action === 'update') {
      let content = fs.readFileSync(t.src, 'utf8');
      if (t.transform) content = t.transform(content);
      fs.mkdirSync(path.dirname(t.dst), { recursive: true });
      fs.writeFileSync(t.dst, content, 'utf8');
      manifest.files[t.rel] = tplHash;
    } else if (action === 'conflict') {
      const newPath = t.dst + '.new';
      let content = fs.readFileSync(t.src, 'utf8');
      if (t.transform) content = t.transform(content);
      fs.writeFileSync(newPath, content, 'utf8');
      // Manifest NOT advanced: the local file stays flagged until resolved.
    } else if (action === 'absent') {
      delete manifest.files[t.rel]; // stop tracking; stays absent until --restore-agents
    } else if (action === 'current' && prevHash !== tplHash) {
      manifest.files[t.rel] = tplHash;
    }
  }

  result[action].push(t.rel);
}

if (!dry) {
  manifest.updatedAt = new Date().toISOString();
  manifest.template = tplRoot;
  fs.mkdirSync(path.dirname(manifestPath()), { recursive: true });
  fs.writeFileSync(manifestPath(), JSON.stringify(manifest, null, 2) + '\n', 'utf8');
}

// ---------- report ----------

const W = 64;
const line = (ch = '-') => ch.repeat(W);
const section = (title, items, note) => {
  console.log('');
  console.log(`${title} (${items.length})`);
  for (const it of items) console.log(`  ${it}${note || ''}`);
};

console.log(line('='));
console.log(`${dry ? '[DRY-RUN] ' : ''}Actualizacion del harness`);
console.log(`Template : ${tplRoot}`);
console.log(`Proyecto : ${tgtRoot}`);
console.log(line('='));

section('Instalados', result.install);
section('Actualizados', result.update);
section('Ya al dia', result.current);

if (result.absent.length) {
  console.log('');
  console.log(`Ausentes localmente — respetados (${result.absent.length})`);
  console.log('  (init los elimino para tu stack, o los borraste a proposito)');
  for (const rel of result.absent) console.log(`  ${rel}`);
  console.log('  Para reinstalarlos: make update TEMPLATE=... RESTORE=1');
}

if (result.conflict.length) {
  console.log('');
  console.log(`CONFLICTOS (${result.conflict.length}) — cambiaste estos archivos Y el template tambien:`);
  for (const rel of result.conflict) {
    console.log(`  ${rel}`);
    console.log(`    -> revision manual: compara <proyecto>/${rel} con ${rel}.new`);
    console.log('       (resuelto: borra el .new; el manifiesto seguira avisando hasta entonces)');
  }
}

console.log('');
console.log('NUNCA tocado (del proyecto o requiere merge manual):');
for (const n of NEVER_TOUCHED) console.log(`  - ${n}`);

console.log('');
console.log('Siguientes pasos:');
if (!dry) console.log('  1. Reinicia OpenCode para recargar agentes/skills/permisos.');
if (result.conflict.length) console.log('  2. Revisa los .new y resuelve los conflictos.');
if (result.absent.length) console.log('  - Agentes ausentes respetados; RESTORE=1 si quieres recuperarlos.');
if (dry) console.log('  - Ejecutalo en firme sin --dry cuando estes conforme.');
console.log(`  - Manifiesto: ${MANIFEST_REL} (commitealo para trazabilidad)`);

process.exit(0);
