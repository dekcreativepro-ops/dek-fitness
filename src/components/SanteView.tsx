import { useEffect, useMemo, useState } from 'react';
import { ArrowsClockwise, Calendar, Check, CheckCircle, Clock, MapPin, Play, Plus, QrCode, Warning } from './DekIcons';
import { BottomSheet, Button, Card, ChipTabs, IconButton, StatTiles } from './ui/kit';
import { INITIAL_THURSDAY_PLAYERS } from '../data/gamesData';
import { INITIAL_SANTE_MATCHES } from '../data/mockData';
import type { SanteMatch, ThursdayFormat, ThursdayPlayer } from '../types/dek';
import { getTierIndex, TIER_COLORS } from '../utils/categorization';
import { usePhoto } from '../utils/usePhoto';
import { playGo, playHit, playTick, playVictory } from '../utils/soundFx';
import { LEVEL_COLORS, levelFromScore } from '../utils/gameFx';
import { SPORTS, SPORT_GROUPS, sportMeta, type SportGroup } from '../data/sports';
import { getTournament } from '../data/tournaments';
import { Slot3D } from './ui/Slot3D';
import { ImagePicker } from './ui/ImagePicker';
import { Bike, Dumbbell, HandBall, Music, Sword, Swim, Timer, Trophy, Volley, Yoga } from './DekIcons';

interface SanteViewProps {
  onJoinSante: (matchTitle: string) => void;
  onCompleteThursday: (summaryText: string, mvpName: string) => boolean;
}

type SanteMainTab = 'jeudi' | 'matchs' | 'tournoi';
type ThursdayPhase = 1 | 2 | 3 | 4;
type PitchTeam = 'A' | 'B' | 'C';

const TEAM_LABELS: Record<PitchTeam, { name: string; tone: string }> = {
  A: { name: 'Équipe A · Volt', tone: 'text-lime' },
  B: { name: 'Équipe B · Cyan', tone: 'text-aqua' },
  C: { name: 'Équipe C · Orange', tone: 'text-ember' },
};

const FIELD =
  'h-12 w-full rounded-2xl bg-tile px-4 text-[14px] font-medium text-fg outline-none placeholder:text-faint focus:ring-1 focus:ring-lime';

