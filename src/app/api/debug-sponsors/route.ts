// DEBUG TEMPORAL - Eliminar després de diagnosticar
export const dynamic = 'force-dynamic';

export async function GET() {
  const API_KEY = process.env.AIRTABLE_API_KEY;
  const BASE_ID = process.env.AIRTABLE_BASE_ID;

  if (!API_KEY || !BASE_ID) {
    return Response.json({ error: 'Falta API_KEY o BASE_ID' });
  }

  try {
    const url = `https://api.airtable.com/v0/${BASE_ID}/Sponsors?filterByFormula={actiu}%3DTRUE()`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${API_KEY}` },
    });
    const data = await res.json();

    // Retornem els camps de cada registre per veure'ls directament
    const debug = (data.records || []).map((r: { id: string; fields: Record<string, unknown> }) => ({
      id: r.id,
      fieldKeys: Object.keys(r.fields),
      fields: r.fields,
    }));

    return Response.json({ count: debug.length, sponsors: debug });
  } catch (e) {
    return Response.json({ error: String(e) });
  }
}
