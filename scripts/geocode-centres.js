#!/usr/bin/env node
/**
 * scripts/geocode-centres.js
 * -------------------
 * Geolocalitza tots els centres de la taula d'Airtable que tinguin adreça
 * però encara no tinguin coordenades (lat, lng) desades, usant tècniques
 * de neteja d'adreça i fallbacks progressius.
 *
 * Ús:
 *   node scripts/geocode-centres.js
 */

const fs   = require('fs');
const path = require('path');

// ─── Llegir .env.local ───────────────────────────────────────────────────────
function loadEnv() {
  const envPath = path.join(__dirname, '..', '.env.local');
  if (!fs.existsSync(envPath)) {
    console.error('❌  No s\'ha trobat el fitxer .env.local a l\'arrel del projecte.');
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

const env = loadEnv();
const API_KEY = env.AIRTABLE_API_KEY;
const BASE_ID = env.AIRTABLE_BASE_ID;

if (!API_KEY || !BASE_ID) {
  console.error('❌  Falten les credencials AIRTABLE_API_KEY o AIRTABLE_BASE_ID a .env.local');
  process.exit(1);
}

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function fetchAllCentres() {
  let allRecords = [];
  let offset;
  
  do {
    const params = new URLSearchParams();
    if (offset) params.append('offset', offset);
    
    const url = `https://api.airtable.com/v0/${BASE_ID}/Centres${params.toString() ? '?' + params.toString() : ''}`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${API_KEY}` }
    });
    
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Error fetching Centres: ${res.status} ${text}`);
    }
    
    const data = await res.json();
    allRecords = allRecords.concat(data.records || []);
    offset = data.offset;
  } while (offset);
  
  return allRecords;
}

function cleanAddress(adreca, barri) {
  let addr = adreca.replace(/[\r\n]/g, ' ').trim();
  
  // 1. Eliminar detalls interns d'escala, pis o porta (baixos, entresol, pral, etc.)
  addr = addr.replace(/\b(baixos|baix|local|pral|principal|entresol|entresòl|piso|pis|1r|2n|3r|4t|5è)\b.*/gi, '');
  
  // 2. Eliminar especificacions de tallers o textos després de barres o comes innecessàries
  addr = addr.replace(/[|;|:].*/g, '');
  
  // 3. Convertir rangs de números a un sol número (ex: "15-19" -> "15", "111-113" -> "111")
  addr = addr.replace(/(\d+)-\d+/g, '$1');
  
  // 4. Netejar codis postals redundants i el text "Girona" repetit dins de la mateixa adreça
  addr = addr.replace(/\b\d{5}\b/g, '');
  addr = addr.replace(/\bGirona\b/gi, '');
  
  addr = addr.trim().replace(/,\s*$/, ''); // Treure comes al final
  
  let cleanB = '';
  if (barri) {
    const rawB = Array.isArray(barri) ? barri[0] : barri;
    if (rawB) {
      // "Girona - Sant Narcís" -> "Sant Narcís"
      cleanB = rawB.replace(/^Girona\s*-\s*/i, '').trim();
    }
  }
  
  return { addr, barri: cleanB };
}

