/**
 * Geocodes an address string using OpenStreetMap's Nominatim API.
 * Free, open-source, and does not require an API key.
 */
export async function geocodeAddress(addressStr: string): Promise<{ lat: number; lng: number } | null> {
  if (!addressStr || !addressStr.trim()) return null;

  // Add region fallback for better accuracy in Girona/Catalunya
  const query = addressStr.toLowerCase().includes('girona') || addressStr.toLowerCase().includes('catalunya')
    ? addressStr.trim()
    : `${addressStr.trim()}, Girona, Catalunya, Espanya`;

  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`;
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'GironaXics-App/1.0 (info@gironaxics.cat)'
      },
      next: { revalidate: 86400 } // cache for 24h
    });

    if (!res.ok) return null;
    const data = await res.json();
    if (Array.isArray(data) && data.length > 0) {
      const lat = parseFloat(data[0].lat);
      const lng = parseFloat(data[0].lon);
      if (!isNaN(lat) && !isNaN(lng)) {
        return { lat, lng };
      }
    }
  } catch (err) {
    console.error('[Geocoding API] Error geocoding address:', addressStr, err);
  }
  return null;
}
