import type { GeneratedRoute } from './routeGenerator';
import { zonesOfRoute, type ZoneRecords } from './zones';

// Légende d'une piste : petit nom, description et difficulté calculées à partir du tracé réel.

export type TrackLevel = 'Facile' | 'Moyen' | 'Difficile' | 'Extrême';

export interface TrackInfo {
  name: string;
  description: string;
  level: TrackLevel;
  color: string;
  turns: number;
  km: number;
  minutes: number;
  zones: number;
  newZones: number;
}

const LEVEL_COLOR: Record<TrackLevel, string> = {
  Facile: '#C8FF00',
  Moyen: '#F5C542',
  Difficile: '#FF9F45',
  Extrême: '#FF4D5E',
};

export function describeTrack(args: {
  route: GeneratedRoute;
  baseKm: number; // distance du palier (3, 5, 10, 15)
  speedKmh: number;
  discipline: 'course' | 'marche' | 'velo';
  area?: string;
  records: ZoneRecords;
  survie: boolean;
}): TrackInfo {
  const { route, baseKm, speedKmh, discipline, area, records, survie } = args;
  const km = Number(route.distanceKm.toFixed(1));
  const turns = route.steps.length;
  const turnsPerKm = km > 0 ? turns / km : 0;

  // Difficulté : distance du palier + densité de virages (+ épreuve de survie)
  const score = baseKm + turnsPerKm * 0.5 + (survie ? 2 : 0);
  const level: TrackLevel = score <= 5.5 ? 'Facile' : score <= 8.5 ? 'Moyen' : score <= 13 ? 'Difficile' : 'Extrême';

  const ids = zonesOfRoute(route.coordinates);
  const newZones = ids.filter((id) => !records[id]).length;
  const minutes = Math.max(1, Math.round((km / speedKmh) * 60));

  const verb = discipline === 'velo' ? 'Parcours à vélo' : discipline === 'marche' ? 'Boucle de marche' : 'Boucle de course';
  const where = area ? ` autour de ${area}` : '';
  const shape =
    route.source === 'osrm'
      ? turns > 0
        ? `${turns} virage${turns > 1 ? 's' : ''} sur de vraies rues`
        : 'tracé presque droit sur de vraies rues'
      : 'tracé libre, rues non confirmées';
  const zonesText = newZones > 0 ? `${newZones} zone${newZones > 1 ? 's' : ''} NO RUN à conquérir` : 'zones déjà courues';

  return {
    name: area ? `Boucle ${area}` : `Boucle de ${km} km`,
    description: `${verb} de ${km} km${where} · ${shape} · environ ${minutes} min · ${zonesText}.`,
    level,
    color: LEVEL_COLOR[level],
    turns,
    km,
    minutes,
    zones: ids.length,
    newZones,
  };
}
