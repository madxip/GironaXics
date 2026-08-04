process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '..');

// Cargar .env.local
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
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Falten les claus de Supabase a .env.local');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const BUCKET_NAME = 'imatges';

async function ensureBucket() {
  console.log(`📦 Verificant / creant el bucket "${BUCKET_NAME}" a Supabase Storage...`);
  const { data: buckets, error: listError } = await supabase.storage.listBuckets();
  
  if (listError) {
    console.error('❌ Error llistant buckets:', listError.message);
  }

  const bucketExists = (buckets || []).some(b => b.name === BUCKET_NAME);
  if (!bucketExists) {
    const { error: createError } = await supabase.storage.createBucket(BUCKET_NAME, {
      public: true, // Bucket públic per a lliure accés des del web
      fileSizeLimit: 10485760, // 10MB per imatge
    });
    if (createError) {
      console.error(`❌ Error creant el bucket "${BUCKET_NAME}":`, createError.message);
      return false;
    }
    console.log(`✅ Bucket públic "${BUCKET_NAME}" creat amb èxit!`);
  } else {
    console.log(`✅ Bucket "${BUCKET_NAME}" ja existeix.`);
  }

  // Garantir que el bucket sigui públic
  await supabase.storage.updateBucket(BUCKET_NAME, { public: true });
  return true;
}

// Descarregar imatge a Buffer des d'una URL
async function fetchImageBuffer(url) {
  if (!url || !url.startsWith('http')) return null;
  try {
    const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    if (!res.ok) return null;
    const arrayBuffer = await res.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const contentType = res.headers.get('content-type') || 'image/jpeg';
    return { buffer, contentType };
  } catch (err) {
    return null;
  }
}

// Detectar extensió des de contentType o URL
function getExtension(url, contentType) {
  if (contentType?.includes('png')) return 'png';
  if (contentType?.includes('webp')) return 'webp';
  if (contentType?.includes('gif')) return 'gif';
  if (contentType?.includes('svg')) return 'svg';
  if (url.includes('.png')) return 'png';
  if (url.includes('.webp')) return 'webp';
  return 'jpg';
}

async function uploadToStorage(storagePath, buffer, contentType) {
  const { error } = await supabase.storage.from(BUCKET_NAME).upload(storagePath, buffer, {
    contentType,
    upsert: true,
  });
  if (error) {
    console.error(`❌ Error pujant ${storagePath}:`, error.message);
    return null;
  }
  const { data } = supabase.storage.from(BUCKET_NAME).getPublicUrl(storagePath);
  return data.publicUrl;
}

