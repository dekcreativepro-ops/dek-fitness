import type { Map as MapLibreMap } from 'maplibre-gl';

// Repères de carte lisibles « comme un vrai GPS » : le style sombre d'OpenFreeMap a des noms de rues et de quartiers
// en gris foncé quasi invisibles et aucun point d'intérêt. On éclaircit les textes existants (quartiers, rues, eau)
// et on ajoute les lieux (écoles, hôpitaux, lieux de culte, stades, commerces…) avec leur nom.

const HALO = '#0E0F12';
const FONT = ['Noto Sans Regular'];

/** Couleur du point selon la catégorie du lieu. */
const POI_COLOR: unknown[] = [
  'match',
  ['get', 'class'],
  ['hospital', 'pharmacy', 'doctors', 'clinic'],
  '#FF4D5E',
  ['school', 'college', 'university', 'kindergarten', 'library'],
  '#5BD6FF',
  ['place_of_worship'],
  '#C8FF00',
  ['stadium', 'pitch', 'sports_centre', 'swimming', 'park', 'playground', 'dog_park'],
  '#7DDC6B',
  ['restaurant', 'cafe', 'fast_food', 'bar', 'bakery', 'ice_cream'],
  '#FF9F45',
  ['bus', 'railway', 'airport', 'ferry_terminal', 'harbor'],
  '#B58CFF',
  ['bank', 'atm', 'post', 'police', 'fire_station', 'townhall', 'courthouse'],
  '#FFD36B',
  '#A1A1AA',
];

/** Rues, eau et parcs éclaircis (le style d'origine les rend quasi noirs sur noir). */
const BASE_COLORS: Record<string, ['fill-color' | 'line-color', string]> = {
  water: ['fill-color', '#12303F'],
  waterway: ['line-color', '#12303F'],
  landuse_park: ['fill-color', '#12271A'],
  landcover_wood: ['fill-color', '#12271A'],
  landuse_residential: ['fill-color', '#15161B'],
  highway_path: ['line-color', '#3B3F4A'],
  highway_minor: ['line-color', '#3B3F4A'],
  highway_major_casing: ['line-color', '#101116'],
  highway_major_inner: ['line-color', '#4D525E'],
  highway_major_subtle: ['line-color', '#4D525E'],
  highway_motorway_casing: ['line-color', '#101116'],
  highway_motorway_subtle: ['line-color', '#4D525E'],
  railway: ['line-color', '#4A4D57'],
};

export function enhanceMapLabels(map: MapLibreMap): void {
  const layers = map.getStyle()?.layers ?? [];

  for (const [id, [prop, color]] of Object.entries(BASE_COLORS)) {
    if (map.getLayer(id)) map.setPaintProperty(id, prop, color);
  }

  for (const lyr of layers) {
    if (lyr.type !== 'symbol' || !lyr.layout || !('text-field' in lyr.layout)) continue;
    const id = lyr.id;
    let color = '#D9DBE1';
    if (id === 'water_name') color = '#7CC7E8';
    else if (id === 'place_suburb' || id === 'place_other' || id === 'place_village') color = '#E3F58A'; // quartiers
    else if (id.startsWith('place_')) color = '#FFFFFF'; // villes, régions
    else if (id.startsWith('highway_name')) color = '#C4C8D2';

    map.setPaintProperty(id, 'text-color', color);
    map.setPaintProperty(id, 'text-halo-color', HALO);
    map.setPaintProperty(id, 'text-halo-width', 1.8);
    map.setPaintProperty(id, 'text-halo-blur', 0.4);
    map.setPaintProperty(id, 'text-opacity', 1);

    if (id === 'highway_name_other' || id === 'highway_name_motorway') {
      map.setLayoutProperty(id, 'text-size', ['interpolate', ['linear'], ['zoom'], 12, 10, 16, 13]);
    } else if (id === 'place_suburb' || id === 'place_other' || id === 'place_village') {
      map.setLayoutProperty(id, 'text-size', ['interpolate', ['linear'], ['zoom'], 11, 11, 16, 16]);
    }
  }

  const vectorSourceId = Object.keys(map.getStyle()?.sources ?? {}).find(
    (k) => map.getStyle()?.sources?.[k]?.type === 'vector',
  );
  if (!vectorSourceId || map.getLayer('dek-poi-dot')) return;

  map.addLayer({
    id: 'dek-poi-dot',
    type: 'circle',
    source: vectorSourceId,
    'source-layer': 'poi',
    minzoom: 14,
    filter: ['has', 'name'],
    paint: {
      'circle-radius': ['interpolate', ['linear'], ['zoom'], 14, 3, 17, 5],
      'circle-color': POI_COLOR as never,
      'circle-stroke-color': HALO,
      'circle-stroke-width': 1.5,
    },
  });

  map.addLayer({
    id: 'dek-poi-label',
    type: 'symbol',
    source: vectorSourceId,
    'source-layer': 'poi',
    minzoom: 14.6,
    filter: ['has', 'name'],
    layout: {
      'text-field': ['coalesce', ['get', 'name:latin'], ['get', 'name']],
      'text-font': FONT,
      'text-size': ['interpolate', ['linear'], ['zoom'], 14.6, 10, 17, 12.5],
      'text-anchor': 'top',
      'text-offset': [0, 0.7],
      'text-max-width': 7,
      'symbol-sort-key': ['coalesce', ['get', 'rank'], 99],
    },
    paint: {
      'text-color': '#E8EAF0',
      'text-halo-color': HALO,
      'text-halo-width': 1.8,
    },
  });
}
