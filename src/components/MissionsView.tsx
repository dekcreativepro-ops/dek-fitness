import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import * as maplibregl from 'maplibre-gl';
// MapLibre v6 cherche son worker à côté de son propre fichier : introuvable une fois
// l'app bundlée par Vite (dev : 504, build : fichier absent) → carte vide.
// On fait bundler le worker par Vite et on donne son URL à MapLibre.
import maplibreWorkerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowsClockwise,
  CaretRight,
  Check,
  Compass,
  Lightning,
  Lock,
  MagnifyingGlass,
  Maximize,
  Minimize,
  Microphone,
  MicrophoneSlash,
  Minus,
  Plus,
  SlidersHorizontal,
  Warning,
} from './DekIcons';
import { INITIAL_TERRITORIES } from '../data/gamesData';
import { INITIAL_RUNNERS, MISSION_TIERS } from '../data/mockData';
import type {
  LobbyRunner,
  MissionDifficulty,
  OutdoorDiscipline,
  OutdoorGameMode,
  TerritoryZone,
} from '../types/dek';
import { CAMEROON_CITIES, CAMEROON_REGIONS } from '../data/cities';
import { getTierIndex, TIER_COLORS, TIER_REQUIREMENTS } from '../utils/categorization';
import { enhanceMapLabels } from '../utils/mapLabels';
import { say } from '../utils/gameVoice';
import { CoachBubble } from './coach/CoachBubble';
import { useCoachLive } from './coach/coachHooks';
import { loadPerf, savePerf } from '../utils/coachProfile';
import { addBonus, ledgerTotal, type BonusId, type BonusLedger } from '../utils/bonusSet';
import { BonusSummary } from './ui/GameKit';
import { searchPlaces, type PlaceResult } from '../utils/placeSearch';
import { syncRouteMarkers } from '../utils/routeMarkers';
import {
  addZoneLabels,
  addZoneLayers,
  loadZoneRecords,
  nearestPlace,
  readPlaceNames,
  recordRun,
  saveZoneRecords,
  syncMedals,
  updateZoneSource,
  ZONE_RADIUS,
  zonesOfRoute,
  type PlaceName,
  type ZoneRecords,
} from '../utils/zones';
import { dayKey } from '../utils/progression';
import { describeTrack } from '../utils/trackInfo';
import { generateLoopRoute, type GeneratedRoute } from '../utils/routeGenerator';
import { playGo, playHit, playTick, playVictory } from '../utils/soundFx';
import { CheckDraw } from './ui/AnimatedIcons';
import { BottomSheet, Button, Card, ChipTabs, IconButton, ListRow, ProgressBar, StatTiles, Tile } from './ui/kit';

interface MissionsViewProps {
  /** Ville du profil : la carte s'ouvre dessus si elle fait partie de la liste */
  userCity?: string;
  userCategory: MissionDifficulty;
  missionsInCurrentTier: number;
  onRequestRetakeTest: () => void;
  onMissionComplete: (
    xpEarned: number,
    distanceKm: number,
    rankPos: number,
    tier: MissionDifficulty,
    modeLabel: string,
  ) => void;
  onMissionFail: (reason?: string) => void;
  onTerritoryCapture: (zoneName: string) => void;
}

const PRESET_CITIES = CAMEROON_CITIES;

const TIME_SLOTS = ['05:00', '06:00', '07:00', '18:30', '20:00'];

const DISCIPLINES: { id: OutdoorDiscipline; label: string; speedMult: number }[] = [
  { id: 'course', label: 'Course', speedMult: 1 },
  { id: 'marche', label: 'Marche', speedMult: 0.6 },
  { id: 'velo', label: 'Vélo', speedMult: 2.1 },
];

const OUTDOOR_MODES: { id: OutdoorGameMode; label: string; short: string }[] = [
  { id: 'mission_5am', label: 'Mission 05h', short: 'Mission 05h' },
  { id: 'survie_checkpoint', label: 'Survie Checkpoint', short: 'Survie CP' },
  { id: 'relais_escouade', label: 'Relais Escouade', short: 'Relais 4x' },
  { id: 'conquete_territoire', label: 'Conquête Territoire', short: 'Territoire' },
  { id: 'fantome', label: 'Duel Fantôme', short: 'Fantôme' },
];

/** Réglages de la carte : « Léger » (fluide) ou « Large » (tous les détails), puis interrupteurs détaillés. */
interface MapOpts {
  detail: 'leger' | 'large';
  zones: boolean;
  places: boolean;
  buildings: boolean;
  streets: boolean;
  km: boolean;
  bonus: boolean;
  alerts: boolean;
  voice: boolean;
}
const MAP_OPTS_KEY = 'dek_map_options_v1';
const LARGE_OPTS: MapOpts = { detail: 'large', zones: true, places: true, buildings: true, streets: true, km: true, bonus: true, alerts: true, voice: true };
const LIGHT_OPTS: MapOpts = { detail: 'leger', zones: true, places: false, buildings: false, streets: false, km: true, bonus: true, alerts: true, voice: true };
function loadMapOpts(): MapOpts {
  try {
    const raw = window.localStorage.getItem(MAP_OPTS_KEY);
    return raw ? { ...LARGE_OPTS, ...(JSON.parse(raw) as Partial<MapOpts>) } : LARGE_OPTS;
  } catch {
    return LARGE_OPTS;
  }
}
const MAP_TOGGLES: { key: Exclude<keyof MapOpts, 'detail'>; label: string; hint: string }[] = [
  { key: 'zones', label: 'Zones NO RUN & médailles', hint: 'Carrés de 550 m' },
  { key: 'places', label: 'Lieux', hint: 'Écoles, hôpitaux, stades…' },
  { key: 'streets', label: 'Noms de rues', hint: 'Sur le tracé et autour' },
  { key: 'buildings', label: 'Bâtiments 3D', hint: 'Plus gourmand' },
  { key: 'km', label: 'Bornes kilométriques', hint: '1, 2, 3 km…' },
  { key: 'bonus', label: 'Bonus chrono', hint: '30 s pour les prendre' },
  { key: 'alerts', label: 'Vibration & lueur verte', hint: 'Près d’un bonus et de l’arrivée' },
  { key: 'voice', label: 'Voix de jeu', hint: 'Annonceur gamer en anglais (voix féminine pour les joueuses)' },
];

/** Bonus de jeu : chrono de 30 s pour pousser tes limites ; le temps restant s'ajoute à l'XP du bonus. */
const BONUS_LIMIT_SEC = 30;
const BONUS_KINDS = {
  xp: { label: 'Lion · Puissance', base: 10, id: 'lion' as BonusId },
  turbo: { label: 'Tigre · Éclair', base: 20, id: 'guepard' as BonusId },
  star: { label: 'Aigle · Précision', base: 35, id: 'faucon' as BonusId },
} as const;
type BonusKind = keyof typeof BONUS_KINDS;
interface Bonus {
  id: number;
  kind: BonusKind;
  lat: number;
  lng: number;
  expiresAt: number;
  ratio: number; // position le long du tracé (0 à 1)
}

/** Fenêtre de temps (s) pour atteindre chaque checkpoint en mode Survie. */
const CP_WINDOW_SEC = 11;

maplibregl.setWorkerUrl(maplibreWorkerUrl);

type MissionPhase =
  | 'lobby'
  | 'relay_wait'
  | 'countdown'
  | 'gate'
  | 'running'
  | 'completed'
  | 'failed';

function computeBearing(from: [number, number], to: [number, number]): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const toDeg = (r: number) => (r * 180) / Math.PI;
  const lon1 = toRad(from[0]);
  const lat1 = toRad(from[1]);
  const lon2 = toRad(to[0]);
  const lat2 = toRad(to[1]);
  const dLon = lon2 - lon1;
  const y = Math.sin(dLon) * Math.cos(lat2);
  const x =
    Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
  return (toDeg(Math.atan2(y, x)) + 360) % 360;
}

