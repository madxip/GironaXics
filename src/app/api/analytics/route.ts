import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { getActivitatsByCentreId, getActivitats } from '@/lib/airtable';
import { supabase, getAllDbActivitats } from '@/lib/db';

const API_KEY = process.env.AIRTABLE_API_KEY;
const BASE_ID = process.env.AIRTABLE_BASE_ID;
const TABLE   = 'Analytics';

// ─── POST: Desar un event ────────────────────────────────────────────────────
const ALLOWED_EVENT_TYPES = new Set([
  'activity_view', 'contact_phone', 'contact_email',
  'filter_categoria', 'filter_barri', 'filter_edat', 'filter_tipus',
  'sponsor_click', 'casals_banner_click',
]);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { event_type, event_label, event_value, device, activitat_id } = body;

    if (!event_type) {
      return NextResponse.json({ error: 'event_type is required' }, { status: 400 });
    }

    if (!ALLOWED_EVENT_TYPES.has(event_type)) {
      return NextResponse.json({ error: 'Invalid event_type' }, { status: 400 });
    }

    // Supabase per defecte
    if (supabase) {
      const { error } = await supabase.from('analytics').insert([{
        event_type,
        event_label: event_label ? String(event_label).substring(0, 200) : null,
        event_value: event_value ? String(event_value).substring(0, 200) : null,
        device: device ? String(device).substring(0, 20) : 'desktop',
        activitat_id: activitat_id ? String(activitat_id).substring(0, 50) : null,
      }]);

      if (!error) return NextResponse.json({ ok: true });
    }

    // Fallback a Airtable si no hi ha Supabase
    if (API_KEY && BASE_ID) {
      const record: Record<string, string> = { event_type };
      if (event_label)  record.event_label  = String(event_label).substring(0, 200);
      if (event_value)  record.event_value  = String(event_value).substring(0, 200);
      if (device)       record.device       = String(device).substring(0, 20);
      if (activitat_id) record.activitat_id = String(activitat_id).substring(0, 50);

      await fetch(
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
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('[Analytics API] Error:', e);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

// ─── GET: Retornar estadístiques agregades ───────────────────────────────────
type AnalyticsRecord = {
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

function countBy(records: AnalyticsRecord[], field: 'event_label' | 'event_value' | 'device') {
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
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const isAdmin   = session.user.isAdmin;
    const centreId  = session.user.centreId;

    const { searchParams } = new URL(req.url);
    const days = parseInt(searchParams.get('days') ?? '30', 10);

    let all: AnalyticsRecord[] = [];

    // 1. Fetch de Supabase primer
    if (supabase) {
      let query = supabase.from('analytics').select('*').order('created_at', { ascending: false });
      if (days > 0) {
        const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
        query = query.gte('created_at', since);
      }
      const { data, error } = await query;
      if (!error && data) {
        all = data.map(r => ({
          id: r.id,
          fields: {
            event_type: r.event_type,
            event_label: r.event_label,
            event_value: r.event_value,
            device: r.device,
            activitat_id: r.activitat_id,
            created_at: r.created_at,
          }
        }));
      }
    }

    // 2. Si no hi ha Supabase o va fallar, carregar d'Airtable
    if (all.length === 0 && API_KEY && BASE_ID) {
      let filterFormula = '';
      if (days > 0) {
        const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
        filterFormula = `IS_AFTER({created_at}, "${since}")`;
      }
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
        all.push(...(data.records ?? []));
        offset = data.offset;
      } while (offset);
    }

    // Si NO és admin → filtrar per les activitats del seu centre
    let allowedActivityIds: Set<string> | null = null;
    if (!isAdmin && centreId) {
      const centreActivitats = supabase 
        ? (await getAllDbActivitats()).filter(a => a.centreId === centreId)
        : await getActivitatsByCentreId(centreId);
      allowedActivityIds = new Set(centreActivitats.map(a => a.id).filter(Boolean) as string[]);
    }

    // Per admin: mapa activitat_id → nom de centre
    const activitatCentreMap: Map<string, string> = new Map();
    if (isAdmin) {
      try {
        const totsActivitats = supabase ? await getAllDbActivitats() : await getActivitats();
        for (const a of totsActivitats) {
          if (a.id && a.centre) activitatCentreMap.set(a.id, a.centre);
        }
      } catch (e) {
        console.warn('[Analytics] No s\'ha pogut carregar el mapa activitat→centre:', e);
      }
    }

    const filterByActivity = (records: AnalyticsRecord[]) => {
      if (!allowedActivityIds) return records;
      return records.filter(r => {
        const aid = r.fields.activitat_id;
        return aid && allowedActivityIds!.has(aid);
      });
    };

    const byType = (type: string) => all.filter(r => r.fields.event_type === type);

    const activityViewsAll   = filterByActivity(byType('activity_view'));
    const contactPhoneAll    = filterByActivity(byType('contact_phone'));
    const contactEmailAll    = filterByActivity(byType('contact_email'));

    const filterCategoria    = byType('filter_categoria');
    const filterBarri        = byType('filter_barri');
    const filterEdat         = byType('filter_edat');
    const sponsorClicks      = byType('sponsor_click');
    const casalsBannerClicks = byType('casals_banner_click');

    const activityMap: Record<string, { label: string; views: number; contacts: number }> = {};
    for (const r of activityViewsAll) {
      const id = r.fields.activitat_id ?? r.fields.event_label ?? 'desconegut';
      const label = r.fields.event_label ?? id;
      if (!activityMap[id]) activityMap[id] = { label, views: 0, contacts: 0 };
      activityMap[id].views++;
    }
    for (const r of [...contactPhoneAll, ...contactEmailAll]) {
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

    const phoneMap: Record<string, { label: string; count: number }> = {};
    for (const r of contactPhoneAll) {
      const id = r.fields.activitat_id ?? r.fields.event_label ?? 'desconegut';
      const label = r.fields.event_label ?? id;
      if (!phoneMap[id]) phoneMap[id] = { label, count: 0 };
      phoneMap[id].count++;
    }
    const topPhoneActivitats = Object.values(phoneMap)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const emailMap: Record<string, { label: string; count: number }> = {};
    for (const r of contactEmailAll) {
      const id = r.fields.activitat_id ?? r.fields.event_label ?? 'desconegut';
      const label = r.fields.event_label ?? id;
      if (!emailMap[id]) emailMap[id] = { label, count: 0 };
      emailMap[id].count++;
    }
    const topEmailActivitats = Object.values(emailMap)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const allFiltered = isAdmin ? all : [...activityViewsAll, ...contactPhoneAll, ...contactEmailAll];
    const allWithDevice = allFiltered.filter(r => r.fields.device && r.fields.device !== 'server');
    const mobileCount  = allWithDevice.filter(r => r.fields.device === 'mobile').length;
    const desktopCount = allWithDevice.filter(r => r.fields.device === 'desktop').length;

    let topCentres: { label: string; views: number; contacts: number; ratio: number }[] = [];
    if (isAdmin && activitatCentreMap.size > 0) {
      const centreMap: Record<string, { views: number; contacts: number }> = {};
      for (const r of activityViewsAll) {
        const aid = r.fields.activitat_id;
        const centre = aid ? activitatCentreMap.get(aid) : undefined;
        if (centre) {
          if (!centreMap[centre]) centreMap[centre] = { views: 0, contacts: 0 };
          centreMap[centre].views++;
        }
      }
      for (const r of [...contactPhoneAll, ...contactEmailAll]) {
        const aid = r.fields.activitat_id;
        const centre = aid ? activitatCentreMap.get(aid) : undefined;
        if (centre) {
          if (!centreMap[centre]) centreMap[centre] = { views: 0, contacts: 0 };
          centreMap[centre].contacts++;
        }
      }
      topCentres = Object.entries(centreMap)
        .sort(([, a], [, b]) => b.views - a.views)
        .map(([label, { views, contacts }]) => ({
          label,
          views,
          contacts,
          ratio: views > 0 ? Math.round((contacts / views) * 100) : 0,
        }));
    }

    return NextResponse.json({
      isAdmin,
      totals: {
        activityViews:      activityViewsAll.length,
        contactPhone:       contactPhoneAll.length,
        contactEmail:       contactEmailAll.length,
        totalContacts:      contactPhoneAll.length + contactEmailAll.length,
        sponsorClicks:      isAdmin ? sponsorClicks.length : 0,
        casalsBannerClicks: isAdmin ? casalsBannerClicks.length : 0,
        filterUses:         isAdmin ? filterCategoria.length + filterBarri.length + filterEdat.length : 0,
      },
      topActivitats,
      topPhoneActivitats,
      topEmailActivitats,
      topCentres,
      topCategories:  isAdmin ? countBy(filterCategoria, 'event_label').slice(0, 8) : [],
      topBarris:      isAdmin ? countBy(filterBarri,     'event_label').slice(0, 8) : [],
      topEdats:       isAdmin ? countBy(filterEdat,      'event_label').slice(0, 6) : [],
      topSponsors:    isAdmin ? countBy(sponsorClicks,   'event_label').slice(0, 5) : [],
      devices:        { mobile: mobileCount, desktop: desktopCount },
    });
  } catch (e) {
    console.error('[Analytics GET] Error:', e);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
