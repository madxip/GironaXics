process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '..');

// Cargar .env.local si existeix
function loadEnv() {
  const envPath = path.join(projectRoot, '.env.local');
  if (!fs.existsSync(envPath)) return {};
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
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY || env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID || env.AIRTABLE_BASE_ID;

async function fetchAllRecordsFromAirtable(tableName) {
  const records = [];
  let offset;
  do {
    const params = new URLSearchParams({ pageSize: '100' });
    if (offset) params.set('offset', offset);
    const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(tableName)}?${params}`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}` }
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

// Trobar la carpeta de backup més recent
function getLatestBackupDir() {
  const backupsRoot = path.join(projectRoot, 'backups');
  if (!fs.existsSync(backupsRoot)) return null;
  const dirs = fs.readdirSync(backupsRoot)
    .filter(d => fs.statSync(path.join(backupsRoot, d)).isDirectory())
    .sort()
    .reverse();
  return dirs.length > 0 ? path.join(backupsRoot, dirs[0]) : null;
}

function readJsonFile(filePath) {
  if (!fs.existsSync(filePath)) return [];
  const content = fs.readFileSync(filePath, 'utf8');
  const parsed = JSON.parse(content);
  return parsed.records || parsed.data || parsed;
}

function normalizeSlug(text) {
  if (!text) return '';
  return text
    .toString()
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9 -]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

function escapeSqlStr(str) {
  if (str === null || str === undefined) return 'NULL';
  return `'${String(str).replace(/'/g, "''")}'`;
}

function escapeSqlArray(arr) {
  if (!Array.isArray(arr) || arr.length === 0) return "'{}'";
  const items = arr.map(item => `"${String(item).replace(/"/g, '\\"')}"`).join(',');
  return `'${items}'`;
}

async function main() {
  console.log('🚀 Iniciant procés de migració directa d\'Airtable cap a Supabase...');

  let rawCentres = [];
  let rawActivitats = [];
  let rawSponsors = [];
  let rawCasals = [];
  let rawPoblacions = [];
  let rawSubcategories = [];
  let rawUsuaris = [];
  let rawCategories = [];
  let rawAnalytics = [];

  if (AIRTABLE_API_KEY && AIRTABLE_BASE_ID) {
    console.log('📡 Connectant en DIRECTE a l\'API d\'Airtable per obtenir les dades MÉS RECIENTS...');
    try {
      rawCentres = await fetchAllRecordsFromAirtable('Centres');
      console.log(`   ✅ Fetched ${rawCentres.length} centres en directe d'Airtable`);
      rawActivitats = await fetchAllRecordsFromAirtable('Activitats');
      console.log(`   ✅ Fetched ${rawActivitats.length} activitats en directe d'Airtable`);
      rawSponsors = await fetchAllRecordsFromAirtable('Sponsors');
      console.log(`   ✅ Fetched ${rawSponsors.length} sponsors en directe d'Airtable`);
      try { rawCasals = await fetchAllRecordsFromAirtable('Casals'); } catch { /* ignore */ }
      try { rawPoblacions = await fetchAllRecordsFromAirtable('Poblacions'); } catch { /* ignore */ }
      try { rawSubcategories = await fetchAllRecordsFromAirtable('Subcategories'); } catch { /* ignore */ }
      try { rawUsuaris = await fetchAllRecordsFromAirtable('Usuaris_Centres'); } catch { /* ignore */ }
      try { rawCategories = await fetchAllRecordsFromAirtable('Categories'); } catch { /* ignore */ }
      try { rawAnalytics = await fetchAllRecordsFromAirtable('Analytics'); } catch { /* ignore */ }
    } catch (err) {
      console.warn('⚠️ Error descarregant en directe d\'Airtable:', err.message);
      console.log('👉 Recorrent al darrer backup en disc...');
    }
  }

  if (rawCentres.length === 0) {
    const latestBackupDir = getLatestBackupDir();
    if (!latestBackupDir) {
      console.error('❌ No s\'ha trobat cap carpeta de backup a ./backups/');
      process.exit(1);
    }
    console.log(`📁 Utilitzant dades de backup des de: ${latestBackupDir}`);

    rawCentres = readJsonFile(path.join(latestBackupDir, 'Centres.json'));
    rawActivitats = readJsonFile(path.join(latestBackupDir, 'Activitats.json'));
    rawSponsors = readJsonFile(path.join(latestBackupDir, 'Sponsors.json'));
    rawCasals = readJsonFile(path.join(latestBackupDir, 'Casals.json'));
    rawPoblacions = readJsonFile(path.join(latestBackupDir, 'Poblacions.json'));
    rawSubcategories = readJsonFile(path.join(latestBackupDir, 'Subcategories.json'));
    rawUsuaris = readJsonFile(path.join(latestBackupDir, 'Usuaris_Centres.json'));
  }

  console.log(`📊 Dades a migrar:
  - Centres: ${rawCentres.length}
  - Activitats: ${rawActivitats.length}
  - Sponsors: ${rawSponsors.length}
  - Casals Banners: ${rawCasals.length}
  - Poblacions: ${rawPoblacions.length}
  - Subcategories: ${rawSubcategories.length}
  - Usuaris: ${rawUsuaris.length}`);


  // Mapes aux per resoldre Linked Records d'Airtable
  const centreMap = new Map();
  const centreInteressatMap = new Map();
  const centreVacancesMap = new Map();

  // 1. PROCESSAR CENTRES
  const centresCleaned = rawCentres.map(r => {
    const f = r.fields || r;
    const id = r.id || f.id;
    const nom = f.nom || f.Nom || '';
    let slug = f.slug || f.Slug || normalizeSlug(nom);
    if (slug && !slug.endsWith('-girona')) slug = `${slug}-girona`;
    
    centreMap.set(id, nom);
    const interessat = !!(f.interessat || f.Interessat || f.partner || f.Partner);
    centreInteressatMap.set(id, interessat);
    const vacances = f.vacances || f.Vacances || '';
    if (vacances) centreVacancesMap.set(id, vacances);

    let imatgeUrl = '';
    const imgField = f.Imatge || f.imatge || f.Logo || f.logo || f.Logotip || f.logotip;
    if (Array.isArray(imgField) && imgField.length > 0) {
      imatgeUrl = imgField[0].url || '';
    }

    return {
      id,
      slug: slug || id,
      nom: nom || 'Centre sense nom',
      adreca: f.adreca || f['adreça'] || f.Adreca || '',
      telefon: f.telefon || f.Telefon || '',
      email: f.email || f.Email || '',
      web: f.web || f.Web || '',
      barri: Array.isArray(f.barri || f.Barri) ? (f.barri || f.Barri)[0] : (f.barri || f.Barri || ''),
      descripcio: f.descripcio || f.Descripcio || f['descripció'] || '',
      imatge_url: imatgeUrl,
      interessat,
      vacances,
      ciutat: 'girona'
    };
  });

  // 2. PROCESSAR ACTIVITATS
  const seenActivitatsSlugs = new Set();
  const activitatsCleaned = rawActivitats.map(r => {
    const f = r.fields || r;
    const id = r.id || f.id;
    const nom = f.nom || f.Nom || '';
    const centreId = Array.isArray(f.centre) && f.centre.length > 0 ? f.centre[0] : (typeof f.centre === 'string' ? f.centre : null);
    const centreNom = centreId ? (centreMap.get(centreId) || centreId) : (f.centreNom || '');

    let rawBarri = f.barri || f.Barri || '';
    if (Array.isArray(rawBarri)) rawBarri = rawBarri[0] || '';
    if (rawBarri === 'Centro') rawBarri = 'Centre';

    const rawCat = f.categoria || f.Categoria || '';
    let categoriesArray = [];
    if (Array.isArray(rawCat)) {
      categoriesArray = rawCat.map(c => String(c).trim());
    } else if (typeof rawCat === 'string' && rawCat) {
      categoriesArray = rawCat.split(',').map(c => c.trim());
    }
    const categoriaPrincipal = categoriesArray[0] || '';

    // Slug generator
    let customSlug = f.slug || f.Slug;
    let slug = '';
    if (customSlug) {
      slug = normalizeSlug(customSlug);
      if (slug.endsWith('-girona')) slug = slug.slice(0, -7);
    } else {
      slug = normalizeSlug(nom);
      if (centreNom) slug += `-${normalizeSlug(centreNom)}`;
      if (rawBarri) slug += `-${normalizeSlug(rawBarri)}`;
    }
    if (slug && !slug.endsWith('-girona')) slug = `${slug}-girona`;
    if (!slug) slug = id;

    let baseSlug = slug;
    let counter = 1;
    while (seenActivitatsSlugs.has(slug)) {
      const stem = baseSlug.endsWith('-girona') ? baseSlug.slice(0, -7) : baseSlug;
      slug = `${stem}-${counter}-girona`;
      counter++;
    }
    seenActivitatsSlugs.add(slug);


    let imatgeUrl = '';
    let imatgeThumb = '';
    if (Array.isArray(f.Imatge) && f.Imatge.length > 0) {
      imatgeUrl = f.Imatge[0].url || '';
      imatgeThumb = f.Imatge[0].thumbnails?.large?.url || imatgeUrl;
    }

    let galeriaUrls = [];
    if (Array.isArray(f.Galeria)) {
      galeriaUrls = f.Galeria.map(g => g.url || '').filter(Boolean);
    }

    const rawSub = f.subcategoria || f.Subcategoria || f['sub-categoria'] || '';
    const subcat = Array.isArray(rawSub) ? rawSub[0] : rawSub;

    const rawPoblacioPropia = f.nom_poblacio_propia || f.nomPoblacioPropia;
    const poblacioPropia = Array.isArray(rawPoblacioPropia) ? rawPoblacioPropia[0] : (rawPoblacioPropia || '');

    const rawAdrecaPropia = f.adreca_propia || f['adreça_pròpia'] || f.adrecaPropia;
    const adrecaPropia = Array.isArray(rawAdrecaPropia) ? rawAdrecaPropia[0] : (rawAdrecaPropia || '');

    return {
      id,
      slug,
      nom: nom || 'Activitat sense nom',
      centre: centreNom,
      centre_id: centreId,
      barri: rawBarri,
      categoria: categoriaPrincipal,
      categories: categoriesArray,
      edat: f.edat || f.Edat || '',
      preu: f.preu || f.Preu || '',
      destacada: !!(f.destacada || f.Destacada),
      centre_interessat: centreId ? (centreInteressatMap.get(centreId) || false) : false,
      destacada_gran: !!(f.destacada_gran || f['destacada_gran'] || f['Destacada Gran']),
      horari: f.horari || f.Horari || '',
      dies: f.dies || f.Dies || '',
      descripcio: f.descripcio || f.Descripcio || '',
      durada: f.durada || f.Durada || '',
      alumnes: f.alumnes || f.Alumnes || '',
      material: f['descripció'] || f.material || f.Material || '',
      inici: f.inici || f.Inici || '',
      idioma: f.idioma || f.Idioma || '',
      qui_imparteix: f.qui_imparteix || f['Qui imparteix'] || '',
      publicada: f.publicada !== undefined ? !!f.publicada : true,
      imatge_url: imatgeUrl,
      imatge_thumbnail_url: imatgeThumb,
      galeria: galeriaUrls,
      subcategoria: subcat || '',
      tipus: f.tipus || f.Tipus || 'Extraescolar',
      torns: f.torns || f.Torns || '',
      centre_vacances: centreId ? (centreVacancesMap.get(centreId) || '') : '',
      poblacio_propia: poblacioPropia,
      adreca_propia: adrecaPropia,
      ciutat: 'girona'
    };
  });

  // 3. PROCESSAR SPONSORS
  const sponsorsCleaned = rawSponsors.map(r => {
    const f = r.fields || r;
    const id = r.id || f.id;
    let imatgeUrl = '';
    if (Array.isArray(f.Imatge) && f.Imatge.length > 0) imatgeUrl = f.Imatge[0].url || '';
    else if (typeof f.imatgeUrl === 'string') imatgeUrl = f.imatgeUrl;

    let imatgeFonsUrl = '';
    if (Array.isArray(f.ImatgeFons) && f.ImatgeFons.length > 0) imatgeFonsUrl = f.ImatgeFons[0].url || '';
    else if (typeof f.imatgeFonsUrl === 'string') imatgeFonsUrl = f.imatgeFonsUrl;

    return {
      id,
      nom: f.nom || f.Nom || 'Sponsor',
      categoria_slug: f.categoriaSlug || f.categoria_slug || f.CategoriaSlug || 'general',
      imatge_url: imatgeUrl,
      enllac: f.enllac || f.Enllac || f.url || '',
      actiu: f.actiu !== undefined ? !!f.actiu : true,
      descripcio: f.descripcio || f.Descripcio || '',
      imatge_fons_url: imatgeFonsUrl,
      titol: f.titol || f.Titol || '',
      posicio_fons: f.posicioFons || f.posicio_fons || '',
      ciutat: 'girona'
    };
  });

  // 4. GENERAR FITXER SQL SEED (`docs/seed-supabase.sql`)
  console.log('📝 Generant fitxer SQL de seed per a l\'SQL Editor de Supabase...');
  let sqlLines = [];
  sqlLines.push('-- ==============================================================================');
  sqlLines.push('-- SEED DE DADES PER A SUPABASE (GironaXics)');
  sqlLines.push('-- Executa aquest script DESPRÉS de crear l\'schema de supabase-schema.sql');
  sqlLines.push('-- ==============================================================================\n');

  // Inserts Centres
  if (centresCleaned.length > 0) {
    sqlLines.push('-- 1. CENTRES');
    for (const c of centresCleaned) {
      sqlLines.push(`INSERT INTO public.centres (id, slug, nom, adreca, telefon, email, web, barri, descripcio, imatge_url, interessat, vacances, ciutat)
VALUES (${escapeSqlStr(c.id)}, ${escapeSqlStr(c.slug)}, ${escapeSqlStr(c.nom)}, ${escapeSqlStr(c.adreca)}, ${escapeSqlStr(c.telefon)}, ${escapeSqlStr(c.email)}, ${escapeSqlStr(c.web)}, ${escapeSqlStr(c.barri)}, ${escapeSqlStr(c.descripcio)}, ${escapeSqlStr(c.imatge_url)}, ${c.interessat ? 'TRUE' : 'FALSE'}, ${escapeSqlStr(c.vacances)}, ${escapeSqlStr(c.ciutat)})
ON CONFLICT (id) DO UPDATE SET
  slug = EXCLUDED.slug, nom = EXCLUDED.nom, adreca = EXCLUDED.adreca, telefon = EXCLUDED.telefon, email = EXCLUDED.email, web = EXCLUDED.web, barri = EXCLUDED.barri, descripcio = EXCLUDED.descripcio, imatge_url = EXCLUDED.imatge_url, interessat = EXCLUDED.interessat, vacances = EXCLUDED.vacances;`);
    }
    sqlLines.push('\n');
  }

  // Inserts Activitats
  if (activitatsCleaned.length > 0) {
    sqlLines.push('-- 2. ACTIVITATS');
    for (const a of activitatsCleaned) {
      sqlLines.push(`INSERT INTO public.activitats (id, slug, nom, centre, centre_id, barri, categoria, categories, edat, preu, destacada, centre_interessat, destacada_gran, horari, dies, descripcio, durada, alumnes, material, inici, idioma, qui_imparteix, publicada, imatge_url, imatge_thumbnail_url, galeria, subcategoria, tipus, torns, centre_vacances, poblacio_propia, adreca_propia, ciutat)
VALUES (${escapeSqlStr(a.id)}, ${escapeSqlStr(a.slug)}, ${escapeSqlStr(a.nom)}, ${escapeSqlStr(a.centre)}, ${escapeSqlStr(a.centre_id)}, ${escapeSqlStr(a.barri)}, ${escapeSqlStr(a.categoria)}, ${escapeSqlArray(a.categories)}, ${escapeSqlStr(a.edat)}, ${escapeSqlStr(a.preu)}, ${a.destacada ? 'TRUE' : 'FALSE'}, ${a.centre_interessat ? 'TRUE' : 'FALSE'}, ${a.destacada_gran ? 'TRUE' : 'FALSE'}, ${escapeSqlStr(a.horari)}, ${escapeSqlStr(a.dies)}, ${escapeSqlStr(a.descripcio)}, ${escapeSqlStr(a.durada)}, ${escapeSqlStr(a.alumnes)}, ${escapeSqlStr(a.material)}, ${escapeSqlStr(a.inici)}, ${escapeSqlStr(a.idioma)}, ${escapeSqlStr(a.qui_imparteix)}, ${a.publicada ? 'TRUE' : 'FALSE'}, ${escapeSqlStr(a.imatge_url)}, ${escapeSqlStr(a.imatge_thumbnail_url)}, ${escapeSqlArray(a.galeria)}, ${escapeSqlStr(a.subcategoria)}, ${escapeSqlStr(a.tipus)}, ${escapeSqlStr(a.torns)}, ${escapeSqlStr(a.centre_vacances)}, ${escapeSqlStr(a.poblacio_propia)}, ${escapeSqlStr(a.adreca_propia)}, ${escapeSqlStr(a.ciutat)})
ON CONFLICT (id) DO UPDATE SET
  slug = EXCLUDED.slug, nom = EXCLUDED.nom, centre = EXCLUDED.centre, centre_id = EXCLUDED.centre_id, barri = EXCLUDED.barri, categoria = EXCLUDED.categoria, categories = EXCLUDED.categories, edat = EXCLUDED.edat, preu = EXCLUDED.preu, destacada = EXCLUDED.destacada, centre_interessat = EXCLUDED.centre_interessat, destacada_gran = EXCLUDED.destacada_gran, horari = EXCLUDED.horari, dies = EXCLUDED.dies, descripcio = EXCLUDED.descripcio, durada = EXCLUDED.durada, alumnes = EXCLUDED.alumnes, material = EXCLUDED.material, inici = EXCLUDED.inici, idioma = EXCLUDED.idioma, qui_imparteix = EXCLUDED.qui_imparteix, publicada = EXCLUDED.publicada, imatge_url = EXCLUDED.imatge_url, imatge_thumbnail_url = EXCLUDED.imatge_thumbnail_url, galeria = EXCLUDED.galeria, subcategoria = EXCLUDED.subcategoria, tipus = EXCLUDED.tipus, torns = EXCLUDED.torns, centre_vacances = EXCLUDED.centre_vacances, poblacio_propia = EXCLUDED.poblacio_propia, adreca_propia = EXCLUDED.adreca_propia;`);
    }
    sqlLines.push('\n');
  }

  // Inserts Sponsors
  if (sponsorsCleaned.length > 0) {
    sqlLines.push('-- 3. SPONSORS');
    for (const s of sponsorsCleaned) {
      sqlLines.push(`INSERT INTO public.sponsors (id, nom, categoria_slug, imatge_url, enllac, actiu, descripcio, imatge_fons_url, titol, posicio_fons, ciutat)
VALUES (${escapeSqlStr(s.id)}, ${escapeSqlStr(s.nom)}, ${escapeSqlStr(s.categoria_slug)}, ${escapeSqlStr(s.imatge_url)}, ${escapeSqlStr(s.enllac)}, ${s.actiu ? 'TRUE' : 'FALSE'}, ${escapeSqlStr(s.descripcio)}, ${escapeSqlStr(s.imatge_fons_url)}, ${escapeSqlStr(s.titol)}, ${escapeSqlStr(s.posicio_fons)}, ${escapeSqlStr(s.ciutat)})
ON CONFLICT (id) DO UPDATE SET
  nom = EXCLUDED.nom, categoria_slug = EXCLUDED.categoria_slug, imatge_url = EXCLUDED.imatge_url, enllac = EXCLUDED.enllac, actiu = EXCLUDED.actiu, descripcio = EXCLUDED.descripcio, imatge_fons_url = EXCLUDED.imatge_fons_url, titol = EXCLUDED.titol, posicio_fons = EXCLUDED.posicio_fons;`);
    }
    sqlLines.push('\n');
  }

  const seedPath = path.join(projectRoot, 'docs', 'seed-supabase.sql');
  fs.writeFileSync(seedPath, sqlLines.join('\n'), 'utf8');
  console.log(`✅ Fitxer SQL guardat a: ${seedPath}`);

  // 5. INTENTAR PUXAR A SUPABASE DIRECTAMENT SI TENIM KEYS
  if (SUPABASE_URL && SUPABASE_KEY) {
    console.log('\n🌐 Connectant directament amb l\'API de Supabase...');
    try {
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

      console.log('   ⏳ Pujant centres...');
      const { error: errCentres } = await supabase.from('centres').upsert(centresCleaned);
      if (errCentres) console.error('   ❌ Error centres:', errCentres.message);
      else console.log(`   ✅ ${centresCleaned.length} centres carregats amb èxit!`);

      console.log('   ⏳ Pujant activitats...');
      const { error: errAct } = await supabase.from('activitats').upsert(activitatsCleaned);
      if (errAct) console.error('   ❌ Error activitats:', errAct.message);
      else console.log(`   ✅ ${activitatsCleaned.length} activitats carregades amb èxit!`);

      console.log('   ⏳ Pujant sponsors...');
      const { error: errSpons } = await supabase.from('sponsors').upsert(sponsorsCleaned);
      if (errSpons) console.error('   ❌ Error sponsors:', errSpons.message);
      else console.log(`   ✅ ${sponsorsCleaned.length} sponsors carregats amb èxit!`);

      // 4. Poblacions
      const poblacionsCleaned = rawPoblacions.map(r => {
        const f = r.fields || r;
        return {
          id: r.id || f.id,
          nom: f.nom || f.Nom || '',
          comarca: f.comarca || f.Comarca || '',
          ciutat: 'girona'
        };
      }).filter(p => p.nom);

      if (poblacionsCleaned.length > 0) {
        console.log('   ⏳ Pujant poblacions...');
        const { error: errPobl } = await supabase.from('poblacions').upsert(poblacionsCleaned);
        if (errPobl) console.error('   ❌ Error poblacions:', errPobl.message);
        else console.log(`   ✅ ${poblacionsCleaned.length} poblacions carregades amb èxit!`);
      }

      // 5. Subcategories
      const subcatCleaned = rawSubcategories.map(r => {
        const f = r.fields || r;
        return {
          id: r.id || f.id,
          nom: f.nom || f.Nom || '',
          categoria: Array.isArray(f.categoria || f.Categoria) ? (f.categoria || f.Categoria)[0] : (f.categoria || f.Categoria || ''),
          ciutat: 'girona'
        };
      }).filter(s => s.nom);

      if (subcatCleaned.length > 0) {
        console.log('   ⏳ Pujant subcategories...');
        const { error: errSub } = await supabase.from('subcategories').upsert(subcatCleaned);
        if (errSub) console.error('   ❌ Error subcategories:', errSub.message);
        else console.log(`   ✅ ${subcatCleaned.length} subcategories carregades amb èxit!`);
      }

      // 6. Casals Banners
      const casalsCleaned = rawCasals.map(r => {
        const f = r.fields || r;
        return {
          id: r.id || f.id,
          nom: f.nom || f.Nom || 'Casals Banner',
          actiu: f.actiu !== undefined ? !!f.actiu : true,
          kicker: f.kicker || f.Kicker || '',
          titol: f.titol || f.Titol || '',
          subtitol: f.subtitol || f.Subtitol || '',
          dates: f.dates || f.Dates || '',
          data_limit: f.dataLimit || f.data_limit || f.DataLimit || '',
          ciutat: 'girona'
        };
      });

      if (casalsCleaned.length > 0) {
        console.log('   ⏳ Pujant casals_banners...');
        const { error: errCas } = await supabase.from('casals_banners').upsert(casalsCleaned);
        if (errCas) console.error('   ❌ Error casals_banners:', errCas.message);
        else console.log(`   ✅ ${casalsCleaned.length} casals_banners carregats amb èxit!`);
      }

      // 7. Usuaris Centres
      const usuarisCleaned = rawUsuaris.map(r => {
        const f = r.fields || r;
        const rawCentreId = Array.isArray(f.centre_id || f.centre || f.Centre) ? (f.centre_id || f.centre || f.Centre)[0] : (f.centre_id || f.centre || f.Centre || null);
        return {
          id: r.id || f.id,
          email: f.email || f.Email || '',
          centre_id: rawCentreId || null,
          password_hash: f.password_hash || f.password || f.Password || '',
          ciutat: 'girona'
        };
      }).filter(u => u.email);

      if (usuarisCleaned.length > 0) {
        console.log('   ⏳ Pujant usuaris_centres...');
        const { error: errUsu } = await supabase.from('usuaris_centres').upsert(usuarisCleaned);
        if (errUsu) console.error('   ❌ Error usuaris_centres:', errUsu.message);
        else console.log(`   ✅ ${usuarisCleaned.length} usuaris_centres carregats amb èxit!`);
      }

      // 8. Categories
      const categoriesCleaned = rawCategories.map(r => {
        const f = r.fields || r;
        const nom = f.nom || f.Nom || '';
        return {
          id: r.id || f.id,
          nom,
          slug: f.slug || f.Slug || normalizeSlug(nom),
          icona: f.icona || f.Icona || '',
          ordre: f.ordre || f.Ordre || 0,
          ciutat: 'girona'
        };
      }).filter(c => c.nom);

      if (categoriesCleaned.length > 0) {
        console.log('   ⏳ Pujant categories...');
        const { error: errCat } = await supabase.from('categories').upsert(categoriesCleaned);
        if (errCat) console.error('   ❌ Error categories:', errCat.message);
        else console.log(`   ✅ ${categoriesCleaned.length} categories carregades amb èxit!`);
      }

      // 9. Analytics
      const analyticsCleaned = rawAnalytics.map(r => {
        const f = r.fields || r;
        return {
          id: r.id || f.id,
          event_type: f.event_type || f.event_name || 'view',
          event_label: f.event_label || f.label || '',
          category_name: f.category_name || f.categoria || '',
          device: f.device || 'desktop',
          ciutat: 'girona',
          created_at: f.created_at || r.createdTime || new Date().toISOString()
        };
      });

      if (analyticsCleaned.length > 0) {
        console.log('   ⏳ Pujant analytics...');
        for (let i = 0; i < analyticsCleaned.length; i += 500) {
          const chunk = analyticsCleaned.slice(i, i + 500);
          const { error: errAna } = await supabase.from('analytics').upsert(chunk);
          if (errAna) console.error('   ❌ Error analytics:', errAna.message);
        }
        console.log(`   ✅ ${analyticsCleaned.length} esdeveniments d'analytics carregats amb èxit!`);
      }




    } catch (err) {
      console.error('❌ Error connectant amb Supabase JS SDK:', err.message);
    }
  } else {
    console.log('\nℹ️ NEXT_PUBLIC_SUPABASE_URL o SUPABASE_KEY no estan definits al .env.local.');
    console.log('👉 Pots copiar i enganxar el contingut de `docs/seed-supabase.sql` directament a l\'SQL Editor de Supabase per carregar totes les dades!');
  }
}

main().catch(err => console.error('❌ Error durant el procés de migració:', err));
