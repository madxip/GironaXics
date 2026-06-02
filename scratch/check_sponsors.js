const fetch = require('node-fetch');

const API_KEY = "patlKCNNCeCTA05wk.da12fef9b08ddb10d006eef4366a6b40a0786171863eac874de6012f3742b2ed";
const BASE_ID = "appJbYV0iss4M9X2L";

async function run() {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
  const url = `https://api.airtable.com/v0/${BASE_ID}/Sponsors`;
  console.log("Fetching sponsors from:", url);
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${API_KEY}` }
  });
  if (!res.ok) {
    console.error("Error fetching:", res.status, await res.text());
    return;
  }
  const data = await res.json();
  console.log(`Fetched ${data.records.length} sponsor records.`);
  
  data.records.forEach(r => {
    console.log({
      id: r.id,
      fields: r.fields
    });
  });
}

run().catch(console.error);
