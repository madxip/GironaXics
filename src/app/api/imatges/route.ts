import { NextRequest, NextResponse } from 'next/server';
import { getActivitats, getCentres, getSponsors, getRawCentreImage, getRawActivityImage } from '@/lib/airtable';
import { normalizeSlug } from '@/lib/utils';
import sharp from 'sharp';

export const dynamic = 'force-dynamic';

// Cache 30 dies al navegador i a la CDN de Vercel (s-maxage)
// La CDN guarda la resposta i la serveix sense tocar el servidor en visites successives
const CACHE = 'public, max-age=2592000, s-maxage=2592000, stale-while-revalidate=86400';

function getValidUrl(url?: string, rawUrl?: string): string {
  if (url && typeof url === 'string' && !url.includes('/api/imatges') && (url.startsWith('http://') || url.startsWith('https://'))) {
    return url;
  }
  if (rawUrl && typeof rawUrl === 'string' && !rawUrl.includes('/api/imatges') && (rawUrl.startsWith('http://') || rawUrl.startsWith('https://'))) {
    return rawUrl;
  }
  return '';
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const type      = searchParams.get('type');
  const slug      = searchParams.get('slug');
  const id        = searchParams.get('id');
  const index     = parseInt(searchParams.get('index') ?? '0', 10);
  const wStr = searchParams.get('w');
  let reqWidth = wStr ? parseInt(wStr, 10) : null;

  if (!reqWidth) {
    if (type === 'activitat-thumb') {
      reqWidth = 200;
    } else if (type === 'centre') {
      reqWidth = 160;
    } else if (type === 'sponsor-logo') {
      reqWidth = 120;
    } else if (type === 'activitat-galeria') {
      reqWidth = 800;
    } else if (type === 'activitat') {
      reqWidth = 1000;
    } else if (type === 'sponsor-bg') {
      reqWidth = 1200;
    }
  }

  let targetUrl = '';

  try {
    if (type === 'activitat' && slug) {
      const activitats = await getActivitats();
      const act = activitats.find(a => normalizeSlug(a.slug) === normalizeSlug(slug));
      targetUrl = getValidUrl(act?.imatgeUrl, act?.rawImatgeUrl);
      if (!targetUrl) {
        const rawUrl = await getRawActivityImage(slug, false);
        if (rawUrl) targetUrl = rawUrl;
      }

    } else if (type === 'activitat-thumb' && slug) {
      const activitats = await getActivitats();
      const act = activitats.find(a => normalizeSlug(a.slug) === normalizeSlug(slug));
      targetUrl = getValidUrl(act?.imatgeThumbnailUrl || act?.imatgeUrl, act?.rawImatgeThumbnailUrl);
      if (!targetUrl) {
        const rawUrl = await getRawActivityImage(slug, true);
        if (rawUrl) targetUrl = rawUrl;
      }

    } else if (type === 'activitat-galeria' && slug) {
      const activitats = await getActivitats();
      const act = activitats.find(a => normalizeSlug(a.slug) === normalizeSlug(slug));
      if (act?.galeria?.[index]) targetUrl = getValidUrl(act.galeria[index], act?.rawGaleria?.[index]);

    } else if (type === 'centre' && (slug || id)) {
      const centres = await getCentres();
      const searchKey = slug || id || '';
      const centre = centres.find(c =>
        (id && c.id === id) ||
        (slug && normalizeSlug(c.slug) === normalizeSlug(searchKey)) ||
        (slug && c.nom && normalizeSlug(c.nom) === normalizeSlug(searchKey))
      );
      targetUrl = getValidUrl(centre?.imatgeUrl, centre?.rawImatgeUrl);
      if (!targetUrl) {
        const directUrl = await getRawCentreImage(searchKey);
        if (directUrl) targetUrl = directUrl;
      }

    } else if (type === 'sponsor-logo' && id) {
      const sponsors = await getSponsors();
      const sponsor = sponsors.find(s => s.id === id);
      targetUrl = getValidUrl(sponsor?.imatgeUrl, sponsor?.rawImatgeUrl);

    } else if (type === 'sponsor-bg' && id) {
      const sponsors = await getSponsors();
      const sponsor = sponsors.find(s => s.id === id);
      targetUrl = getValidUrl(sponsor?.imatgeFonsUrl, sponsor?.rawImatgeFonsUrl);
    }
  } catch (error) {
    console.error('[Images API] Error resolving image:', error);
  }

  // Fallback: placeholder local
  if (!targetUrl || (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://'))) {
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
