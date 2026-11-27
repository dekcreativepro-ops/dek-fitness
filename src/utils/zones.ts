import * as maplibregl from 'maplibre-gl';
import type { GeoJSONSource, Map as MapLibreMap, Marker } from 'maplibre-gl';

// Zones de course : le pays est découpé en carrés d'environ 550 m. Une zone jamais courue est « NO RUN » (voilée) ;
// une zone déjà courue porte une médaille animée avec le meilleur score. Les records sont gardés sur l'appareil.

export const ZONE_CELL = 0.005; // degrés (~550 m)
export const ZONE_RADIUS = 6; // zones affichées autour du centre (13 x 13)
export const ZONE_STORAGE_KEY = 'dek_zone_records_v1';

export interface ZoneRecord {
  best: number;
  runs: number;
  lastDay: string;
}
export type ZoneRecords = Record<string, ZoneRecord>;
export interface PlaceName {
  name: string;
  lng: number;
  lat: number;
}

export const zoneIndex = (lat: number, lng: number): [number, number] => [Math.floor(lat / ZONE_CELL), Math.floor(lng / ZONE_CELL)];
export const zoneId = (iy: number, ix: number) => `${iy}_${ix}`;

export function zonesOfRoute(coords: [number, number][]): string[] {
  const ids = new Set<string>();
  for (const [lat, lng] of coords) {
    const [iy, ix] = zoneIndex(lat, lng);
    ids.add(zoneId(iy, ix));
  }
  return [...ids];
}

