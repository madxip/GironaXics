import { NextRequest, NextResponse } from 'next/server';

const API_KEY = process.env.AIRTABLE_API_KEY;
const BASE_ID = process.env.AIRTABLE_BASE_ID;
const TABLE   = 'Analytics';

// ─── POST: Desar un event ────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { event_type, event_label, event_value, device, activitat_id } = body;

    if (!event_type) {
      return NextResponse.json({ error: 'event_type is required' }, { status: 400 });
    }

    const record: Record<string, string> = { event_type };
    if (event_label)  record.event_label  = String(event_label).substring(0, 200);
    if (event_value)  record.event_value  = String(event_value).substring(0, 200);
    if (device)       record.device       = String(device).substring(0, 20);
    if (activitat_id) record.activitat_id = String(activitat_id).substring(0, 50);

    const res = await fetch(
      `https://api.airtable.com/v0/${BASE_ID}/${encodeURIComponent(TABLE)}`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ fields: record }),
      }
    );

    if (!res.ok) {
      const err = await res.text();
      console.error('[Analytics API] Error desant event:', err);
      return NextResponse.json({ error: 'Airtable error' }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('[Analytics API] Error:', e);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

// ─── GET: Retornar estadístiques agregades ───────────────────────────────────
type AirtableRecord = {
  id: string;
  fields: {
    event_type?: string;
    event_label?: string;
    event_value?: string;
    device?: string;
    activitat_id?: string;
    created_at?: string;
  };
};

async function fetchAllAnalytics(filterFormula?: string): Promise<AirtableRecord[]> {
  const records: AirtableRecord[] = [];
  let offset: string | undefined;

  do {
    const params = new URLSearchParams({ pageSize: '100' });
    if (filterFormula) params.set('filterByFormula', filterFormula);
    if (offset)        params.set('offset', offset);

    const res = await fetch(
      `https://api.airtable.com/v0/${BASE_ID}/${encodeURIComponent(TABLE)}?${params}`,
      { headers: { Authorization: `Bearer ${API_KEY}` }, cache: 'no-store' }
    );

    if (!res.ok) break;
    const data = await res.json();
    records.push(...(data.records ?? []));
    offset = data.offset;
  } while (offset);

  return records;
}

function countBy(records: AirtableRecord[], field: 'event_label' | 'event_value' | 'device') {
  const counts: Record<string, number> = {};
  for (const r of records) {
    const v = r.fields[field];
    if (v) counts[v] = (counts[v] ?? 0) + 1;
  }
  return Object.entries(counts)
    .sort(([, a], [, b]) => b - a)
    .map(([label, count]) => ({ label, count }));
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const days = parseInt(searchParams.get('days') ?? '30', 10);

    // Filtre per data
    let filterFormula = '';
    if (days > 0) {
      const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
      filterFormula = `IS_AFTER({created_at}, "${since}")`;
    }

    const all = await fetchAllAnalytics(filterFormula || undefined);

    // Segmentar per tipus
    const byType = (type: string) => all.filter(r => r.fields.event_type === type);

    const activityViews      = byType('activity_view');
    const contactPhone       = byType('contact_phone');
    const contactEmail       = byType('contact_email');
    const filterCategoria    = byType('filter_categoria');
    const filterBarri        = byType('filter_barri');
    const filterEdat         = byType('filter_edat');
    const sponsorClicks      = byType('sponsor_click');
    const casalsBannerClicks = byType('casals_banner_click');

    // Top activitats vistes amb clics de contacte
    const activityMap: Record<string, { label: string; views: number; contacts: number }> = {};
    for (const r of activityViews) {
      const id = r.fields.activitat_id ?? r.fields.event_label ?? 'desconegut';
      const label = r.fields.event_label ?? id;
      if (!activityMap[id]) activityMap[id] = { label, views: 0, contacts: 0 };
      activityMap[id].views++;
    }
    for (const r of [...contactPhone, ...contactEmail]) {
      const id = r.fields.activitat_id ?? r.fields.event_label ?? 'desconegut';
      if (!activityMap[id]) activityMap[id] = { label: r.fields.event_label ?? id, views: 0, contacts: 0 };
      activityMap[id].contacts++;
    }
    const topActivitats = Object.values(activityMap)
      .sort((a, b) => b.views - a.views)
      .slice(0, 10)
      .map(a => ({
        ...a,
        ratio: a.views > 0 ? Math.round((a.contacts / a.views) * 100) : 0,
      }));

    // Devices
    const allWithDevice = all.filter(r => r.fields.device);
    const mobileCount  = allWithDevice.filter(r => r.fields.device === 'mobile').length;
    const desktopCount = allWithDevice.filter(r => r.fields.device === 'desktop').length;

    return NextResponse.json({
      totals: {
        activityViews:      activityViews.length,
        contactPhone:       contactPhone.length,
        contactEmail:       contactEmail.length,
        totalContacts:      contactPhone.length + contactEmail.length,
        sponsorClicks:      sponsorClicks.length,
        casalsBannerClicks: casalsBannerClicks.length,
        filterUses:         filterCategoria.length + filterBarri.length + filterEdat.length,
      },
      topActivitats,
      topCategories:  countBy(filterCategoria, 'event_label').slice(0, 8),
      topBarris:      countBy(filterBarri,     'event_label').slice(0, 8),
      topEdats:       countBy(filterEdat,      'event_label').slice(0, 6),
      topSponsors:    countBy(sponsorClicks,   'event_label').slice(0, 5),
      devices:        { mobile: mobileCount, desktop: desktopCount },
    });
  } catch (e) {
    console.error('[Analytics GET] Error:', e);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
