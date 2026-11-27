import { useEffect, useRef, useState } from 'react';
import * as maplibregl from 'maplibre-gl';
// MapLibre v6 cherche son worker à côté de son propre fichier : introuvable une fois
// l'app bundlée par Vite (dev : 504, build : fichier absent) → carte vide.
// On fait bundler le worker par Vite et on donne son URL à MapLibre.
import maplibreWorkerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowsClockwise,
  Check,
  Compass,
  Lightning,
  Lock,
  Microphone,
  MicrophoneSlash,
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
import { getTierIndex, TIER_COLORS, TIER_REQUIREMENTS } from '../utils/categorization';
import { generateLoopRoute, type GeneratedRoute } from '../utils/routeGenerator';
import { playGo, playHit, playTick, playVictory } from '../utils/soundFx';
import { CheckDraw } from './ui/AnimatedIcons';
import { BottomSheet, Button, Card, ChipTabs, IconButton, ListRow, ProgressBar, StatTiles, Tile } from './ui/kit';

interface MissionsViewProps {
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

const PRESET_CITIES = [
  { name: 'Douala', lat: 4.0511, lng: 9.7679 },
  { name: 'Yaoundé', lat: 3.848, lng: 11.5021 },
  { name: 'Bafoussam', lat: 5.4737, lng: 10.4179 },
  { name: 'Kribi', lat: 2.94, lng: 9.91 },
];

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
  const [cityIdx, setCityIdx] = useState(0);
  const [coords, setCoords] = useState<[number, number]>([
    PRESET_CITIES[0].lat,
    PRESET_CITIES[0].lng,
  ]);
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
  // Résultat figé au moment de l'arrivée (le palier peut changer juste après une promotion)
  const [lastResult, setLastResult] = useState<{ rank: number; km: number; xp: number } | null>(
    null,
  );

  // État Relais Escouade (4 équipiers)
  const [relayLeg, setRelayLeg] = useState(1); // 1: Koffi, 2: Toi, 3: Sarah, 4: Moussa
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

      if (routeRef.current) {
        applyRouteToMap(map, routeRef.current);
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

  const toggle3D = () => {
    const next = !is3D;
    setIs3D(next);
    mapRef.current?.easeTo({ pitch: next ? 60 : 0, duration: 450 });
  };

  const finishMissionSuccess = () => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    playVictory();
    setPhase('completed');
    const modeLabel = OUTDOOR_MODES.find((m) => m.id === gameMode)?.label ?? 'Mission 05h';
    // runnersRef : classement réel (avant, la closure figée renvoyait toujours #1)
    const myRank =
      runnersRef.current.filter((r) => r.progressKm >= effectiveDistanceKm).length + 1;
    const xpEarned = tierObj.xpReward + (gameMode === 'survie_checkpoint' ? 100 : 0);
    setLastResult({ rank: myRank, km: effectiveDistanceKm, xp: xpEarned });

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
    // Phase spéciale Relais : le Joueur 1 (Koffi) court avant de nous passer le témoin
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
            ? 'Relais #2 en cours • Passe le témoin à Sarah !'
            : progressRatio < 0.5
              ? 'Dans 250 m • Tourne à droite'
              : 'Dernière ligne droite • Garde l’allure'
      : gameMode === 'conquete_territoire'
        ? `${selectedZone.name} • Détenu par ${selectedZone.ownerClub}`
        : `Boucle 3D ${effectiveDistanceKm} km • ${discObj.label}`;

  const modeShort = OUTDOOR_MODES.find((m) => m.id === gameMode)?.short ?? '';
  const clock = `${Math.floor(elapsedSec / 60)}:${String(elapsedSec % 60).padStart(2, '0')}`;
  const glassBtn = 'bg-black/50 text-fg backdrop-blur-md';
  const glassPill =
    'flex h-10 items-center gap-2 rounded-full bg-black/50 px-4 text-[13px] font-semibold text-fg backdrop-blur-md';

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
      <div className="relative h-[380px] w-full overflow-hidden rounded-[28px] bg-card">
        <div ref={mapContainerRef} className="h-full w-full" />

        {/* Consigne */}
        <div className="pointer-events-none absolute left-3 right-16 top-3 z-20">
          <div className="pointer-events-auto inline-flex h-10 max-w-full items-center rounded-full bg-ink/80 px-4 backdrop-blur-md">
            <span className="truncate text-[13px] font-semibold text-fg">{guidanceLabel}</span>
          </div>
        </div>

        {/* Contrôles flottants */}
        <div className="absolute right-3 top-3 z-20 flex flex-col gap-2">
          <IconButton label={is3D ? 'Passer en 2D' : 'Passer en 3D'} onClick={toggle3D} size={40} className={glassBtn}>
            <span className="num text-[13px] font-bold">{is3D ? '3D' : '2D'}</span>
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
              {PRESET_CITIES.map((c, i) => (
                <option key={c.name} value={i} className="bg-card text-fg">
                  {c.name}
                </option>
              ))}
            </select>

            <button type="button" onClick={() => setVoiceSheetOpen(true)} className={glassPill}>
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
              <h3 className="mt-1 text-[20px] font-bold text-fg">Koffi_Sprint court vers toi…</h3>
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
                  <Button fullWidth onClick={() => setPhase('running')}>
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
            {['Koffi', 'Toi', 'Sarah', 'Moussa'].map((name, i) => {
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
      {detailsBottomSheet}
      {lockedSheet}
    </div>
  );
}