async function migrateImages() {
  console.log('🚀 Iniciant migració d\'imatges d\'Airtable cap a Supabase Storage...');
  
  const ready = await ensureBucket();
  if (!ready) process.exit(1);

  // 1. MIGRAR IMATGES DE CENTRES
  console.log('\n🏬 1. Processant imatges de Centres...');
  const { data: centres } = await supabase.from('centres').select('*');
  let centresMigrats = 0;

  for (const c of centres || []) {
    if (c.imatge_url && c.imatge_url.startsWith('http') && !c.imatge_url.includes('supabase.co')) {
      const fetched = await fetchImageBuffer(c.imatge_url);
      if (fetched) {
        const ext = getExtension(c.imatge_url, fetched.contentType);
        const storagePath = `centres/${c.slug || c.id}.${ext}`;
        const publicUrl = await uploadToStorage(storagePath, fetched.buffer, fetched.contentType);
        
        if (publicUrl) {
          await supabase.from('centres').update({ imatge_url: publicUrl }).eq('id', c.id);
          centresMigrats++;
          process.stdout.write(`   ✅ Centre: ${c.nom}\n`);
        }
      }
    }
  }
  console.log(`✨ ${centresMigrats} imatges de centres migrades a Supabase Storage!`);

  // 2. MIGRAR IMATGES D'ACTIVITATS
  console.log('\n🎨 2. Processant imatges d\'Activitats i Galeries...');
  const { data: activitats } = await supabase.from('activitats').select('*');
  let activitatsMigrades = 0;

  for (const a of activitats || []) {
    let updatedNeeded = false;
    let newImatgeUrl = a.imatge_url;
    let newThumbUrl = a.imatge_thumbnail_url;
    let newGaleria = Array.isArray(a.galeria) ? [...a.galeria] : [];

    // Imatge principal
    if (a.imatge_url && a.imatge_url.startsWith('http') && !a.imatge_url.includes('supabase.co')) {
      const fetched = await fetchImageBuffer(a.imatge_url);
      if (fetched) {
        const ext = getExtension(a.imatge_url, fetched.contentType);
        const storagePath = `activitats/${a.slug || a.id}.${ext}`;
        const publicUrl = await uploadToStorage(storagePath, fetched.buffer, fetched.contentType);
        if (publicUrl) {
          newImatgeUrl = publicUrl;
          newThumbUrl = publicUrl;
          updatedNeeded = true;
        }
      }
    }

    // Galeria
    let galeriaUpdated = false;
    const updatedGaleria = [];
    for (let idx = 0; idx < newGaleria.length; idx++) {
      const gUrl = newGaleria[idx];
      if (gUrl && gUrl.startsWith('http') && !gUrl.includes('supabase.co')) {
        const fetched = await fetchImageBuffer(gUrl);
        if (fetched) {
          const ext = getExtension(gUrl, fetched.contentType);
          const storagePath = `activitats/${a.slug || a.id}/galeria-${idx + 1}.${ext}`;
          const publicUrl = await uploadToStorage(storagePath, fetched.buffer, fetched.contentType);
          if (publicUrl) {
            updatedGaleria.push(publicUrl);
            galeriaUpdated = true;
          } else {
            updatedGaleria.push(gUrl);
          }
        } else {
          updatedGaleria.push(gUrl);
        }
      } else {
        updatedGaleria.push(gUrl);
      }
    }

    if (galeriaUpdated) {
      newGaleria = updatedGaleria;
      updatedNeeded = true;
    }

    if (updatedNeeded) {
      await supabase.from('activitats').update({
        imatge_url: newImatgeUrl,
        imatge_thumbnail_url: newThumbUrl,
        galeria: newGaleria,
      }).eq('id', a.id);
      activitatsMigrades++;
      process.stdout.write(`   ✅ Activitat (${activitatsMigrades}): ${a.nom}\n`);
    }
  }

  console.log(`✨ ${activitatsMigrades} imatges d'activitats migrades amb èxit a Supabase Storage!`);

  // 3. MIGRAR IMATGES DE SPONSORS
  console.log('\n🏆 3. Processant imatges de Sponsors...');
  const { data: sponsors } = await supabase.from('sponsors').select('*');
  let sponsorsMigrats = 0;

  for (const s of sponsors || []) {
    let updateNeeded = false;
    let newImatgeUrl = s.imatge_url;
    let newFonsUrl = s.imatge_fons_url;

    if (s.imatge_url && s.imatge_url.startsWith('http') && !s.imatge_url.includes('supabase.co')) {
      const fetched = await fetchImageBuffer(s.imatge_url);
      if (fetched) {
        const ext = getExtension(s.imatge_url, fetched.contentType);
        const storagePath = `sponsors/${s.id}.${ext}`;
        const publicUrl = await uploadToStorage(storagePath, fetched.buffer, fetched.contentType);
        if (publicUrl) {
          newImatgeUrl = publicUrl;
          updateNeeded = true;
        }
      }
    }

    if (s.imatge_fons_url && s.imatge_fons_url.startsWith('http') && !s.imatge_fons_url.includes('supabase.co')) {
      const fetched = await fetchImageBuffer(s.imatge_fons_url);
      if (fetched) {
        const ext = getExtension(s.imatge_fons_url, fetched.contentType);
        const storagePath = `sponsors/${s.id}-fons.${ext}`;
        const publicUrl = await uploadToStorage(storagePath, fetched.buffer, fetched.contentType);
        if (publicUrl) {
          newFonsUrl = publicUrl;
          updateNeeded = true;
        }
      }
    }

    if (updateNeeded) {
      await supabase.from('sponsors').update({
        imatge_url: newImatgeUrl,
        imatge_fons_url: newFonsUrl,
      }).eq('id', s.id);
      sponsorsMigrats++;
      process.stdout.write(`   ✅ Sponsor: ${s.nom}\n`);
    }
  }

  console.log(`✨ ${sponsorsMigrats} imatges de sponsors migrades!`);

  console.log('\n🎉 PROCES DE MIGRACIÓ D\'IMATGES A SUPABASE STORAGE COMPLETAT AMB ÈXIT!');
}

migrateImages().catch(err => console.error('❌ Error migrant imatges:', err));
