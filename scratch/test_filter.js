const fetch = require('node-fetch');

const API_KEY = "patlKCNNCeCTA05wk.da12fef9b08ddb10d006eef4366a6b40a0786171863eac874de6012f3742b2ed";
const BASE_ID = "appJbYV0iss4M9X2L";

async function fetchAllRecords(tableName, filterByFormula) {
  let allRecords = [];
  let offset;
  
  do {
    const params = new URLSearchParams();
    if (filterByFormula) params.append('filterByFormula', filterByFormula);
    if (offset) params.append('offset', offset);
    params.append('_cb', Date.now().toString());

    const url = `https://api.airtable.com/v0/${BASE_ID}/${tableName}${params.toString() ? '?' + params.toString() : ''}`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${API_KEY}` }
    });

    if (!res.ok) {
      throw new Error(`Error: ${res.status} ${await res.text()}`);
    }

    const data = await res.json();
    allRecords = allRecords.concat(data.records || []);
    offset = data.offset;
  } while (offset);

  return allRecords;
}

async function run() {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
  console.log("Fetching all activities...");
  const records = await fetchAllRecords('Activitats', '{publicada}=TRUE()');
  console.log(`Fetched ${records.length} published activities.`);

  const activitats = records.map(r => {
    return {
      id: r.id,
      nom: r.fields.nom,
      centre: r.fields.centre,
      tipus: r.fields.tipus || r.fields.Tipus || "Extraescolar",
      categoria: r.fields.categoria,
    };
  });

  const selectedTipus = 'Tallers i Oci';

  const filtered = activitats.filter(a => {
    const normalizedTipus = a.tipus?.toLowerCase().trim() || '';
    const matchTipus = selectedTipus === 'Totes' || 
                       (selectedTipus === 'Extraescolars' && (normalizedTipus === '' || normalizedTipus.includes('extraescolar'))) ||
                       (selectedTipus === 'Casals' && normalizedTipus.includes('casal')) ||
                       (selectedTipus === 'Tallers i Oci' && (
                         normalizedTipus.includes('taller') || 
                         normalizedTipus.includes('oci') || 
                         normalizedTipus.includes('monograf') || 
                         normalizedTipus.includes('escape') || 
                         normalizedTipus.includes('aniversari') || 
                         normalizedTipus.includes('virtual')
                       ));
    return matchTipus;
  });

  console.log(`Filtered count with selectedTipus = '${selectedTipus}': ${filtered.length}`);
  
  if (filtered.length > 0) {
    console.log("First 10 matched activities:");
    filtered.slice(0, 10).forEach(a => {
      console.log(`- ${a.nom} (tipus: "${a.tipus}")`);
    });
  } else {
    console.log("No activities matched. Here are some of the raw activities:");
    activitats.slice(0, 20).forEach(a => {
      console.log(`- ${a.nom} (tipus: "${a.tipus}")`);
    });
  }
}

run().catch(console.error);