export function MissionsView({
  userCity,
  userCategory,
  missionsInCurrentTier,
  onRequestRetakeTest,
  onMissionComplete,
  onMissionFail,
  onTerritoryCapture,
}: MissionsViewProps) {
  const [discipline, setDiscipline] = useState<OutdoorDiscipline>('course');
  const [gameMode, setGameMode] = useState<OutdoorGameMode>('mission_5am');
  const [selectedSlot, setSelectedSlot] = useState('05:00');
  const [selectedTier, setSelectedTier] = useState<MissionDifficulty>(userCategory);
  const [lockedTierModal, setLockedTierModal] = useState<MissionDifficulty | null>(null);
  const [geoMode, setGeoMode] = useState<'global' | 'local'>('global');
  const [cityIdx, setCityIdx] = useState(() => Math.max(0, PRESET_CITIES.findIndex((c) => c.name === userCity)));
  const [coords, setCoords] = useState<[number, number]>(() => {
    const c = PRESET_CITIES[Math.max(0, PRESET_CITIES.findIndex((x) => x.name === userCity))];
    return [c.lat, c.lng];
  });
  const [route, setRoute] = useState<GeneratedRoute | null>(null);
  const [isLoadingRoute, setIsLoadingRoute] = useState(false);
  const [is3D, setIs3D] = useState(true);

  // Territoires
  const [territories, setTerritories] = useState<TerritoryZone[]>(INITIAL_TERRITORIES);
  const [selectedZoneId, setSelectedZoneId] = useState<string>(INITIAL_TERRITORIES[0].id);

  // Sheets
  const [voiceSheetOpen, setVoiceSheetOpen] = useState(false);
  const [detailsSheetOpen, setDetailsSheetOpen] = useState(false);
  const [micMuted, setMicMuted] = useState(false);

  // État du jeu live
  const [phase, setPhase] = useState<MissionPhase>('lobby');
  const [failReason, setFailReason] = useState<string>('Timing de départ manqué.');
  const [countdown, setCountdown] = useState(5);
  const [gateTimer, setGateTimer] = useState(8);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [myProgressKm, setMyProgressKm] = useState(0);
  const [ghostProgressKm, setGhostProgressKm] = useState(0);
  const [runners, setRunners] = useState<LobbyRunner[]>(INITIAL_RUNNERS);

  // État Survie Checkpoint (4 CPs : 25%, 50%, 75%, 100%)
  const [checkpointIdx, setCheckpointIdx] = useState(1); // 1..4
  const [cpTimer, setCpTimer] = useState(CP_WINDOW_SEC);
  const [mapNotice, setMapNotice] = useState<string | null>(null);
  // Zones courues (NO RUN / médailles), repères du tracé et recherche de lieu
  const [zoneRecords, setZoneRecords] = useState<ZoneRecords>(() => loadZoneRecords());
  const [mapReady, setMapReady] = useState(false);
  const [placesVersion, setPlacesVersion] = useState(0);
  const placesRef = useRef<PlaceName[]>([]);
  const [places, setPlaces] = useState<PlaceName[]>([]);
  const medalsRef = useRef<Map<string, maplibregl.Marker>>(new Map());
  const routeMarkersRef = useRef<maplibregl.Marker[]>([]);
  const zoneRecordsRef = useRef(zoneRecords);
  const [mapOpts, setMapOpts] = useState<MapOpts>(() => loadMapOpts());
  const [isFull, setIsFull] = useState(false);
  const [optsOpen, setOptsOpen] = useState(false);
  const [tallMap, setTallMap] = useState(false);
  const mapWrapRef = useRef<HTMLDivElement | null>(null);
  // Bonus chrono (jeu)
  const [glowKey, setGlowKey] = useState(0);
  const [glowOn, setGlowOn] = useState(false);
  const glowTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const finishAlertRef = useRef(false);
  const approachedRef = useRef<Set<number>>(new Set());
  const [bonuses, setBonuses] = useState<Bonus[]>([]);
  const [bonusXp, setBonusXp] = useState(0);
  // Coach en direct : bulle + voix, comparaison avec ta dernière course
  const { coach, line: coachLine, say: coachSay } = useCoachLive();
  const coachMilestonesRef = useRef<Set<number>>(new Set());
  const bonusLedgerRef = useRef<BonusLedger>({});
  const [finalLedger, setFinalLedger] = useState<BonusLedger | null>(null);
  const [nowMs, setNowMs] = useState(0);
  const bonusesRef = useRef<Bonus[]>([]);
  const bonusSeqRef = useRef(0);
  const bonusSpawnedRef = useRef(0);
  const bonusXpRef = useRef(0);
  const lastBonusEndRef = useRef(0);
  const bonusMarkersRef = useRef<Map<number, { marker: maplibregl.Marker; el: HTMLElement }>>(new Map());
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<PlaceResult[]>([]);
  const [searchState, setSearchState] = useState<'idle' | 'loading' | 'error'>('idle');
  // Résultat figé au moment de l'arrivée (le palier peut changer juste après une promotion)
  const [lastResult, setLastResult] = useState<{ rank: number; km: number; xp: number } | null>(
    null,
  );

  // État Relais Escouade (4 équipiers)
  const [relayLeg, setRelayLeg] = useState(1); // 1: Ngando, 2: Toi, 3: Estelle, 4: Mbarga
  const [relayTeammatePct, setRelayTeammatePct] = useState(0);

  // Après une promotion de palier, on présélectionne automatiquement le nouveau palier
  const [prevCategory, setPrevCategory] = useState(userCategory);
  if (prevCategory !== userCategory) {
    setPrevCategory(userCategory);
    setSelectedTier(userCategory);
  }

  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const mapLoadedRef = useRef(false);
  const arrowMarkerRef = useRef<maplibregl.Marker | null>(null);
  const ghostMarkerRef = useRef<maplibregl.Marker | null>(null);
  const routeRef = useRef<GeneratedRoute | null>(null);
  const is3DRef = useRef(is3D);
  const myProgressRef = useRef(myProgressKm);
  const cpIdxRef = useRef(checkpointIdx);
  const cpTimerRef = useRef(CP_WINDOW_SEC);
  const runnersRef = useRef(runners);
  // Verrou : une mission ne peut se terminer (succès OU échec) qu'une seule fois.
  // Avant, la fin pouvait être déclenchée 2× (sprint + timer, ou StrictMode) → XP doublée.
  const finishedRef = useRef(false);
  const routeReqRef = useRef(0);
  const noticeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Toujours appeler les callbacks parents les plus récents depuis les timers
  const callbacksRef = useRef({ onMissionComplete, onMissionFail, onTerritoryCapture });
  useEffect(() => {
    callbacksRef.current = { onMissionComplete, onMissionFail, onTerritoryCapture };
  });

  useEffect(() => {
    runnersRef.current = runners;
  }, [runners]);

  useEffect(
    () => () => {
      if (noticeTimerRef.current) clearTimeout(noticeTimerRef.current);
    },
    [],
  );

  const flashNotice = (msg: string) => {
    if (noticeTimerRef.current) clearTimeout(noticeTimerRef.current);
    setMapNotice(msg);
    noticeTimerRef.current = setTimeout(() => setMapNotice(null), 3500);
  };

  useEffect(() => {
    is3DRef.current = is3D;
  }, [is3D]);

  useEffect(() => {
    myProgressRef.current = myProgressKm;
  }, [myProgressKm]);

  useEffect(() => {
    cpIdxRef.current = checkpointIdx;
  }, [checkpointIdx]);

  const tierObj = MISSION_TIERS.find((t) => t.id === selectedTier) ?? MISSION_TIERS[1];
  const discObj = DISCIPLINES.find((d) => d.id === discipline) ?? DISCIPLINES[0];
  const effectiveDistanceKm =
    gameMode === 'relais_escouade'
      ? Number((tierObj.distanceKm / 2).toFixed(1))
      : discipline === 'velo'
        ? tierObj.distanceKm * 3
        : tierObj.distanceKm;

  const selectedZone = territories.find((z) => z.id === selectedZoneId) ?? territories[0];

  const applyRouteToMap = (map: maplibregl.Map, r: GeneratedRoute) => {
    const lngLatCoords: [number, number][] = r.coordinates.map(([la, ln]) => [ln, la]);
    const geojson = {
      type: 'Feature' as const,
      properties: {},
      geometry: {
        type: 'LineString' as const,
        coordinates: lngLatCoords,
      },
    };

    const source = map.getSource('dek-route') as maplibregl.GeoJSONSource | undefined;
    if (source) {
      source.setData(geojson);
    }
    routeMarkersRef.current = syncRouteMarkers(map, routeMarkersRef.current, r);

    if (lngLatCoords.length >= 2) {
      const start = lngLatCoords[0];
      const next = lngLatCoords[1];
      const bearing = computeBearing(start, next);

      arrowMarkerRef.current?.setLngLat(start).setRotation(bearing);
      ghostMarkerRef.current?.setLngLat(start);

      map.easeTo({
        center: start,
        zoom: 15.3,
        pitch: is3DRef.current ? 60 : 0,
        bearing,
        duration: 700,
      });
    }
  };

  useEffect(() => {
    const container = mapContainerRef.current;
    if (!container || mapRef.current) return;

    // Initialisation unique de la carte : les changements de coordonnées passent ensuite
    // par loadNewRoute → applyRouteToMap (easeTo), pas par une recréation de la carte.
    const map = new maplibregl.Map({
      container,
      style: 'https://tiles.openfreemap.org/styles/dark',
      center: [coords[1], coords[0]],
      zoom: 15.2,
      pitch: 60,
      bearing: -18,
      canvasContextAttributes: { antialias: true },
    });

    // Flèche 3D directionnelle du coureur
    const arrowEl = document.createElement('div');
    arrowEl.style.width = '36px';
    arrowEl.style.height = '36px';
    arrowEl.style.display = 'flex';
    arrowEl.style.alignItems = 'center';
    arrowEl.style.justifyContent = 'center';
    arrowEl.innerHTML = `<svg viewBox="0 0 40 40" width="34" height="34" style="filter: drop-shadow(0 0 8px #C8FF00);">
      <polygon points="20,3 33,34 20,27 7,34" fill="#C8FF00" stroke="#080A0E" stroke-width="2.5" stroke-linejoin="round" />
    </svg>`;

    arrowMarkerRef.current = new maplibregl.Marker({
      element: arrowEl,
      rotationAlignment: 'map',
      pitchAlignment: 'map',
    })
      .setLngLat([coords[1], coords[0]])
      .addTo(map);

    // Marqueur Fantôme (visible en mode Fantôme)
    const ghostEl = document.createElement('div');
    ghostEl.style.width = '22px';
    ghostEl.style.height = '22px';
    ghostEl.style.borderRadius = '9999px';
    ghostEl.style.background = '#A855F7';
    ghostEl.style.border = '2px solid #FFFFFF';
    ghostEl.style.boxShadow = '0 0 12px #A855F7';
    ghostEl.style.display = 'none';
    ghostMarkerRef.current = new maplibregl.Marker({ element: ghostEl })
      .setLngLat([coords[1], coords[0]])
      .addTo(map);

    map.on('load', () => {
      mapLoadedRef.current = true;

      try {
        const style = map.getStyle();
        const layers = style?.layers ?? [];
        let labelLayerId: string | undefined;
        for (const lyr of layers) {
          if (lyr.type === 'symbol' && lyr.layout && 'text-field' in lyr.layout) {
            labelLayerId = lyr.id;
            break;
          }
        }
        const vectorSourceId = Object.keys(style?.sources ?? {}).find(
          (k) => style?.sources?.[k]?.type === 'vector',
        );
        if (vectorSourceId && !map.getLayer('dek-3d-buildings')) {
          map.addLayer(
            {
              id: 'dek-3d-buildings',
              source: vectorSourceId,
              'source-layer': 'building',
              type: 'fill-extrusion',
              minzoom: 14,
              paint: {
                'fill-extrusion-color': '#182030',
                'fill-extrusion-height': [
                  'interpolate',
                  ['linear'],
                  ['zoom'],
                  14,
                  0,
                  14.5,
                  ['coalesce', ['get', 'render_height'], ['get', 'height'], 12],
                ],
                'fill-extrusion-base': [
                  'interpolate',
                  ['linear'],
                  ['zoom'],
                  14,
                  0,
                  14.5,
                  ['coalesce', ['get', 'render_min_height'], ['get', 'min_height'], 0],
                ],
                'fill-extrusion-opacity': 0.85,
              },
            },
            labelLayerId,
          );
        }
      } catch {
        // Ignore si pas de couche building
      }

      if (!map.getSource('dek-route')) {
        map.addSource('dek-route', {
          type: 'geojson',
          data: {
            type: 'Feature',
            properties: {},
            geometry: { type: 'LineString', coordinates: [] },
          },
        });
      }

      if (!map.getLayer('dek-route-glow')) {
        map.addLayer({
          id: 'dek-route-glow',
          type: 'line',
          source: 'dek-route',
          layout: { 'line-join': 'round', 'line-cap': 'round' },
          paint: { 'line-color': '#C8FF00', 'line-width': 12, 'line-opacity': 0.24 },
        });
      }

      if (!map.getLayer('dek-route-line')) {
        map.addLayer({
          id: 'dek-route-line',
          type: 'line',
          source: 'dek-route',
          layout: { 'line-join': 'round', 'line-cap': 'round' },
          paint: { 'line-color': '#C8FF00', 'line-width': 5, 'line-opacity': 0.96 },
        });
      }

      try {
        addZoneLayers(map);
        enhanceMapLabels(map);
        addZoneLabels(map);
      } catch {
        // Les repères sont un plus : la carte reste utilisable sans
      }
      setMapReady(true);

      if (routeRef.current) {
        applyRouteToMap(map, routeRef.current);
      }
    });

    // Noms de quartiers pour nommer les zones, lus quand les tuiles sont chargées
    let lastPlaces = 0;
    map.on('idle', () => {
      if (!mapLoadedRef.current) return;
      try {
        const found = readPlaceNames(map);
        if (found.length !== lastPlaces) {
          lastPlaces = found.length;
          placesRef.current = found;
          setPlaces(found);
          setPlacesVersion((v) => v + 1);
        }
      } catch {
        // sans noms, les zones restent identifiables par leur statut
      }
    });

    mapRef.current = map;

    const ro = new ResizeObserver(() => {
      map.resize();
    });
    ro.observe(container);

    const lateTimer = setTimeout(() => {
      map.resize();
    }, 300);

    return () => {
      clearTimeout(lateTimer);
      ro.disconnect();
      mapLoadedRef.current = false;
      arrowMarkerRef.current?.remove();
      ghostMarkerRef.current?.remove();
      routeMarkersRef.current.forEach((m) => m.remove());
      routeMarkersRef.current = [];
      // eslint-disable-next-line react-hooks/exhaustive-deps
      medalsRef.current.forEach((m) => m.remove());
      // eslint-disable-next-line react-hooks/exhaustive-deps
      medalsRef.current.clear();
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Afficher / cacher le marqueur Fantôme selon le mode
  useEffect(() => {
    if (!ghostMarkerRef.current) return;
    const el = ghostMarkerRef.current.getElement();
    el.style.display = gameMode === 'fantome' ? 'block' : 'none';
  }, [gameMode]);

  const loadNewRoute = async (lat: number, lng: number, distKm: number) => {
    // Ignore les réponses d'anciennes requêtes (changement rapide de ville / de palier)
    const reqId = ++routeReqRef.current;
    setIsLoadingRoute(true);
    const res = await generateLoopRoute(lat, lng, distKm);
    if (reqId !== routeReqRef.current) return;
    routeRef.current = res;
    setRoute(res);
    setIsLoadingRoute(false);
    if (mapRef.current && mapLoadedRef.current) {
      applyRouteToMap(mapRef.current, res);
    }
  };

  // Le tracé suit la distance réelle du mode (x3 à vélo, /2 en relais)
  useEffect(() => {
    // Chargement réseau (OSRM) : la mise à jour d'état asynchrone est voulue ici
    // eslint-disable-next-line react/set-state-in-effect
    void loadNewRoute(coords[0], coords[1], effectiveDistanceKm);
  }, [coords, effectiveDistanceKm]);

  // Suivi 3D dynamique de la flèche & du fantôme pendant la course
  useEffect(() => {
    if (!route || !arrowMarkerRef.current || !mapRef.current) return;
    const lngLatCoords: [number, number][] = route.coordinates.map(([la, ln]) => [ln, la]);
    if (lngLatCoords.length < 2) return;

    const ratio = Math.min(1, myProgressKm / Math.max(0.1, effectiveDistanceKm));
    const idx = Math.min(
      lngLatCoords.length - 2,
      Math.floor(ratio * (lngLatCoords.length - 1)),
    );
    const curPt = lngLatCoords[idx];
    const nextPt = lngLatCoords[Math.min(lngLatCoords.length - 1, idx + 1)];
    const bearing = computeBearing(curPt, nextPt);

    arrowMarkerRef.current.setLngLat(curPt).setRotation(bearing);

    if (gameMode === 'fantome' && ghostMarkerRef.current) {
      const gRatio = Math.min(1, ghostProgressKm / Math.max(0.1, effectiveDistanceKm));
      const gIdx = Math.min(
        lngLatCoords.length - 1,
        Math.floor(gRatio * (lngLatCoords.length - 1)),
      );
      ghostMarkerRef.current.setLngLat(lngLatCoords[gIdx]);
    }

    if (phase === 'running') {
      mapRef.current.easeTo({
        center: curPt,
        bearing,
        pitch: is3D ? 62 : 0,
        zoom: 16.2,
        duration: 550,
      });
    }
  }, [myProgressKm, ghostProgressKm, route, effectiveDistanceKm, phase, is3D, gameMode]);

  useEffect(() => {
    zoneRecordsRef.current = zoneRecords;
    saveZoneRecords(zoneRecords);
  }, [zoneRecords]);

  // Zones « NO RUN » / courues et médailles autour du point de départ
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;
    updateZoneSource(map, coords[0], coords[1], zoneRecords, placesRef.current);
    syncMedals(map, medalsRef.current, zoneRecords, coords[0], coords[1]);
  }, [coords, zoneRecords, mapReady, placesVersion]);

  // Recherche de lieu (envoi différé pour ne pas interroger le service à chaque lettre)
  useEffect(() => {
    if (!searchOpen) return;
    const q = searchQuery.trim();
    if (q.length < 3) return;
    const ctrl = new AbortController();
    const t = setTimeout(() => {
      setSearchState('loading');
      searchPlaces(q, ctrl.signal)
        .then((r) => {
          setSearchResults(r);
          setSearchState('idle');
        })
        .catch((e: unknown) => {
          if ((e as { name?: string })?.name !== 'AbortError') setSearchState('error');
        });
    }, 500);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [searchQuery, searchOpen]);

  const pickPlace = (r: PlaceResult) => {
    setSearchOpen(false);
    setSearchQuery('');
    setSearchResults([]);
    setCoords([r.lat, r.lng]);
    flashNotice(`Départ : ${r.label.split(',')[0]}`);
  };

  /** Mémorise les zones traversées par le tracé avec le score de la course. */
  const recordZonesRun = (score: number) => {
    const ids = zonesOfRoute(routeRef.current?.coordinates ?? [coords]);
    const fresh = ids.filter((id) => !zoneRecordsRef.current[id]).length;
    setZoneRecords((prev) => recordRun(prev, ids, score, dayKey()));
    flashNotice(fresh > 0 ? `${fresh} nouvelle${fresh > 1 ? 's' : ''} zone${fresh > 1 ? 's' : ''} courue${fresh > 1 ? 's' : ''} · médaille ${score} pts` : `Score de zone : ${score} pts`);
  };

  useEffect(() => {
    try {
      window.localStorage.setItem(MAP_OPTS_KEY, JSON.stringify(mapOpts));
    } catch {
      // réglages non conservés
    }
  }, [mapOpts]);

  // Applique les réglages aux couches de la carte
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;
    const vis = (id: string, on: boolean) => {
      if (map.getLayer(id)) map.setLayoutProperty(id, 'visibility', on ? 'visible' : 'none');
    };
    vis('dek-3d-buildings', mapOpts.buildings);
    vis('dek-poi-dot', mapOpts.places);
    vis('dek-poi-label', mapOpts.places);
    for (const id of ['dek-zones-fill', 'dek-zones-line', 'dek-zones-label']) vis(id, mapOpts.zones);
    for (const l of map.getStyle()?.layers ?? []) {
      if (l.id.startsWith('highway_name')) vis(l.id, mapOpts.streets);
    }
    try {
      map.setPixelRatio(mapOpts.detail === 'leger' ? 1 : Math.min(window.devicePixelRatio || 1, 2));
    } catch {
      // setPixelRatio indisponible : sans effet sur le rendu
    }
  }, [mapOpts, mapReady]);

  // Plein écran horizontal (API plein écran du navigateur ; repli : carte agrandie)
  useEffect(() => {
    const onChange = () => setIsFull(document.fullscreenElement === mapWrapRef.current);
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);

  const toggleFullscreen = () => {
    const wrap = mapWrapRef.current;
    if (!wrap) return;
    if (document.fullscreenElement) {
      void document.exitFullscreen();
      try {
        screen.orientation?.unlock?.();
      } catch {
        // pas de verrouillage d'orientation
      }
      return;
    }
    if (!wrap.requestFullscreen) {
      setTallMap((t) => !t);
      flashNotice(tallMap ? 'Carte réduite' : 'Plein écran indisponible : carte agrandie');
      return;
    }
    wrap
      .requestFullscreen()
      .then(() => (screen.orientation as ScreenOrientation & { lock?: (o: string) => Promise<void> }).lock?.('landscape'))
      .catch(() => {
        // orientation non verrouillable (ordinateur) : le plein écran reste actif
      });
  };

  /** Sortie du plein écran avant d'ouvrir une feuille (elles s'affichent en dehors de la carte). */
  const leaveFullscreen = () => {
    if (document.fullscreenElement) void document.exitFullscreen();
  };

  const applyPreset = (detail: 'leger' | 'large') => setMapOpts(detail === 'leger' ? LIGHT_OPTS : LARGE_OPTS);

  // Bonus : un à la fois, chrono de 30 s ; disparaît si on ne le prend pas à temps
  const mapOptsRef = useRef(mapOpts);
  useEffect(() => {
    mapOptsRef.current = mapOpts;
  }, [mapOpts]);

  /** Approche d'un bonus ou de l'arrivée : le téléphone vibre et un halo vert passe autour de l'écran. */
  const triggerAlert = (kind: 'bonus' | 'finish') => {
    say(kind === 'finish' ? 'final' : 'bonusAhead', 'hype', mapOptsRef.current.voice);
    if (!mapOptsRef.current.alerts) return;
    try {
      navigator.vibrate?.(kind === 'finish' ? [200, 80, 200, 80, 450] : [140, 70, 140]);
    } catch {
      // vibration non prise en charge (ordinateur, iPhone)
    }
    setGlowKey((k) => k + 1);
    setGlowOn(true);
    if (glowTimerRef.current) clearTimeout(glowTimerRef.current);
    glowTimerRef.current = setTimeout(() => setGlowOn(false), 1600);
  };
  const triggerAlertRef = useRef(triggerAlert);
  useEffect(() => {
    triggerAlertRef.current = triggerAlert;
  });

  const clearBonuses = () => {
    bonusesRef.current = [];
    setBonuses([]);
  };

  const collectBonus = (id: number) => {
    const b = bonusesRef.current.find((x) => x.id === id);
    if (!b || finishedRef.current) return;
    const left = Math.max(0, Math.ceil((b.expiresAt - Date.now()) / 1000));
    const gain = BONUS_KINDS[b.kind].base + left; // le chrono restant s'ajoute à l'XP
    bonusesRef.current = bonusesRef.current.filter((x) => x.id !== id);
    setBonuses([...bonusesRef.current]);
    lastBonusEndRef.current = Date.now();
    bonusXpRef.current += gain;
    bonusLedgerRef.current = addBonus(bonusLedgerRef.current, BONUS_KINDS[b.kind].id, gain);
    setBonusXp(bonusXpRef.current);
    playHit();
    say('bonus', 'hype', mapOptsRef.current.voice);
    if (mapOptsRef.current.alerts) {
      try {
        navigator.vibrate?.(60);
      } catch {
        // sans vibration
      }
    }
    flashNotice(`${BONUS_KINDS[b.kind].label} pris · +${gain} XP (${BONUS_KINDS[b.kind].base} + ${left} s restantes)`);
  };
  const collectBonusRef = useRef(collectBonus);
  useEffect(() => {
    collectBonusRef.current = collectBonus;
  });

  useEffect(() => {
    if (phase !== 'running' || !mapOpts.bonus) return;
    lastBonusEndRef.current = Date.now() - 600;
    const timer = setInterval(() => {
      const now = Date.now();
      const alive = bonusesRef.current.filter((b) => b.expiresAt > now);
      if (alive.length < bonusesRef.current.length) {
        flashNotice('Bonus raté, trop lent !');
        lastBonusEndRef.current = now;
      }
      bonusesRef.current = alive;
      const r = routeRef.current;
      const ratio = myProgressRef.current / Math.max(0.1, effectiveDistanceKm);
      if (alive.length === 0 && r && r.coordinates.length > 4 && bonusSpawnedRef.current < 4 && ratio < 0.85 && now - lastBonusEndRef.current > 1200) {
        const target = Math.min(0.95, ratio + 0.06 + Math.random() * 0.14);
        const pt = r.coordinates[Math.min(r.coordinates.length - 1, Math.floor(target * (r.coordinates.length - 1)))];
        const roll = Math.random();
        const kind: BonusKind = roll < 0.18 ? 'star' : roll < 0.5 ? 'turbo' : 'xp';
        bonusSeqRef.current += 1;
        bonusSpawnedRef.current += 1;
        alive.push({ id: bonusSeqRef.current, kind, lat: pt[0], lng: pt[1], expiresAt: now + BONUS_LIMIT_SEC * 1000, ratio: target });
        bonusesRef.current = alive;
      }
      // Approche d'un bonus (moins de 250 m ou 8 % du tracé) : vibration + lueur, une seule fois par bonus
      if (r) {
        const totalM = r.distanceKm * 1000;
        for (const b of bonusesRef.current) {
          if (!approachedRef.current.has(b.id) && (b.ratio - ratio) * totalM <= Math.max(250, totalM * 0.08)) {
            approachedRef.current.add(b.id);
            triggerAlertRef.current('bonus');
          }
        }
      }
      setBonuses([...bonusesRef.current]);
      setNowMs(now);
    }, 300);
    return () => clearInterval(timer);
  }, [phase, mapOpts.bonus, effectiveDistanceKm]);

  // Pastilles de bonus sur la carte (cliquables) synchronisées avec la liste
  useEffect(() => {
    const map = mapRef.current;
    const markers = bonusMarkersRef.current;
    if (!map) return;
    for (const [id, m] of markers) {
      if (!bonuses.some((b) => b.id === id)) {
        m.marker.remove();
        markers.delete(id);
      }
    }
    for (const b of bonuses) {
      if (markers.has(b.id)) continue;
      const el = document.createElement('button');
      el.type = 'button';
      el.className = 'dek-bonus';
      el.innerHTML = `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#0E0F12" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M13 2 4 14h7l-1 8 9-12h-7z"/></svg><span class="dek-bonus-left"></span><span class="dek-bonus-name">${BONUS_KINDS[b.kind].label} +${BONUS_KINDS[b.kind].base}</span>`;
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        collectBonusRef.current(b.id);
      });
      const marker = new maplibregl.Marker({ element: el, anchor: 'bottom' }).setLngLat([b.lng, b.lat]).addTo(map);
      markers.set(b.id, { marker, el });
    }
  }, [bonuses]);

  useEffect(() => {
    for (const b of bonuses) {
      const left = bonusMarkersRef.current.get(b.id)?.el.querySelector('.dek-bonus-left');
      if (left) left.textContent = `${Math.max(0, Math.ceil((b.expiresAt - nowMs) / 1000))}s`;
    }
  }, [bonuses, nowMs]);

  const toggle3D = () => {
    const next = !is3D;
    setIs3D(next);
    mapRef.current?.easeTo({ pitch: next ? 60 : 0, duration: 450 });
  };

  const finishMissionSuccess = () => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    playVictory();
    say('complete', 'hype', mapOptsRef.current.voice);
    const perf = savePerf(`outdoor:${selectedTier}:${discipline}:${gameMode}`, elapsedSec, 'lower');
    window.setTimeout(() => coachSay(perf.previous && perf.isRecord ? 'record' : perf.previous && perf.improved ? 'better' : 'finish'), 1800);
    setPhase('completed');
    const modeLabel = OUTDOOR_MODES.find((m) => m.id === gameMode)?.label ?? 'Mission 05h';
    // runnersRef : classement réel (avant, la closure figée renvoyait toujours #1)
    const myRank =
      runnersRef.current.filter((r) => r.progressKm >= effectiveDistanceKm).length + 1;
    // Bonus de fin : Éléphant (endurance, selon la distance) et Loup (dynamisme, si plusieurs bonus pris)
    const pickups = Object.values(bonusLedgerRef.current).reduce((n, e) => n + (e?.count ?? 0), 0);
    const enduranceXp = Math.round(effectiveDistanceKm * 8);
    const dynamismXp = pickups >= 2 ? 15 + 5 * (pickups - 2) : 0;
    let ledger = addBonus(bonusLedgerRef.current, 'elephant', enduranceXp);
    if (dynamismXp > 0) ledger = addBonus(ledger, 'panthere', dynamismXp);
    setFinalLedger(ledger);
    const xpEarned = tierObj.xpReward + (gameMode === 'survie_checkpoint' ? 100 : 0) + ledgerTotal(ledger);
    clearBonuses();
    setLastResult({ rank: myRank, km: effectiveDistanceKm, xp: xpEarned });
    recordZonesRun(xpEarned + Math.max(0, 5 - myRank) * 10);

    callbacksRef.current.onMissionComplete(
      xpEarned,
      effectiveDistanceKm,
      myRank,
      selectedTier,
      `${modeLabel} (${discObj.label})`,
    );

    if (gameMode === 'conquete_territoire') {
      const zone = territories.find((z) => z.id === selectedZoneId);
      if (zone) {
        const nextPts = Math.min(zone.targetPoints, zone.points + 150);
        const conquered = nextPts >= zone.targetPoints && zone.ownerClub !== 'DEK Warriors';
        setTerritories((prev) =>
          prev.map((z) =>
            z.id !== zone.id
              ? z
              : {
                  ...z,
                  points: nextPts,
                  ownerClub: nextPts >= z.targetPoints ? 'DEK Warriors' : z.ownerClub,
                  color: nextPts >= z.targetPoints ? '#C8FF00' : z.color,
                },
          ),
        );
        if (conquered) callbacksRef.current.onTerritoryCapture(zone.name);
      }
    }
  };

  const failMission = (msg: string) => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    setFailReason(msg);
    clearBonuses();
    setPhase('failed');
    callbacksRef.current.onMissionFail(msg);
  };

  /** Fait avancer l'athlète (hors updater React : aucun effet de bord dupliqué). */
  const advanceMyProgress = (deltaKm: number) => {
    if (finishedRef.current) return;
    const next = Math.min(
      effectiveDistanceKm,
      Number((myProgressRef.current + deltaKm).toFixed(2)),
    );
    myProgressRef.current = next;
    setMyProgressKm(next);

    // Coach : encouragements à 25 / 50 / 75 % et comparaison avec la dernière course
    const perfKey = `outdoor:${selectedTier}:${discipline}:${gameMode}`;
    for (const m of [0.25, 0.5, 0.75]) {
      if (!coachMilestonesRef.current.has(m) && next / effectiveDistanceKm >= m) {
        coachMilestonesRef.current.add(m);
        const last = loadPerf(perfKey)?.last;
        if (last && m >= 0.5) coachSay(elapsedSec <= last * m ? 'ahead' : 'behind');
        else if (m === 0.25) coachSay('quarter');
        else if (m === 0.5) coachSay('half');
      }
    }

    // Approche de l'arrivée (moins de 250 m ou 8 % du parcours)
    if (!finishAlertRef.current && next < effectiveDistanceKm && effectiveDistanceKm - next <= Math.max(0.25, effectiveDistanceKm * 0.08)) {
      finishAlertRef.current = true;
      triggerAlertRef.current('finish');
    }

    if (gameMode === 'survie_checkpoint') {
      let cp = cpIdxRef.current;
      while (cp < 4 && next >= (cp / 4) * effectiveDistanceKm) cp += 1;
      if (cp !== cpIdxRef.current) {
        playHit();
        cpIdxRef.current = cp;
        cpTimerRef.current = CP_WINDOW_SEC;
        setCheckpointIdx(cp);
        setCpTimer(CP_WINDOW_SEC);
      }
    }

    if (next >= effectiveDistanceKm) {
      if (gameMode === 'relais_escouade') setRelayLeg(4);
      finishMissionSuccess();
    }
  };

  const actionsRef = useRef({ advanceMyProgress, failMission });
  useEffect(() => {
    actionsRef.current = { advanceMyProgress, failMission };
  });

  // Timers selon les phases & modes
  useEffect(() => {
    // Phase spéciale Relais : le Joueur 1 (Ngando) court avant de nous passer le témoin
    if (phase === 'relay_wait') {
      let pct = 0;
      const t = setInterval(() => {
        pct = Math.min(100, pct + 20);
        setRelayTeammatePct(pct);
        if (pct >= 100) {
          clearInterval(t);
          playGo();
          setRelayLeg(2);
          setGateTimer(8);
          setPhase('gate');
        }
      }, 550);
      return () => clearInterval(t);
    }

    if (phase === 'countdown') {
      playTick();
      const t = setTimeout(() => {
        if (countdown <= 1) {
          playGo();
          setGateTimer(8);
          setPhase('gate');
        } else {
          setCountdown((c) => c - 1);
        }
      }, 1000);
      return () => clearTimeout(t);
    }

    if (phase === 'gate') {
      if (gateTimer <= 0) {
        actionsRef.current.failMission(
          gameMode === 'relais_escouade'
            ? 'Relais manqué : toute l’escouade a échoué !'
            : `Timing ${selectedSlot} manqué (-2% discipline).`,
        );
        return;
      }
      const t = setTimeout(() => setGateTimer((g) => g - 1), 1000);
      return () => clearTimeout(t);
    }

    if (phase === 'running') {
      const interval = setInterval(() => {
        setElapsedSec((s) => s + 1);

        const baseStep =
          (effectiveDistanceKm / 18) * (gameMode === 'survie_checkpoint' ? 0.85 : 1);
        actionsRef.current.advanceMyProgress(baseStep);

        // Avancée du Fantôme
        if (gameMode === 'fantome') {
          setGhostProgressKm((g) =>
            Math.min(effectiveDistanceKm, Number((g + effectiveDistanceKm / 17.5).toFixed(2))),
          );
        }

        // Avancée des autres coureurs
        setRunners((prev) =>
          prev.map((r) => {
            const step = (effectiveDistanceKm / 19) * (5 / r.paceMinKm);
            const nextDist = Math.min(
              effectiveDistanceKm,
              Number((r.progressKm + step).toFixed(2)),
            );
            return {
              ...r,
              progressKm: nextDist,
              status: nextDist >= effectiveDistanceKm ? 'termine' : 'en_course',
            };
          }),
        );
      }, 650);

      // Timer de Checkpoint strict en mode Survie
      let cpInterval: ReturnType<typeof setInterval> | null = null;
      if (gameMode === 'survie_checkpoint') {
        cpInterval = setInterval(() => {
          if (finishedRef.current) return;
          cpTimerRef.current -= 1;
          if (cpTimerRef.current <= 0) {
            const targetDist = (cpIdxRef.current / 4) * effectiveDistanceKm;
            if (myProgressRef.current < targetDist) {
              setCpTimer(0);
              actionsRef.current.failMission(
                `Éliminé au Checkpoint #${cpIdxRef.current} (distance non atteinte à temps) !`,
              );
              return;
            }
            cpTimerRef.current = CP_WINDOW_SEC;
          }
          setCpTimer(cpTimerRef.current);
        }, 1000);
      }

      return () => {
        clearInterval(interval);
        if (cpInterval) clearInterval(cpInterval);
      };
    }
  }, [phase, countdown, gateTimer, effectiveDistanceKm, gameMode, selectedSlot]);

  const handleSprintBoost = () => {
    if (phase !== 'running') return;
    playHit();
    advanceMyProgress(effectiveDistanceKm * 0.08);
  };

  const handleUseGPS = () => {
    if (!navigator.geolocation) {
      flashNotice('GPS indisponible sur cet appareil');
      return;
    }
    flashNotice('Recherche de ta position GPS…');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords([pos.coords.latitude, pos.coords.longitude]);
        flashNotice('Position GPS trouvée, nouveau tracé autour de toi');
      },
      (err) => {
        flashNotice(
          err.code === err.PERMISSION_DENIED
            ? 'Autorise la localisation pour utiliser le GPS'
            : 'Position GPS introuvable, réessaie dehors',
        );
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 },
    );
  };

  const resetRunRefs = () => {
    coachMilestonesRef.current = new Set();
    bonusLedgerRef.current = {};
    setFinalLedger(null);
    finishAlertRef.current = false;
    approachedRef.current.clear();
    bonusXpRef.current = 0;
    bonusSpawnedRef.current = 0;
    setBonusXp(0);
    clearBonuses();
    finishedRef.current = false;
    myProgressRef.current = 0;
    cpIdxRef.current = 1;
    cpTimerRef.current = CP_WINDOW_SEC;
  };

  const handleJoinMission = () => {
    resetRunRefs();
    setCountdown(5);
    setElapsedSec(0);
    setMyProgressKm(0);
    setGhostProgressKm(0);
    setCheckpointIdx(1);
    setCpTimer(CP_WINDOW_SEC);
    setRelayLeg(1);
    setRelayTeammatePct(0);
    setRunners(INITIAL_RUNNERS.map((r) => ({ ...r, progressKm: 0, status: 'pret' })));

    if (gameMode === 'relais_escouade') {
      setPhase('relay_wait');
    } else {
      setPhase('countdown');
    }
  };

  const handleReset = () => {
    resetRunRefs();
    setPhase('lobby');
    setMyProgressKm(0);
    setGhostProgressKm(0);
    setElapsedSec(0);
    setCheckpointIdx(1);
    setCpTimer(CP_WINDOW_SEC);
    setRelayLeg(1);
    setRelayTeammatePct(0);
    setRunners(INITIAL_RUNNERS.map((r) => ({ ...r, progressKm: 0, status: 'pret' })));
  };

  const leaderboard = [
    ...runners,
    {
      id: 'me',
      name: 'TOI (DEK)',
      city: PRESET_CITIES[cityIdx].name,
      disciplineScore: 94,
      rank: 'Challenger',
      progressKm: myProgressKm,
      status: phase === 'completed' ? 'termine' : phase === 'running' ? 'en_course' : 'pret',
      paceMinKm: 4.6,
    } as LobbyRunner,
  ].sort((a, b) => b.progressKm - a.progressKm);

  const myPosition = leaderboard.findIndex((r) => r.id === 'me') + 1;
  const progressRatio = Math.min(1, myProgressKm / Math.max(0.1, effectiveDistanceKm));
  // Panneau « Run Tracker » en verre dépoli pendant la course (métriques simulées en attendant le GPS réel)
  const liveKcal = Math.round(myProgressKm * (discipline === 'velo' ? 25 : discipline === 'marche' ? 45 : 60));
  const liveBpm = phase === 'running' ? 138 + Math.round(progressRatio * 28) + ((elapsedSec * 7) % 5) : 0;
  const liveSpeedKmh = (10.8 + (elapsedSec % 3) * 0.4) * discObj.speedMult;
  const paceSecPerKm = phase === 'running' ? Math.round(3600 / liveSpeedKmh) : 0;
  const paceLabel = paceSecPerKm
    ? `${Math.floor(paceSecPerKm / 60)}'${String(paceSecPerKm % 60).padStart(2, '0')}"`
    : '—';

  const simulatedSpeed =
    phase === 'running'
      ? ((10.8 + (elapsedSec % 3) * 0.4) * discObj.speedMult).toFixed(1)
      : null;

  const ghostDeltaMeters = Math.round((myProgressKm - ghostProgressKm) * 1000);


  // Guidage tournant par tournant : prochaine consigne du tracé, selon la distance déjà parcourue
  const routeTotalM = (route?.distanceKm ?? effectiveDistanceKm) * 1000;
  const progressM = progressRatio * routeTotalM;
  const upcoming = route?.steps.find((st) => st.atM > progressM + 5);
  const toNextM = upcoming ? Math.round(upcoming.atM - progressM) : 0;
  const nextStepLabel = upcoming
    ? toNextM <= 30
      ? `Maintenant · ${upcoming.text}`
      : `Dans ${Math.round(toNextM / 10) * 10} m · ${upcoming.text}`
    : route && route.steps.length > 0
      ? 'Dernière ligne droite • Garde l’allure'
      : 'Suis le tracé vert • Garde l’allure';
  const speedKmh = 10.8 * discObj.speedMult;
  const remainingKm = Math.max(0, effectiveDistanceKm - myProgressKm);
  const etaMin = Math.max(1, Math.round((remainingKm / speedKmh) * 60));
  const zonesRun = Object.keys(zoneRecords).length;
  const bestZoneScore = Object.values(zoneRecords).reduce((m, z) => Math.max(m, z.best), 0);
  const zonesTotal = (2 * ZONE_RADIUS + 1) ** 2;
  // Légende de la piste : nom, description et difficulté calculés depuis le tracé
  const trackInfo = route
    ? describeTrack({
        route,
        baseKm: tierObj.distanceKm,
        speedKmh,
        discipline,
        area: nearestPlace(places, route.coordinates[0]?.[0] ?? coords[0], route.coordinates[0]?.[1] ?? coords[1]),
        records: zoneRecords,
        survie: gameMode === 'survie_checkpoint',
      })
    : null;

  const guidanceLabel = mapNotice
    ? mapNotice
    : phase === 'running'
      ? gameMode === 'survie_checkpoint'
        ? `Checkpoint #${checkpointIdx}/4 • ${cpTimer}s restantes`
        : gameMode === 'fantome'
          ? ghostDeltaMeters >= 0
            ? `+${ghostDeltaMeters} m d’avance sur le Fantôme`
            : `${ghostDeltaMeters} m derrière le Fantôme`
          : gameMode === 'relais_escouade'
            ? 'Relais #2 en cours • Passe le témoin à Estelle !'
            : nextStepLabel
      : gameMode === 'conquete_territoire'
        ? `${selectedZone.name} • Détenu par ${selectedZone.ownerClub}`
        : `Boucle 3D ${effectiveDistanceKm} km • ${discObj.label}`;

  const modeShort = OUTDOOR_MODES.find((m) => m.id === gameMode)?.short ?? '';
  const clock = `${Math.floor(elapsedSec / 60)}:${String(elapsedSec % 60).padStart(2, '0')}`;
  const glassBtn = 'bg-black/50 text-fg backdrop-blur-md';
  const glassPill =
    'flex h-10 items-center gap-2 rounded-full bg-black/50 px-4 text-[13px] font-semibold text-fg backdrop-blur-md';

  const queryReady = searchQuery.trim().length >= 3;
  const overlayRoot = typeof document !== 'undefined' ? document.getElementById('dek-overlay-root') : null;
  const searchBottomSheet = (
    <BottomSheet open={searchOpen} onClose={() => setSearchOpen(false)} title="Rechercher un lieu">
      <input
        type="search"
        autoFocus
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder="Quartier, rue, stade, école… (Cameroun)"
        className="h-12 w-full rounded-full bg-tile px-5 text-[15px] font-medium text-fg outline-none placeholder:text-faint"
      />
      <div className="mt-3 flex flex-col gap-1.5">
        {queryReady && searchState === 'loading' && <div className="px-2 py-3 text-[13px] text-mute">Recherche…</div>}
        {queryReady && searchState === 'error' && <div className="px-2 py-3 text-[13px] text-danger">Recherche indisponible, réessaie.</div>}
        {queryReady && searchState === 'idle' && searchResults.length === 0 && (
          <div className="px-2 py-3 text-[13px] text-mute">Aucun lieu trouvé.</div>
        )}
        {(queryReady ? searchResults : []).map((r) => (
          <button
            key={`${r.lat}-${r.lng}`}
            type="button"
            onClick={() => pickPlace(r)}
            className="flex items-center gap-3 rounded-[18px] bg-tile px-4 py-3 text-left transition active:scale-[0.98]"
          >
            <MagnifyingGlass className="h-4 w-4 shrink-0 text-lime" />
            <span className="text-[14px] font-medium leading-5 text-fg">{r.label}</span>
          </button>
        ))}
      </div>
    </BottomSheet>
  );

  const voiceBottomSheet = (
    <BottomSheet
      open={voiceSheetOpen}
      onClose={() => setVoiceSheetOpen(false)}
      title={`Salon vocal · Lobby ${selectedSlot}`}
    >
      <div className="grid grid-cols-4 gap-2">
        {[
          { id: 'me', name: 'Toi', speaking: !micMuted },
          ...runners.map((r, i) => ({
            id: r.id,
            name: r.name.split('_')[0],
            speaking: i === 0,
          })),
        ].map((member) => (
          <div key={member.id} className="flex flex-col items-center rounded-[20px] bg-tile p-3">
            <div
              className={`flex h-11 w-11 items-center justify-center rounded-full bg-card text-[13px] font-bold text-fg ${
                member.speaking ? 'ring-2 ring-lime' : ''
              }`}
            >
              {member.name.slice(0, 2).toUpperCase()}
            </div>
            <span className="mt-1.5 max-w-full truncate text-[12px] font-medium text-mute">
              {member.name}
            </span>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={() => setMicMuted((m) => !m)}
        className={`mt-4 flex h-[52px] w-full items-center justify-center gap-2 rounded-full text-[15px] font-bold transition active:scale-[0.97] ${
          micMuted ? 'bg-tile text-danger' : 'bg-lime text-on-lime'
        }`}
      >
        {micMuted ? <MicrophoneSlash className="h-5 w-5" /> : <Microphone className="h-5 w-5" />}
        {micMuted ? 'Micro coupé' : 'Micro actif'}
      </button>
    </BottomSheet>
  );

  const detailsBottomSheet = (
    <BottomSheet
      open={detailsSheetOpen}
      onClose={() => setDetailsSheetOpen(false)}
      title="Réglages et classement"
      maxHeight="82%"
    >
      <div className="space-y-5">
        <div>
          <div className="mb-2 text-[13px] font-medium text-mute">Horaire de départ strict</div>
          <div className={phase !== 'lobby' ? 'pointer-events-none opacity-50' : ''}>
            <ChipTabs
              items={TIME_SLOTS.map((s) => ({ id: s, label: s }))}
              value={selectedSlot}
              onChange={setSelectedSlot}
              layoutId="outdoor-slot"
            />
          </div>
        </div>

        <div
          className={`grid grid-cols-2 gap-1 rounded-full bg-tile p-1 ${
            phase !== 'lobby' ? 'pointer-events-none opacity-50' : ''
          }`}
        >
          {(
            [
              { id: 'global', label: 'Zones différentes' },
              { id: 'local', label: 'Même parcours' },
            ] as const
          ).map((g) => (
            <button
              key={g.id}
              type="button"
              onClick={() => setGeoMode(g.id)}
              className={`h-10 rounded-full text-[13px] font-semibold transition-colors ${
                geoMode === g.id ? 'bg-lime text-on-lime' : 'text-mute'
              }`}
            >
              {g.label}
            </button>
          ))}
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <h4 className="text-[16px] font-bold text-fg">Lobby {selectedSlot}</h4>
            <span className="text-[12px] font-medium text-mute">
              {geoMode === 'global' ? 'Multi-villes' : 'Proximité'}
            </span>
          </div>
          <div className="space-y-2">
            {leaderboard.map((runner, i) => {
              const isMe = runner.id === 'me';
              return (
                <ListRow
                  key={runner.id}
                  chevron={false}
                  className={`bg-tile! ${isMe ? 'ring-1 ring-lime' : ''}`}
                  leading={
                    <span className="num flex h-full w-full items-center justify-center bg-card text-[14px] font-bold text-fg">
                      {i + 1}
                    </span>
                  }
                  title={runner.name}
                  subtitle={runner.city}
                  meta={`${runner.progressKm.toFixed(2)} km`}
                />
              );
            })}
          </div>
        </div>
      </div>
    </BottomSheet>
  );

  const lockedSheet = (
    <BottomSheet
      open={lockedTierModal !== null}
      onClose={() => setLockedTierModal(null)}
      title={lockedTierModal ? `Palier ${lockedTierModal} verrouillé` : undefined}
    >
      {lockedTierModal && (
        <div className="space-y-2">
          {[
            { label: 'Santé', text: TIER_REQUIREMENTS[lockedTierModal].healthReason },
            { label: 'Progression', text: TIER_REQUIREMENTS[lockedTierModal].missionRule },
            { label: 'Compétences', text: TIER_REQUIREMENTS[lockedTierModal].skillRule },
          ].map((row) => (
            <div key={row.label} className="rounded-[20px] bg-tile p-4">
              <div className="text-[12px] font-medium text-mute">{row.label}</div>
              <div className="mt-1 text-[14px] font-medium leading-5 text-fg">{row.text}</div>
            </div>
          ))}
          <div className="pt-2">
            <Button
              fullWidth
              onClick={() => {
                setLockedTierModal(null);
                onRequestRetakeTest();
              }}
            >
              Passer le test de montée de palier
            </Button>
          </div>
        </div>
      )}
    </BottomSheet>
  );

  const pillState = (done: boolean, active: boolean) =>
    done
      ? 'bg-tile text-fg'
      : active
        ? 'bg-lime text-on-lime'
        : 'bg-tile text-faint';

  return (
    <div className="space-y-4 pb-4">
      {/* En-tête de page */}
      <div>
        <h1 className="text-[26px] font-bold leading-8 text-fg">Outdoor</h1>
        <p className="text-[13px] font-medium text-mute">Missions GPS & carte 3D</p>
      </div>

      {/* Disciplines + modes */}
      <div className="space-y-3">
        <div className="grid grid-cols-3 gap-1 rounded-full bg-card p-1">
          {DISCIPLINES.map((d) => {
            const active = discipline === d.id;
            return (
              <button
                key={d.id}
                type="button"
                disabled={phase !== 'lobby'}
                onClick={() => setDiscipline(d.id)}
                className={`h-10 rounded-full text-[14px] font-semibold transition-colors disabled:opacity-60 ${
                  active ? 'bg-lime text-on-lime' : 'text-mute'
                }`}
              >
                {d.label}
              </button>
            );
          })}
        </div>

        <div className={phase !== 'lobby' ? 'pointer-events-none opacity-50' : ''}>
          <ChipTabs
            items={OUTDOOR_MODES.map((m) => ({ id: m.id, label: m.short }))}
            value={gameMode}
            onChange={setGameMode}
            layoutId="outdoor-mode"
          />
        </div>
      </div>

      {/* Carte */}
      <div
        ref={mapWrapRef}
        className={`relative w-full overflow-hidden bg-card ${isFull ? 'h-full rounded-none' : `${tallMap ? 'h-[620px]' : 'h-[380px]'} rounded-[28px]`} ${mapOpts.zones ? '' : 'dek-nozones'} ${mapOpts.km ? '' : 'dek-nokm'}`}
      >
        <div ref={mapContainerRef} className="h-full w-full" />
        {glowOn && isFull && <div key={glowKey} className="dek-glow" />}

        {/* Consigne */}
        <div className="pointer-events-none absolute left-3 right-16 top-3 z-20">
          <div className="pointer-events-auto inline-flex h-10 max-w-full items-center rounded-full bg-ink/80 px-4 backdrop-blur-md">
            <span className="truncate text-[13px] font-semibold text-fg">{guidanceLabel}</span>
          </div>
        </div>

        {/* Légende des zones */}
        {phase === 'lobby' && mapOpts.zones && (
        <div className="pointer-events-none absolute left-3 top-14 z-20 flex flex-col gap-1.5">
          <span className="pointer-events-auto inline-flex h-7 items-center gap-1.5 rounded-full bg-ink/80 px-3 text-[11px] font-semibold text-mute backdrop-blur-md">
            <span className="h-2.5 w-2.5 rounded-[3px] border border-dashed border-faint bg-black/60" /> NO RUN
            <span className="ml-1 h-2.5 w-2.5 rounded-[3px] border border-lime bg-lime/25" /> Courue
            <span className="num ml-1 text-fg">
              {zonesRun}/{zonesTotal}
            </span>
          </span>
          {bestZoneScore > 0 && (
            <span className="pointer-events-auto inline-flex h-7 items-center rounded-full bg-ink/80 px-3 text-[11px] font-semibold text-lime backdrop-blur-md">
              Record de zone · {bestZoneScore} pts
            </span>
          )}
        </div>
        )}

        {/* Coach en direct */}
        <div className="pointer-events-none absolute left-3 right-16 top-[136px] z-20">
          <CoachBubble coach={coach} line={coachLine} />
        </div>

        {/* Bonus chrono en cours */}
        {phase === 'running' && (bonuses.length > 0 || bonusXp > 0) && (
          <div className="absolute left-3 top-14 z-20 flex flex-col items-start gap-1.5">
            {bonuses.map((b) => {
              const left = Math.max(0, Math.ceil((b.expiresAt - nowMs) / 1000));
              return (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => collectBonus(b.id)}
                  className="flex h-9 items-center gap-2 rounded-full bg-lime px-3 text-[13px] font-extrabold text-on-lime shadow-lg transition active:scale-95"
                >
                  <Lightning className="h-4 w-4" />
                  {BONUS_KINDS[b.kind].label} +{BONUS_KINDS[b.kind].base + left} XP
                  <span className="num rounded-full bg-black/80 px-2 text-[12px] leading-5 text-lime">{left}s</span>
                </button>
              );
            })}
            {bonusXp > 0 && (
              <span className="inline-flex h-7 items-center rounded-full bg-ink/80 px-3 text-[11px] font-semibold text-lime backdrop-blur-md">
                Bonus cumulés · +{bonusXp} XP
              </span>
            )}
          </div>
        )}

        {/* Zoom */}
        <div className="absolute left-3 top-1/2 z-20 flex -translate-y-1/2 flex-col gap-2">
          <IconButton label="Zoomer" onClick={() => mapRef.current?.zoomIn({ duration: 250 })} size={40} className={glassBtn}>
            <Plus className="h-5 w-5" />
          </IconButton>
          <IconButton label="Dézoomer" onClick={() => mapRef.current?.zoomOut({ duration: 250 })} size={40} className={glassBtn}>
            <Minus className="h-5 w-5" />
          </IconButton>
        </div>

        {/* Contrôles flottants */}
        <div className="absolute right-3 top-3 z-20 flex flex-col gap-2">
          <IconButton label={is3D ? 'Passer en 2D' : 'Passer en 3D'} onClick={toggle3D} size={40} className={glassBtn}>
            <span className="num text-[13px] font-bold">{is3D ? '3D' : '2D'}</span>
          </IconButton>
          <IconButton label={isFull || tallMap ? 'Réduire la carte' : 'Carte en plein écran (horizontal)'} onClick={toggleFullscreen} size={40} className={glassBtn}>
            {isFull || tallMap ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
          </IconButton>
          <IconButton label="Utiliser ma position GPS" onClick={handleUseGPS} size={40} className={glassBtn}>
            <Compass className="h-5 w-5" />
          </IconButton>
          <IconButton
            label="Générer un nouveau tracé"
            onClick={() => void loadNewRoute(coords[0], coords[1], effectiveDistanceKm)}
            disabled={isLoadingRoute || phase !== 'lobby'}
            size={40}
            className={glassBtn}
          >
            <ArrowsClockwise className={`h-5 w-5 ${isLoadingRoute ? 'opacity-50' : ''}`} />
          </IconButton>
        </div>

        {phase === 'lobby' && (
          <div className="absolute inset-x-3 bottom-3 z-20 flex items-center justify-between gap-2">
            <select
              aria-label="Ville"
              value={cityIdx}
              onChange={(e) => {
                const idx = Number(e.target.value);
                setCityIdx(idx);
                setCoords([PRESET_CITIES[idx].lat, PRESET_CITIES[idx].lng]);
              }}
              className="h-10 rounded-full bg-black/50 px-4 text-[13px] font-semibold text-fg outline-none backdrop-blur-md"
            >
              {CAMEROON_REGIONS.map((region) => (
                <optgroup key={region} label={region} className="bg-card text-fg">
                  {PRESET_CITIES.map((c, i) =>
                    c.region === region ? (
                      <option key={c.name} value={i} className="bg-card text-fg">
                        {c.name}
                      </option>
                    ) : null,
                  )}
                </optgroup>
              ))}
            </select>

            <button type="button" onClick={() => { leaveFullscreen(); setSearchOpen(true); }} aria-label="Rechercher un lieu" className={glassPill}>
              <MagnifyingGlass className="h-4 w-4" />
            </button>

            <button type="button" onClick={() => { leaveFullscreen(); setVoiceSheetOpen(true); }} className={glassPill}>
              <Microphone className="h-4 w-4" /> Vocal ({runners.length + 1})
            </button>
          </div>
        )}

        {/* Panneau verre « Run Tracker » */}
        <AnimatePresence>
          {phase === 'running' && (
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 24 }}
              transition={{ type: 'spring', stiffness: 320, damping: 30 }}
              className="absolute inset-x-3 bottom-3 z-20 rounded-[24px] border border-white/10 bg-black/45 p-4 backdrop-blur-xl"
            >
              <div className="flex items-end gap-2">
                <span className="num text-[44px] font-extrabold leading-none text-fg">
                  {myProgressKm.toFixed(2)}
                </span>
                <span className="mb-1 text-[14px] font-medium text-mute">
                  km sur {effectiveDistanceKm} km
                </span>
                <span className="num mb-1 ml-auto flex h-7 items-center rounded-full bg-lime px-3 text-[13px] font-bold text-on-lime">
                  #{myPosition}
                </span>
              </div>
              <ProgressBar value={progressRatio * 100} className="mt-3" />
              <div className="mt-2 flex justify-between text-[12px] font-medium text-mute">
                <span>Reste {remainingKm.toFixed(1)} km</span>
                <span>Arrivée dans ~{etaMin} min</span>
              </div>
              <div className="mt-3 grid grid-cols-4 gap-1 text-center">
                <div>
                  <div className="text-[12px] font-medium text-mute">Temps</div>
                  <div className="num text-[16px] font-bold text-fg">{clock}</div>
                </div>
                <div>
                  <div className="text-[12px] font-medium text-mute">Calories</div>
                  <div className="num text-[16px] font-bold text-ember">{liveKcal}</div>
                </div>
                <div>
                  <div className="text-[12px] font-medium text-mute">Cardio</div>
                  <div className="num text-[16px] font-bold text-danger">{liveBpm}</div>
                </div>
                <div>
                  <div className="text-[12px] font-medium text-mute">Allure</div>
                  <div className="num text-[16px] font-bold text-fg">{paceLabel}</div>
                </div>
              </div>
              <div className="mt-3 flex gap-2">
                <Button size="md" className="flex-1" onClick={handleSprintBoost}>
                  <span className="inline-flex items-center gap-1.5">
                    <Lightning className="h-4 w-4" /> Sprint
                  </span>
                </Button>
                <button
                  type="button"
                  onClick={() => failMission('Abandon en cours de mission.')}
                  className="h-11 flex-1 rounded-full bg-white text-[15px] font-bold text-on-lime transition active:scale-[0.97]"
                >
                  Stop
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Attente relais */}
        <AnimatePresence>
          {phase === 'relay_wait' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-ink/85 p-6 text-center backdrop-blur-sm"
            >
              <span className="text-[13px] font-medium text-mute">Relais escouade · étape 1/4</span>
              <h3 className="mt-1 text-[20px] font-bold text-fg">Ngando_Sprint court vers toi…</h3>
              <ProgressBar value={relayTeammatePct} className="mt-4 w-48" />
              <p className="mt-3 text-[13px] font-medium text-mute">
                Tiens-toi prêt à prendre le témoin dans la fenêtre stricte.
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Compte à rebours */}
        <AnimatePresence>
          {phase === 'countdown' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-ink/85 backdrop-blur-sm"
            >
              <p className="text-[14px] font-medium text-mute">Top départ · {modeShort}</p>
              <motion.div
                key={countdown}
                initial={{ scale: 1.4, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.7, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 450, damping: 28 }}
                className="num text-[140px] font-extrabold leading-none text-lime"
              >
                {countdown}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Fenêtre stricte */}
        <AnimatePresence>
          {phase === 'gate' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-30 flex items-center justify-center bg-ink/85 p-5 backdrop-blur-sm"
            >
              <div className="w-full rounded-[28px] bg-card p-5">
                <div className="flex items-center justify-between">
                  <span className="text-[16px] font-bold text-fg">
                    {gameMode === 'relais_escouade' ? 'Témoin reçu' : 'Valide vite'}
                  </span>
                  <span className="num text-[20px] font-extrabold text-danger">{gateTimer}s</span>
                </div>
                <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-rim">
                  <motion.div
                    initial={{ width: '100%' }}
                    animate={{ width: '0%' }}
                    transition={{ duration: 8, ease: 'linear' }}
                    className="h-full rounded-full bg-danger"
                  />
                </div>
                <div className="mt-4">
                  <Button
                    fullWidth
                    onClick={() => {
                      say('mission', 'hype', mapOptsRef.current.voice);
                      setPhase('running');
                    }}
                  >
                    {gameMode === 'relais_escouade' ? 'Prendre le relais' : 'Lancer ma course'}
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Échec */}
        <AnimatePresence>
          {phase === 'failed' && (
            <motion.div
              initial={{ opacity: 0, x: 0 }}
              animate={{ opacity: 1, x: [0, -8, 8, -5, 5, 0] }}
              className="absolute inset-0 z-30 flex items-center justify-center bg-ink/85 p-5 backdrop-blur-sm"
            >
              <div className="w-full rounded-[28px] bg-card p-6 text-center">
                <Warning className="mx-auto h-9 w-9 text-danger" />
                <h3 className="mt-3 text-[22px] font-bold text-danger">
                  {gameMode === 'survie_checkpoint' ? 'Éliminé' : 'Mission échouée'}
                </h3>
                <p className="mt-1 text-[13px] font-medium text-mute">{failReason}</p>
                <div className="mt-4">
                  <Button variant="secondary" fullWidth onClick={handleReset}>
                    Retour
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Succès */}
        <AnimatePresence>
          {phase === 'completed' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-30 flex items-center justify-center bg-ink/80 p-5 backdrop-blur-sm"
            >
              <motion.div
                initial={{ scale: 0.92, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="w-full rounded-[28px] bg-lime p-6 text-center"
              >
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-on-lime text-lime">
                  <CheckDraw className="h-9 w-9" color="currentColor" />
                </div>
                <h3 className="mt-3 text-[22px] font-extrabold text-on-lime">
                  {gameMode === 'survie_checkpoint'
                    ? 'Survie validée'
                    : gameMode === 'conquete_territoire'
                      ? '+150 pts territoire'
                      : 'Mission réussie'}
                </h3>
                <div className="mt-3 grid grid-cols-3 text-on-lime">
                  <div>
                    <div className="text-[12px] font-medium opacity-70">Rang</div>
                    <div className="num text-[20px] font-extrabold">#{lastResult?.rank ?? myPosition}</div>
                  </div>
                  <div className="border-l border-on-lime/20">
                    <div className="text-[12px] font-medium opacity-70">Distance</div>
                    <div className="num text-[20px] font-extrabold">
                      {lastResult?.km ?? effectiveDistanceKm} km
                    </div>
                  </div>
                  <div className="border-l border-on-lime/20">
                    <div className="text-[12px] font-medium opacity-70">XP</div>
                    <div className="num text-[20px] font-extrabold">+{lastResult?.xp ?? tierObj.xpReward}</div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleReset}
                  className="mt-5 h-[52px] w-full rounded-full bg-ink text-[15px] font-bold text-fg transition active:scale-[0.97]"
                >
                  Nouvelle mission
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Légende de la piste */}
      <Card className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-[12px] font-semibold text-mute">Légende de la piste</div>
            <div className="truncate text-[17px] font-bold leading-6 text-fg">{trackInfo?.name ?? 'Calcul du tracé…'}</div>
          </div>
          {trackInfo && (
            <span
              className="flex h-7 shrink-0 items-center rounded-full bg-tile px-3 text-[12px] font-bold"
              style={{ color: trackInfo.color }}
            >
              {trackInfo.level}
            </span>
          )}
        </div>
        {trackInfo ? (
          <>
            <p className="text-[13px] font-medium leading-5 text-mute">{trackInfo.description}</p>
            <StatTiles
              items={[
                { label: 'Distance', value: trackInfo.km, unit: 'km' },
                { label: 'Virages', value: trackInfo.turns },
                { label: 'NO RUN', value: trackInfo.newZones, unit: `/${trackInfo.zones}` },
              ]}
            />
          </>
        ) : (
          <p className="text-[13px] font-medium text-mute">Génération du parcours sur les vraies rues…</p>
        )}
      </Card>

      {phase === 'completed' && finalLedger && <BonusSummary ledger={finalLedger} />}

      {/* Bloc métriques */}
      <Card className="space-y-4">
        <div className="flex items-end justify-between gap-3">
          <div className="flex items-end gap-2">
            <span className="num text-[56px] font-extrabold leading-none text-fg">
              {simulatedSpeed ?? effectiveDistanceKm}
            </span>
            <span className="mb-1.5 text-[14px] font-medium text-mute">
              {simulatedSpeed ? 'km/h' : 'km'}
            </span>
          </div>
          <span
            className="mb-1.5 flex h-7 items-center rounded-full bg-tile px-3 text-[12px] font-semibold"
            style={{ color: TIER_COLORS[selectedTier] }}
          >
            {selectedTier}
          </span>
        </div>

        {phase === 'running' ? (
          <StatTiles
            items={[
              { label: 'Rang', value: `#${myPosition}`, unit: `/${leaderboard.length}` },
              { label: 'Temps', value: clock },
              { label: 'Anti-triche', value: 'Actif' },
            ]}
          />
        ) : (
          <StatTiles
            items={[
              { label: 'Départ', value: selectedSlot },
              { label: 'Inscrits', value: tierObj.participantsCount },
              { label: 'Durée max', value: tierObj.timeLimitMin, unit: 'min' },
            ]}
          />
        )}
        {phase !== 'running' && (
          <div className="flex items-center justify-between rounded-full bg-tile px-4 py-2.5">
            <span className="text-[13px] font-medium text-mute">Récompense</span>
            <span className="num text-[15px] font-extrabold text-lime">+{tierObj.xpReward} XP</span>
          </div>
        )}

        {gameMode === 'survie_checkpoint' && (
          <div className="grid grid-cols-4 gap-2">
            {[1, 2, 3, 4].map((cp) => {
              const passed = phase === 'completed' || (phase === 'running' && cp < checkpointIdx);
              const current = phase === 'running' && cp === checkpointIdx;
              return (
                <div
                  key={cp}
                  className={`flex h-8 items-center justify-center gap-1 rounded-full text-[12px] font-semibold ${pillState(passed, current)}`}
                >
                  CP{cp}
                  {passed && <Check className="h-3.5 w-3.5" />}
                  {current && <span className="num">{cpTimer}s</span>}
                </div>
              );
            })}
          </div>
        )}

        {gameMode === 'relais_escouade' && (
          <div className="grid grid-cols-4 gap-2">
            {['Ngando', 'Toi', 'Estelle', 'Mbarga'].map((name, i) => {
              const idx = i + 1;
              const active = phase !== 'lobby' && relayLeg === idx;
              const done = phase === 'completed' || (phase !== 'lobby' && idx < relayLeg);
              return (
                <div
                  key={name}
                  className={`flex h-8 items-center justify-center rounded-full px-1 text-[12px] font-semibold ${pillState(done, active)}`}
                >
                  <span className="truncate">{name}</span>
                </div>
              );
            })}
          </div>
        )}

        <div className="flex items-center gap-2">
          {phase !== 'running' ? (
            <Button className="flex-1" trailingArrow onClick={handleJoinMission}>
              Lancer {modeShort}
            </Button>
          ) : (
            <div className="flex-1 text-[13px] font-medium text-mute">Course en cours</div>
          )}
          <IconButton label="Horaires et classement" onClick={() => setDetailsSheetOpen(true)} size={52}>
            <SlidersHorizontal className="h-5 w-5" />
          </IconButton>
        </div>
      </Card>

      {/* Réglages de la carte */}
      <Card>
        <button
          type="button"
          onClick={() => setOptsOpen((o) => !o)}
          aria-expanded={optsOpen}
          aria-controls="map-settings"
          className="flex w-full items-center justify-between gap-3 text-left"
        >
          <div className="flex items-center gap-3">
            <SlidersHorizontal className="h-5 w-5 text-lime" />
            <div>
              <div className="text-[15px] font-bold text-fg">Réglages de la carte</div>
              <div className="text-[12px] font-medium text-mute">
                {mapOpts.detail === 'leger' ? 'Mode Léger' : 'Mode Large'} · touche pour {optsOpen ? 'replier' : 'déplier'}
              </div>
            </div>
          </div>
          <CaretRight className={`h-5 w-5 shrink-0 text-mute transition-transform duration-200 ${optsOpen ? 'rotate-90' : ''}`} />
        </button>
        <AnimatePresence initial={false}>
          {optsOpen && (
            <motion.div
              id="map-settings"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
              className="overflow-hidden"
            >
              <div className="space-y-3 pt-4">
        <ChipTabs
          items={[
            { id: 'leger', label: 'Léger' },
            { id: 'large', label: 'Large' },
          ]}
          value={mapOpts.detail}
          onChange={(v) => applyPreset(v as 'leger' | 'large')}
          layoutId="map-detail"
        />
        <div className="flex flex-col gap-1.5">
          {MAP_TOGGLES.map((t) => (
            <button
              key={t.key}
              type="button"
              role="switch"
              aria-checked={mapOpts[t.key]}
              onClick={() => setMapOpts((o) => ({ ...o, [t.key]: !o[t.key] }))}
              className="flex items-center justify-between gap-3 rounded-[18px] bg-tile px-4 py-2.5 text-left transition active:scale-[0.98]"
            >
              <span>
                <span className="block text-[14px] font-semibold text-fg">{t.label}</span>
                <span className="block text-[12px] font-medium text-mute">{t.hint}</span>
              </span>
              <span className={`flex h-6 w-11 shrink-0 items-center rounded-full p-0.5 transition-colors ${mapOpts[t.key] ? 'bg-lime' : 'bg-rim'}`}>
                <span className={`h-5 w-5 rounded-full bg-ink transition-transform ${mapOpts[t.key] ? 'translate-x-5' : 'translate-x-0'}`} />
              </span>
            </button>
          ))}
        </div>
        <Button fullWidth variant="secondary" onClick={toggleFullscreen}>
          <Maximize className="h-4 w-4" /> Carte en plein écran (horizontal)
        </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>

      {/* Conquête de territoire */}
      {gameMode === 'conquete_territoire' && (
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-[18px] font-bold leading-6 text-fg">Zones de la ville</h3>
            <span className="text-[13px] font-medium text-mute">Ton club : DEK Warriors</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {territories.map((z) => {
              const active = z.id === selectedZoneId;
              const pct = Math.round((z.points / z.targetPoints) * 100);
              return (
                <Tile
                  key={z.id}
                  onClick={() => setSelectedZoneId(z.id)}
                  className={`bg-card! ${active ? 'ring-1 ring-lime' : ''}`}
                >
                  <div className="truncate text-[15px] font-bold text-fg">{z.name}</div>
                  <div className="truncate text-[12px] font-medium text-mute">{z.ownerClub}</div>
                  <ProgressBar value={pct} className="mt-3" />
                  <div className="num mt-1.5 text-[12px] font-semibold text-fg">{pct} %</div>
                </Tile>
              );
            })}
          </div>
        </div>
      )}

      {/* Paliers */}
      <div>
        <div className="mb-2 flex items-center justify-between text-[13px] font-medium text-mute">
          <span>
            Catégorie{' '}
            <strong className="font-bold" style={{ color: TIER_COLORS[selectedTier] }}>
              {selectedTier}
            </strong>{' '}
            · Équitable
          </span>
          <span>
            Palier {userCategory} ({Math.min(2, missionsInCurrentTier)}/2)
          </span>
        </div>

        <div className="grid grid-cols-4 gap-1 rounded-[24px] bg-card p-1.5">
          {MISSION_TIERS.map((tier) => {
            const active = selectedTier === tier.id;
            const isLocked = getTierIndex(tier.id) > getTierIndex(userCategory);
            return (
              <button
                key={tier.id}
                type="button"
                disabled={phase !== 'lobby'}
                onClick={() => {
                  if (isLocked) setLockedTierModal(tier.id);
                  else setSelectedTier(tier.id);
                }}
                className={`rounded-[18px] px-2 py-3 text-left transition active:scale-[0.97] disabled:opacity-60 ${
                  active && !isLocked ? 'bg-tile ring-1 ring-lime' : ''
                } ${isLocked ? 'opacity-50' : ''}`}
              >
                <div className="flex items-center justify-between gap-1">
                  <span className="truncate text-[12px] font-semibold" style={{ color: tier.color }}>
                    {tier.id}
                  </span>
                  {isLocked && <Lock className="h-3.5 w-3.5 shrink-0 text-faint" />}
                </div>
                <div className="num mt-0.5 text-[15px] font-bold text-fg">{tier.badge}</div>
              </button>
            );
          })}
        </div>
      </div>

      {voiceBottomSheet}
      {searchBottomSheet}
      {glowOn && !isFull && overlayRoot && createPortal(<div key={glowKey} className="dek-glow" />, overlayRoot)}
      {detailsBottomSheet}
      {lockedSheet}
    </div>
  );
}