export function loadZoneRecords(): ZoneRecords {
  try {
    const raw = window.localStorage.getItem(ZONE_STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as ZoneRecords) : {};
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

export function saveZoneRecords(records: ZoneRecords): void {
  try {
    window.localStorage.setItem(ZONE_STORAGE_KEY, JSON.stringify(records));
  } catch {
    // stockage indisponible : les records ne seront pas conservés
  }
}

export function recordRun(prev: ZoneRecords, ids: string[], score: number, day: string): ZoneRecords {
  const next = { ...prev };
  for (const id of ids) {
    const old = next[id];
    next[id] = { best: Math.max(old?.best ?? 0, score), runs: (old?.runs ?? 0) + 1, lastDay: day };
  }
  return next;
}

export function nearestPlace(places: PlaceName[], lat: number, lng: number): string | undefined {
  let best: PlaceName | undefined;
  let bestD = 0.009 * 0.009; // ~1 km
  for (const p of places) {
    const d = (p.lat - lat) ** 2 + (p.lng - lng) ** 2;
    if (d < bestD) {
      bestD = d;
      best = p;
    }
  }
  return best?.name;
}

export function buildZoneGeoJSON(centerLat: number, centerLng: number, records: ZoneRecords, places: PlaceName[]) {
  const [cy, cx] = zoneIndex(centerLat, centerLng);
  const features = [];
  for (let dy = -ZONE_RADIUS; dy <= ZONE_RADIUS; dy++) {
    for (let dx = -ZONE_RADIUS; dx <= ZONE_RADIUS; dx++) {
      const iy = cy + dy;
      const ix = cx + dx;
      const id = zoneId(iy, ix);
      const south = iy * ZONE_CELL;
      const west = ix * ZONE_CELL;
      const name = nearestPlace(places, south + ZONE_CELL / 2, west + ZONE_CELL / 2);
      const rec = records[id];
      features.push({
        type: 'Feature' as const,
        properties: {
          id,
          status: rec ? 'run' : 'norun',
          label: rec ? (name ?? 'Zone courue') : `${name ? name + '\n' : ''}NO RUN`,
        },
        geometry: {
          type: 'Polygon' as const,
          coordinates: [
            [
              [west, south],
              [west + ZONE_CELL, south],
              [west + ZONE_CELL, south + ZONE_CELL],
              [west, south + ZONE_CELL],
              [west, south],
            ],
          ],
        },
      });
    }
  }
  return { type: 'FeatureCollection' as const, features };
}

export function addZoneLayers(map: MapLibreMap): void {
  if (map.getSource('dek-zones')) return;
  map.addSource('dek-zones', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
  const firstLabel = map.getStyle()?.layers?.find((l) => l.type === 'symbol' && l.layout && 'text-field' in l.layout)?.id;
  map.addLayer(
    {
      id: 'dek-zones-fill',
      type: 'fill',
      source: 'dek-zones',
      paint: {
        'fill-color': ['match', ['get', 'status'], 'run', '#C8FF00', '#0A0B0E'],
        'fill-opacity': ['match', ['get', 'status'], 'run', 0.14, 0.42],
      },
    },
    firstLabel,
  );
  map.addLayer(
    {
      id: 'dek-zones-line',
      type: 'line',
      source: 'dek-zones',
      paint: {
        'line-color': ['match', ['get', 'status'], 'run', '#C8FF00', '#6B6C75'],
        'line-width': ['match', ['get', 'status'], 'run', 2, 1],
        'line-opacity': ['match', ['get', 'status'], 'run', 0.85, 0.7],
        'line-dasharray': [2, 2],
      },
    },
    firstLabel,
  );
}

export function addZoneLabels(map: MapLibreMap): void {
  if (map.getLayer('dek-zones-label')) return;
  map.addLayer({
    id: 'dek-zones-label',
    type: 'symbol',
    source: 'dek-zones',
    minzoom: 12.5,
    layout: {
      'text-field': ['get', 'label'],
      'text-font': ['Noto Sans Regular'],
      'text-size': ['interpolate', ['linear'], ['zoom'], 13, 9, 16, 12],
      'text-justify': 'center',
      'text-letter-spacing': 0.08,
    },
    paint: {
      'text-color': ['match', ['get', 'status'], 'run', '#C8FF00', '#9A9CA6'],
      'text-halo-color': '#0E0F12',
      'text-halo-width': 1.6,
    },
  });
}

export function updateZoneSource(map: MapLibreMap, centerLat: number, centerLng: number, records: ZoneRecords, places: PlaceName[]): void {
  const src = map.getSource('dek-zones') as GeoJSONSource | undefined;
  src?.setData(buildZoneGeoJSON(centerLat, centerLng, records, places) as never);
}

/** Noms de quartiers lus dans les tuiles déjà chargées (couche « place » d'OpenMapTiles). */
export function readPlaceNames(map: MapLibreMap): PlaceName[] {
  const sources = map.getStyle()?.sources ?? {};
  const vectorId = Object.keys(sources).find((k) => sources[k]?.type === 'vector');
  if (!vectorId) return [];
  const seen = new Map<string, PlaceName>();
  const feats = map.querySourceFeatures(vectorId, {
    sourceLayer: 'place',
    filter: ['in', ['get', 'class'], ['literal', ['suburb', 'neighbourhood', 'quarter', 'village', 'hamlet', 'town', 'city']]],
  });
  for (const f of feats) {
    const name = (f.properties?.['name:latin'] ?? f.properties?.name) as string | undefined;
    if (!name || f.geometry.type !== 'Point') continue;
    const [lng, lat] = f.geometry.coordinates as [number, number];
    seen.set(name, { name, lng, lat });
  }
  return [...seen.values()];
}

function medalColor(score: number): { rim: string; face: string } {
  if (score >= 250) return { rim: '#B8860B', face: '#F5C542' };
  if (score >= 120) return { rim: '#7C8594', face: '#D5DAE3' };
  return { rim: '#8A4F1D', face: '#D58A4A' };
}

function medalElement(score: number, runs: number): HTMLElement {
  const c = medalColor(score);
  const wrap = document.createElement('div');
  wrap.innerHTML = `<div class="dek-medal" title="Meilleur score : ${score} pts (${runs} course${runs > 1 ? 's' : ''})">
    <svg viewBox="0 0 48 60" width="40" height="50" aria-hidden="true">
      <path d="M14 0 L24 22 L34 0 Z" fill="#C8FF00"/><path d="M14 0 L20 0 L28 20 L24 22Z" fill="#8DB800"/>
      <circle cx="24" cy="36" r="17" fill="${c.rim}"/><circle cx="24" cy="36" r="14" fill="${c.face}"/>
      <path d="M24 26 l3 6.4 7 .8-5.2 4.8 1.4 6.9-6.2-3.5-6.2 3.5 1.4-6.9-5.2-4.8 7-.8z" fill="${c.rim}" opacity=".85"/>
      <ellipse cx="18.5" cy="29.5" rx="4" ry="2.4" fill="#fff" opacity=".45" transform="rotate(-35 18.5 29.5)"/>
    </svg>
    <span class="dek-medal-score">${score} pts</span>
  </div>`;
  return wrap;
}

/** Synchronise les médailles flottantes : une par zone courue autour du centre. */
export function syncMedals(map: MapLibreMap, markers: Map<string, Marker>, records: ZoneRecords, centerLat: number, centerLng: number): void {
  const [cy, cx] = zoneIndex(centerLat, centerLng);
  const wanted = new Set<string>();
  for (const [id, rec] of Object.entries(records)) {
    const [iy, ix] = id.split('_').map(Number);
    if (Math.abs(iy - cy) > ZONE_RADIUS || Math.abs(ix - cx) > ZONE_RADIUS) continue;
    wanted.add(id);
    markers.get(id)?.remove();
    const m = new maplibregl.Marker({ element: medalElement(rec.best, rec.runs), anchor: 'bottom' })
      .setLngLat([ix * ZONE_CELL + ZONE_CELL / 2, iy * ZONE_CELL + ZONE_CELL / 2])
      .addTo(map);
    markers.set(id, m);
  }
  for (const [id, m] of markers) {
    if (!wanted.has(id)) {
      m.remove();
      markers.delete(id);
    }
  }
}
