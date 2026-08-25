#!/usr/bin/env node
// harness.mjs - Interactive helper for managing this SDD agent harness.
// Zero dependencies. Works on Linux, macOS and Windows (Node >= 18).
//
// Usage:
//   node .opencode/scripts/harness.mjs                 -> interactive TUI menu
//   node .opencode/scripts/harness.mjs models          -> list agents + their model
//   node .opencode/scripts/harness.mjs model <agent> <provider/model|inherit>
//   node .opencode/scripts/harness.mjs skills          -> list available skills
//   node .opencode/scripts/harness.mjs help

import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline/promises';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const AGENTS_DIR = path.join(ROOT, '.opencode', 'agents');
const SKILLS_DIR = path.join(ROOT, '.opencode', 'skills');

// ---------- helpers ----------

/** Read and split an agent file into { fmLines, body, eol }. */
function readAgentFile(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8');
  const eol = raw.includes('\r\n') ? '\r\n' : '\n';
  const lines = raw.split(/\r?\n/);
  const open = lines.indexOf('---');
  const close = lines.indexOf('---', open + 1);
  if (open !== 0 || close === -1) {
    return { fmLines: null, body: lines, eol };
  }
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
  return fs.readdirSync(AGENTS_DIR)
    .filter((f) => f.endsWith('.md'))
    .sort();
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

// ---------- commands ----------

function cmdModels() {
  const rows = listAgentFiles().map(agentSummary);
  console.log('');
  console.log('Agentes (.opencode/agents/)');
  console.log('='.repeat(60));
  for (const a of rows) {
    const model = a.model ? a.model : '(hereda el modelo global)';
    const tag = a.mode === 'primary' ? '[primary]' : '[subagent]';
    console.log(`  ${a.name.padEnd(22)} ${tag.padEnd(11)} ${model}`);
  }
  console.log('='.repeat(60));
  console.log('Cambia un modelo con: make model AGENT=<nombre> MODEL=<provider/model>');
  console.log("Vuelve a heredar con: make model AGENT=<nombre> MODEL=inherit");
  console.log('');
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

  const filePath = path.join(AGENTS_DIR, file);
  const { fmLines, body, eol } = readAgentFile(filePath);
  if (!fmLines) {
    console.error(`[ERROR] ${file} no tiene frontmatter valido.`);
    process.exit(1);
  }

  // Locate frontmatter boundaries inside the full line array.
  const open = body.indexOf('---');
  const close = body.indexOf('---', open + 1);

  const clear = ['inherit', 'none', '--clear'].includes(modelArg.toLowerCase());
  if (!clear && !MODEL_RE.test(modelArg)) {
    console.error(`[ERROR] Modelo invalido: "${modelArg}"`);
    console.error('        Formato esperado: provider/model-id  (ej: anthropic/claude-sonnet-4-6)');
    process.exit(1);
  }

  let fm = [...fmLines];
  const idx = fm.findIndex((l) => /^model:\s*/.test(l));

  if (clear) {
    if (idx === -1) {
      console.log(`[OK] ${wanted} ya hereda el modelo global. Nada que hacer.`);
      return;
    }
    fm.splice(idx, 1);
  } else if (idx >= 0) {
    fm[idx] = `model: ${modelArg}`;
  } else {
    // Insert after mode: when present, otherwise at the top of the frontmatter.
    const modeIdx = fm.findIndex((l) => /^mode:\s*/.test(l));
    fm.splice(modeIdx >= 0 ? modeIdx + 1 : 0, 0, `model: ${modelArg}`);
  }

  const nextBody = [...body.slice(0, open + 1), ...fm, ...body.slice(close)];
  fs.writeFileSync(filePath, nextBody.join(eol), 'utf8');

  if (clear) {
    console.log(`[OK] ${wanted}: modelo eliminado, vuelve a heredar el global.`);
  } else {
    console.log(`[OK] ${wanted}: model fijado a ${modelArg}`);
    console.log('     Reinicia OpenCode para que el cambio surta efecto.');
  }
}

function cmdSkills() {
  if (!fs.existsSync(SKILLS_DIR)) return;
  const dirs = fs.readdirSync(SKILLS_DIR).filter((d) =>
    fs.existsSync(path.join(SKILLS_DIR, d, 'SKILL.md')),
  );
  console.log('');
  console.log('Skills disponibles (.opencode/skills/)');
  console.log('='.repeat(60));
  for (const d of dirs.sort()) {
    const raw = fs.readFileSync(path.join(SKILLS_DIR, d, 'SKILL.md'), 'utf8');
    const m = raw.match(/^description:\s*(.+?)$/m);
    const desc = m ? m[1].trim() : '(sin descripcion)';
    console.log(`  ${d.padEnd(20)} ${desc.slice(0, 90)}`);
  }
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
  tui                          Menu interactivo (igual que sin argumentos)
  help                         Esta ayuda
`);
}

// ---------- interactive TUI (v0) ----------

async function ask(rl, question) {
  const answer = (await rl.question(question)).trim();
  return answer;
}

async function cmdTui() {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  // Pause stdin while subcommands print, resume after.
  try {
    for (;;) {
      console.log('');
      console.log('+------------------------------------------+');
      console.log('|        Harness SDD - menu (v0)           |');
      console.log('+------------------------------------------+');
      console.log('|  [1] Agentes y modelos                   |');
      console.log('|  [2] Cambiar modelo de un agente         |');
      console.log('|  [3] Skills disponibles                  |');
      console.log('|  [4] Ayuda rapida                        |');
      console.log('|  [0] Salir                               |');
      console.log('+------------------------------------------+');
      const choice = await ask(rl, 'Elige una opcion: ');

      if (choice === '1') {
        rl.pause(); cmdModels(); rl.resume();
      } else if (choice === '2') {
        const rows = listAgentFiles().map(agentSummary);
        console.log('');
        rows.forEach((a, i) => {
          console.log(`  [${i + 1}] ${a.name}  (${a.model || 'hereda'})`);
        });
        const num = parseInt(await ask(rl, '\nAgente (numero): '), 10);
        if (!Number.isInteger(num) || num < 1 || num > rows.length) {
          console.log('[..] Opcion invalida.');
          continue;
        }
        const target = rows[num - 1];
        const model = await ask(rl, `Nuevo modelo para ${target.name} (provider/model-id, vacio = inherit): `);
        rl.pause();
        if (!model) { cmdModel(target.name, 'inherit'); }
        else { cmdModel(target.name, model); }
        rl.resume();
      } else if (choice === '3') {
        rl.pause(); cmdSkills(); rl.resume();
      } else if (choice === '4') {
        console.log(`
Ayuda rapida:
  - Inicia sesion con /start y cierra con /end.
  - Pregunta "que puedo hacer?" a tu agente: cargara la skill harness-guide.
  - Config profunda del harness: agente @harness-arquitect.
  - Docs del harness: docs/harness/ y AGENTS.md.
`);
      } else if (choice === '0' || choice.toLowerCase() === 'q') {
        break;
      } else {
        console.log('[..] Opcion invalida.');
      }
    }
  } finally {
    rl.close();
  }
  console.log('Hasta la proxima sesion.');
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
