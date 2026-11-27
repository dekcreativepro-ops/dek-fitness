// Recherche de lieux au Cameroun (quartier, rue, établissement) via Nominatim / OpenStreetMap.
// Le texte tapé est envoyé à nominatim.openstreetmap.org pour trouver le lieu.

export interface PlaceResult {
  label: string;
  lat: number;
  lng: number;
}

export async function searchPlaces(query: string, signal?: AbortSignal): Promise<PlaceResult[]> {
  const q = query.trim();
  if (q.length < 3) return [];
  const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=6&countrycodes=cm&accept-language=fr&q=${encodeURIComponent(q)}`;
  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error('Recherche indisponible');
  const data = (await res.json()) as { display_name: string; lat: string; lon: string }[];
  return data.map((d) => ({
    label: d.display_name.split(',').slice(0, 3).join(',').trim().replace(/&apos;/g, "'").replace(/&amp;/g, '&'),
    lat: Number(d.lat),
    lng: Number(d.lon),
  }));
}