/** Avatar rond à initiales (effectifs, buteurs). */
function Initials({ name }: { name: string }) {
  const letters = name
    .replace(/[^A-Za-zÀ-ÿ0-9_ ]/g, '')
    .split(/[_ ]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');
  return (
    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-tile text-[15px] font-bold text-fg">
      {letters}
    </span>
  );
}

const FEE_PER_PLAYER = 1500; // FCFA

function formatClock(totalSec: number) {
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

/** Photo d'un match : basket ou football (le hook vit ici pour pouvoir servir dans une liste). */
const GROUP_ICON: Record<SportGroup, React.ReactNode> = {
  Foot: null,
  Basket: null,
  Volley: <Volley />,
  Hand: <HandBall />,
  Padel: <Trophy />,
  Natation: <Swim />,
  Combat: <Sword />,
  Danse: <Music />,
  Cardio: <Timer />,
  Vélo: <Bike />,
  Street: <Dumbbell />,
  'Bien-être': <Yoga />,
};

function SportBanner({ sport }: { sport: SanteMatch['sport'] }) {
  const meta = sportMeta(sport);
  if (meta.group === 'Foot' || meta.group === 'Basket') return <SportPhoto basket={meta.group === 'Basket'} />;
  return (
    <div className="relative h-full w-full">
      <Slot3D name={`sport-${meta.slug}`} icon={GROUP_ICON[meta.group]} className="h-full w-full" rounded="rounded-none" />
      <span className="absolute bottom-2 left-3 rounded-full bg-black/55 px-3 py-1 text-[12px] font-bold text-lime">{meta.label}</span>
    </div>
  );
}

function SportPhoto({ basket }: { basket: boolean }) {
  const src = usePhoto(basket ? 'basket' : 'matchfoot', 'wide');
  return <img src={src} alt="" loading="lazy" draggable={false} className="h-full w-full select-none object-cover" />;
}

/** Légende d'un match : difficulté selon le niveau et la taille du terrain, description courte. */
function matchInfo(m: SanteMatch) {
  const meta = sportMeta(m.sport);
  const base = m.level === 'Intensif' ? 6 : m.level === 'Compétitif' ? 4 : 2;
  const score = base + meta.intensity;
  const level = levelFromScore(score, [2.5, 4.5, 6.5]);
  const left = Math.max(0, m.playersMax - m.playersJoined);
  const street = meta.group === 'Street' ? ' Rue partagée : reste sur les zones piétonnes, gilet fluo conseillé, jamais sur la chaussée.' : '';
  const description = `${m.sport} ${m.level.toLowerCase()} · ${m.playersMax} ${meta.unit} · ${meta.place} · ${left > 0 ? `${left} place${left > 1 ? 's' : ''} restante${left > 1 ? 's' : ''}` : 'complet'}.${street}`;
  return { level, description };
}

export function SanteView({ onJoinSante, onCompleteThursday }: SanteViewProps) {
  const bannerPhoto = usePhoto('football', 'wide');
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
  const [sportGroup, setSportGroup] = useState<'Tous' | SportGroup>('Tous');
  const [matchImage, setMatchImage] = useState<string | null>(null);
  const [tourGroup, setTourGroup] = useState<SportGroup>('Foot');
  const tournament = getTournament(tourGroup);
  const [location, setLocation] = useState('');
  const [time, setTime] = useState('19h00');
  const [matchDay, setMatchDay] = useState('Ce soir');
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

  const activeTeams: PitchTeam[] = useMemo(
    () => (format === 'roi_du_terrain' ? ['A', 'B', 'C'] : ['A', 'B']),
    [format],
  );
  const activeRoster = useMemo(
    () => players.filter((p) => p.team !== 'waitlist' && activeTeams.includes(p.team)),
    [players, activeTeams],
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
    const target = players.find((p) => p.id === id);
    if (target && markAbsent && target.team !== 'waitlist') {
      setAbsentAlert({ playerName: target.name, team: target.team });
    }
    setPlayers((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, checkedIn: markAbsent ? false : !p.checkedIn } : p,
      ),
    );
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
      // Tri du plus fort au plus faible (ordre des paliers, pas alphabétique),
      // puis répartition en « serpent » A-B-C-C-B-A pour des équipes équilibrées.
      const sorted = [...playing].sort(
        (a, b) => getTierIndex(b.category) - getTierIndex(a.category),
      );
      const n = activeTeams.length;
      const rebalanced = sorted.map((p, idx) => {
        const round = Math.floor(idx / n);
        const pos = idx % n;
        return { ...p, team: activeTeams[round % 2 === 0 ? pos : n - 1 - pos] };
      });
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
    const mvpName = players.find((p) => p.id === mvpId)?.name ?? 'Ngando_Sprint';
    const headline =
      format === 'roi_du_terrain'
        ? `Match (Roi du Terrain • ${roundNum} manches) : Équipe ${winStreak.team} domine (${winStreak.count} victoires de suite). Top buteur : ${topScorer?.name ?? 'Ngando_Sprint'} (${topScorer?.goals ?? 1} buts).`
        : `Match (2×25 min) : Éq. ${pitchLeft} ${scoreLeft} - ${scoreRight} Éq. ${pitchRight}. Top buteur : ${topScorer?.name ?? 'Ngando_Sprint'}.`;
    setThursdayPublished(true);
    if (onCompleteThursday(headline, mvpName)) playVictory();
  };

  // --- Matchs handlers ---
  const handleToggleJoin = (id: string) => {
    const match = matches.find((m) => m.id === id);
    if (!match) return;
    // Effet de bord hors de l'updater (sinon double XP en mode StrictMode)
    if (!match.isJoined) onJoinSante(match.title);
    setMatches((prev) =>
      prev.map((m) => {
        if (m.id !== id) return m;
        const joining = !m.isJoined;
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
    const created: SanteMatch = {
      id: 's_' + Date.now(),
      title: title.trim(),
      sport,
      location: location.trim(),
      city: 'À proximité',
      dateLabel: matchDay,
      time,
      teamA: teamA.trim() || 'Équipe A',
      teamB: teamB.trim() || 'Équipe B',
      playersJoined: 1,
      playersMax: sportMeta(sport).max,
      level: 'Compétitif',
      feeLabel: '1 500 F / joueur',
      isJoined: true,
      image: matchImage ?? undefined,
    };
    setMatches((prev) => [created, ...prev]);
    onJoinSante(created.title);
    setMatchImage(null);
    setTitle('');
    setLocation('');
    setShowCreate(false);
    setSubTab('matchs');
  };

  const checkInMe = () => {
    playGo();
    setPlayers((prev) => prev.map((p) => (p.id === 'p1' ? { ...p, checkedIn: true } : p)));
  };

  const createSheet = (
    <BottomSheet open={showCreate} onClose={() => setShowCreate(false)} title="Organiser une Santé / Terrain">
      <form onSubmit={handleCreateMatch} className="space-y-3">
        <input
          type="text"
          required
          placeholder="Nom du match (ex: Terrain du soir 19h)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className={FIELD}
        />
        <div className="space-y-2">
          <div className="text-[12px] font-medium text-mute">Image du match ou du tournoi (facultatif)</div>
          {matchImage && <img src={matchImage} alt="Aperçu de l'image du match" className="h-32 w-full rounded-[18px] object-cover" />}
          <div className="flex gap-2">
            <ImagePicker
              onPick={setMatchImage}
              maxWidth={1000}
              className="flex h-10 flex-1 items-center justify-center gap-2 rounded-full bg-tile px-4 text-[13px] font-semibold text-fg transition active:scale-95"
            >
              {matchImage ? 'Changer l’image' : 'Choisir une image'}
            </ImagePicker>
            {matchImage && (
              <button type="button" onClick={() => setMatchImage(null)} className="h-10 rounded-full bg-tile px-4 text-[13px] font-semibold text-mute transition active:scale-95">
                Retirer
              </button>
            )}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <select
            value={sport}
            onChange={(e) => setSport(e.target.value as SanteMatch['sport'])}
            className={FIELD}
          >
            {SPORTS.map((sp) => (
              <option key={sp.id} value={sp.id}>
                {sp.label}
              </option>
            ))}
          </select>
          <select value={matchDay} onChange={(e) => setMatchDay(e.target.value)} className={FIELD} aria-label="Jour du match">
            {['Ce soir', 'Demain', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'].map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
          <input
            type="text"
            placeholder="Heure (ex: 19h00)"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className={FIELD}
          />
        </div>
        <input
          type="text"
          required
          placeholder="Terrain / Complexe (ex: Urban Five Akwa)"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          className={FIELD}
        />
        <div className="grid grid-cols-2 gap-2">
          <input type="text" placeholder="Ton groupe" value={teamA} onChange={(e) => setTeamA(e.target.value)} className={FIELD} />
          <input type="text" placeholder="Groupe adverse" value={teamB} onChange={(e) => setTeamB(e.target.value)} className={FIELD} />
        </div>
        <Button type="submit" fullWidth>
          Publier le match sur DEK
        </Button>
      </form>
    </BottomSheet>
  );

  const goalTargetTeam = scorerPickerSide === 'left' ? pitchLeft : pitchRight;

  return (
    <div className="space-y-5 pb-2">
      {/* Bandeau photo sobre */}
      <div className="relative h-36 overflow-hidden rounded-[24px]">
        <img
          src={bannerPhoto}
          alt="Terrains collectifs & La Santé DEK"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />
        <div className="absolute inset-x-4 bottom-4 flex items-end justify-between gap-3">
          <div>
            <div className="text-[12px] font-medium text-white/80">Matchs & terrains</div>
            <h2 className="text-[22px] font-bold leading-7 text-white">Terrains &amp; Tournoi</h2>
          </div>
          <Button size="md" onClick={() => setShowCreate(true)}>
            <span className="flex items-center gap-1.5">
              <Plus weight="bold" className="h-4 w-4" /> Créer
            </span>
          </Button>
        </div>
      </div>

      <ChipTabs
        items={[
          { id: 'jeudi', label: 'Match live' },
          { id: 'matchs', label: `Matchs (${matches.length})` },
          { id: 'tournoi', label: 'Tournoi' },
        ]}
        value={subTab}
        onChange={setSubTab}
        layoutId="santeSubTab"
      />

      {/* ================== ONGLET 1 : JEUDI LIVE (4 PHASES) ================== */}
      {subTab === 'jeudi' && (
        <div className="space-y-4">
          {/* Stepper 4 phases : pastilles numérotées + trait */}
          <div className="relative grid grid-cols-4">
            <div className="absolute left-[12.5%] right-[12.5%] top-4 h-px bg-rim" />
            {(
              [
                { n: 1, label: 'Équipes' },
                { n: 2, label: 'Check-in' },
                { n: 3, label: 'Live' },
                { n: 4, label: 'Bilan' },
              ] as { n: ThursdayPhase; label: string }[]
            ).map((st) => {
              const active = phase === st.n;
              const done = phase > st.n;
              return (
                <button
                  key={st.n}
                  onClick={() => setPhase(st.n)}
                  aria-current={active ? 'step' : undefined}
                  className="relative flex flex-col items-center gap-1.5"
                >
                  <span
                    className={`num flex h-8 w-8 items-center justify-center rounded-full text-[13px] font-bold ${
                      active ? 'bg-lime text-on-lime' : done ? 'bg-tile text-lime' : 'bg-tile text-mute'
                    }`}
                  >
                    {done ? <Check weight="bold" className="h-4 w-4" /> : st.n}
                  </span>
                  <span className={`text-[12px] font-semibold ${active ? 'text-fg' : 'text-mute'}`}>{st.label}</span>
                </button>
              );
            })}
          </div>

          {/* PHASE 1 : ÉQUIPES, CAISSE & LISTE D'ATTENTE */}
          {phase === 1 && (
            <div className="space-y-4">
              <Card>
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-[16px] font-bold leading-[22px] text-fg">Format · soirée 19h00</h3>
                  <button
                    onClick={handleAutoBalance}
                    className="flex h-8 items-center gap-1.5 rounded-full bg-tile px-3 text-[12px] font-semibold text-fg"
                  >
                    <ArrowsClockwise className="h-3.5 w-3.5" /> Équilibrer
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {(
                    [
                      { id: '2_equipes', name: '2 Équipes', sub: '2 × 25 min · Match complet' },
                      { id: 'roi_du_terrain', name: 'Roi du Terrain', sub: '3 Équipes · Vainqueur reste (8m)' },
                    ] as { id: ThursdayFormat; name: string; sub: string }[]
                  ).map((f) => (
                    <button
                      key={f.id}
                      onClick={() => handleSelectFormat(f.id)}
                      className={`rounded-[20px] p-3 text-left ring-1 transition ${
                        format === f.id ? 'bg-tile ring-lime' : 'bg-tile ring-transparent'
                      }`}
                    >
                      <div className={`text-[14px] font-bold ${format === f.id ? 'text-lime' : 'text-fg'}`}>{f.name}</div>
                      <div className="mt-0.5 text-[12px] font-medium text-mute">{f.sub}</div>
                    </button>
                  ))}
                </div>

                {/* Caisse */}
                <StatTiles
                  className="mt-5"
                  items={[
                    { label: 'Payés', value: `${paidCount}/${activeRoster.length}` },
                    { label: 'Collecté', value: totalCollected.toLocaleString('fr-FR'), unit: 'F' },
                    { label: 'Attendu', value: totalExpected.toLocaleString('fr-FR'), unit: 'F' },
                  ]}
                />
                <p className="mt-3 text-center text-[12px] font-medium text-mute">
                  Touche le statut d’un joueur pour valider sa cotisation
                </p>
              </Card>

              {/* Effectifs par équipe */}
              {activeTeams.map((teamKey) => {
                const members = players.filter((p) => p.team === teamKey);
                return (
                  <div key={teamKey} className="space-y-2">
                    <div className="flex items-baseline justify-between px-1">
                      <h3 className={`text-[16px] font-bold leading-[22px] ${TEAM_LABELS[teamKey].tone}`}>
                        {TEAM_LABELS[teamKey].name} <span className="num text-mute">({members.length})</span>
                      </h3>
                      <span className="text-[12px] font-medium text-mute">
                        <span className="num">{members.filter((m) => m.paid).length}/{members.length}</span> cotisé
                      </span>
                    </div>
                    {members.map((p) => (
                      <div key={p.id} className="flex items-center gap-3 rounded-[24px] bg-card p-3">
                        <Initials name={p.name} />
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-[15px] font-bold leading-5 text-fg">{p.name}</div>
                          <span
                            className="inline-block rounded-full bg-tile px-2 py-px text-[11px] font-semibold"
                            style={{ color: TIER_COLORS[p.category] }}
                          >
                            {p.category}
                          </span>
                        </div>
                        <button
                          onClick={() => togglePaid(p.id)}
                          className={`num h-9 shrink-0 rounded-full px-3 text-[13px] font-semibold ${
                            p.paid ? 'text-lime' : 'text-mute'
                          }`}
                        >
                          {p.paid ? 'Payé' : `À régler · ${FEE_PER_PLAYER} F`}
                        </button>
                      </div>
                    ))}
                  </div>
                );
              })}

              {/* Liste d'attente / Remplaçants */}
              <div className="space-y-2">
                <div className="flex items-baseline justify-between px-1">
                  <h3 className="text-[16px] font-bold leading-[22px] text-fg">
                    Liste d’attente / Remplaçants <span className="num text-mute">({waitlistPlayers.length})</span>
                  </h3>
                  <span className="text-[12px] font-medium text-mute">Anti-désistement</span>
                </div>
                {waitlistPlayers.length === 0 ? (
                  <p className="px-1 text-[13px] font-medium text-mute">
                    Tous les remplaçants ont été promus sur le terrain !
                  </p>
                ) : (
                  waitlistPlayers.map((p) => (
                    <div key={p.id} className="flex items-center gap-3 rounded-[24px] bg-card p-3">
                      <Initials name={p.name} />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-[15px] font-bold leading-5 text-fg">{p.name}</div>
                        <div className="text-[12px] font-medium text-mute">{p.category}</div>
                      </div>
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => promoteWaitlist(p.id, 'A')}
                          className="h-9 rounded-full bg-tile px-3 text-[12px] font-semibold text-fg"
                        >
                          + Éq. A
                        </button>
                        <button
                          onClick={() => promoteWaitlist(p.id, 'B')}
                          className="h-9 rounded-full bg-tile px-3 text-[12px] font-semibold text-fg"
                        >
                          + Éq. B
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <Button fullWidth trailingArrow onClick={() => setPhase(2)}>
                Passer au check-in terrain
              </Button>
            </div>
          )}

          {/* PHASE 2 : CHECK-IN TERRAIN (QR / GPS) */}
          {phase === 2 && (
            <div className="space-y-4">
              <Card>
                <div className="text-[12px] font-medium text-mute">Pointage sur place · Terrain Akwa</div>
                <div className="mt-1 flex items-end justify-between gap-2">
                  <div className="num text-[40px] font-extrabold leading-none text-fg">
                    {presentCount}
                    <span className="text-[22px] font-bold text-faint"> / {activeRoster.length}</span>
                  </div>
                  <span className={`text-[13px] font-semibold ${myThursdayPlayer?.checkedIn ? 'text-lime' : 'text-mute'}`}>
                    {myThursdayPlayer?.checkedIn ? 'Tu es pointé' : 'À pointer'}
                  </span>
                </div>
                <div className="mt-1 text-[13px] font-medium text-mute">joueurs présents</div>

                <div className="mt-4 grid grid-cols-2 gap-2">
                  <Button size="md" onClick={checkInMe}>
                    <span className="flex items-center gap-1.5">
                      <QrCode className="h-4 w-4" /> Scanner QR
                    </span>
                  </Button>
                  <Button variant="secondary" size="md" onClick={checkInMe}>
                    <span className="flex items-center gap-1.5">
                      <MapPin className="h-4 w-4" /> GPS &lt; 100 m
                    </span>
                  </Button>
                </div>
              </Card>

              {absentAlert && (
                <Card className="!p-4">
                  <div className="flex items-center gap-2 text-[14px] font-bold text-danger">
                    <Warning className="h-4 w-4 shrink-0" />
                    {absentAlert.playerName} marqué absent (-5% Discipline)
                  </div>
                  {waitlistPlayers[0] && (
                    <div className="mt-3 flex items-center justify-between gap-2">
                      <span className="text-[13px] font-medium text-mute">
                        Remplaçant dispo : <span className="font-bold text-fg">{waitlistPlayers[0].name}</span>
                      </span>
                      <Button
                        size="md"
                        onClick={() => promoteWaitlist(waitlistPlayers[0].id, absentAlert.team)}
                      >
                        Promouvoir en Éq. {absentAlert.team}
                      </Button>
                    </div>
                  )}
                </Card>
              )}

              <div className="space-y-2">
                {activeRoster.map((p) => (
                  <div key={p.id} className="flex items-center gap-3 rounded-[24px] bg-card p-3">
                    <Initials name={p.name} />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[15px] font-bold leading-5 text-fg">{p.name}</div>
                      <div className="text-[12px] font-medium text-mute">Éq. {p.team}</div>
                    </div>
                    <button
                      onClick={() => toggleCheckIn(p.id, false)}
                      className={`h-9 rounded-full px-3 text-[13px] font-semibold ${
                        p.checkedIn ? 'bg-lime text-on-lime' : 'bg-tile text-fg'
                      }`}
                    >
                      {p.checkedIn ? 'Présent' : 'Pointer'}
                    </button>
                    <button
                      onClick={() => toggleCheckIn(p.id, true)}
                      className="h-9 rounded-full px-2 text-[13px] font-semibold text-danger"
                      title="Marquer absent (-5% Discipline)"
                    >
                      Absent
                    </button>
                  </div>
                ))}
              </div>

              <Button
                fullWidth
                trailingArrow
                onClick={() => {
                  playGo();
                  setPhase(3);
                }}
              >
                Lancer le match live
              </Button>
            </div>
          )}

          {/* PHASE 3 : MATCH LIVE, SCOREBOARD & ROTATION ROI DU TERRAIN */}
          {phase === 3 && (
            <div className="space-y-4">
              <Card>
                <div className="flex items-center justify-between gap-2 text-[13px] font-medium text-mute">
                  <span>
                    {format === 'roi_du_terrain' ? (
                      <>
                        Roi du Terrain · Manche <span className="num">#{roundNum}</span>
                      </>
                    ) : (
                      'Match 2 × 25 min'
                    )}
                  </span>
                  {format === 'roi_du_terrain' && (
                    <span className="num font-semibold text-fg">
                      Série Éq. {winStreak.team} : {winStreak.count}V
                    </span>
                  )}
                </div>

                {/* Chrono */}
                <div className="mt-3 flex items-center justify-center gap-4">
                  <span className="num text-[40px] font-extrabold leading-none text-fg">{formatClock(clockSec)}</span>
                  <Button size="md" onClick={() => setClockRunning((r) => !r)}>
                    <span className="flex items-center gap-1.5">
                      <Play className="h-4 w-4" />
                      {clockRunning ? 'Pause' : 'Start'}
                    </span>
                  </Button>
                  <IconButton
                    label="Réinitialiser le chrono"
                    onClick={() => {
                      setClockRunning(false);
                      setClockSec(format === 'roi_du_terrain' ? 8 * 60 : 25 * 60);
                    }}
                  >
                    <ArrowsClockwise className="h-5 w-5" />
                  </IconButton>
                </div>

                {/* Tableau de score */}
                <div className="mt-5 grid grid-cols-2 gap-3">
                  {(
                    [
                      { side: 'left', team: pitchLeft, score: scoreLeft },
                      { side: 'right', team: pitchRight, score: scoreRight },
                    ] as const
                  ).map((c) => (
                    <div key={c.side} className="flex flex-col items-center rounded-[20px] bg-tile p-4">
                      <div className={`text-[13px] font-semibold ${TEAM_LABELS[c.team].tone}`}>Équipe {c.team}</div>
                      <div className="num mt-1 text-[64px] font-extrabold leading-none text-fg">{c.score}</div>
                      <Button
                        variant="secondary"
                        size="md"
                        className="mt-3 !bg-card"
                        onClick={() => setScorerPickerSide((s) => (s === c.side ? null : c.side))}
                      >
                        +1 but
                      </Button>
                    </div>
                  ))}
                </div>

                {/* Sélecteur de buteur */}
                {scorerPickerSide && (
                  <div className="mt-3 rounded-[20px] bg-tile p-4">
                    <div className="mb-3 flex items-center justify-between text-[13px] font-semibold text-fg">
                      <span>Qui marque pour Équipe {goalTargetTeam} ?</span>
                      <button onClick={() => handleScoreGoal(scorerPickerSide)} className="text-mute underline">
                        Sans nom
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {players
                        .filter((p) => p.team === goalTargetTeam)
                        .map((p) => (
                          <button
                            key={p.id}
                            onClick={() => handleScoreGoal(scorerPickerSide, p.id)}
                            className="h-9 rounded-full bg-card px-3 text-[13px] font-semibold text-fg"
                          >
                            {p.name}
                          </button>
                        ))}
                    </div>
                  </div>
                )}
              </Card>

              {/* Rotation Roi du Terrain */}
              {format === 'roi_du_terrain' && (
                <Card>
                  <div className="flex items-center justify-between text-[13px]">
                    <span className="font-medium text-mute">En attente sur le bord</span>
                    <span className={`font-bold ${TEAM_LABELS[queueTeam].tone}`}>{TEAM_LABELS[queueTeam].name}</span>
                  </div>
                  <Button className="mt-3" fullWidth variant="secondary" onClick={handleRotateKingOfPitch}>
                    Fin de manche · Vainqueur reste
                  </Button>
                </Card>
              )}

              {roundHistory.length > 0 && (
                <Card>
                  <h3 className="text-[16px] font-bold leading-[22px] text-fg">Manches jouées ce soir</h3>
                  <div className="mt-2 space-y-1.5 text-[13px] font-medium text-mute">
                    {roundHistory.map((h, i) => (
                      <div key={i}>{h}</div>
                    ))}
                  </div>
                </Card>
              )}

              <Card>
                <h3 className="text-[16px] font-bold leading-[22px] text-fg">Buteurs du soir</h3>
                <div className="mt-3 flex flex-wrap gap-2">
                  {players
                    .filter((p) => p.goals > 0)
                    .sort((a, b) => b.goals - a.goals)
                    .map((p) => (
                      <span key={p.id} className="rounded-full bg-tile px-3 py-1.5 text-[13px] font-semibold text-fg">
                        {p.name} <span className="num text-lime">{p.goals}</span>
                      </span>
                    ))}
                </div>
              </Card>

              <Button fullWidth trailingArrow onClick={() => setPhase(4)}>
                Passer au bilan &amp; vote MVP
              </Button>
            </div>
          )}

          {/* PHASE 4 : DOUBLE VALIDATION CAPITAINES, VOTE MVP & PUBLICATION */}
          {phase === 4 && (
            <div className="space-y-4">
              <Card>
                <h3 className="text-[16px] font-bold leading-[22px] text-fg">Validation anti-litige (2 capitaines)</h3>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  {(
                    [
                      { label: 'Capitaine Éq. A', on: capAValidated, toggle: () => setCapAValidated((v) => !v) },
                      { label: 'Capitaine Éq. B', on: capBValidated, toggle: () => setCapBValidated((v) => !v) },
                    ] as const
                  ).map((c) => (
                    <button
                      key={c.label}
                      onClick={c.toggle}
                      aria-pressed={c.on}
                      className={`flex h-11 items-center justify-center gap-1.5 rounded-full text-[13px] font-semibold ${
                        c.on ? 'bg-lime text-on-lime' : 'bg-tile text-mute'
                      }`}
                    >
                      {c.on && <Check weight="bold" className="h-4 w-4" />}
                      {c.label}
                    </button>
                  ))}
                </div>
                <p className="mt-3 text-[12px] font-medium text-mute">
                  {capAValidated && capBValidated
                    ? 'Score certifié par les deux capitaines ! Prêt à publier.'
                    : 'Les deux capitaines doivent valider pour verrouiller les stats officielles.'}
                </p>
              </Card>

              {/* Vote MVP */}
              <Card>
                <img src="/images/3d/terrain-mvp.jpg" alt="" loading="lazy" className="mb-3 h-28 w-full rounded-[18px] object-cover" />
                <div className="mb-3 flex items-baseline justify-between">
                  <h3 className="text-[16px] font-bold leading-[22px] text-fg">Vote MVP du match</h3>
                  <span className="text-[12px] font-semibold text-lime">+50 XP bonus</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {activeRoster.slice(0, 6).map((p) => {
                    const selected = mvpId === p.id;
                    return (
                      <button
                        key={p.id}
                        onClick={() => {
                          playHit();
                          setMvpId(p.id);
                        }}
                        className={`rounded-[20px] bg-tile px-3 py-2.5 text-left ring-1 transition ${
                          selected ? 'ring-lime' : 'ring-transparent'
                        }`}
                      >
                        <div className={`truncate text-[14px] font-bold ${selected ? 'text-lime' : 'text-fg'}`}>{p.name}</div>
                        <div className="text-[12px] font-medium text-mute">
                          {p.goals} but(s) · Éq. {p.team}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </Card>

              {/* Récapitulatif & clôture */}
              <Card>
                <StatTiles
                  items={[
                    {
                      label: 'Dominant',
                      value: `Éq. ${format === 'roi_du_terrain' ? winStreak.team : scoreLeft >= scoreRight ? pitchLeft : pitchRight}`,
                    },
                    { label: 'Top buteur', value: topScorer?.name ?? '-' },
                    { label: 'Caisse', value: totalCollected.toLocaleString('fr-FR'), unit: 'F' },
                  ]}
                />

                {thursdayPublished ? (
                  <div className="mt-5 flex items-center justify-center gap-2 rounded-full bg-tile py-3.5 text-[14px] font-bold text-lime">
                    <CheckCircle className="h-4 w-4" />
                    Bilan du match publié sur le Réseau DEK
                  </div>
                ) : (
                  <Button
                    className="mt-5"
                    fullWidth
                    disabled={!capAValidated || !capBValidated}
                    onClick={handlePublishThursday}
                  >
                    Clôturer &amp; publier (+150 XP)
                  </Button>
                )}
              </Card>
            </div>
          )}
        </div>
      )}

      {/* ================== ONGLET 2 : MATCHS LA SANTÉ ================== */}
      {subTab === 'matchs' && (
        <div className="space-y-4">
          <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 pb-1" role="tablist" aria-label="Discipline">
            {SPORT_GROUPS.map((g) => (
              <button
                key={g}
                type="button"
                role="tab"
                aria-selected={sportGroup === g}
                onClick={() => setSportGroup(g)}
                className={`h-9 shrink-0 rounded-full px-4 text-[13px] font-semibold transition-colors ${sportGroup === g ? 'bg-lime text-on-lime' : 'bg-tile text-mute'}`}
              >
                {g}
              </button>
            ))}
          </div>
          {matches.filter((m) => sportGroup === 'Tous' || sportMeta(m.sport).group === sportGroup).length === 0 && (
            <p className="rounded-[20px] bg-card px-4 py-6 text-center text-[13px] font-medium text-mute">
              Aucun match dans cette discipline : crée le premier avec le bouton « Créer ».
            </p>
          )}
          {matches
            .filter((m) => sportGroup === 'Tous' || sportMeta(m.sport).group === sportGroup)
            .map((m) => (
            <Card key={m.id}>
              {/* Photo adaptée au sport : basket en noir et blanc, football en couleur */}
              <div className="-mx-5 -mt-5 mb-4 h-32 overflow-hidden rounded-t-[28px]">
                {m.image ? <img src={m.image} alt="" className="h-full w-full object-cover" /> : <SportBanner sport={m.sport} />}
              </div>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-[12px] font-medium text-mute">
                    {m.sport} · {m.level}
                  </div>
                  <h3 className="mt-0.5 text-[16px] font-bold leading-[22px] text-fg">{m.title}</h3>
                </div>
                <span className="num shrink-0 rounded-full bg-tile px-3 py-1 text-[13px] font-bold text-lime">
                  {m.playersJoined}/{m.playersMax}
                </span>
              </div>

              <div className="mt-3 flex items-center justify-between gap-2 rounded-[20px] bg-tile px-4 py-3 text-[14px]">
                <span className="truncate font-bold text-fg">{m.teamA}</span>
                <span className="shrink-0 text-[12px] font-semibold text-faint">contre</span>
                <span className="truncate text-right font-bold text-fg">{m.teamB}</span>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] font-medium text-mute">
                <span className="flex items-center gap-1.5">
                  <MapPin className="h-4 w-4" /> {m.location}
                </span>
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4" /> {m.dateLabel}
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock className="h-4 w-4" /> {m.time}
                </span>
              </div>

              <div className="mt-3 rounded-[18px] bg-tile p-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[12px] font-semibold text-mute">Légende du match</span>
                  <span className="text-[12px] font-bold" style={{ color: LEVEL_COLORS[matchInfo(m).level] }}>
                    {matchInfo(m).level}
                  </span>
                </div>
                <p className="mt-1 text-[13px] font-medium leading-5 text-mute">{matchInfo(m).description}</p>
              </div>

              <div className="mt-4 flex items-center justify-between gap-3">
                <span className="text-[13px] font-medium text-mute">{m.feeLabel}</span>
                <Button variant={m.isJoined ? 'secondary' : 'primary'} size="md" onClick={() => handleToggleJoin(m.id)}>
                  {m.isJoined ? 'Inscrit (+50 XP)' : 'Rejoindre'}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* ================== ONGLET 3 : TOURNOI (POULES + TABLEAU FINAL + BUTEURS) ================== */}
      {subTab === 'tournoi' && (
        <div className="space-y-4">
          {/* Une coupe par discipline */}
          <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 pb-1" role="tablist" aria-label="Discipline du tournoi">
            {SPORT_GROUPS.filter((g): g is SportGroup => g !== 'Tous').map((g) => (
              <button
                key={g}
                type="button"
                role="tab"
                aria-selected={tourGroup === g}
                onClick={() => setTourGroup(g)}
                className={`h-9 shrink-0 rounded-full px-4 text-[13px] font-semibold transition-colors ${tourGroup === g ? 'bg-lime text-on-lime' : 'bg-tile text-mute'}`}
              >
                {g}
              </button>
            ))}
          </div>

          {/* Poule A */}
          <Card>
            <h3 className="text-[16px] font-bold leading-[22px] text-fg">{tournament.title} · Phase de poules</h3>
            <div className="mt-3">
              <div className="grid grid-cols-12 border-b border-rim pb-2 text-[12px] font-medium text-mute">
                <span className="col-span-6">Équipe</span>
                <span className="col-span-2 text-center">J</span>
                <span className="col-span-2 text-center">Diff</span>
                <span className="col-span-2 text-right">Pts</span>
              </div>
              {tournament.table.map((row, idx) => (
                <div
                  key={row.team}
                  className="grid grid-cols-12 items-center border-b border-rim py-2.5 text-[14px] last:border-0 last:pb-0"
                >
                  <span className="col-span-6 flex items-center gap-2 font-semibold text-fg">
                    <span className={`num w-4 text-[12px] font-bold ${idx < 2 ? 'text-lime' : 'text-faint'}`}>{idx + 1}</span>
                    <span className="truncate">{row.team}</span>
                  </span>
                  <span className="num col-span-2 text-center text-mute">{row.played}</span>
                  <span className="num col-span-2 text-center text-mute">{row.diff}</span>
                  <span className="num col-span-2 text-right font-extrabold text-fg">{row.pts}</span>
                </div>
              ))}
            </div>
          </Card>

          {/* Tableau final */}
          <Card>
            <h3 className="text-[16px] font-bold leading-[22px] text-fg">Tableau final</h3>
            <div className="mt-3 space-y-5">
              {(['Quarts', 'Demies', 'Finale'] as const).map((round) => (
                <div key={round}>
                  <div className="mb-1 text-[12px] font-semibold text-mute">{round}</div>
                  {tournament.bracket.filter((t) => t.round === round).map((tm) => (
                    <div key={tm.id} className="border-b border-rim py-3 last:border-0">
                      <div className="flex items-center justify-between text-[12px] font-medium">
                        <span
                          className={
                            tm.status === 'en_cours' ? 'text-lime' : tm.status === 'termine' ? 'text-mute' : 'text-faint'
                          }
                        >
                          {tm.status === 'en_cours' ? 'En direct' : tm.status === 'termine' ? 'Terminé' : 'À venir'}
                        </span>
                      </div>
                      <div className="mt-1 space-y-1 text-[14px] font-semibold">
                        <div className="flex justify-between text-fg">
                          <span>{tm.teamA}</span>
                          <span className="num font-extrabold">{tm.scoreA ?? '-'}</span>
                        </div>
                        <div className="flex justify-between text-fg">
                          <span>{tm.teamB}</span>
                          <span className="num font-extrabold">{tm.scoreB ?? '-'}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </Card>

          {/* Meilleurs performeurs */}
          <div className="space-y-2">
            <h3 className="px-1 text-[18px] font-bold leading-6 text-fg">{tournament.topTitle} du tournoi</h3>
            {tournament.top.map((p, idx) => (
              <div key={p.name} className="flex items-center gap-3 rounded-[24px] bg-card p-3">
                <span className="num w-6 text-center text-[16px] font-extrabold text-mute">{idx + 1}</span>
                <Initials name={p.name} />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[15px] font-bold leading-5 text-fg">{p.name}</div>
                  <div className="truncate text-[12px] font-medium text-mute">{p.team}</div>
                </div>
                <span className="num text-[15px] font-extrabold text-lime">
                  {p.value} {tournament.unit}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {createSheet}
    </div>
  );
}