async function callNominatim(query) {
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`;
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'GironaXicsGeocodingScript/2.0 (hola@gironaxics.cat)'
    }
  });
  
  if (!res.ok) return null;
  const data = await res.json();
  if (Array.isArray(data) && data.length > 0) {
    const lat = parseFloat(data[0].lat);
    const lng = parseFloat(data[0].lon);
    if (!isNaN(lat) && !isNaN(lng)) {
      return { lat, lng };
    }
  }
  return null;
}

async function geocodeAddressWithFallbacks(adreca, barri) {
  const { addr, barri: cleanBarri } = cleanAddress(adreca, barri);
  
  // Intent 1: Adreça neta + Barri + Girona
  const query1Parts = [addr];
  if (cleanBarri) query1Parts.push(cleanBarri);
  query1Parts.push("Girona", "Catalunya", "Espanya");
  const query1 = query1Parts.join(", ");
  
  console.log(`   🔍 Intent 1: "${query1}"`);
  let coords = await callNominatim(query1);
  if (coords) return coords;
  
  // Intent 2: Adreça neta + Girona (sense el barri per evitar confusions si no està dibuixat a OSM)
  await sleep(1500); // Respectar ràtio de Nominatim
  const query2 = `${addr}, Girona, Catalunya, Espanya`;
  console.log(`   🔍 Intent 2: "${query2}"`);
  coords = await callNominatim(query2);
  if (coords) return coords;
  
  // Intent 3: Simplificació extrema (només el nom del carrer i número sense tipus de via abreujat)
  // Per exemple "C/ Migdia 17" -> "Migdia 17"
  const simplifiedAddr = addr.replace(/^(c\/|c\.?|carrer|avda\.?|avinguda|ronda|rd\.?|pg\.?|passeig)\s+/gi, '').trim();
  if (simplifiedAddr !== addr) {
    await sleep(1500);
    const query3 = `${simplifiedAddr}, Girona, Catalunya, Espanya`;
    console.log(`   🔍 Intent 3: "${query3}"`);
    coords = await callNominatim(query3);
    if (coords) return coords;
  }
  
  return null;
}

async function updateAirtable(recordId, lat, lng) {
  const url = `https://api.airtable.com/v0/${BASE_ID}/Centres/${recordId}`;
  const res = await fetch(url, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      fields: {
        lat: lat,
        lng: lng
      }
    })
  });
  
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Airtable update failed: ${res.status} ${text}`);
  }
}

async function run() {
  console.log('🔌  Connectant amb Airtable per llegir els centres...');
  let records;
  try {
    records = await fetchAllCentres();
  } catch (err) {
    console.error('❌  Error carregant centres:', err.message);
    process.exit(1);
  }
  
  console.log(`📊  S'han trobat ${records.length} registres de centres.`);
  
  const toGeocode = records.filter(r => {
    const adreca = r.fields.adreça || r.fields.adreca;
    const lat = r.fields.lat;
    const lng = r.fields.lng;
    return adreca && (lat === undefined || lng === undefined);
  });
  
  if (toGeocode.length === 0) {
    console.log('✅  Tots els centres amb adreça ja tenen coordenades desades! No cal fer res.');
    process.exit(0);
  }
  
  console.log(`🔍  Hi ha ${toGeocode.length} centres pendents de geolocalitzar.`);
  console.log('⏳  Iniciant geolocalització progressiva amb fallbacks (1 petició cada 1.5s)...');
  
  let successCount = 0;
  for (let i = 0; i < toGeocode.length; i++) {
    const record = toGeocode[i];
    const nom = record.fields.nom || record.fields.Nom || 'Sense nom';
    const adreca = record.fields.adreça || record.fields.adreca;
    const barri = record.fields.barri || record.fields.Barri;
    
    console.log(`\n[${i + 1}/${toGeocode.length}] 📍 Geolocalitzant: "${nom}" (adreça original: "${adreca}")...`);
    
    if (i > 0) {
      await sleep(1500); // 1.5s delay
    }
    
    const coords = await geocodeAddressWithFallbacks(adreca, barri);
    if (coords) {
      try {
        await updateAirtable(record.id, coords.lat, coords.lng);
        console.log(`   ✅  ÈXIT! Coordenades desades: lat=${coords.lat}, lng=${coords.lng}`);
        successCount++;
      } catch (err) {
        console.error(`   ❌  Error actualitzant Airtable per al registre ${record.id}:`, err.message);
      }
    } else {
      console.warn(`   ⚠️  No s'ha pogut geolocalitzar l'adreça.`);
    }
  }
  
  console.log(`\n🎉  Procés finalitzat! S'han geolocalitzat amb èxit ${successCount} de ${toGeocode.length} centres.`);
}

run();
