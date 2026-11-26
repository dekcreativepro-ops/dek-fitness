import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowsClockwise,
  Calendar,
  Check,
  CheckCircle,
  Clock,
  Crown,
  MapPin,
  Play,
  Plus,
  QrCode,
  ShieldCheck,
  SoccerBall,
  Timer,
  Trophy,
  Users,
  Wallet,
  Warning,
  X,
} from './DekIcons';
import {
  INITIAL_THURSDAY_PLAYERS,
  TOURNAMENT_GROUP_TABLE,
  TOURNAMENT_TOP_SCORERS,
} from '../data/gamesData';
import { INITIAL_SANTE_MATCHES, INITIAL_TOURNAMENT } from '../data/mockData';
import type { SanteMatch, ThursdayFormat, ThursdayPlayer } from '../types/dek';
import { TIER_COLORS } from '../utils/categorization';
import { playGo, playHit, playTick, playVictory } from '../utils/soundFx';

interface SanteViewProps {
  onJoinSante: (matchTitle: string) => void;
  onCompleteThursday: (summaryText: string, mvpName: string) => void;
}

type SanteMainTab = 'jeudi' | 'matchs' | 'tournoi';
type ThursdayPhase = 1 | 2 | 3 | 4;
type PitchTeam = 'A' | 'B' | 'C';

const TEAM_LABELS: Record<PitchTeam, { name: string; color: string }> = {
  A: { name: 'Équipe A • Volt', color: '#C8FF00' },
  B: { name: 'Équipe B • Cyan', color: '#00E5FF' },
  C: { name: 'Équipe C • Orange', color: '#FF8A00' },
};

const FEE_PER_PLAYER = 1500; // FCFA

