const fetch = require('node-fetch');

const API_KEY = "patlKCNNCeCTA05wk.da12fef9b08ddb10d006eef4366a6b40a0786171863eac874de6012f3742b2ed";
const BASE_ID = "appJbYV0iss4M9X2L";

async function run() {
  const url = `https://api.airtable.com/v0/${BASE_ID}/Activitats`;
  console.log("Fetching from:", url);
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${API_KEY}` }
  });
  if (!res.ok) {
    console.error("Error fetching:", res.status, await res.text());
    return;
  }
  const data = await res.json();
  console.log(`Fetched ${data.records.length} records.`);
  
  // Let's filter for ones from "Imagina Art" or having Monogràfic/Taller/Oci
  const filtered = data.records.filter(r => {
    const f = r.fields;
    const name = f.nom || '';
    const centre = String(f.centre || '');
    const tipus = f.tipus || f.Tipus || '';
    return name.includes('Imagina') || centre.includes('Imagina') || centre.includes('imagina') || tipus.toLowerCase().includes('taller') || tipus.toLowerCase().includes('oci');
  });

  console.log("Matching activities from Airtable:");
  filtered.forEach(r => {
    console.log({
      id: r.id,
      nom: r.fields.nom,
      centre: r.fields.centre,
      tipus: r.fields.tipus,
      Tipus: r.fields.Tipus,
      categoria: r.fields.categoria,
      publicada: r.fields.publicada
    });
  });
}

run().catch(console.error);
