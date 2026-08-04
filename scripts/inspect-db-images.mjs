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
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function inspect() {
  console.log('--- CENTRES SAMPLE ---');
  const { data: centres, error: cErr } = await supabase.from('centres').select('id, nom, imatge_url, interessat').limit(5);
  console.log('Centres:', centres);

  console.log('\n--- ACTIVITATS SAMPLE ---');
  const { data: activitats, error: aErr } = await supabase.from('activitats').select('id, nom, centre, centre_id, imatge_url, imatge_thumbnail_url').limit(5);
  console.log('Activitats:', activitats);

  console.log('\n--- TESTING SUPABASE STORAGE ACCESSIBILITY ---');
  if (centres && centres.length > 0 && centres[0].imatge_url) {
    const testUrl = centres[0].imatge_url;
    console.log('Testing URL fetch:', testUrl);
    try {
      const res = await fetch(testUrl);
      console.log('Fetch HTTP status:', res.status, res.headers.get('content-type'));
    } catch (e) {
      console.error('Fetch error:', e.message);
    }
  }
}

inspect();
