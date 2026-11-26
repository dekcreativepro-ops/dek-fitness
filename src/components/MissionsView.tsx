import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import * as maplibregl from 'maplibre-gl';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Bike,
  CheckCircle,
  Clock,
  Compass,
  Cube,
  Flag,
  Footprints,
  Ghost,
  Globe,
  Lightning,
  Lock,
  MapPin,
  Microphone,
  MicrophoneSlash,
  NavigationArrow,
  Play,
  SlidersHorizontal,
  Timer,
  Trophy,
  Users,
  Warning,
  X,
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
  { name: 'Abidjan', lat: 5.3484, lng: -3.9985 },
  { name: 'Paris', lat: 48.8675, lng: 2.3638 },
  { name: 'Dakar', lat: 14.6928, lng: -17.4667 },
  { name: 'Lyon', lat: 45.7772, lng: 4.8552 },
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
  const [cpTimer, setCpTimer] = useState(11);

  // État Relais Escouade (4 équipiers)
  const [relayLeg, setRelayLeg] = useState(1); // 1: Koffi, 2: Toi, 3: Sarah, 4: Moussa
  const [relayTeammatePct, setRelayTeammatePct] = useState(0);

  useEffect(() => {
    setSelectedTier(userCategory);
  }, [userCategory]);

  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const mapLoadedRef = useRef(false);
  const arrowMarkerRef = useRef<maplibregl.Marker | null>(null);
  const ghostMarkerRef = useRef<maplibregl.Marker | null>(null);
  const routeRef = useRef<GeneratedRoute | null>(null);
  const is3DRef = useRef(is3D);
  const myProgressRef = useRef(myProgressKm);
  const cpIdxRef = useRef(checkpointIdx);

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
  }, []);

  // Afficher / cacher le marqueur Fantôme selon le mode
  useEffect(() => {
    if (!ghostMarkerRef.current) return;
    const el = ghostMarkerRef.current.getElement();
    el.style.display = gameMode === 'fantome' ? 'block' : 'none';
  }, [gameMode]);

  const loadNewRoute = async (lat: number, lng: number, distKm: number) => {
    setIsLoadingRoute(true);
    const res = await generateLoopRoute(lat, lng, distKm);
    routeRef.current = res;
    setRoute(res);
    setIsLoadingRoute(false);
    if (mapRef.current && mapLoadedRef.current) {
      applyRouteToMap(mapRef.current, res);
    }
  };

  useEffect(() => {
    void loadNewRoute(coords[0], coords[1], tierObj.distanceKm);
  }, [coords, tierObj.distanceKm]);

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
    playVictory();
    setPhase('completed');
    const modeLabel = OUTDOOR_MODES.find((m) => m.id === gameMode)?.label ?? 'Mission 05h';
    const myRank = runners.filter((r) => r.progressKm >= effectiveDistanceKm).length + 1;

    if (gameMode === 'conquete_territoire') {
      setTerritories((prev) =>
        prev.map((z) => {
          if (z.id !== selectedZoneId) return z;
          const nextPts = Math.min(z.targetPoints, z.points + 150);
          const conquered = nextPts >= z.targetPoints && z.ownerClub !== 'DEK Warriors';
          if (conquered) onTerritoryCapture(z.name);
          return {
            ...z,
            points: nextPts,
            ownerClub: nextPts >= z.targetPoints ? 'DEK Warriors' : z.ownerClub,
            color: nextPts >= z.targetPoints ? '#C8FF00' : z.color,
          };
        }),
      );
    }

    onMissionComplete(
      tierObj.xpReward + (gameMode === 'survie_checkpoint' ? 100 : 0),
      effectiveDistanceKm,
      myRank,
      selectedTier,
      `${modeLabel} (${discObj.label})`,
    );
  };

  // Timers selon les phases & modes
  useEffect(() => {
    // Phase spéciale Relais : le Joueur 1 (Koffi) court avant de nous passer le témoin
    if (phase === 'relay_wait') {
      const t = setInterval(() => {
        setRelayTeammatePct((p) => {
          if (p >= 100) {
            clearInterval(t);
            playGo();
            setRelayLeg(2);
            setPhase('gate');
            setGateTimer(8);
            return 100;
          }
          return p + 20;
        });
      }, 550);
      return () => clearInterval(t);
    }

    if (phase === 'countdown') {
      if (countdown <= 0) {
        playGo();
        setPhase('gate');
        setGateTimer(8);
        return;
      }
      playTick();
      const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
      return () => clearTimeout(t);
    }

    if (phase === 'gate') {
      if (gateTimer <= 0) {
        const msg =
          gameMode === 'relais_escouade'
            ? 'Relais manqué : toute l’escouade a échoué !'
            : `Timing ${selectedSlot} manqué (-2% discipline).`;
        setFailReason(msg);
        setPhase('failed');
        onMissionFail(msg);
        return;
      }
      const t = setTimeout(() => setGateTimer((g) => g - 1), 1000);
      return () => clearTimeout(t);
    }

    if (phase === 'running') {
      const interval = setInterval(() => {
        setElapsedSec((s) => s + 1);

        const baseStep = (effectiveDistanceKm / 18) * (gameMode === 'survie_checkpoint' ? 0.85 : 1);
        setMyProgressKm((prev) => {
          const next = Number((prev + baseStep).toFixed(2));

          // Vérification Checkpoint (Mode Survie)
          if (gameMode === 'survie_checkpoint') {
            const targetCpDist = (cpIdxRef.current / 4) * effectiveDistanceKm;
            if (next >= targetCpDist && cpIdxRef.current < 4) {
              playHit();
              setCheckpointIdx((c) => c + 1);
              setCpTimer(11);
            }
          }

          if (next >= effectiveDistanceKm) {
            clearInterval(interval);
            if (gameMode === 'relais_escouade') setRelayLeg(4);
            finishMissionSuccess();
            return effectiveDistanceKm;
          }
          return next;
        });

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
            const nextDist = Math.min(effectiveDistanceKm, Number((r.progressKm + step).toFixed(2)));
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
          setCpTimer((t) => {
            if (t <= 1) {
              const targetDist = (cpIdxRef.current / 4) * effectiveDistanceKm;
              if (myProgressRef.current < targetDist) {
                const msg = `Éliminé au Checkpoint #${cpIdxRef.current} (distance non atteinte à temps) !`;
                setFailReason(msg);
                setPhase('failed');
                onMissionFail(msg);
                return 0;
              }
              return 11;
            }
            return t - 1;
          });
        }, 1000);
      }

      return () => {
        clearInterval(interval);
        if (cpInterval) clearInterval(cpInterval);
      };
    }
  }, [phase, countdown, gateTimer, effectiveDistanceKm, gameMode]);

  const handleSprintBoost = () => {
    if (phase !== 'running') return;
    playHit();
    setMyProgressKm((prev) => {
      const next = Math.min(effectiveDistanceKm, Number((prev + effectiveDistanceKm * 0.08).toFixed(2)));
      if (gameMode === 'survie_checkpoint') {
        const targetCpDist = (cpIdxRef.current / 4) * effectiveDistanceKm;
        if (next >= targetCpDist && cpIdxRef.current < 4) {
          setCheckpointIdx((c) => c + 1);
          setCpTimer(11);
        }
      }
      if (next >= effectiveDistanceKm) {
        finishMissionSuccess();
      }
      return next;
    });
  };

  const handleUseGPS = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition((pos) => {
      setCoords([pos.coords.latitude, pos.coords.longitude]);
    });
  };

  const handleJoinMission = () => {
    setCountdown(5);
    setElapsedSec(0);
    setMyProgressKm(0);
    setGhostProgressKm(0);
    setCheckpointIdx(1);
    setCpTimer(11);
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
    setPhase('lobby');
    setMyProgressKm(0);
    setGhostProgressKm(0);
    setElapsedSec(0);
    setCheckpointIdx(1);
    setCpTimer(11);
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
  const simulatedSpeed =
    phase === 'running'
      ? ((10.8 + (elapsedSec % 3) * 0.4) * discObj.speedMult).toFixed(1)
      : null;

  const ghostDeltaMeters = Math.round((myProgressKm - ghostProgressKm) * 1000);

  const arcLength = 157;
  const arcFill = phase === 'running' ? arcLength * progressRatio : arcLength * 0.68;

  const guidanceLabel =
    phase === 'running'
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

  const overlayRoot =
    typeof document !== 'undefined' ? document.getElementById('dek-overlay-root') : null;

  const voiceBottomSheet = (
    <AnimatePresence>
      {voiceSheetOpen && (
        <motion.div
          key="voice-sheet-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setVoiceSheetOpen(false)}
          className="pointer-events-auto absolute inset-0 flex flex-col justify-end bg-black/70 backdrop-blur-xs"
        >
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 360, damping: 32 }}
            onClick={(e) => e.stopPropagation()}
            className="rounded-t-3xl border-t border-white/15 bg-[#121722] p-4 pb-6 shadow-2xl"
          >
            <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-white/20" />
            <div className="flex items-center justify-between">
              <h3 className="font-hud text-sm font-bold text-white">
                SALON VOCAL • LOBBY {selectedSlot}
              </h3>
              <button
                onClick={() => setVoiceSheetOpen(false)}
                className="rounded-xl bg-white/5 p-1.5 text-slate-400"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-3 grid grid-cols-4 gap-2">
              {[
                { id: 'me', name: 'Toi', speaking: !micMuted },
                ...runners.map((r, i) => ({
                  id: r.id,
                  name: r.name.split('_')[0],
                  speaking: i === 0,
                })),
              ].map((member) => (
                <div
                  key={member.id}
                  className="flex flex-col items-center rounded-2xl border border-white/5 bg-[#0B0E14] p-2.5"
                >
                  <div className="relative flex h-10 w-10 items-center justify-center rounded-full bg-[#1C2331] text-xs font-bold text-white">
                    {member.speaking && (
                      <motion.span
                        animate={{ scale: [1, 1.35, 1], opacity: [0.65, 0, 0.65] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                        className="absolute inset-0 rounded-full border-2 border-[#C8FF00]"
                      />
                    )}
                    {member.name.slice(0, 2).toUpperCase()}
                  </div>
                  <span className="mt-1 truncate text-[10px] text-slate-200">{member.name}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 flex gap-2">
              <button
                onClick={() => setMicMuted((m) => !m)}
                className={`font-hud flex flex-1 items-center justify-center gap-2 rounded-full py-2.5 text-xs font-bold ${
                  micMuted ? 'bg-[#FF2E54]/20 text-[#FF2E54]' : 'bg-[#C8FF00] text-black'
                }`}
              >
                {micMuted ? (
                  <MicrophoneSlash weight="duotone" className="h-4 w-4" />
                ) : (
                  <Microphone weight="duotone" className="h-4 w-4" />
                )}
                {micMuted ? 'Micro coupé' : 'Micro actif'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  const detailsBottomSheet = (
    <AnimatePresence>
      {detailsSheetOpen && (
        <motion.div
          key="details-sheet-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setDetailsSheetOpen(false)}
          className="pointer-events-auto absolute inset-0 flex flex-col justify-end bg-black/75 backdrop-blur-xs"
        >
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 360, damping: 32 }}
            onClick={(e) => e.stopPropagation()}
            className="max-h-[78%] space-y-3.5 overflow-y-auto rounded-t-3xl border-t border-white/15 bg-[#121722] p-4 pb-6 shadow-2xl no-scrollbar"
          >
            <div className="mx-auto h-1 w-10 rounded-full bg-white/20" />
            <div className="flex items-center justify-between">
              <h3 className="font-hud text-sm font-bold text-white">
                PARAMÈTRES & CLASSEMENT LOBBY
              </h3>
              <button
                onClick={() => setDetailsSheetOpen(false)}
                className="rounded-xl bg-white/5 p-1.5 text-slate-400"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div>
              <span className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-300">
                <Clock weight="duotone" className="h-4 w-4 text-[#C8FF00]" /> Horaire de départ
                strict
              </span>
              <div className="no-scrollbar mt-2 flex gap-1.5 overflow-x-auto">
                {TIME_SLOTS.map((slot) => (
                  <button
                    key={slot}
                    disabled={phase !== 'lobby'}
                    onClick={() => setSelectedSlot(slot)}
                    className={`font-hud shrink-0 rounded-xl border px-3 py-1.5 text-xs font-bold ${
                      selectedSlot === slot
                        ? 'border-[#C8FF00] bg-[#C8FF00] text-black'
                        : 'border-white/10 bg-[#0B0E14] text-slate-300'
                    }`}
                  >
                    {slot}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                disabled={phase !== 'lobby'}
                onClick={() => setGeoMode('global')}
                className={`flex items-center justify-center gap-1.5 rounded-xl border py-2 text-[11px] font-semibold ${
                  geoMode === 'global'
                    ? 'border-[#00E5FF] bg-[#00E5FF]/15 text-[#00E5FF]'
                    : 'border-white/10 bg-[#0B0E14] text-slate-400'
                }`}
              >
                <Globe weight="duotone" className="h-4 w-4" /> Zones différentes
              </button>
              <button
                disabled={phase !== 'lobby'}
                onClick={() => setGeoMode('local')}
                className={`flex items-center justify-center gap-1.5 rounded-xl border py-2 text-[11px] font-semibold ${
                  geoMode === 'local'
                    ? 'border-[#00E5FF] bg-[#00E5FF]/15 text-[#00E5FF]'
                    : 'border-white/10 bg-[#0B0E14] text-slate-400'
                }`}
              >
                <MapPin weight="duotone" className="h-4 w-4" /> Même parcours
              </button>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-bold text-white">
                <span className="flex items-center gap-1.5">
                  <Trophy weight="duotone" className="h-4 w-4 text-[#C8FF00]" /> Lobby{' '}
                  {selectedSlot}
                </span>
                <span className="text-[10px] text-slate-400">
                  {geoMode === 'global' ? 'Multi-villes' : 'Proximité'}
                </span>
              </div>
              {leaderboard.map((runner, i) => {
                const isMe = runner.id === 'me';
                return (
                  <motion.div
                    layout
                    key={runner.id}
                    className={`flex items-center justify-between rounded-xl border px-3 py-2 text-[11px] ${
                      isMe
                        ? 'border-[#C8FF00]/40 bg-[#C8FF00]/10'
                        : 'border-white/5 bg-[#0B0E14]'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-hud font-bold text-slate-400">#{i + 1}</span>
                      <span className={isMe ? 'font-bold text-[#C8FF00]' : 'text-white'}>
                        {runner.name}
                      </span>
                      <span className="text-[10px] text-slate-500">{runner.city}</span>
                    </div>
                    <span className="font-hud font-bold text-white">
                      {runner.progressKm.toFixed(2)} km
                    </span>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  const lockedSheet = (
    <AnimatePresence>
      {lockedTierModal && (
        <motion.div
          key="locked-tier-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setLockedTierModal(null)}
          className="pointer-events-auto absolute inset-0 flex flex-col justify-end bg-black/75 backdrop-blur-xs"
        >
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 360, damping: 32 }}
            onClick={(e) => e.stopPropagation()}
            className="space-y-3 rounded-t-3xl border-t border-[#FF8A00]/35 bg-[#121722] p-4 pb-6 shadow-2xl"
          >
            <div className="mx-auto h-1 w-10 rounded-full bg-white/20" />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Lock weight="duotone" className="h-4 w-4 text-[#FF8A00]" />
                <h3 className="font-hud text-sm font-bold text-white">
                  PALIER {lockedTierModal.toUpperCase()} VERROUILLÉ
                </h3>
              </div>
              <button
                onClick={() => setLockedTierModal(null)}
                className="rounded-xl bg-white/5 p-1.5 text-slate-400"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="rounded-2xl border border-emerald-500/25 bg-emerald-500/10 p-3 text-[11px] text-emerald-100">
              <strong className="text-emerald-400">Santé :</strong>{' '}
              {TIER_REQUIREMENTS[lockedTierModal].healthReason}
            </div>
            <div className="space-y-1.5 rounded-2xl border border-white/10 bg-[#0B0E14] p-3 text-[11px]">
              <div>
                <strong className="text-[#C8FF00]">Progression : </strong>
                <span className="text-slate-300">
                  {TIER_REQUIREMENTS[lockedTierModal].missionRule}
                </span>
              </div>
              <div>
                <strong className="text-[#00E5FF]">Compétences : </strong>
                <span className="text-slate-300">
                  {TIER_REQUIREMENTS[lockedTierModal].skillRule}
                </span>
              </div>
            </div>
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={() => {
                setLockedTierModal(null);
                onRequestRetakeTest();
              }}
              className="font-hud w-full rounded-full bg-[#C8FF00] py-3 text-xs font-bold text-black"
            >
              PASSER LE TEST DE MONTÉE DE PALIER
            </motion.button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <div className="space-y-2.5 pb-2">
      {/* Barre Disciplines (Course / Marche / Vélo) + 5 Modes Outdoor */}
      <div className="space-y-1.5">
        <div className="grid grid-cols-3 gap-1 rounded-2xl border border-white/10 bg-[#11151D] p-1">
          {DISCIPLINES.map((d) => {
            const active = discipline === d.id;
            return (
              <button
                key={d.id}
                disabled={phase !== 'lobby'}
                onClick={() => setDiscipline(d.id)}
                className={`font-hud flex items-center justify-center gap-1 rounded-xl py-1.5 text-[11px] font-bold transition ${
                  active ? 'bg-[#C8FF00] text-black' : 'text-slate-300'
                }`}
              >
                {d.id === 'velo' ? (
                  <Bike weight="duotone" className="h-3.5 w-3.5" />
                ) : (
                  <Footprints weight="duotone" className="h-3.5 w-3.5" />
                )}
                {d.label}
              </button>
            );
          })}
        </div>

        <div className="no-scrollbar flex gap-1.5 overflow-x-auto pb-0.5">
          {OUTDOOR_MODES.map((m) => {
            const active = gameMode === m.id;
            return (
              <button
                key={m.id}
                disabled={phase !== 'lobby'}
                onClick={() => setGameMode(m.id)}
                className={`font-hud flex shrink-0 items-center gap-1 rounded-full border px-3 py-1.5 text-[10px] font-bold transition ${
                  active
                    ? 'border-[#C8FF00] bg-[#C8FF00]/15 text-[#C8FF00]'
                    : 'border-white/10 bg-[#11151D] text-slate-400'
                }`}
              >
                {m.id === 'survie_checkpoint' && <Timer weight="duotone" className="h-3 w-3" />}
                {m.id === 'relais_escouade' && <Users weight="duotone" className="h-3 w-3" />}
                {m.id === 'conquete_territoire' && <Flag weight="duotone" className="h-3 w-3" />}
                {m.id === 'fantome' && <Ghost weight="duotone" className="h-3 w-3" />}
                {m.short}
              </button>
            );
          })}
        </div>
      </div>

      {/* Héro Carte 3D + Panneau de bord */}
      <div className="overflow-hidden rounded-3xl border border-white/10 bg-[#11151D]">
        <div className="relative h-[245px] w-full bg-[#090C12]">
          <div ref={mapContainerRef} className="h-full w-full" />

          {/* Pilule de guidage flottante */}
          <div className="pointer-events-none absolute left-2.5 right-2.5 top-2.5 z-20 flex items-center justify-between gap-2">
            <div className="pointer-events-auto flex min-w-0 items-center gap-2 rounded-2xl border border-white/15 bg-[#080A0E]/88 px-3 py-2 shadow-xl backdrop-blur-md">
              <NavigationArrow weight="duotone" className="h-4 w-4 shrink-0 text-[#C8FF00]" />
              <span className="truncate text-[11px] font-semibold text-white">
                {guidanceLabel}
              </span>
            </div>

            <div className="pointer-events-auto flex items-center gap-1">
              <button
                onClick={toggle3D}
                className={`font-hud flex items-center gap-1 rounded-xl border px-2 py-1.5 text-[10px] font-bold backdrop-blur ${
                  is3D
                    ? 'border-[#C8FF00]/50 bg-[#C8FF00]/15 text-[#C8FF00]'
                    : 'border-white/15 bg-[#080A0E]/88 text-slate-300'
                }`}
              >
                <Cube weight="duotone" className="h-3.5 w-3.5" />
                {is3D ? '3D' : '2D'}
              </button>
              <button
                onClick={handleUseGPS}
                className="rounded-xl border border-white/15 bg-[#080A0E]/88 p-1.5 text-[#00E5FF] backdrop-blur"
                title="GPS réel"
              >
                <Compass weight="duotone" className="h-4 w-4" />
              </button>
              <button
                disabled={isLoadingRoute || phase !== 'lobby'}
                onClick={() => void loadNewRoute(coords[0], coords[1], tierObj.distanceKm)}
                className="font-hud rounded-xl border border-white/15 bg-[#080A0E]/88 px-2 py-1.5 text-[10px] font-bold text-[#C8FF00] backdrop-blur"
              >
                {isLoadingRoute ? '...' : 'Tracé'}
              </button>
            </div>
          </div>

          {phase === 'lobby' && (
            <div className="absolute bottom-2.5 left-2.5 right-2.5 z-20 flex items-center justify-between">
              <select
                value={cityIdx}
                onChange={(e) => {
                  const idx = Number(e.target.value);
                  setCityIdx(idx);
                  setCoords([PRESET_CITIES[idx].lat, PRESET_CITIES[idx].lng]);
                }}
                className="rounded-xl border border-white/15 bg-[#080A0E]/88 px-2.5 py-1.5 text-[11px] font-semibold text-white backdrop-blur outline-none"
              >
                {PRESET_CITIES.map((c, i) => (
                  <option key={c.name} value={i}>
                    {c.name}
                  </option>
                ))}
              </select>

              <button
                onClick={() => setVoiceSheetOpen(true)}
                className="flex items-center gap-1.5 rounded-xl border border-white/15 bg-[#080A0E]/88 px-2.5 py-1.5 text-[11px] font-semibold text-white backdrop-blur"
              >
                <Microphone weight="duotone" className="h-4 w-4 text-[#C8FF00]" /> Vocal (
                {runners.length + 1})
              </button>
            </div>
          )}

          {/* Overlay Attente Relais Escouade */}
          <AnimatePresence>
            {phase === 'relay_wait' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/85 p-4 text-center backdrop-blur-xs"
              >
                <span className="font-hud text-[11px] font-bold tracking-widest text-[#00E5FF]">
                  RELAIS ESCOUADE • ÉTAPE 1/4
                </span>
                <h3 className="font-hud mt-1 text-lg font-bold text-white">
                  Koffi_Sprint court vers toi...
                </h3>
                <div className="mt-3 h-2 w-48 overflow-hidden rounded-full bg-white/15">
                  <div
                    className="h-full bg-[#C8FF00] transition-all duration-300"
                    style={{ width: `${relayTeammatePct}%` }}
                  />
                </div>
                <p className="mt-2 text-[11px] text-slate-300">
                  Tiens-toi prêt à prendre le témoin dans la fenêtre stricte !
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Overlay Countdown */}
          <AnimatePresence>
            {phase === 'countdown' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/82 backdrop-blur-xs"
              >
                <p className="font-hud text-[11px] font-bold tracking-[0.22em] text-[#C8FF00]">
                  TOP DÉPART • {OUTDOOR_MODES.find((m) => m.id === gameMode)?.short.toUpperCase()}
                </p>
                <motion.div
                  key={countdown}
                  initial={{ scale: 1.55, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.7, opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 450, damping: 24 }}
                  className="font-hud mt-1 text-7xl font-bold text-white"
                >
                  {countdown}
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Overlay Fenêtre stricte */}
          <AnimatePresence>
            {phase === 'gate' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/88 p-4 text-center backdrop-blur-xs"
              >
                <div className="w-44">
                  <div className="mb-1 flex justify-between text-[11px] font-bold text-[#FF2E54]">
                    <span>
                      {gameMode === 'relais_escouade' ? 'TÉMOIN REÇU !' : 'VALIDE VITE'}
                    </span>
                    <span>{gateTimer}s</span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                    <motion.div
                      initial={{ width: '100%' }}
                      animate={{ width: '0%' }}
                      transition={{ duration: 8, ease: 'linear' }}
                      className="h-full bg-[#FF2E54]"
                    />
                  </div>
                </div>
                <motion.button
                  whileTap={{ scale: 0.93 }}
                  onClick={() => setPhase('running')}
                  className="animate-pulse-volt font-hud mt-4 rounded-full bg-[#C8FF00] px-7 py-3 text-sm font-bold text-black"
                >
                  {gameMode === 'relais_escouade' ? 'PRENDRE LE RELAIS !' : 'GO ! LANCER MA COURSE'}
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {phase === 'failed' && (
              <motion.div
                initial={{ opacity: 0, x: 0 }}
                animate={{ opacity: 1, x: [0, -8, 8, -5, 5, 0] }}
                className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-[#19080C]/92 p-4 text-center"
              >
                <Warning weight="duotone" className="h-10 w-10 text-[#FF2E54]" />
                <h3 className="font-hud mt-1.5 text-xl font-bold text-[#FF2E54]">
                  {gameMode === 'survie_checkpoint' ? 'ÉLIMINÉ !' : 'MISSION ÉCHOUÉE'}
                </h3>
                <p className="mt-0.5 text-[11px] text-slate-300">{failReason}</p>
                <button
                  onClick={handleReset}
                  className="font-hud mt-3 rounded-full border border-white/20 bg-white/10 px-5 py-2 text-xs font-bold text-white"
                >
                  RETOUR
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {phase === 'completed' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-[#09140A]/92 p-4 text-center"
              >
                <CheckCircle weight="duotone" className="h-10 w-10 text-[#C8FF00]" />
                <h3 className="font-hud mt-1.5 text-xl font-bold text-[#C8FF00]">
                  {gameMode === 'survie_checkpoint'
                    ? 'SURVIE VALIDÉE !'
                    : gameMode === 'conquete_territoire'
                      ? '+150 PTS TERRITOIRE !'
                      : 'MISSION RÉUSSIE !'}
                </h3>
                <p className="mt-0.5 text-xs text-white">
                  #{myPosition} • {effectiveDistanceKm} km •{' '}
                  <strong className="text-[#C8FF00]">
                    +{tierObj.xpReward + (gameMode === 'survie_checkpoint' ? 100 : 0)} XP
                  </strong>
                </p>
                <button
                  onClick={handleReset}
                  className="font-hud mt-3 rounded-full bg-[#C8FF00] px-5 py-2 text-xs font-bold text-black"
                >
                  NOUVELLE MISSION
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Panneau de bord minimaliste avec Jauge Arc */}
        <div className="bg-[#0B0E14] px-4 pb-3.5 pt-2.5">
          <div className="relative mx-auto flex w-44 flex-col items-center">
            <svg viewBox="0 0 120 68" className="h-18 w-36">
              <path
                d="M 10 60 A 50 50 0 0 1 110 60"
                fill="none"
                stroke="rgba(255,255,255,0.1)"
                strokeWidth="7"
                strokeLinecap="round"
              />
              <motion.path
                d="M 10 60 A 50 50 0 0 1 110 60"
                fill="none"
                stroke="#C8FF00"
                strokeWidth="7"
                strokeLinecap="round"
                strokeDasharray={arcLength}
                animate={{ strokeDashoffset: arcLength - arcFill }}
                transition={{ duration: 0.35 }}
              />
            </svg>
            <div className="-mt-8 text-center">
              <div className="font-hud text-xl font-bold leading-none text-white">
                {simulatedSpeed ?? `${effectiveDistanceKm}`}
              </div>
              <div className="mt-0.5 text-[10px] font-medium text-slate-400">
                {simulatedSpeed ? 'km/h live' : `km • ${selectedTier}`}
              </div>
            </div>
          </div>

          {/* Barre spécifique Mode Survie Checkpoint */}
          {gameMode === 'survie_checkpoint' && (
            <div className="mt-2.5 grid grid-cols-4 gap-1.5">
              {[1, 2, 3, 4].map((cp) => {
                const passed =
                  phase === 'completed' || (phase === 'running' && cp < checkpointIdx);
                const current = phase === 'running' && cp === checkpointIdx;
                return (
                  <div
                    key={cp}
                    className={`font-hud rounded-xl border py-1 text-center text-[10px] font-bold ${
                      passed
                        ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-400'
                        : current
                          ? 'border-[#FF8A00] bg-[#FF8A00]/15 text-[#FF8A00]'
                          : 'border-white/5 bg-[#11151D] text-slate-500'
                    }`}
                  >
                    CP{cp} {passed ? '✓' : current ? `${cpTimer}s` : ''}
                  </div>
                );
              })}
            </div>
          )}

          {/* Barre spécifique Relais Escouade */}
          {gameMode === 'relais_escouade' && (
            <div className="mt-2.5 grid grid-cols-4 gap-1.5">
              {['Koffi', 'TOI', 'Sarah', 'Moussa'].map((name, i) => {
                const idx = i + 1;
                const active = phase !== 'lobby' && relayLeg === idx;
                const done = phase === 'completed' || (phase !== 'lobby' && idx < relayLeg);
                return (
                  <div
                    key={name}
                    className={`font-hud rounded-xl border py-1 text-center text-[10px] font-bold ${
                      done
                        ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-400'
                        : active
                          ? 'border-[#C8FF00] bg-[#C8FF00]/15 text-[#C8FF00]'
                          : 'border-white/5 bg-[#11151D] text-slate-400'
                    }`}
                  >
                    {idx}. {name}
                  </div>
                );
              })}
            </div>
          )}

          {/* 2 mini-blocs métriques */}
          <div className="mt-2.5 grid grid-cols-2 gap-2">
            <div className="rounded-2xl border border-white/5 bg-[#11151D] px-3 py-1.5 text-center">
              <div className="font-hud text-sm font-bold text-white">
                {phase === 'running'
                  ? `${myProgressKm.toFixed(2)} km`
                  : `Départ ${selectedSlot}`}
              </div>
              <div className="text-[10px] text-slate-400">
                {phase === 'running'
                  ? `Rang #${myPosition}/${leaderboard.length}`
                  : `${tierObj.participantsCount} inscrits`}
              </div>
            </div>

            <div className="rounded-2xl border border-white/5 bg-[#11151D] px-3 py-1.5 text-center">
              <div className="font-hud text-sm font-bold text-white">
                {phase === 'running'
                  ? `${Math.floor(elapsedSec / 60)}:${String(elapsedSec % 60).padStart(2, '0')}`
                  : `${tierObj.timeLimitMin} min max`}
              </div>
              <div className="text-[10px] text-slate-400">
                {phase === 'running' ? 'Anti-triche GPS ✓' : `+${tierObj.xpReward} XP`}
              </div>
            </div>
          </div>

          {/* Boutons d'action */}
          <div className="mt-3 flex items-center gap-2">
            {phase === 'running' ? (
              <>
                <motion.button
                  whileTap={{ scale: 0.94 }}
                  onClick={handleSprintBoost}
                  className="font-hud flex flex-1 items-center justify-center gap-1.5 rounded-full bg-[#C8FF00] py-3 text-xs font-bold text-black"
                >
                  <Lightning weight="duotone" className="h-4 w-4" /> Accélérer (Sprint)
                </motion.button>
                <button
                  onClick={() => {
                    setFailReason('Abandon en cours de mission.');
                    setPhase('failed');
                    onMissionFail('Abandon');
                  }}
                  className="font-hud rounded-full bg-[#FF2E54]/20 px-4 py-3 text-xs font-bold text-[#FF2E54]"
                >
                  Stop
                </button>
              </>
            ) : (
              <motion.button
                whileTap={{ scale: 0.96 }}
                onClick={handleJoinMission}
                className="font-hud flex flex-1 items-center justify-center gap-2 rounded-full bg-[#C8FF00] py-3 text-xs font-bold text-black shadow-lg shadow-[#C8FF00]/15"
              >
                <Play weight="duotone" className="h-4 w-4" /> Lancer{' '}
                {OUTDOOR_MODES.find((m) => m.id === gameMode)?.short}
              </motion.button>
            )}

            <motion.button
              whileTap={{ scale: 0.92 }}
              onClick={() => setDetailsSheetOpen(true)}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/15 bg-[#11151D] text-slate-200"
              title="Horaires & Classement"
            >
              <SlidersHorizontal weight="duotone" className="h-4 w-4" />
            </motion.button>
          </div>
        </div>
      </div>

      {/* Panneau Conquête de Territoire (quand ce mode est actif) */}
      {gameMode === 'conquete_territoire' && (
        <div className="rounded-2xl border border-white/10 bg-[#11151D] p-3">
          <div className="mb-2 flex items-center justify-between text-[11px] font-bold text-white">
            <span className="flex items-center gap-1.5">
              <Flag weight="duotone" className="h-4 w-4 text-[#C8FF00]" /> Zones de la ville
            </span>
            <span className="text-[10px] text-slate-400">Ton club : DEK Warriors</span>
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            {territories.map((z) => {
              const active = z.id === selectedZoneId;
              return (
                <button
                  key={z.id}
                  onClick={() => setSelectedZoneId(z.id)}
                  className={`rounded-xl border p-2 text-left transition ${
                    active ? 'border-[#C8FF00] bg-[#C8FF00]/10' : 'border-white/10 bg-[#0B0E14]'
                  }`}
                >
                  <div className="font-hud text-[11px] font-bold text-white">{z.name}</div>
                  <div className="text-[9px]" style={{ color: z.color }}>
                    {z.ownerClub}
                  </div>
                  <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${Math.round((z.points / z.targetPoints) * 100)}%`,
                        backgroundColor: z.color,
                      }}
                    />
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Sélecteur des 4 paliers compact avec cadenas */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between px-1 text-[10px] font-semibold text-slate-400">
          <span>
            Catégorie <strong style={{ color: TIER_COLORS[selectedTier] }}>{selectedTier}</strong>{' '}
            • Équitable
          </span>
          <span>
            Palier {userCategory} ({Math.min(2, missionsInCurrentTier)}/2)
          </span>
        </div>

        <div className="grid grid-cols-4 gap-1.5">
          {MISSION_TIERS.map((tier) => {
            const active = selectedTier === tier.id;
            const isLocked = getTierIndex(tier.id) > getTierIndex(userCategory);
            return (
              <motion.button
                key={tier.id}
                whileTap={{ scale: 0.94 }}
                disabled={phase !== 'lobby'}
                onClick={() => {
                  if (isLocked) setLockedTierModal(tier.id);
                  else setSelectedTier(tier.id);
                }}
                className={`relative rounded-2xl border p-2 text-left transition ${
                  isLocked
                    ? 'border-white/5 bg-[#0D1017] opacity-60'
                    : active
                      ? 'border-[#C8FF00] bg-[#181E29]'
                      : 'border-white/10 bg-[#11151D]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className="font-hud text-[10px] font-bold uppercase"
                    style={{ color: tier.color }}
                  >
                    {tier.id}
                  </span>
                  {isLocked && <Lock weight="duotone" className="h-3 w-3 text-slate-400" />}
                </div>
                <div className="font-hud mt-0.5 text-sm font-bold text-white">{tier.badge}</div>
              </motion.button>
            );
          })}
        </div>
      </div>

      {overlayRoot ? createPortal(voiceBottomSheet, overlayRoot) : voiceBottomSheet}
      {overlayRoot ? createPortal(detailsBottomSheet, overlayRoot) : detailsBottomSheet}
      {overlayRoot ? createPortal(lockedSheet, overlayRoot) : lockedSheet}
    </div>
  );
}
