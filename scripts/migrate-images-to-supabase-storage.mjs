process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '..');

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
const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Manca SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function ensureBucketExists() {
  const { data: buckets } = await supabase.storage.listBuckets();
  const exists = (buckets || []).some(b => b.name === 'imatges');
  if (!exists) {
    console.log('📦 Creant el bucket public "imatges" a Supabase Storage...');
    await supabase.storage.createBucket('imatges', { public: true });
  }
}

async function uploadImageFromUrl(imageUrl, storagePath) {
  if (!imageUrl || !imageUrl.startsWith('http')) return null;
  // Si la imatge ja està a Supabase Storage, no cal tornar-la a carregar
  if (imageUrl.includes('supabase.co/storage')) return imageUrl;

  try {
    const res = await fetch(imageUrl, { signal: AbortSignal.timeout(10000) });
    if (!res.ok) return null;
    const contentType = res.headers.get('content-type') || 'image/jpeg';
    const arrayBuffer = await res.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { data, error } = await supabase.storage
      .from('imatges')
      .upload(storagePath, buffer, {
        contentType,
        upsert: true
      });

    if (error) {
      console.warn(`⚠️ Error pujant ${storagePath}:`, error.message);
      return null;
    }

    const { data: publicUrlData } = supabase.storage
      .from('imatges')
      .getPublicUrl(storagePath);

    return publicUrlData.publicUrl;
  } catch (err) {
    console.warn(`⚠️ Exception baixant/pujant ${storagePath}:`, err.message);
    return null;
  }
}

async function run() {
  console.log('🚀 Iniciant migració d\'imatges cap a Supabase Storage...');
  await ensureBucketExists();

  // 1. CENTRES LOGOS
  console.log('\n🏫 1. Processant logos de CENTRES...');
  const { data: centres } = await supabase.from('centres').select('id, slug, nom, imatge_url');
  let centresUpdated = 0;
  if (centres) {
    for (const c of centres) {
      if (c.imatge_url && c.imatge_url.startsWith('http') && !c.imatge_url.includes('supabase.co')) {
        const ext = c.imatge_url.includes('.png') ? 'png' : c.imatge_url.includes('.webp') ? 'webp' : 'jpg';
        const fileName = `centres/${c.slug || c.id}.${ext}`;
        const newUrl = await uploadImageFromUrl(c.imatge_url, fileName);
        if (newUrl) {
          await supabase.from('centres').update({ imatge_url: newUrl }).eq('id', c.id);
          centresUpdated++;
          console.log(`  ✓ Logo desat per a: ${c.nom}`);
        }
      }
    }
  }
  console.log(`✅ S'han migrat ${centresUpdated} logos de centres a Supabase Storage.`);

  // 2. ACTIVITATS IMATGES
  console.log('\n🎨 2. Processant imatges d\'ACTIVITATS...');
  const { data: activitats } = await supabase.from('activitats').select('id, slug, nom, imatge_url, imatge_thumbnail_url');
  let actsUpdated = 0;
  if (activitats) {
    for (const a of activitats) {
      let updated = false;
      const updates = {};

      if (a.imatge_url && a.imatge_url.startsWith('http') && !a.imatge_url.includes('supabase.co')) {
        const ext = a.imatge_url.includes('.png') ? 'png' : a.imatge_url.includes('.webp') ? 'webp' : 'jpg';
        const fileName = `activitats/${a.slug || a.id}.${ext}`;
        const newUrl = await uploadImageFromUrl(a.imatge_url, fileName);
        if (newUrl) {
          updates.imatge_url = newUrl;
          if (!a.imatge_thumbnail_url || a.imatge_thumbnail_url === a.imatge_url) {
            updates.imatge_thumbnail_url = newUrl;
          }
          updated = true;
        }
      }

      if (a.imatge_thumbnail_url && a.imatge_thumbnail_url.startsWith('http') && !a.imatge_thumbnail_url.includes('supabase.co') && !updates.imatge_thumbnail_url) {
        const ext = a.imatge_thumbnail_url.includes('.png') ? 'png' : a.imatge_thumbnail_url.includes('.webp') ? 'webp' : 'jpg';
        const fileName = `activitats/thumb_${a.slug || a.id}.${ext}`;
        const newThumbUrl = await uploadImageFromUrl(a.imatge_thumbnail_url, fileName);
        if (newThumbUrl) {
          updates.imatge_thumbnail_url = newThumbUrl;
          updated = true;
        }
      }

      if (updated) {
        await supabase.from('activitats').update(updates).eq('id', a.id);
        actsUpdated++;
      }
    }
  }
  console.log(`✅ S'han migrat ${actsUpdated} imatges d'activitats a Supabase Storage.`);

  // 3. SPONSORS IMATGES
  console.log('\n🤝 3. Processant imatges de SPONSORS...');
  const { data: sponsors } = await supabase.from('sponsors').select('id, nom, imatge_url, imatge_fons_url');
  let sponsorsUpdated = 0;
  if (sponsors) {
    for (const s of sponsors) {
      const updates = {};
      let updated = false;

      if (s.imatge_url && s.imatge_url.startsWith('http') && !s.imatge_url.includes('supabase.co')) {
        const fileName = `sponsors/logo_${s.id}.jpg`;
        const newUrl = await uploadImageFromUrl(s.imatge_url, fileName);
        if (newUrl) {
          updates.imatge_url = newUrl;
          updated = true;
        }
      }

      if (s.imatge_fons_url && s.imatge_fons_url.startsWith('http') && !s.imatge_fons_url.includes('supabase.co')) {
        const fileName = `sponsors/bg_${s.id}.jpg`;
        const newBgUrl = await uploadImageFromUrl(s.imatge_fons_url, fileName);
        if (newBgUrl) {
          updates.imatge_fons_url = newBgUrl;
          updated = true;
        }
      }

      if (updated) {
        await supabase.from('sponsors').update(updates).eq('id', s.id);
        sponsorsUpdated++;
      }
    }
  }
  console.log(`✅ S'han migrat ${sponsorsUpdated} imatges de sponsors a Supabase Storage.`);

  console.log('\n🎉 PROCES DE MIGRACIO D\'IMATGES COMPLETAT AMB EXXI!');
}

run();
