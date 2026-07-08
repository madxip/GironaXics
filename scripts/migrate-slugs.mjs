import { readFileSync } from "fs";
import { resolve } from "path";

const envPath = resolve(process.cwd(), ".env.local");
try {
  const envContent = readFileSync(envPath, "utf-8");
  for (const line of envContent.split("\n")) {
    const [key, ...vals] = line.trim().split("=");
    if (key && !key.startsWith("#")) process.env[key] = vals.join("=").replace(/^["'"'"]|["'"'"]$/g, "");
  }
} catch { console.error("No s ha trobat .env.local"); process.exit(1); }

const API_KEY = process.env.AIRTABLE_API_KEY;
const BASE_ID = process.env.AIRTABLE_BASE_ID;
if (!API_KEY || !BASE_ID) { console.error("Manquen variables"); process.exit(1); }

// Extrau string segur d un camp que pot ser string, array o undefined
function str(v) {
  if (!v) return "";
  if (Array.isArray(v)) return v[0] ? String(v[0]) : "";
  return String(v);
}

function normalizeSlug(text) {
  if (!text) return "";
  return String(text).toLowerCase().normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, " i ")
    .replace(/[^a-z0-9\s-]/g, " ")
    .replace(/[\s-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function fetchAll(table) {
  const records = [];
  let offset;
  do {
    const params = new URLSearchParams({ pageSize: "100" });
    if (offset) params.set("offset", offset);
    const res = await fetch(`https://api.airtable.com/v0/${BASE_ID}/${encodeURIComponent(table)}?${params}`,
      { headers: { Authorization: `Bearer ${API_KEY}` } });
    if (!res.ok) throw new Error(await res.text());
    const data = await res.json();
    records.push(...(data.records ?? []));
    offset = data.offset;
  } while (offset);
  return records;
}

async function patchRecords(table, updates) {
  for (let i = 0; i < updates.length; i += 10) {
    const batch = updates.slice(i, i + 10);
    const res = await fetch(`https://api.airtable.com/v0/${BASE_ID}/${encodeURIComponent(table)}`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ records: batch }),
    });
    if (!res.ok) console.error(`Error lot ${i/10+1}:`, await res.text());
    else console.log(`  Lot ${i/10+1} (${batch.length} registres) OK`);
    await new Promise(r => setTimeout(r, 250));
  }
}

async function main() {
  console.log("Carregant centres i activitats...\n");
  const centresRaw = await fetchAll("Centres");
  const centreMap = new Map();
  for (const c of centresRaw) {
    const nom = str(c.fields.nom || c.fields.Nom || c.fields.Name);
    if (c.id && nom) centreMap.set(c.id, nom);
  }
  console.log(`${centreMap.size} centres carregats`);

  const activitats = await fetchAll("Activitats");
  console.log(`${activitats.length} activitats carregades\n`);

  const updates = [];
  const seenSlugs = new Map();

  for (const a of activitats) {
    const f = a.fields;
    const nom    = str(f.nom);
    const edat   = str(f.edat);
    const barri  = str(f.barri);
    const poblacio = str(f.poblacio_propia);
    const tipus  = str(f.tipus || f.Tipus) || "extraescolar";

    // centre: linked record (array d IDs) o string
    let centreNom = "";
    if (Array.isArray(f.centre) && f.centre.length > 0) {
      centreNom = centreMap.get(f.centre[0]) || "";
    } else {
      centreNom = str(f.centre);
    }

    const rawLloc = barri || poblacio || "girona";
    let newSlug = [
      normalizeSlug(tipus),
      normalizeSlug(nom),
      normalizeSlug(edat),
      normalizeSlug(centreNom),
      normalizeSlug(rawLloc)
    ].filter(Boolean).join("-");

    if (seenSlugs.has(newSlug)) newSlug = `${newSlug}-${a.id.slice(-6).toLowerCase()}`;
    seenSlugs.set(newSlug, a.id);

    const oldSlug = str(f.slug);
    if (!newSlug || newSlug === oldSlug) continue;

    updates.push({ id: a.id, fields: { slug: newSlug } });
    console.log(`  ${(oldSlug || "(buit)").padEnd(60)} -> ${newSlug}`);
  }

  if (updates.length === 0) { console.log("\nTots els slugs ja estan al dia."); return; }
  console.log(`\nActualitzant ${updates.length} activitat(s)...`);
  await patchRecords("Activitats", updates);
  console.log(`\nFet! ${updates.length} activitats actualitzades.`);
}

main().catch(e => { console.error("Error:", e); process.exit(1); });
