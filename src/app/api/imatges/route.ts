import { NextRequest, NextResponse } from 'next/server';
import { getActivitats, getCentres, getSponsors } from '@/lib/airtable';
import { normalizeSlug } from '@/lib/utils';
import sharp from 'sharp';

export const dynamic = 'force-dynamic';

// Dominis de confiança on resideixen les imatges d'Airtable
const ALLOWED_HOSTS = ['v5.airtableusercontent.com', 'dl.airtable.com'];

function isAirtableUrl(url: string): boolean {
  try {
    const { hostname } = new URL(url);
    return ALLOWED_HOSTS.includes(hostname);
  } catch {
    return false;
  }
}

// Cache 30 dies al navegador i a la CDN de Vercel (s-maxage)
// La CDN guarda la resposta i la serveix sense tocar el servidor en visites successives
const CACHE = 'public, max-age=2592000, s-maxage=2592000, stale-while-revalidate=86400';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const type      = searchParams.get('type');
  const slug      = searchParams.get('slug');
  const id        = searchParams.get('id');
  const index     = parseInt(searchParams.get('index') ?? '0', 10);
  const reqWidth  = searchParams.get('w') ? parseInt(searchParams.get('w')!, 10) : null;

  let targetUrl = '';

  try {
    if (type === 'activitat' && slug) {
      const activitats = await getActivitats();
      const act = activitats.find(a => normalizeSlug(a.slug) === normalizeSlug(slug));
      if (act?.rawImatgeUrl) targetUrl = act.rawImatgeUrl;

    } else if (type === 'activitat-thumb' && slug) {
      const activitats = await getActivitats();
      const act = activitats.find(a => normalizeSlug(a.slug) === normalizeSlug(slug));
      if (act?.rawImatgeThumbnailUrl) targetUrl = act.rawImatgeThumbnailUrl;

    } else if (type === 'activitat-galeria' && slug) {
      const activitats = await getActivitats();
      const act = activitats.find(a => normalizeSlug(a.slug) === normalizeSlug(slug));
      if (act?.rawGaleria?.[index]) targetUrl = act.rawGaleria[index];

    } else if (type === 'centre' && slug) {
      const centres = await getCentres();
      const centre = centres.find(c =>
        normalizeSlug(c.slug) === normalizeSlug(slug) ||
        (c.nom && normalizeSlug(c.nom) === normalizeSlug(slug))
      );
      if (centre?.rawImatgeUrl) targetUrl = centre.rawImatgeUrl;

    } else if (type === 'sponsor-logo' && id) {
      const sponsors = await getSponsors();
      const sponsor = sponsors.find(s => s.id === id);
      if (sponsor?.rawImatgeUrl) targetUrl = sponsor.rawImatgeUrl;

    } else if (type === 'sponsor-bg' && id) {
      const sponsors = await getSponsors();
      const sponsor = sponsors.find(s => s.id === id);
      if (sponsor?.rawImatgeFonsUrl) targetUrl = sponsor.rawImatgeFonsUrl;
    }
  } catch (error) {
    console.error('[Images API] Error resolving image:', error);
  }

  // Fallback: placeholder local
  if (!targetUrl || !isAirtableUrl(targetUrl)) {
    const placeholder = NextResponse.redirect(
      new URL('/placeholder-activitat.svg', req.url), 307
    );
    placeholder.headers.set('Cache-Control', CACHE);
    return placeholder;
  }

  try {
    // ── Proxy real: descarreguem la imatge al servidor i la servim convertida ──
    // Avantatges vs redirect 307:
    //   1. Podem controlar el Cache-Control (30 dies vs 4h d'Airtable)
    //   2. Convertim a WebP (25-40% menys pes)
    //   3. Redimensionem si s'indica el paràmetre ?w=NNN
    const upstream = await fetch(targetUrl, {
      signal: AbortSignal.timeout(8000),
    });
    if (!upstream.ok) throw new Error(`Upstream HTTP ${upstream.status}`);

    const input = Buffer.from(await upstream.arrayBuffer());

    // Redimensionem si s'indica ?w= i convertim a WebP
    let pipeline = sharp(input);
    if (reqWidth) {
      pipeline = pipeline.resize(reqWidth, null, { withoutEnlargement: true });
    }
    const webp = await pipeline.webp({ quality: 82 }).toBuffer();

    return new NextResponse(webp, {
      headers: {
        'Content-Type': 'image/webp',
        'Cache-Control': CACHE,
      },
    });

  } catch (err) {
    console.error('[Images API] Error proxying/converting image:', err);
    // Fallback graciós: redirigim a Airtable directament si sharp falla
    const fallback = NextResponse.redirect(targetUrl, 307);
    fallback.headers.set('Cache-Control', 'public, max-age=3600');
    return fallback;
  }
}
