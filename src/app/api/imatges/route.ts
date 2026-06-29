import { NextRequest, NextResponse } from 'next/server';
import { getActivitats, getCentres, getSponsors } from '@/lib/airtable';
import { normalizeSlug } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type');
  const slug = searchParams.get('slug');
  const id = searchParams.get('id');
  const indexStr = searchParams.get('index');
  const index = indexStr ? parseInt(indexStr, 10) : 0;

  let targetUrl = '';

  try {
    if (type === 'activitat' && slug) {
      const activitats = await getActivitats();
      const act = activitats.find(a => normalizeSlug(a.slug) === normalizeSlug(slug));
      if (act && act.rawImatgeUrl) {
        targetUrl = act.rawImatgeUrl;
      }
    } else if (type === 'activitat-thumb' && slug) {
      const activitats = await getActivitats();
      const act = activitats.find(a => normalizeSlug(a.slug) === normalizeSlug(slug));
      if (act && act.rawImatgeThumbnailUrl) {
        targetUrl = act.rawImatgeThumbnailUrl;
      }
    } else if (type === 'activitat-galeria' && slug) {
      const activitats = await getActivitats();
      const act = activitats.find(a => normalizeSlug(a.slug) === normalizeSlug(slug));
      if (act && Array.isArray(act.rawGaleria) && act.rawGaleria[index]) {
        targetUrl = act.rawGaleria[index];
      }
    } else if (type === 'centre' && slug) {
      const centres = await getCentres();
      const centre = centres.find(c => normalizeSlug(c.slug) === normalizeSlug(slug) || (c.nom && normalizeSlug(c.nom) === normalizeSlug(slug)));
      if (centre && centre.rawImatgeUrl) {
        targetUrl = centre.rawImatgeUrl;
      }
    } else if (type === 'sponsor-logo' && id) {
      const sponsors = await getSponsors();
      const sponsor = sponsors.find(s => s.id === id);
      if (sponsor && sponsor.rawImatgeUrl) {
        targetUrl = sponsor.rawImatgeUrl;
      }
    } else if (type === 'sponsor-bg' && id) {
      const sponsors = await getSponsors();
      const sponsor = sponsors.find(s => s.id === id);
      if (sponsor && sponsor.rawImatgeFonsUrl) {
        targetUrl = sponsor.rawImatgeFonsUrl;
      }
    }
  } catch (error) {
    console.error('[Images API] Error resolving image:', error);
  }

  if (targetUrl) {
    const res = NextResponse.redirect(targetUrl, 307);
    // Cache the redirect response for 1 hour (3600 seconds) in the user's browser/CDN
    res.headers.set('Cache-Control', 'public, max-age=3600');
    return res;
  }

  // Fallback to local placeholder
  const placeholderUrl = new URL('/placeholder-activitat.svg', req.url).toString();
  const res = NextResponse.redirect(placeholderUrl, 307);
  res.headers.set('Cache-Control', 'public, max-age=3600');
  return res;
}
