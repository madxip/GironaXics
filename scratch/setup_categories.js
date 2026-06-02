const fetch = require('node-fetch');

const API_KEY = "patlKCNNCeCTA05wk.da12fef9b08ddb10d006eef4366a6b40a0786171863eac874de6012f3742b2ed";
const BASE_ID = "appJbYV0iss4M9X2L";

async function fetchAllRecords(tableName) {
  let allRecords = [];
  let offset;
  
  do {
    const params = new URLSearchParams();
    if (offset) params.append('offset', offset);
    params.append('_cb', Date.now().toString());

    const url = `https://api.airtable.com/v0/${BASE_ID}/${tableName}${params.toString() ? '?' + params.toString() : ''}`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${API_KEY}` }
    });

    if (!res.ok) {
      if (res.status === 404) {
        return null; // Table does not exist
      }
      throw new Error(`Error fetching ${tableName}: ${res.status} ${await res.text()}`);
    }

    const data = await res.json();
    allRecords = allRecords.concat(data.records || []);
    offset = data.offset;
  } while (offset);

  return allRecords;
}

async function run() {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
  
  console.log("1. Fetching all unique categories from 'Activitats'...");
  const activitats = await fetchAllRecords('Activitats');
  if (!activitats) {
    console.error("Could not fetch Activitats. Please check base ID and API key.");
    return;
  }

  const uniqueCategories = new Set();
  activitats.forEach(r => {
    // If it's an array (already linked), get the first item
    const cat = Array.isArray(r.fields.categoria) ? r.fields.categoria[0] : r.fields.categoria;
    if (cat && typeof cat === 'string') {
      const trimmed = cat.trim();
      if (trimmed) uniqueCategories.add(trimmed);
    }
  });

  console.log(`Found ${uniqueCategories.size} unique categories in activities:`, Array.from(uniqueCategories));

  console.log("\n2. Checking if 'Categories' table exists in Airtable...");
  const existingCategories = await fetchAllRecords('Categories');
  
  if (existingCategories === null) {
    console.log("❌ The table 'Categories' does NOT exist in your Airtable yet.");
    console.log("👉 Please create a table named 'Categories' in your Airtable interface first.");
    console.log("   Make sure the primary (first) column is named 'Nom' (Text type).");
    console.log("   Once you create it, run this script again and it will automatically populate all categories for you!");
    return;
  }

  console.log(`✅ The table 'Categories' exists! It currently has ${existingCategories.length} records.`);
  
  const existingNames = new Set(
    existingCategories.map(r => r.fields.Nom || r.fields.nom || '').map(n => String(n).trim()).filter(Boolean)
  );

  const toInsert = Array.from(uniqueCategories).filter(cat => !existingNames.has(cat));
  console.log(`Categories to insert: ${toInsert.length}`, toInsert);

  if (toInsert.length === 0) {
    console.log("🎉 All categories are already present in the 'Categories' table!");
    return;
  }

  console.log("\n3. Inserting missing categories into 'Categories' table...");
  
  // Airtable allows inserting up to 10 records per request
  for (let i = 0; i < toInsert.length; i += 10) {
    const chunk = toInsert.slice(i, i + 10);
    const body = {
      records: chunk.map(name => ({
        fields: {
          Nom: name
        }
      }))
    };

    const url = `https://api.airtable.com/v0/${BASE_ID}/Categories`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    if (!res.ok) {
      console.error(`Failed to insert chunk starting at index ${i}:`, res.status, await res.text());
      return;
    }
    console.log(`Inserted chunk of ${chunk.length} categories:`, chunk);
  }

  console.log("\n🎉 Categories table successfully populated and synchronized!");
}

run().catch(console.error);
