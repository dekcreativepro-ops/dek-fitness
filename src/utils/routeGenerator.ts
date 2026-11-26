export interface GeneratedRoute {
  coordinates: [number, number][]; // [lat, lng]
  distanceKm: number;
  source: 'osrm' | 'fallback';
  safetyScore: number;
}

function offsetLatLng(lat: number, lng: number, distKm: number, bearingDeg: number): [number, number] {
  const R = 6371;
  const brng = (bearingDeg * Math.PI) / 180;
  const lat1 = (lat * Math.PI) / 180;
  const lng1 = (lng * Math.PI) / 180;
  const dR = distKm / R;

  const lat2 = Math.asin(
    Math.sin(lat1) * Math.cos(dR) + Math.cos(lat1) * Math.sin(dR) * Math.cos(brng),
  );
  const lng2 =
    lng1 +
    Math.atan2(
      Math.sin(brng) * Math.sin(dR) * Math.cos(lat1),
      Math.cos(dR) - Math.sin(lat1) * Math.sin(lat2),
    );

  return [(lat2 * 180) / Math.PI, (lng2 * 180) / Math.PI];
}

function buildFallbackLoop(lat: number, lng: number, targetKm: number, seedAngle: number): [number, number][] {
  const points: [number, number][] = [];
  const steps = 28;
  // Un cercle de rayon R a une circonférence 2*PI*R
  const radiusKm = targetKm / (2 * Math.PI);
  const [centerLat, centerLng] = offsetLatLng(lat, lng, radiusKm, seedAngle);

  for (let i = 0; i <= steps; i++) {
    const angle = (seedAngle + 180 + (i / steps) * 360) % 360;
    // Légère variation organique pour imiter un tracé urbain
    const jitter = 1 + Math.sin(i * 1.7) * 0.08;
    const pt = offsetLatLng(centerLat, centerLng, radiusKm * jitter, angle);
    points.push(pt);
  }
  points[0] = [lat, lng];
  points[points.length - 1] = [lat, lng];
  return points;
}

/**
 * Génère un parcours en boucle autour de (lat, lng) proche de targetKm.
 * Utilise OSRM (OpenStreetMap) pour suivre les vraies rues, avec repli géométrique si hors-ligne.
 */
export async function generateLoopRoute(
  lat: number,
  lng: number,
  targetKm: number,
  seedAngle = Math.floor(Math.random() * 360),
): Promise<GeneratedRoute> {
  // Les rues ajoutent ~35% de détour par rapport à la ligne droite
  const legKm = (targetKm / 4) * 0.72;
  const p1 = offsetLatLng(lat, lng, legKm, seedAngle);
  const p2 = offsetLatLng(p1[0], p1[1], legKm, (seedAngle + 95) % 360);
  const p3 = offsetLatLng(p2[0], p2[1], legKm, (seedAngle + 190) % 360);

  const waypoints: [number, number][] = [
    [lat, lng],
    p1,
    p2,
    p3,
    [lat, lng],
  ];

  const coordStr = waypoints.map(([la, ln]) => `${ln.toFixed(5)},${la.toFixed(5)}`).join(';');
  const url = `https://router.project-osrm.org/route/v1/foot/${coordStr}?overview=full&geometries=geojson`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4500);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);

    if (!res.ok) throw new Error('OSRM non disponible');
    const data = await res.json();
    const route = data?.routes?.[0];
    if (!route?.geometry?.coordinates?.length) throw new Error('Tracé vide');

    const coords: [number, number][] = route.geometry.coordinates.map(
      ([ln, la]: [number, number]) => [la, ln],
    );
    const distKm = Number((route.distance / 1000).toFixed(2));

    return {
      coordinates: coords,
      distanceKm: distKm,
      source: 'osrm',
      safetyScore: 92 + (seedAngle % 7),
    };
  } catch {
    return {
      coordinates: buildFallbackLoop(lat, lng, targetKm, seedAngle),
      distanceKm: targetKm,
      source: 'fallback',
      safetyScore: 95,
    };
  }
}
