#!/usr/bin/env node
// harness.mjs - Interactive dashboard + CLI for managing this SDD agent harness.
// Zero dependencies. Works on Linux, macOS and Windows (Node >= 18).
//
// Usage:
//   node .opencode/scripts/harness.mjs                  -> interactive dashboard (needs a real TTY)
//   node .opencode/scripts/harness.mjs models           -> list agents + their model
//   node .opencode/scripts/harness.mjs model <agent> <provider/model|inherit>
//   node .opencode/scripts/harness.mjs skills           -> list available skills
//   node .opencode/scripts/harness.mjs backlog          -> list open backlog items
//   node .opencode/scripts/harness.mjs help

import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline/promises';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const AGENTS_DIR = path.join(ROOT, '.opencode', 'agents');
const SKILLS_DIR = path.join(ROOT, '.opencode', 'skills');
const BACKLOG_FILE = path.join(ROOT, 'docs', 'harness', 'BACKLOG.md');

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

function backlogItems() {
  if (!fs.existsSync(BACKLOG_FILE)) return [];
  return fs.readFileSync(BACKLOG_FILE, 'utf8')
    .split(/\r?\n/)
    .filter((l) => /^\s*- \[ \]/.test(l))
    .map((l) => l.replace(/^\s*- \[ \]\s*/, '').trim());
}

function cmdBacklog() {
  const items = backlogItems();
  console.log('');
  console.log(`Backlog abierto del harness (${items.length}) — docs/harness/BACKLOG.md`);
  console.log('='.repeat(60));
  if (!items.length) { console.log('  (vacío)'); }
  for (const it of items.slice(0, 20)) console.log(`  [ ] ${it}`);
  console.log('');
}

function cmdHelp() {
  console.log(`
harness.mjs - gestor del harness SDD

Comandos:
  models                       Lista agentes, modo y modelo configurado
  model <agente> <modelo>      Fija el modelo de un agente (provider/model-id)
                               Usa "inherit" para volver al modelo global
  skills                       Lista las skills disponibles
  backlog                      Items abiertos de docs/harness/BACKLOG.md
  tui                          Dashboard interactivo (igual que sin argumentos)
  help                         Esta ayuda
`);
}

// ---------- interactive dashboard (v1) ----------

// ANSI helpers (no deps). Windows Terminal / modern conhost render these fine.
const C = {
  reset: '\x1b[0m', bold: '\x1b[1m', dim: '\x1b[2m', inverse: '\x1b[7m',
  cyan: '\x1b[36m', green: '\x1b[32m', yellow: '\x1b[33m', red: '\x1b[31m',
};
const CLEAR = '\x1b[2J\x1b[H';
const WIDTH = 70;

function boxLine(content, width = WIDTH) {
  const visible = content.replace(/\x1b\[[0-9;]*m/g, ''); // strip ANSI to measure
  const pad = Math.max(0, width - 2 - visible.length);
  return `│ ${content}${' '.repeat(pad)}│`;
}

function enableRawMode() {
  readline.emitKeypressEvents(process.stdin);
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
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
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
    { id: 'agents', title: 'Agentes & Modelos', hint: 'Enter=modelo · i=heredar · Esc=volver' },
    { id: 'skills', title: 'Skills', hint: 'Esc=volver' },
    { id: 'backlog', title: 'Backlog del harness', hint: 'Esc=volver' },
    { id: 'help', title: 'Ayuda rapida', hint: 'Esc=volver' },
  ];

  let viewIdx = 0;
  let cursor = 0;
  let status = 'Bienvenido. q para salir.';
  let detail = null; // per-view transient state (e.g. agent action menu)

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
      return lines;
    }

    if (v.id === 'skills') {
      for (const s of skillSummaries()) {
        lines.push(`  ${C.bold}${s.name.padEnd(20)}${C.reset} ${s.desc.slice(0, 38)}`);
      }
      return lines;
    }

    if (v.id === 'backlog') {
      const items = backlogItems();
      if (!items.length) lines.push('  (sin items abiertos)');
      items.slice(0, 12).forEach((it) => lines.push(`  ${C.yellow}[ ]${C.reset} ${it.slice(0, 58)}`));
      if (items.length > 12) lines.push(C.dim + `  ... y ${items.length - 12} mas en docs/harness/BACKLOG.md` + C.reset);
      return lines;
    }

    // help
    lines.push('  Que es esto: panel de control del harness SDD.');
    lines.push('');
    lines.push('  Flujo: ANALYZE > SPEC > IMPLEMENT > REVIEW > DECIDE');
    lines.push('  Sesion: /start al abrir · /end al cerrar');
    lines.push('  Dudas de uso: pregunta "que puedo hacer?" y se cargara');
    lines.push('  la skill harness-guide. Config profunda: @harness-arquitect.');
    lines.push('');
    lines.push('  CLI equivalente: node .opencode/scripts/harness.mjs help');
    return lines;
  }

  function draw() {
    const v = VIEWS[viewIdx];
    const g = gitStatus();
    const gitTxt = g.dirty
      ? `${C.yellow}${g.branch}${C.reset} · ${g.dirty} cambio(s) sin commit`
      : `${C.green}${g.branch}${C.reset} · limpio`;

    const tabs = VIEWS.map((x, i) =>
      i === viewIdx ? `${C.inverse} ${i + 1} ${x.title} ${C.reset}` : `${C.dim} ${i + 1} ${x.title} ${C.reset}`,
    ).join(' ');

    const out = [
      CLEAR,
      C.dim + '┌' + '─'.repeat(WIDTH - 2) + '┐' + C.reset,
      boxLine(`${C.bold}HARNESS${C.reset} · ${projectName()}   ${C.dim}|${C.reset}  ${gitTxt}`),
      boxLine(tabs),
      C.dim + '├' + '─'.repeat(WIDTH - 2) + '┤' + C.reset,
      ...renderViewBody().map((l) => boxLine(l)),
      '',
      C.dim + '├' + '─'.repeat(WIDTH - 2) + '┤' + C.reset,
      boxLine(`${C.dim}${v.hint}   ·   [q] salir${C.reset}`),
      boxLine(`${C.green}»${C.reset} ${status}`),
      C.dim + '└' + '─'.repeat(WIDTH - 2) + '┘' + C.reset,
    ].join('\n');

    process.stdout.write(out + '\n');
  }

  enableRawMode();
  try {
    for (;;) {
      draw();
      const key = await nextKey();

      if (key.ctrl && key.name === 'c') break;
      if (key.name === 'q') break;

      // Global view switch (only outside the agent action sub-menu).
      if (!detail && /^[1-4]$/.test(key.sequence || key.str || key.name)) {
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
              const answer = await askLine(` Nuevo modelo para ${a.name} (provider/model-id | inherit | vacio cancela): `);
              enableRawMode(); // askLine dropped us back to cooked mode
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
        else if (key.name === 'return') {
          detail = { type: 'agent-actions', index: cursor, sel: 0 };
          status = 'Accion sobre el agente seleccionado.';
        }
      }
    }
  } finally {
    disableRawMode();
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
    cmdBacklog();
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
