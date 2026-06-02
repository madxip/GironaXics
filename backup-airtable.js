#!/usr/bin/env node
/**
 * backup-airtable.js
 * -------------------
 * Descarrega totes les taules d'Airtable i les guarda com a fitxers JSON
 * dins d'una carpeta amb la data d'avui.
 *
 * Ús:
 *   node backup-airtable.js
 *
 * Requisits:
 *   - El fitxer .env.local ha d'existir al mateix directori amb:
 *       AIRTABLE_API_KEY=patXXX...
 *       AIRTABLE_BASE_ID=appXXX...
 */

const fs   = require('fs');
const path = require('path');

// ─── Llegir .env.local ───────────────────────────────────────────────────────
function loadEnv() {
  const envPath = path.join(__dirname, '.env.local');
  if (!fs.existsSync(envPath)) {
    console.error('❌  No s\'ha trobat el fitxer .env.local');
    process.exit(1);
  }
  const lines = fs.readFileSync(envPath, 'utf8').split('\n');
  const env = {};
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const idx = trimmed.indexOf('=');
    if (idx === -1) continue;
    const key = trimmed.substring(0, idx).trim();
    const val = trimmed.substring(idx + 1).trim().replace(/^["']|["']$/g, '');
    env[key] = val;
  }
  return env;
}

// ─── Descarregar tots els registres d'una taula (amb paginació) ──────────────
async function fetchAllRecords(apiKey, baseId, tableName) {
  const records = [];
  let offset;

  do {
    const params = new URLSearchParams({ pageSize: '100' });
    if (offset) params.set('offset', offset);

    const url = `https://api.airtable.com/v0/${baseId}/${encodeURIComponent(tableName)}?${params}`;
    const res  = await fetch(url, {
      headers: { Authorization: `Bearer ${apiKey}` }
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Error a la taula "${tableName}": ${res.status} ${err}`);
    }

    const data = await res.json();
    records.push(...(data.records ?? []));
    offset = data.offset;
  } while (offset);

  return records;
}

// ─── Guardar JSON a fitxer ───────────────────────────────────────────────────
function saveJson(dir, filename, data) {
  const filePath = path.join(dir, filename);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
  return filePath;
}

// ─── Principal ───────────────────────────────────────────────────────────────
async function main() {
  // Desactivar verificació TLS si cal (entorns corporatius)
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

  const env    = loadEnv();
  const apiKey = env.AIRTABLE_API_KEY;
  const baseId = env.AIRTABLE_BASE_ID;

  if (!apiKey || !baseId) {
    console.error('❌  Falten AIRTABLE_API_KEY o AIRTABLE_BASE_ID al .env.local');
    process.exit(1);
  }

  // Taules a fer backup (totes les que usa el projecte)
  const TAULES = [
    'Activitats',
    'Centres',
    'Subcategories',
    'Usuaris_Centres',
    'Sponsors',
    'Casals',
    'Analytics',
  ];

  // Carpeta de backup amb data i hora
  const now       = new Date();
  const dateStr   = now.toISOString().slice(0, 10);               // 2026-06-02
  const timeStr   = now.toTimeString().slice(0, 8).replace(/:/g, '-'); // 16-13-00
  const backupDir = path.join(__dirname, 'backups', `${dateStr}_${timeStr}`);

  fs.mkdirSync(backupDir, { recursive: true });

  console.log(`\n🗄️  Backup d'Airtable — Base: ${baseId}`);
  console.log(`📁  Carpeta: ${backupDir}\n`);

  const summary = [];
  let totalRecords = 0;

  for (const taula of TAULES) {
    process.stdout.write(`   ⏳  ${taula.padEnd(20)}`);

    try {
      const records = await fetchAllRecords(apiKey, baseId, taula);
      const filename = `${taula}.json`;
      saveJson(backupDir, filename, {
        taula,
        exportat: now.toISOString(),
        total: records.length,
        records,
      });

      totalRecords += records.length;
      summary.push({ taula, registres: records.length, ok: true });
      console.log(`✅  ${records.length} registres`);

    } catch (err) {
      summary.push({ taula, registres: 0, ok: false, error: err.message });
      console.log(`❌  Error: ${err.message}`);
    }
  }

  // Resum final
  console.log('\n─────────────────────────────────────────');
  console.log(`✅  Backup completat!`);
  console.log(`📊  Total registres: ${totalRecords}`);
  console.log(`📁  Fitxers guardats a:\n    ${backupDir}\n`);

  // Fitxer de resum
  saveJson(backupDir, '_resum.json', {
    data: now.toISOString(),
    baseId,
    totalRegistres: totalRecords,
    taules: summary,
  });

  // Llistat de backups existents
  const backupsRoot = path.join(__dirname, 'backups');
  const backups = fs.readdirSync(backupsRoot)
    .filter(d => fs.statSync(path.join(backupsRoot, d)).isDirectory())
    .sort()
    .reverse();

  console.log(`📦  Backups disponibles (${backups.length} en total):`);
  backups.forEach((b, i) => console.log(`    ${i === 0 ? '→' : ' '} ${b}`));
  console.log('');
}

main().catch(err => {
  console.error('❌  Error inesperat:', err);
  process.exit(1);
});