function formatClock(totalSec: number) {
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function SanteView({ onJoinSante, onCompleteThursday }: SanteViewProps) {
  const [subTab, setSubTab] = useState<SanteMainTab>('jeudi');

  // --- JEUDI LIVE (4 PHASES) ---
  const [phase, setPhase] = useState<ThursdayPhase>(1);
  const [format, setFormat] = useState<ThursdayFormat>('roi_du_terrain');
  const [players, setPlayers] = useState<ThursdayPlayer[]>(
    INITIAL_THURSDAY_PLAYERS.map((p) => ({ ...p })),
  );
  const [absentAlert, setAbsentAlert] = useState<{
    playerName: string;
    team: PitchTeam;
  } | null>(null);

  // Phase 3 Live Match
  const [pitchLeft, setPitchLeft] = useState<PitchTeam>('A');
  const [pitchRight, setPitchRight] = useState<PitchTeam>('B');
  const [queueTeam, setQueueTeam] = useState<PitchTeam>('C');
  const [scoreLeft, setScoreLeft] = useState(1);
  const [scoreRight, setScoreRight] = useState(1);
  const [roundNum, setRoundNum] = useState(1);
  const [winStreak, setWinStreak] = useState<{ team: PitchTeam; count: number }>({
    team: 'A',
    count: 1,
  });
  const [roundHistory, setRoundHistory] = useState<string[]>([]);
  const [clockSec, setClockSec] = useState(8 * 60);
  const [clockRunning, setClockRunning] = useState(false);
  const [scorerPickerSide, setScorerPickerSide] = useState<'left' | 'right' | null>(null);

  // Phase 4 Bilan & MVP
  const [capAValidated, setCapAValidated] = useState(true);
  const [capBValidated, setCapBValidated] = useState(false);
  const [mvpId, setMvpId] = useState<string>('p2');
  const [thursdayPublished, setThursdayPublished] = useState(false);

  // --- MATCHS LA SANTÉ ---
  const [matches, setMatches] = useState<SanteMatch[]>(INITIAL_SANTE_MATCHES);
  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState('');
  const [sport, setSport] = useState<SanteMatch['sport']>('Football 7v7');
  const [location, setLocation] = useState('');
  const [time, setTime] = useState('19h00');
  const [teamA, setTeamA] = useState('Mon Équipe DEK');
  const [teamB, setTeamB] = useState('Équipe Adverse (Ouvert)');

  // Adjust default clock when switching format
  const handleSelectFormat = (next: ThursdayFormat) => {
    setFormat(next);
    setClockRunning(false);
    setClockSec(next === 'roi_du_terrain' ? 8 * 60 : 25 * 60);
    if (next === '2_equipes') {
      setPitchLeft('A');
      setPitchRight('B');
    }
  };

  useEffect(() => {
    if (!clockRunning) return;
    const t = setInterval(() => {
      setClockSec((prev) => {
        if (prev <= 4 && prev > 1) playTick();
        if (prev <= 1) {
          setClockRunning(false);
          playGo();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [clockRunning]);

  const activeTeams: PitchTeam[] = format === 'roi_du_terrain' ? ['A', 'B', 'C'] : ['A', 'B'];
  const activeRoster = useMemo(
    () => players.filter((p) => p.team !== 'waitlist' && activeTeams.includes(p.team)),
    [players, format],
  );
  const waitlistPlayers = useMemo(
    () => players.filter((p) => p.team === 'waitlist'),
    [players],
  );

  const paidCount = activeRoster.filter((p) => p.paid).length;
  const totalCollected = paidCount * FEE_PER_PLAYER;
  const totalExpected = activeRoster.length * FEE_PER_PLAYER;
  const presentCount = activeRoster.filter((p) => p.checkedIn).length;
  const myThursdayPlayer = players.find((p) => p.id === 'p1');

  const togglePaid = (id: string) => {
    playHit();
    setPlayers((prev) => prev.map((p) => (p.id === id ? { ...p, paid: !p.paid } : p)));
  };

  const toggleCheckIn = (id: string, markAbsent = false) => {
    setPlayers((prev) => {
      const target = prev.find((p) => p.id === id);
      if (target && markAbsent && target.team !== 'waitlist') {
        setAbsentAlert({ playerName: target.name, team: target.team });
      }
      return prev.map((p) =>
        p.id === id ? { ...p, checkedIn: markAbsent ? false : !p.checkedIn } : p,
      );
    });
    playHit();
  };

  const promoteWaitlist = (playerId: string, toTeam: PitchTeam) => {
    playGo();
    setPlayers((prev) =>
      prev.map((p) =>
        p.id === playerId ? { ...p, team: toTeam, checkedIn: true } : p,
      ),
    );
    setAbsentAlert(null);
  };

  const handleAutoBalance = () => {
    playHit();
    setPlayers((prev) => {
      const playing = prev.filter((p) => p.team !== 'waitlist');
      const waiting = prev.filter((p) => p.team === 'waitlist');
      const sorted = [...playing].sort((a, b) => a.category.localeCompare(b.category));
      const rebalanced = sorted.map((p, idx) => ({
        ...p,
        team: activeTeams[idx % activeTeams.length],
      }));
      return [...rebalanced, ...waiting];
    });
  };

  const handleScoreGoal = (side: 'left' | 'right', scorerId?: string) => {
    playHit();
    if (side === 'left') setScoreLeft((s) => s + 1);
    else setScoreRight((s) => s + 1);

    if (scorerId) {
      setPlayers((prev) =>
        prev.map((p) => (p.id === scorerId ? { ...p, goals: p.goals + 1 } : p)),
      );
    }
    setScorerPickerSide(null);
  };

  const handleRotateKingOfPitch = () => {
    playGo();
    const winner: PitchTeam = scoreLeft >= scoreRight ? pitchLeft : pitchRight;
    const loser: PitchTeam = winner === pitchLeft ? pitchRight : pitchLeft;

    setRoundHistory((prev) => [
      `Manche #${roundNum} : Éq. ${pitchLeft} ${scoreLeft} - ${scoreRight} Éq. ${pitchRight} (Éq. ${winner} reste)`,
      ...prev,
    ]);

    setWinStreak((prev) =>
      prev.team === winner ? { team: winner, count: prev.count + 1 } : { team: winner, count: 1 },
    );

    setPitchLeft(winner);
    setPitchRight(queueTeam);
    setQueueTeam(loser);
    setScoreLeft(0);
    setScoreRight(0);
    setRoundNum((r) => r + 1);
    setClockRunning(false);
    setClockSec(8 * 60);
  };

  const topScorer = useMemo(() => {
    return [...players].sort((a, b) => b.goals - a.goals)[0];
  }, [players]);

  const handlePublishThursday = () => {
    const mvpName = players.find((p) => p.id === mvpId)?.name ?? 'Koffi_Sprint';
    const headline =
      format === 'roi_du_terrain'
        ? `Terrain du Jeudi (Roi du Terrain • ${roundNum} manches) : Équipe ${winStreak.team} domine (${winStreak.count} victoires de suite). Top buteur : ${topScorer?.name ?? 'Koffi_Sprint'} (${topScorer?.goals ?? 1} buts).`
        : `Terrain du Jeudi (2×25 min) : Éq. ${pitchLeft} ${scoreLeft} - ${scoreRight} Éq. ${pitchRight}. Top buteur : ${topScorer?.name ?? 'Koffi_Sprint'}.`;
    setThursdayPublished(true);
    playVictory();
    onCompleteThursday(headline, mvpName);
  };

  // --- Matchs handlers ---
  const handleToggleJoin = (id: string) => {
    setMatches((prev) =>
      prev.map((m) => {
        if (m.id !== id) return m;
        const joining = !m.isJoined;
        if (joining) onJoinSante(m.title);
        return {
          ...m,
          isJoined: joining,
          playersJoined: joining
            ? Math.min(m.playersMax, m.playersJoined + 1)
            : Math.max(1, m.playersJoined - 1),
        };
      }),
    );
  };

  const handleCreateMatch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !location.trim()) return;
    const maxMap: Record<SanteMatch['sport'], number> = {
      'Football 5v5': 10,
      'Football 7v7': 14,
      'Football 11v11': 22,
      'Basket 3v3': 6,
    };
    const created: SanteMatch = {
      id: 's_' + Date.now(),
      title: title.trim(),
      sport,
      location: location.trim(),
      city: 'À proximité',
      dateLabel: 'Jeudi prochain',
      time,
      teamA: teamA.trim() || 'Équipe A',
      teamB: teamB.trim() || 'Équipe B',
      playersJoined: 1,
      playersMax: maxMap[sport],
      level: 'Compétitif',
      feeLabel: '1 500 F / joueur',
      isJoined: true,
    };
    setMatches((prev) => [created, ...prev]);
    onJoinSante(created.title);
    setTitle('');
    setLocation('');
    setShowCreate(false);
    setSubTab('matchs');
  };

  const overlayRoot =
    typeof document !== 'undefined' ? document.getElementById('dek-overlay-root') : null;

  const createSheet = (
    <AnimatePresence>
      {showCreate && (
        <motion.div
          key="sante-create-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setShowCreate(false)}
          className="pointer-events-auto absolute inset-0 flex flex-col justify-end bg-black/70 backdrop-blur-xs"
        >
          <motion.form
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 360, damping: 32 }}
            onClick={(e) => e.stopPropagation()}
            onSubmit={handleCreateMatch}
            className="space-y-3 rounded-t-3xl border-t border-[#C8FF00]/30 bg-[#121722] p-4 pb-6 shadow-2xl"
          >
            <div className="mx-auto h-1 w-10 rounded-full bg-white/20" />
            <div className="flex items-center justify-between">
              <h3 className="font-hud text-sm font-bold text-[#C8FF00]">
                ORGANISER UNE SANTÉ / TERRAIN
              </h3>
              <button
                type="button"
                onClick={() => setShowCreate(false)}
                className="rounded-xl bg-white/5 p-1.5 text-slate-400"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-2.5">
              <input
                type="text"
                required
                placeholder="Nom du match (ex: Terrain Jeudi 19h)"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-[#0B0E14] px-3 py-2.5 text-xs text-white outline-none focus:border-[#C8FF00]"
              />
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={sport}
                  onChange={(e) => setSport(e.target.value as SanteMatch['sport'])}
                  className="rounded-xl border border-white/10 bg-[#0B0E14] px-2.5 py-2.5 text-xs text-white outline-none"
                >
                  <option value="Football 5v5">Foot 5v5</option>
                  <option value="Football 7v7">Foot 7v7</option>
                  <option value="Football 11v11">Foot 11v11</option>
                  <option value="Basket 3v3">Basket 3v3</option>
                </select>
                <input
                  type="text"
                  placeholder="Heure (ex: 19h00)"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="rounded-xl border border-white/10 bg-[#0B0E14] px-3 py-2.5 text-xs text-white outline-none focus:border-[#C8FF00]"
                />
              </div>
              <input
                type="text"
                required
                placeholder="Terrain / Complexe (ex: Urban Five Cocody)"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-[#0B0E14] px-3 py-2.5 text-xs text-white outline-none focus:border-[#C8FF00]"
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="Ton groupe"
                  value={teamA}
                  onChange={(e) => setTeamA(e.target.value)}
                  className="rounded-xl border border-white/10 bg-[#0B0E14] px-3 py-2.5 text-xs text-white outline-none"
                />
                <input
                  type="text"
                  placeholder="Groupe adverse"
                  value={teamB}
                  onChange={(e) => setTeamB(e.target.value)}
                  className="rounded-xl border border-white/10 bg-[#0B0E14] px-3 py-2.5 text-xs text-white outline-none"
                />
              </div>
            </div>

            <motion.button
              whileTap={{ scale: 0.96 }}
              type="submit"
              className="font-hud w-full rounded-2xl bg-[#C8FF00] py-3 text-xs font-bold text-black"
            >
              PUBLIER LE MATCH SUR DEK
            </motion.button>
          </motion.form>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <div className="space-y-3 pb-2">
      {/* Bannière Tête d'affiche Terrain & Collectif */}
      <div className="overflow-hidden rounded-3xl border border-white/15 bg-[#11151D]">
        <div className="relative h-28 w-full">
          <img
            src="/images/banner-sante.jpg"
            alt="Terrain du Jeudi & La Santé DEK"
            className="h-full w-full object-cover opacity-80"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#11151D] via-[#080A0E]/55 to-transparent" />

          <div className="absolute inset-x-0 bottom-0 flex items-end justify-between p-3.5">
            <div>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-300 backdrop-blur">
                <SoccerBall weight="duotone" className="h-3.5 w-3.5" /> UNIVERS 2 • TERRAINS DU JEUDI
              </span>
              <h2 className="font-hud mt-0.5 text-lg font-bold text-white">
                JEUDI TERRAIN & TOURNOI
              </h2>
            </div>

            <motion.button
              whileTap={{ scale: 0.94 }}
              onClick={() => setShowCreate(true)}
              className="font-hud flex items-center gap-1 rounded-xl bg-[#C8FF00] px-3 py-2 text-[11px] font-bold text-black shadow-lg"
            >
              <Plus weight="bold" className="h-3.5 w-3.5" /> Créer
            </motion.button>
          </div>
        </div>

        {/* 3 Sous-onglets : Jeudi Live | Matchs | Tournoi */}
        <div className="p-3 pt-1">
          <div className="grid grid-cols-3 gap-1 rounded-xl bg-[#0B0E14] p-1">
            {(
              [
                { id: 'jeudi', label: 'Jeudi Live' },
                { id: 'matchs', label: `Matchs (${matches.length})` },
                { id: 'tournoi', label: 'Tournoi' },
              ] as { id: SanteMainTab; label: string }[]
            ).map((t) => {
              const active = subTab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setSubTab(t.id)}
                  className={`font-hud relative rounded-lg py-2 text-[11px] font-bold uppercase transition ${
                    active ? 'text-black' : 'text-slate-400'
                  }`}
                >
                  {active && (
                    <motion.div
                      layoutId="santeSubTab"
                      transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                      className="absolute inset-0 rounded-lg bg-[#C8FF00]"
                    />
                  )}
                  <span className="relative z-10">{t.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ================== ONGLET 1 : JEUDI LIVE (4 PHASES) ================== */}
      {subTab === 'jeudi' && (
        <div className="space-y-3">
          {/* Stepper cliquable 4 Phases */}
          <div className="grid grid-cols-4 gap-1 rounded-2xl border border-white/10 bg-[#11151D] p-1.5">
            {(
              [
                { n: 1, label: '1. Équipes' },
                { n: 2, label: '2. Check-in' },
                { n: 3, label: '3. Live' },
                { n: 4, label: '4. Bilan' },
              ] as { n: ThursdayPhase; label: string }[]
            ).map((st) => {
              const active = phase === st.n;
              const done = phase > st.n;
              return (
                <button
                  key={st.n}
                  onClick={() => setPhase(st.n)}
                  className={`font-hud rounded-xl py-1.5 text-[10px] font-bold transition ${
                    active
                      ? 'bg-[#C8FF00] text-black'
                      : done
                        ? 'bg-emerald-500/15 text-emerald-300'
                        : 'bg-white/5 text-slate-400'
                  }`}
                >
                  {st.label}
                </button>
              );
            })}
          </div>

          {/* PHASE 1 : ÉQUIPES, CAISSE & LISTE D'ATTENTE */}
          {phase === 1 && (
            <div className="space-y-3">
              {/* Format du Jeudi */}
              <div className="rounded-3xl border border-white/10 bg-[#11151D] p-3">
                <div className="mb-2 flex items-center justify-between">
                  <span className="font-hud text-[11px] font-bold text-slate-200">
                    FORMAT DU TERRAIN • JEUDI 19H00
                  </span>
                  <button
                    onClick={handleAutoBalance}
                    className="font-hud flex items-center gap-1 rounded-lg border border-[#00E5FF]/35 bg-[#00E5FF]/10 px-2 py-1 text-[10px] font-bold text-[#00E5FF]"
                  >
                    <ArrowsClockwise weight="duotone" className="h-3 w-3" /> Équilibrer
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    onClick={() => handleSelectFormat('2_equipes')}
                    className={`rounded-2xl border p-2.5 text-left transition ${
                      format === '2_equipes'
                        ? 'border-[#C8FF00] bg-[#C8FF00]/12'
                        : 'border-white/10 bg-[#0B0E14]'
                    }`}
                  >
                    <div className="font-hud text-xs font-bold text-white">2 Équipes</div>
                    <div className="text-[10px] text-slate-400">2 × 25 min • Match complet</div>
                  </button>
                  <button
                    onClick={() => handleSelectFormat('roi_du_terrain')}
                    className={`rounded-2xl border p-2.5 text-left transition ${
                      format === 'roi_du_terrain'
                        ? 'border-[#C8FF00] bg-[#C8FF00]/12'
                        : 'border-white/10 bg-[#0B0E14]'
                    }`}
                  >
                    <div className="font-hud flex items-center gap-1 text-xs font-bold text-white">
                      <Crown weight="duotone" className="h-3.5 w-3.5 text-[#C8FF00]" /> Roi du Terrain
                    </div>
                    <div className="text-[10px] text-slate-400">3 Équipes • Vainqueur reste (8m)</div>
                  </button>
                </div>

                {/* Caisse Cotisation */}
                <div className="mt-2.5 flex items-center justify-between rounded-2xl border border-white/10 bg-[#0B0E14] px-3 py-2">
                  <div className="flex items-center gap-2">
                    <Wallet weight="duotone" className="h-4 w-4 text-[#C8FF00]" />
                    <div>
                      <div className="text-[10px] font-bold text-white">
                        Caisse Terrain ({paidCount}/{activeRoster.length} payés)
                      </div>
                      <div className="text-[9px] text-slate-400">
                        Clique sur un joueur pour valider sa cotisation
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-hud text-xs font-bold text-[#C8FF00]">
                      {totalCollected.toLocaleString('fr-FR')} F
                    </div>
                    <div className="text-[9px] text-slate-400">
                      / {totalExpected.toLocaleString('fr-FR')} F
                    </div>
                  </div>
                </div>
              </div>

              {/* Effectifs par équipe */}
              {activeTeams.map((teamKey) => {
                const members = players.filter((p) => p.team === teamKey);
                return (
                  <div
                    key={teamKey}
                    className="rounded-3xl border border-white/10 bg-[#11151D] p-3"
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <span
                        className="font-hud text-xs font-bold"
                        style={{ color: TEAM_LABELS[teamKey].color }}
                      >
                        {TEAM_LABELS[teamKey].name} ({members.length})
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {members.filter((m) => m.paid).length}/{members.length} cotisé
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      {members.map((p) => (
                        <div
                          key={p.id}
                          className="flex items-center justify-between rounded-xl border border-white/5 bg-[#0B0E14] px-2.5 py-2"
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-white">{p.name}</span>
                            <span
                              className="rounded px-1.5 py-0.5 text-[9px] font-bold"
                              style={{
                                backgroundColor: `${TIER_COLORS[p.category]}22`,
                                color: TIER_COLORS[p.category],
                              }}
                            >
                              {p.category}
                            </span>
                          </div>
                          <button
                            onClick={() => togglePaid(p.id)}
                            className={`font-hud rounded-lg px-2 py-1 text-[10px] font-bold ${
                              p.paid
                                ? 'bg-emerald-500/15 text-emerald-400'
                                : 'bg-amber-500/15 text-amber-300'
                            }`}
                          >
                            {p.paid ? 'Payé ✓' : `${FEE_PER_PLAYER} F`}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}

              {/* Liste d'attente / Remplaçants */}
              <div className="rounded-3xl border border-white/10 bg-[#11151D] p-3">
                <div className="mb-2 flex items-center justify-between">
                  <span className="font-hud text-xs font-bold text-slate-200">
                    Liste d’attente / Remplaçants ({waitlistPlayers.length})
                  </span>
                  <span className="text-[10px] text-slate-400">Anti-désistement</span>
                </div>
                {waitlistPlayers.length === 0 ? (
                  <p className="text-[11px] text-slate-400">
                    Tous les remplaçants ont été promus sur le terrain !
                  </p>
                ) : (
                  <div className="space-y-1.5">
                    {waitlistPlayers.map((p) => (
                      <div
                        key={p.id}
                        className="flex items-center justify-between gap-2 rounded-xl border border-white/5 bg-[#0B0E14] px-2.5 py-2"
                      >
                        <div>
                          <span className="text-xs font-semibold text-white">{p.name}</span>
                          <span className="ml-1.5 text-[10px] text-slate-400">{p.category}</span>
                        </div>
                        <div className="flex gap-1">
                          <button
                            onClick={() => promoteWaitlist(p.id, 'A')}
                            className="font-hud rounded-lg bg-[#C8FF00]/15 px-2 py-1 text-[10px] font-bold text-[#C8FF00]"
                          >
                            + Éq. A
                          </button>
                          <button
                            onClick={() => promoteWaitlist(p.id, 'B')}
                            className="font-hud rounded-lg bg-[#00E5FF]/15 px-2 py-1 text-[10px] font-bold text-[#00E5FF]"
                          >
                            + Éq. B
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <button
                onClick={() => setPhase(2)}
                className="font-hud w-full rounded-full bg-[#C8FF00] py-3 text-xs font-bold text-black"
              >
                Passer au Check-in Terrain (Phase 2) →
              </button>
            </div>
          )}

          {/* PHASE 2 : CHECK-IN TERRAIN (QR / GPS) */}
          {phase === 2 && (
            <div className="space-y-3">
              <div className="rounded-3xl border border-[#C8FF00]/30 bg-[#11151D] p-3.5">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-hud text-[10px] font-bold text-[#C8FF00]">
                      POINTAGE SUR PLACE • TERRAIN COCODY
                    </span>
                    <h3 className="font-hud text-base font-bold text-white">
                      {presentCount} / {activeRoster.length} joueurs présents
                    </h3>
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${
                      myThursdayPlayer?.checkedIn
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : 'bg-amber-500/20 text-amber-300'
                    }`}
                  >
                    {myThursdayPlayer?.checkedIn ? 'Tu es pointé ✓' : 'À pointer'}
                  </span>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      playGo();
                      setPlayers((prev) =>
                        prev.map((p) => (p.id === 'p1' ? { ...p, checkedIn: true } : p)),
                      );
                    }}
                    className="font-hud flex items-center justify-center gap-1.5 rounded-2xl bg-[#C8FF00] py-2.5 text-[11px] font-bold text-black"
                  >
                    <QrCode weight="duotone" className="h-4 w-4" /> Scanner QR Capitaine
                  </button>
                  <button
                    onClick={() => {
                      playGo();
                      setPlayers((prev) =>
                        prev.map((p) => (p.id === 'p1' ? { ...p, checkedIn: true } : p)),
                      );
                    }}
                    className="font-hud flex items-center justify-center gap-1.5 rounded-2xl border border-[#00E5FF]/40 bg-[#00E5FF]/15 py-2.5 text-[11px] font-bold text-[#00E5FF]"
                  >
                    <MapPin weight="duotone" className="h-4 w-4" /> GPS &lt; 100 m
                  </button>
                </div>
              </div>

              {absentAlert && (
                <div className="rounded-2xl border border-[#FF2E54]/45 bg-[#FF2E54]/12 p-3 text-xs">
                  <div className="flex items-center gap-1.5 font-bold text-[#FF2E54]">
                    <Warning weight="duotone" className="h-4 w-4" />
                    {absentAlert.playerName} marqué absent (-5% Discipline)
                  </div>
                  {waitlistPlayers[0] && (
                    <div className="mt-2 flex items-center justify-between gap-2">
                      <span className="text-[11px] text-slate-200">
                        Remplaçant dispo : <strong>{waitlistPlayers[0].name}</strong>
                      </span>
                      <button
                        onClick={() => promoteWaitlist(waitlistPlayers[0].id, absentAlert.team)}
                        className="font-hud rounded-full bg-[#C8FF00] px-3 py-1 text-[10px] font-bold text-black"
                      >
                        Promouvoir en Éq. {absentAlert.team}
                      </button>
                    </div>
                  )}
                </div>
              )}

              <div className="space-y-1.5 rounded-3xl border border-white/10 bg-[#11151D] p-3">
                {activeRoster.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between gap-2 rounded-xl border border-white/5 bg-[#0B0E14] px-2.5 py-2"
                  >
                    <div>
                      <span className="text-xs font-semibold text-white">{p.name}</span>
                      <span className="ml-1.5 text-[10px] text-slate-400">Éq. {p.team}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => toggleCheckIn(p.id, false)}
                        className={`font-hud rounded-lg px-2 py-1 text-[10px] font-bold ${
                          p.checkedIn
                            ? 'bg-emerald-500/15 text-emerald-400'
                            : 'bg-white/10 text-slate-300'
                        }`}
                      >
                        {p.checkedIn ? 'Présent ✓' : 'Pointer'}
                      </button>
                      <button
                        onClick={() => toggleCheckIn(p.id, true)}
                        className="rounded-lg bg-[#FF2E54]/15 px-2 py-1 text-[10px] font-bold text-[#FF2E54]"
                        title="Marquer absent (-5% Discipline)"
                      >
                        Absent
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={() => {
                  playGo();
                  setPhase(3);
                }}
                className="font-hud w-full rounded-full bg-[#C8FF00] py-3 text-xs font-bold text-black"
              >
                Lancer le Match Live (Phase 3) →
              </button>
            </div>
          )}

          {/* PHASE 3 : MATCH LIVE, SCOREBOARD & ROTATION ROI DU TERRAIN */}
          {phase === 3 && (
            <div className="space-y-3">
              {/* Tableau Score & Chrono */}
              <div className="rounded-3xl border border-[#C8FF00]/30 bg-[#11151D] p-4">
                <div className="flex items-center justify-between text-[10px]">
                  <span className="font-hud flex items-center gap-1 font-bold text-[#C8FF00]">
                    <Timer weight="duotone" className="h-3.5 w-3.5" />
                    {format === 'roi_du_terrain'
                      ? `ROI DU TERRAIN • MANCHE #${roundNum}`
                      : 'MATCH 2 × 25 MIN'}
                  </span>
                  {format === 'roi_du_terrain' && (
                    <span className="rounded-full bg-amber-400/15 px-2 py-0.5 font-bold text-amber-300">
                      Série Éq. {winStreak.team} : {winStreak.count}V
                    </span>
                  )}
                </div>

                {/* Chrono */}
                <div className="mt-2 flex items-center justify-center gap-3">
                  <span className="font-hud text-3xl font-black tracking-wider text-white">
                    {formatClock(clockSec)}
                  </span>
                  <button
                    onClick={() => setClockRunning((r) => !r)}
                    className="font-hud flex items-center gap-1 rounded-full bg-[#C8FF00] px-3 py-1.5 text-[11px] font-bold text-black"
                  >
                    <Play weight="duotone" className="h-3.5 w-3.5" />
                    {clockRunning ? 'Pause' : 'Start'}
                  </button>
                  <button
                    onClick={() => {
                      setClockRunning(false);
                      setClockSec(format === 'roi_du_terrain' ? 8 * 60 : 25 * 60);
                    }}
                    className="rounded-full border border-white/15 bg-white/5 p-1.5 text-slate-300"
                    title="Réinitialiser chrono"
                  >
                    <ArrowsClockwise className="h-3.5 w-3.5" />
                  </button>
                </div>

                {/* Scoreboard */}
                <div className="mt-3 grid grid-cols-3 items-center rounded-2xl border border-white/10 bg-[#0B0E14] p-3 text-center">
                  <div>
                    <div
                      className="font-hud text-xs font-bold"
                      style={{ color: TEAM_LABELS[pitchLeft].color }}
                    >
                      Équipe {pitchLeft}
                    </div>
                    <div className="font-hud mt-1 text-4xl font-black text-white">{scoreLeft}</div>
                    <button
                      onClick={() =>
                        setScorerPickerSide((s) => (s === 'left' ? null : 'left'))
                      }
                      className="font-hud mt-1.5 rounded-full bg-[#C8FF00] px-3 py-1 text-[10px] font-bold text-black"
                    >
                      +1 But
                    </button>
                  </div>

                  <div className="font-hud text-sm font-black text-[#FF2E54]">VS</div>

                  <div>
                    <div
                      className="font-hud text-xs font-bold"
                      style={{ color: TEAM_LABELS[pitchRight].color }}
                    >
                      Équipe {pitchRight}
                    </div>
                    <div className="font-hud mt-1 text-4xl font-black text-white">{scoreRight}</div>
                    <button
                      onClick={() =>
                        setScorerPickerSide((s) => (s === 'right' ? null : 'right'))
                      }
                      className="font-hud mt-1.5 rounded-full bg-[#00E5FF] px-3 py-1 text-[10px] font-bold text-black"
                    >
                      +1 But
                    </button>
                  </div>
                </div>

                {/* Sélecteur de buteur instantané */}
                {scorerPickerSide && (
                  <div className="mt-2.5 rounded-2xl border border-[#C8FF00]/35 bg-black/50 p-2.5">
                    <div className="mb-1.5 flex items-center justify-between text-[10px] font-bold text-[#C8FF00]">
                      <span>
                        Qui marque pour Équipe{' '}
                        {scorerPickerSide === 'left' ? pitchLeft : pitchRight} ?
                      </span>
                      <button
                        onClick={() => handleScoreGoal(scorerPickerSide)}
                        className="text-slate-300 underline"
                      >
                        Sans nom
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {players
                        .filter(
                          (p) =>
                            p.team === (scorerPickerSide === 'left' ? pitchLeft : pitchRight),
                        )
                        .map((p) => (
                          <button
                            key={p.id}
                            onClick={() => handleScoreGoal(scorerPickerSide, p.id)}
                            className="rounded-full border border-white/15 bg-white/10 px-2.5 py-1 text-[11px] font-semibold text-white hover:border-[#C8FF00]"
                          >
                            ⚽ {p.name}
                          </button>
                        ))}
                    </div>
                  </div>
                )}

                {/* Rotation Roi du Terrain */}
                {format === 'roi_du_terrain' && (
                  <div className="mt-3 space-y-2 border-t border-white/10 pt-3">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-400">En attente sur le bord :</span>
                      <span
                        className="font-hud font-bold"
                        style={{ color: TEAM_LABELS[queueTeam].color }}
                      >
                        {TEAM_LABELS[queueTeam].name}
                      </span>
                    </div>
                    <button
                      onClick={handleRotateKingOfPitch}
                      className="font-hud flex w-full items-center justify-center gap-1.5 rounded-2xl border border-amber-400/45 bg-amber-400/15 py-2.5 text-xs font-bold text-amber-300"
                    >
                      <Crown weight="duotone" className="h-4 w-4" /> Fin de manche — Vainqueur reste
                    </button>
                  </div>
                )}
              </div>

              {/* Historique des manches & Top Buteurs du soir */}
              {roundHistory.length > 0 && (
                <div className="rounded-2xl border border-white/10 bg-[#11151D] p-3">
                  <div className="font-hud mb-1 text-[10px] font-bold text-slate-400">
                    MANCHES JOUÉES CE SOIR
                  </div>
                  <div className="space-y-1 text-[11px] text-slate-200">
                    {roundHistory.map((h, i) => (
                      <div key={i}>• {h}</div>
                    ))}
                  </div>
                </div>
              )}

              <div className="rounded-2xl border border-white/10 bg-[#11151D] p-3">
                <div className="font-hud mb-1.5 text-[10px] font-bold text-[#C8FF00]">
                  BUTEURS DU SOIR
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {players
                    .filter((p) => p.goals > 0)
                    .sort((a, b) => b.goals - a.goals)
                    .map((p) => (
                      <span
                        key={p.id}
                        className="rounded-full border border-white/10 bg-[#0B0E14] px-2.5 py-1 text-[11px] font-bold text-white"
                      >
                        ⚽ {p.name} ({p.goals})
                      </span>
                    ))}
                </div>
              </div>

              <button
                onClick={() => setPhase(4)}
                className="font-hud w-full rounded-full bg-[#C8FF00] py-3 text-xs font-bold text-black"
              >
                Passer au Bilan & Vote MVP (Phase 4) →
              </button>
            </div>
          )}

          {/* PHASE 4 : DOUBLE VALIDATION CAPITAINES, VOTE MVP & PUBLICATION */}
          {phase === 4 && (
            <div className="space-y-3">
              {/* Double validation Capitaines */}
              <div className="rounded-3xl border border-white/10 bg-[#11151D] p-3.5">
                <div className="font-hud mb-2 flex items-center gap-1.5 text-xs font-bold text-white">
                  <ShieldCheck weight="duotone" className="h-4 w-4 text-[#C8FF00]" />
                  Validation Anti-Litige (2 Capitaines)
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setCapAValidated((v) => !v)}
                    className={`rounded-2xl border p-2.5 text-left text-xs font-bold transition ${
                      capAValidated
                        ? 'border-emerald-400/50 bg-emerald-500/15 text-emerald-300'
                        : 'border-white/10 bg-[#0B0E14] text-slate-400'
                    }`}
                  >
                    {capAValidated ? '✓ ' : '○ '}Capitaine Éq. A
                  </button>
                  <button
                    onClick={() => setCapBValidated((v) => !v)}
                    className={`rounded-2xl border p-2.5 text-left text-xs font-bold transition ${
                      capBValidated
                        ? 'border-emerald-400/50 bg-emerald-500/15 text-emerald-300'
                        : 'border-white/10 bg-[#0B0E14] text-slate-400'
                    }`}
                  >
                    {capBValidated ? '✓ ' : '○ '}Capitaine Éq. B
                  </button>
                </div>
                <p className="mt-2 text-[10px] text-slate-400">
                  {capAValidated && capBValidated
                    ? 'Score certifié par les deux capitaines ! Prêt à publier.'
                    : 'Les deux capitaines doivent cocher pour verrouiller les stats officielles.'}
                </p>
              </div>

              {/* Vote MVP */}
              <div className="rounded-3xl border border-white/10 bg-[#11151D] p-3.5">
                <div className="font-hud mb-2 flex items-center justify-between text-xs font-bold text-white">
                  <span className="flex items-center gap-1.5">
                    <Trophy weight="duotone" className="h-4 w-4 text-[#C8FF00]" /> Vote MVP du Jeudi
                  </span>
                  <span className="text-[10px] text-[#C8FF00]">+50 XP Bonus</span>
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  {activeRoster.slice(0, 6).map((p) => {
                    const selected = mvpId === p.id;
                    return (
                      <button
                        key={p.id}
                        onClick={() => {
                          playHit();
                          setMvpId(p.id);
                        }}
                        className={`rounded-xl border px-2.5 py-2 text-left text-xs font-semibold transition ${
                          selected
                            ? 'border-[#C8FF00] bg-[#C8FF00]/15 text-[#C8FF00]'
                            : 'border-white/10 bg-[#0B0E14] text-slate-200'
                        }`}
                      >
                        <div className="truncate">{p.name}</div>
                        <div className="text-[9px] text-slate-400">
                          {p.goals} but(s) • Éq. {p.team}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Récapitulatif & Clôture */}
              <div className="rounded-3xl border border-[#C8FF00]/30 bg-[#11151D] p-3.5">
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-xl bg-[#0B0E14] p-2">
                    <div className="text-[9px] text-slate-400">Dominant</div>
                    <div className="font-hud text-xs font-bold text-[#C8FF00]">
                      Éq. {format === 'roi_du_terrain' ? winStreak.team : scoreLeft >= scoreRight ? pitchLeft : pitchRight}
                    </div>
                  </div>
                  <div className="rounded-xl bg-[#0B0E14] p-2">
                    <div className="text-[9px] text-slate-400">Top Buteur</div>
                    <div className="font-hud truncate text-xs font-bold text-white">
                      {topScorer?.name}
                    </div>
                  </div>
                  <div className="rounded-xl bg-[#0B0E14] p-2">
                    <div className="text-[9px] text-slate-400">Caisse</div>
                    <div className="font-hud text-xs font-bold text-emerald-400">
                      {totalCollected.toLocaleString('fr-FR')} F
                    </div>
                  </div>
                </div>

                {thursdayPublished ? (
                  <div className="mt-3 flex items-center justify-center gap-1.5 rounded-full border border-emerald-400/40 bg-emerald-500/15 py-3 text-xs font-bold text-emerald-300">
                    <CheckCircle weight="duotone" className="h-4 w-4" />
                    Bilan du Jeudi publié sur le Réseau DEK !
                  </div>
                ) : (
                  <button
                    disabled={!capAValidated || !capBValidated}
                    onClick={handlePublishThursday}
                    className={`font-hud mt-3 w-full rounded-full py-3 text-xs font-bold transition ${
                      capAValidated && capBValidated
                        ? 'bg-[#C8FF00] text-black'
                        : 'cursor-not-allowed bg-white/10 text-slate-400'
                    }`}
                  >
                    Clôturer &amp; Publier sur le Réseau DEK (+150 XP)
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ================== ONGLET 2 : MATCHS LA SANTÉ ================== */}
      {subTab === 'matchs' && (
        <div className="space-y-2.5">
          {matches.map((m) => (
            <div key={m.id} className="rounded-2xl border border-white/10 bg-[#11151D] p-3.5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="rounded-md bg-[#00E5FF]/15 px-2 py-0.5 text-[10px] font-bold text-[#00E5FF]">
                      {m.sport}
                    </span>
                    <span className="rounded-md bg-white/5 px-2 py-0.5 text-[10px] font-semibold text-slate-300">
                      {m.level}
                    </span>
                  </div>
                  <h3 className="font-hud mt-1.5 text-sm font-bold text-white">{m.title}</h3>
                </div>
                <span className="font-hud rounded-lg border border-white/10 bg-[#181E29] px-2 py-1 text-[11px] font-bold text-[#C8FF00]">
                  {m.playersJoined}/{m.playersMax}
                </span>
              </div>

              <div className="mt-2.5 flex items-center justify-between rounded-xl border border-white/5 bg-[#0B0E14] px-3 py-2 text-xs">
                <span className="truncate font-bold text-white">{m.teamA}</span>
                <span className="font-hud px-2 font-bold text-[#FF2E54]">VS</span>
                <span className="truncate text-right font-bold text-slate-200">{m.teamB}</span>
              </div>

              <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-400">
                <span className="flex items-center gap-1">
                  <MapPin weight="duotone" className="h-3.5 w-3.5 text-[#00E5FF]" /> {m.location}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar weight="duotone" className="h-3.5 w-3.5 text-[#C8FF00]" /> {m.dateLabel}
                </span>
                <span className="flex items-center gap-1">
                  <Clock weight="duotone" className="h-3.5 w-3.5 text-[#C8FF00]" /> {m.time}
                </span>
              </div>

              <div className="mt-3 flex items-center justify-between border-t border-white/5 pt-2.5">
                <span className="flex items-center gap-1 text-[10px] text-slate-400">
                  <ShieldCheck weight="duotone" className="h-3.5 w-3.5 text-emerald-400" />
                  {m.feeLabel}
                </span>
                <motion.button
                  whileTap={{ scale: 0.94 }}
                  onClick={() => handleToggleJoin(m.id)}
                  className={`font-hud flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-[11px] font-bold transition ${
                    m.isJoined
                      ? 'border border-[#C8FF00]/40 bg-[#C8FF00]/15 text-[#C8FF00]'
                      : 'bg-[#C8FF00] text-black'
                  }`}
                >
                  {m.isJoined ? (
                    <>
                      <Check weight="bold" className="h-3.5 w-3.5" /> INSCRIT (+50 XP)
                    </>
                  ) : (
                    <>
                      <Users weight="duotone" className="h-3.5 w-3.5" /> REJOINDRE
                    </>
                  )}
                </motion.button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ================== ONGLET 3 : TOURNOI (POULES + BRACKET + BUTEURS) ================== */}
      {subTab === 'tournoi' && (
        <div className="space-y-3">
          {/* Classement Poule A */}
          <div className="rounded-3xl border border-white/10 bg-[#11151D] p-3.5">
            <h3 className="font-hud mb-2 flex items-center gap-1.5 text-xs font-bold text-[#C8FF00]">
              <Trophy weight="duotone" className="h-4 w-4" /> PHASE DE POULES • GROUPE A
            </h3>
            <div className="overflow-hidden rounded-2xl border border-white/5 bg-[#0B0E14]">
              <div className="grid grid-cols-12 border-b border-white/10 px-3 py-1.5 text-[10px] font-bold text-slate-400">
                <span className="col-span-6">Équipe</span>
                <span className="col-span-2 text-center">J</span>
                <span className="col-span-2 text-center">Diff</span>
                <span className="col-span-2 text-right">Pts</span>
              </div>
              {TOURNAMENT_GROUP_TABLE.map((row, idx) => (
                <div
                  key={row.team}
                  className="grid grid-cols-12 items-center border-b border-white/5 px-3 py-2 text-xs last:border-0"
                >
                  <span className="col-span-6 flex items-center gap-1.5 font-semibold text-white">
                    <span
                      className={`font-hud text-[10px] font-bold ${
                        idx < 2 ? 'text-[#C8FF00]' : 'text-slate-500'
                      }`}
                    >
                      #{idx + 1}
                    </span>
                    <span className="truncate">{row.team}</span>
                  </span>
                  <span className="col-span-2 text-center text-slate-400">{row.played}</span>
                  <span className="col-span-2 text-center text-slate-300">{row.diff}</span>
                  <span className="font-hud col-span-2 text-right font-bold text-[#C8FF00]">
                    {row.pts}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Bracket Élimination Directe */}
          <div className="space-y-3 rounded-3xl border border-white/10 bg-[#11151D] p-3.5">
            <div className="flex items-center justify-between gap-2">
              <div>
                <h3 className="font-hud flex items-center gap-1.5 text-sm font-bold text-white">
                  <Trophy weight="duotone" className="h-4 w-4 text-[#C8FF00]" /> COUPE DEK • TABLEAU FINAL
                </h3>
                <p className="text-[11px] text-slate-400">
                  Glisse horizontalement pour voir Quarts → Finale →
                </p>
              </div>
              <span className="rounded-full bg-[#FF2E54]/15 px-2 py-0.5 text-[10px] font-bold text-[#FF2E54]">
                LIVE
              </span>
            </div>

            <div className="no-scrollbar flex snap-x snap-mandatory gap-3 overflow-x-auto pb-1">
              {(['Quarts', 'Demies', 'Finale'] as const).map((round) => (
                <div
                  key={round}
                  className="w-[84%] shrink-0 snap-center space-y-2 rounded-2xl border border-white/5 bg-[#0B0E14] p-3"
                >
                  <div className="font-hud text-xs font-bold uppercase tracking-wider text-[#00E5FF]">
                    {round}
                  </div>
                  {INITIAL_TOURNAMENT.filter((t) => t.round === round).map((tm) => (
                    <div
                      key={tm.id}
                      className={`rounded-xl border p-2.5 ${
                        tm.status === 'en_cours'
                          ? 'border-[#C8FF00]/50 bg-[#C8FF00]/10'
                          : 'border-white/10 bg-[#181E29]'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[10px] uppercase text-slate-400">
                        <span>{tm.round}</span>
                        <span
                          className={
                            tm.status === 'en_cours'
                              ? 'font-bold text-[#C8FF00]'
                              : tm.status === 'termine'
                                ? 'text-emerald-400'
                                : 'text-slate-500'
                          }
                        >
                          {tm.status === 'en_cours'
                            ? '● LIVE'
                            : tm.status === 'termine'
                              ? 'Terminé'
                              : 'À venir'}
                        </span>
                      </div>
                      <div className="mt-1.5 space-y-1 text-xs font-semibold">
                        <div className="flex justify-between text-white">
                          <span>{tm.teamA}</span>
                          <span className="font-hud font-bold text-[#C8FF00]">
                            {tm.scoreA ?? '-'}
                          </span>
                        </div>
                        <div className="flex justify-between text-slate-300">
                          <span>{tm.teamB}</span>
                          <span className="font-hud font-bold text-white">
                            {tm.scoreB ?? '-'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* Classement Top Buteurs */}
          <div className="rounded-3xl border border-white/10 bg-[#11151D] p-3.5">
            <h3 className="font-hud mb-2 flex items-center gap-1.5 text-xs font-bold text-white">
              <Crown weight="duotone" className="h-4 w-4 text-amber-400" /> TOP BUTEURS DU TOURNOI
            </h3>
            <div className="space-y-1.5">
              {TOURNAMENT_TOP_SCORERS.map((s, idx) => (
                <div
                  key={s.name}
                  className="flex items-center justify-between rounded-xl bg-[#0B0E14] px-3 py-2 text-xs"
                >
                  <div>
                    <span className="font-hud mr-2 font-bold text-[#C8FF00]">#{idx + 1}</span>
                    <span className="font-semibold text-white">{s.name}</span>
                    <span className="ml-1.5 text-[10px] text-slate-400">({s.team})</span>
                  </div>
                  <span className="font-hud font-bold text-[#00E5FF]">{s.goals} buts</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {overlayRoot ? createPortal(createSheet, overlayRoot) : createSheet}
    </div>
  );
}
