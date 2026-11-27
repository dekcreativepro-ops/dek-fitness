import * as maplibregl from 'maplibre-gl';
import type { Map as MapLibreMap, Marker } from 'maplibre-gl';
import type { GeneratedRoute } from './routeGenerator';

// Repères du tracé : drapeau départ/arrivée et bornes tous les kilomètres.

function haversineM(a: [number, number], b: [number, number]): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b[0] - a[0]);
  const dLng = toRad(b[1] - a[1]);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a[0])) * Math.cos(toRad(b[0])) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

function flagElement(): HTMLElement {
  const el = document.createElement('div');
  el.innerHTML = `<div class="dek-flag"><span class="dek-flag-label">DÉPART / ARRIVÉE</span>
    <svg viewBox="0 0 24 30" width="22" height="28" aria-hidden="true"><path d="M5 2v26" stroke="#E4E4E7" stroke-width="2.4" stroke-linecap="round"/><path d="M6 3h15l-4 5 4 5H6z" fill="#C8FF00" stroke="#0E0F12" stroke-width="1.2" stroke-linejoin="round"/></svg></div>`;
  return el;
}

function kmElement(km: number): HTMLElement {
  const el = document.createElement('div');
  el.className = 'dek-km';
  el.textContent = String(km);
  el.title = `${km} km`;
  return el;
}

/** Remplace les repères du tracé précédent par ceux du nouveau. */
export function syncRouteMarkers(map: MapLibreMap, old: Marker[], route: GeneratedRoute): Marker[] {
  old.forEach((m) => m.remove());
  const coords = route.coordinates;
  if (coords.length < 2) return [];
  const markers: Marker[] = [];
  markers.push(new maplibregl.Marker({ element: flagElement(), anchor: 'bottom' }).setLngLat([coords[0][1], coords[0][0]]).addTo(map));

  let cum = 0;
  let nextKm = 1;
  const totalM = route.distanceKm * 1000;
  for (let i = 1; i < coords.length; i++) {
    cum += haversineM(coords[i - 1], coords[i]);
    if (cum >= nextKm * 1000 && cum < totalM - 250) {
      markers.push(new maplibregl.Marker({ element: kmElement(nextKm) }).setLngLat([coords[i][1], coords[i][0]]).addTo(map));
      nextKm += 1;
    }
  }
  return markers;
}
