import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { getActivitatsByCentreId } from '@/lib/airtable';

export const dynamic = 'force-dynamic';

const API_KEY = process.env.AIRTABLE_API_KEY;
const BASE_ID = process.env.AIRTABLE_BASE_ID;

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

async function fetchAnalyticsPage(params: URLSearchParams): Promise<{ records: AirtableRecord[]; offset?: string }> {
  const res = await fetch(
    `https://api.airtable.com/v0/${BASE_ID}/Analytics?${params}`,
    { headers: { Authorization: `Bearer ${API_KEY}` }, cache: 'no-store' }
  );
  if (!res.ok) return { records: [] };
  return res.json();
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const centreId = searchParams.get('centreId');
    const days = parseInt(searchParams.get('days') ?? '90', 10);

    if (!centreId) {
      return NextResponse.json({ error: 'centreId is required' }, { status: 400 });
    }

    // 1. Obtenir totes les activitats del centre
    const activitats = await getActivitatsByCentreId(centreId);
    const activitatIds = new Set(activitats.map(a => a.id).filter(Boolean) as string[]);

    if (activitatIds.size === 0) {
      return NextResponse.json({
        totalViews: 0, totalPhone: 0, totalEmail: 0, totalContacts: 0,
        topActivitats: [], byDevice: { mobile: 0, desktop: 0 }, activitatCount: 0, days,
      });
    }

    // 2. Obtenir events d'analytics filtrats per data
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
    const dateFilter = `IS_AFTER({created_at}, "${since}")`;
    const allRecords: AirtableRecord[] = [];
    let offset: string | undefined;

    do {
      const params = new URLSearchParams({ pageSize: '100', filterByFormula: dateFilter });
      if (offset) params.set('offset', offset);
      const data = await fetchAnalyticsPage(params);
      // Filtrar per activitat_id del centre
      const filtered = (data.records ?? []).filter((r: AirtableRecord) => {
        const aid = r.fields.activitat_id;
        return aid && activitatIds.has(aid);
      });
      allRecords.push(...filtered);
      offset = data.offset;
    } while (offset);

    // 3. Agregar per tipus
    const views  = allRecords.filter(r => r.fields.event_type === 'activity_view');
    const phones = allRecords.filter(r => r.fields.event_type === 'contact_phone');
    const emails = allRecords.filter(r => r.fields.event_type === 'contact_email');

    // Top activitats
    const activityMap: Record<string, { label: string; views: number; phone: number; email: number }> = {};
    const getLabel = (r: AirtableRecord) =>
      r.fields.event_label ?? activitats.find(a => a.id === r.fields.activitat_id)?.nom ?? r.fields.activitat_id ?? '?';

    for (const r of views) {
      const id = r.fields.activitat_id!;
      if (!activityMap[id]) activityMap[id] = { label: getLabel(r), views: 0, phone: 0, email: 0 };
      activityMap[id].views++;
    }
    for (const r of phones) {
      const id = r.fields.activitat_id!;
      if (!activityMap[id]) activityMap[id] = { label: getLabel(r), views: 0, phone: 0, email: 0 };
      activityMap[id].phone++;
    }
    for (const r of emails) {
      const id = r.fields.activitat_id!;
      if (!activityMap[id]) activityMap[id] = { label: getLabel(r), views: 0, phone: 0, email: 0 };
      activityMap[id].email++;
    }

    const topActivitats = Object.values(activityMap)
      .sort((a, b) => b.views - a.views)
      .slice(0, 15);

    // Devices
    const withDevice = allRecords.filter(r => r.fields.device && r.fields.device !== 'server');
    const mobile  = withDevice.filter(r => r.fields.device === 'mobile').length;
    const desktop = withDevice.filter(r => r.fields.device === 'desktop').length;

    return NextResponse.json({
      totalViews:    views.length,
      totalPhone:    phones.length,
      totalEmail:    emails.length,
      totalContacts: phones.length + emails.length,
      topActivitats,
      byDevice: { mobile, desktop },
      activitatCount: activitats.length,
      days,
    });
  } catch (e) {
    console.error('[centre-stats] Error:', e);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
