const API_KEY = "patlKCNNCeCTA05wk.da12fef9b08ddb10d006eef4366a6b40a0786171863eac874de6012f3742b2ed";
const BASE_ID = "appJbYV0iss4M9X2L";

async function fetchAllRecords(tableName, filterByFormula) {
  const params = new URLSearchParams();
  if (filterByFormula) params.append('filterByFormula', filterByFormula);
  
  const url = `https://api.airtable.com/v0/${BASE_ID}/${tableName}?${params.toString()}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${API_KEY}` }
  });
  
  if (!res.ok) {
    throw new Error(`Error: ${res.status} ${await res.text()}`);
  }
  return await res.json();
}

async function test() {
  try {
    console.log("Querying table 'Casals'...");
    const data = await fetchAllRecords('Casals', '{actiu}=TRUE()');
    console.log("Airtable Response:", JSON.stringify(data, null, 2));
    
    if (data.records && data.records.length > 0) {
      const todayStr = new Date().toLocaleDateString('sv-SE');
      console.log("Today is:", todayStr);
      
      const r = data.records[0];
      const f = r.fields;
      
      const limitKey = Object.keys(f).find(k => 
        k.toLowerCase().includes('limit') || 
        k.toLowerCase().includes('límit') || 
        k.toLowerCase().includes('deadline')
      );
      
      const rawLimit = limitKey ? f[limitKey] : undefined;
      console.log("Raw limit value:", rawLimit);
      
      if (rawLimit && typeof rawLimit === 'string') {
        const limitStr = rawLimit.split('T')[0];
        console.log("Parsed limit date:", limitStr);
        if (limitStr && todayStr > limitStr) {
          console.log("Banner IS EXPIRED!");
        } else {
          console.log("Banner is active and within limit.");
        }
      } else {
        console.log("No limit date found or invalid format.");
      }
    } else {
      console.log("No active banner records found in Airtable.");
    }
  } catch (err) {
    console.error("Test failed:", err);
  }
}

test();
