import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  CheckCircle,
  Dumbbell,
  MapPin,
  Play,
  Plus,
  Sparkle,
  Timer,
  UsersThree,
  X,
} from './DekIcons';
import {
  DUO_ROUTINES,
  INITIAL_FORM_CHECKS,
  INITIAL_GYM_CALLS,
} from '../data/gamesData';
import type {
  AvatarPresetId,
  FormCheckItem,
  GymDuoExercise,
  GymSpotCall,
  MissionDifficulty,
  UserAvatarConfig,
} from '../types/dek';
import { TIER_COLORS } from '../utils/categorization';
import { playGo, playHit, playTick, playVictory } from '../utils/soundFx';
import { UserAvatar } from './UserAvatar';

interface GymBuddyViewProps {
  userCategory: MissionDifficulty;
  userName: string;
  onDuoComplete: (routineTitle: string, totalSets: number) => void;
  onSpotJoin?: (author: string, gymName: string) => void;
}

type GymSubTab = 'spot' | 'duo' | 'form';

const GYM_PLACES = [
  { name: 'Fitness Park Centre', activeCount: 7 },
  { name: 'Parc Street Workout', activeCount: 5 },
  { name: 'Basic-Fit Nord', activeCount: 4 },
];

const QUICK_TIPS = [
  'Posture propre ✓',
  'Gaine les abdos',
  'Contrôle la descente',
  'Amplitude top 🔥',
];

function presetAvatar(presetId: AvatarPresetId): UserAvatarConfig {
  return {
    mode: 'preset',
    presetId,
    diceStyle: 'lorelei',
    seed: presetId,
    bgColor: '0f172a',
    auraColor: '#C8FF00',
  };
}

export function GymBuddyView({
  userCategory,
  userName,
  onDuoComplete,
  onSpotJoin,
}: GymBuddyViewProps) {
  const [subTab, setSubTab] = useState<GymSubTab>('spot');

  // Spot Me state
  const [selectedGym, setSelectedGym] = useState<string>(GYM_PLACES[0].name);
  const [checkedInGym, setCheckedInGym] = useState<string | null>(null);
  const [calls, setCalls] = useState<GymSpotCall[]>(INITIAL_GYM_CALLS);
  const [showNewCall, setShowNewCall] = useState(false);
  const [newFocus, setNewFocus] = useState('Dos / Biceps (Tractions)');
  const [newSlot, setNewSlot] = useState('Ce soir • 19:00');

  // Duo Live state
  const [routineKey, setRoutineKey] = useState<'salle' | 'street'>('salle');
  const [exercises, setExercises] = useState<GymDuoExercise[]>(
    DUO_ROUTINES.salle.exercises.map((e) => ({ ...e })),
  );
  const [restDuration, setRestDuration] = useState(60);
  const [restRemaining, setRestRemaining] = useState(0);
  const [restRunning, setRestRunning] = useState(false);
  const [duoBanner, setDuoBanner] = useState('Synchronisé avec Moussa_Iron');

  // Form Check state
  const [formChecks, setFormChecks] = useState<FormCheckItem[]>(INITIAL_FORM_CHECKS);
  const [showNewForm, setShowNewForm] = useState(false);
  const [newExName, setNewExName] = useState('Soulevé de terre (60 kg)');
  const [newNote, setNewNote] = useState('Mon bas du dos reste-t-il bien neutre au départ ?');

  // Switch Duo Routine
  const selectRoutine = (key: 'salle' | 'street') => {
    setRoutineKey(key);
    setExercises(DUO_ROUTINES[key].exercises.map((e) => ({ ...e })));
    setRestRunning(false);
    setRestRemaining(0);
  };

  // Synced Rest Timer countdown
  useEffect(() => {
    if (!restRunning || restRemaining <= 0) return;
    const t = setInterval(() => {
      setRestRemaining((prev) => {
        if (prev <= 4 && prev > 1) playTick();
        if (prev <= 1) {
          setRestRunning(false);
          playGo();
          setDuoBanner('Repos terminé ! GO série suivante 💪');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [restRunning, restRemaining]);

  const startRest = (seconds: number) => {
    setRestDuration(seconds);
    setRestRemaining(seconds);
    setRestRunning(true);
    setDuoBanner(`Chrono repos synchro (${seconds}s) lancé`);
  };

  const completeSet = (exId: string) => {
    playHit();
    let nextRest = 60;
    setExercises((prev) =>
      prev.map((ex) => {
        if (ex.id !== exId) return ex;
        nextRest = ex.restSec;
        return { ...ex, completedSets: Math.min(ex.sets, ex.completedSets + 1) };
      }),
    );
    startRest(nextRest);
    // Partner catches up smoothly
    setTimeout(() => {
      setExercises((prev) =>
        prev.map((ex) =>
          ex.id === exId
            ? { ...ex, partnerSets: Math.min(ex.sets, Math.max(ex.partnerSets, ex.completedSets)) }
            : ex,
        ),
      );
    }, 1200);
  };

  const toggleJoinCall = (id: string) => {
    setCalls((prev) =>
      prev.map((c) => {
        if (c.id !== id) return c;
        const nextJoined = !c.joined;
        if (nextJoined) {
          playGo();
          onSpotJoin?.(c.author, c.gymName);
        }
        return { ...c, joined: nextJoined };
      }),
    );
  };

  const publishCall = () => {
    if (!newFocus.trim()) return;
    const item: GymSpotCall = {
      id: `g-${Date.now()}`,
      author: userName,
      avatarPreset: 'manga-sprint',
      gymName: selectedGym,
      focus: newFocus.trim(),
      timeSlot: newSlot.trim() || 'Ce soir • 19:00',
      level: userCategory,
      joined: true,
    };
    setCalls((prev) => [item, ...prev]);
    setShowNewCall(false);
    playGo();
  };

  const addTipToForm = (id: string, tip: string) => {
    playHit();
    setFormChecks((prev) =>
      prev.map((item) =>
        item.id === id && !item.tips.includes(tip)
          ? { ...item, tips: [...item.tips, tip] }
          : item,
      ),
    );
  };

  const publishFormCheck = () => {
    if (!newExName.trim() || !newNote.trim()) return;
    const item: FormCheckItem = {
      id: `fc-${Date.now()}`,
      author: userName,
      avatarPreset: 'manga-fighter',
      exercise: newExName.trim(),
      note: newNote.trim(),
      tips: ['En attente d’un retour coach / partenaire'],
    };
    setFormChecks((prev) => [item, ...prev]);
    setShowNewForm(false);
    playGo();
  };

  const totalSetsDone = exercises.reduce((acc, e) => acc + e.completedSets, 0);
  const totalSetsPlanned = exercises.reduce((acc, e) => acc + e.sets, 0);

  return (
    <div className="space-y-3 pb-2">
      {/* Bannière compacte Salle & Street */}
      <div className="relative overflow-hidden rounded-3xl border border-white/15 bg-[#11151D] p-3.5">
        <div className="flex items-center justify-between gap-2">
          <div>
            <span className="font-hud inline-flex items-center gap-1 rounded-full bg-[#00E5FF]/15 px-2 py-0.5 text-[9px] font-bold text-[#00E5FF]">
              <Dumbbell weight="duotone" className="h-3 w-3" /> UNIVERS 4 • SALLE & STREET
            </span>
            <h3 className="font-hud mt-1 text-base font-bold text-white">
              Gym Buddy & Duo Synchronisé
            </h3>
          </div>
          <span className="rounded-xl border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] font-bold text-[#C8FF00]">
            {checkedInGym ? '✓ En salle' : 'Check-in'}
          </span>
        </div>

        {/* Sous-onglets Gym Buddy */}
        <div className="mt-3 grid grid-cols-3 gap-1 rounded-2xl border border-white/10 bg-[#0A0D13] p-1">
          {(
            [
              { id: 'spot', label: 'Spot Me' },
              { id: 'duo', label: 'Duo Live' },
              { id: 'form', label: 'Form Check' },
            ] as { id: GymSubTab; label: string }[]
          ).map((t) => {
            const active = subTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setSubTab(t.id)}
                className={`font-hud relative rounded-xl py-1.5 text-[11px] font-bold transition ${
                  active ? 'text-black' : 'text-slate-300'
                }`}
              >
                {active && (
                  <motion.div
                    layoutId="gymSubTabPill"
                    transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                    className="absolute inset-0 rounded-xl bg-[#C8FF00]"
                  />
                )}
                <span className="relative z-10">{t.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* SOUS-ONGLET 1 : SPOT ME */}
      {subTab === 'spot' && (
        <div className="space-y-3">
          {/* Check-in rapide lieu */}
          <div className="rounded-3xl border border-white/10 bg-[#11151D] p-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="font-hud flex items-center gap-1 text-[11px] font-bold text-slate-300">
                <MapPin weight="duotone" className="h-3.5 w-3.5 text-[#C8FF00]" /> Lieux actifs autour
              </span>
              <button
                onClick={() => setShowNewCall((v) => !v)}
                className="font-hud flex items-center gap-1 rounded-full bg-[#C8FF00] px-2.5 py-1 text-[10px] font-bold text-black"
              >
                {showNewCall ? <X className="h-3 w-3" /> : <Plus className="h-3 w-3" />} Appel Spot
              </button>
            </div>

            <div className="flex gap-1.5 overflow-x-auto pb-0.5">
              {GYM_PLACES.map((g) => {
                const isHere = checkedInGym === g.name;
                return (
                  <button
                    key={g.name}
                    onClick={() => {
                      setSelectedGym(g.name);
                      setCheckedInGym(isHere ? null : g.name);
                      if (!isHere) playHit();
                    }}
                    className={`shrink-0 rounded-2xl border px-3 py-2 text-left transition ${
                      isHere
                        ? 'border-[#C8FF00] bg-[#C8FF00]/15 text-white'
                        : 'border-white/10 bg-white/5 text-slate-300'
                    }`}
                  >
                    <div className="text-[11px] font-bold">{g.name}</div>
                    <div className="text-[9px] text-slate-400">
                      {isHere ? '✓ Présent sur place' : `${g.activeCount} athlètes DEK`}
                    </div>
                  </button>
                );
              })}
            </div>

            {showNewCall && (
              <div className="mt-3 space-y-2 rounded-2xl border border-[#C8FF00]/30 bg-black/50 p-3">
                <div className="text-[11px] font-bold text-[#C8FF00]">
                  Publier un appel partenaire ({selectedGym})
                </div>
                <input
                  value={newFocus}
                  onChange={(e) => setNewFocus(e.target.value)}
                  placeholder="Séance / Muscles ciblés..."
                  className="w-full rounded-xl border border-white/10 bg-[#11151D] px-3 py-2 text-xs text-white outline-none focus:border-[#C8FF00]"
                />
                <div className="flex gap-2">
                  <input
                    value={newSlot}
                    onChange={(e) => setNewSlot(e.target.value)}
                    placeholder="Créneau (ex: 19:00)"
                    className="flex-1 rounded-xl border border-white/10 bg-[#11151D] px-3 py-2 text-xs text-white outline-none focus:border-[#C8FF00]"
                  />
                  <button
                    onClick={publishCall}
                    className="font-hud rounded-xl bg-[#C8FF00] px-4 py-2 text-xs font-bold text-black"
                  >
                    Publier
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Liste des appels Spot Me */}
          <div className="space-y-2">
            {calls.map((c) => (
              <div
                key={c.id}
                className="flex items-center justify-between gap-2.5 rounded-3xl border border-white/10 bg-[#11151D] p-3"
              >
                <div className="flex min-w-0 items-center gap-2.5">
                  <UserAvatar avatar={presetAvatar(c.avatarPreset)} size="sm" />
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-hud truncate text-xs font-bold text-white">
                        {c.author}
                      </span>
                      <span
                        className="rounded px-1.5 py-0.5 text-[9px] font-bold"
                        style={{
                          backgroundColor: `${TIER_COLORS[c.level]}22`,
                          color: TIER_COLORS[c.level],
                        }}
                      >
                        {c.level}
                      </span>
                    </div>
                    <div className="truncate text-[11px] font-medium text-slate-200">{c.focus}</div>
                    <div className="truncate text-[10px] text-slate-400">
                      {c.gymName} • {c.timeSlot}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => toggleJoinCall(c.id)}
                  className={`font-hud shrink-0 rounded-full px-3 py-2 text-[10px] font-bold transition ${
                    c.joined
                      ? 'border border-[#C8FF00]/40 bg-[#C8FF00]/15 text-[#C8FF00]'
                      : 'bg-[#C8FF00] text-black'
                  }`}
                >
                  {c.joined ? 'Partenaire ✓' : 'Je viens'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SOUS-ONGLET 2 : DUO LIVE */}
      {subTab === 'duo' && (
        <div className="space-y-3">
          {/* Choix Salle vs Street */}
          <div className="grid grid-cols-2 gap-1.5">
            {(
              [
                { key: 'salle', label: 'Push Salle (Pecs/Épaules)' },
                { key: 'street', label: 'Street Workout (Barres)' },
              ] as const
            ).map((r) => (
              <button
                key={r.key}
                onClick={() => selectRoutine(r.key)}
                className={`font-hud rounded-2xl border px-3 py-2 text-[11px] font-bold transition ${
                  routineKey === r.key
                    ? 'border-[#00E5FF] bg-[#00E5FF]/15 text-[#00E5FF]'
                    : 'border-white/10 bg-[#11151D] text-slate-300'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>

          {/* Chrono Repos Synchronisé */}
          <div className="rounded-3xl border border-[#C8FF00]/25 bg-[#11151D] p-3.5">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-[#C8FF00]">
                  <Timer weight="duotone" className="h-3.5 w-3.5" /> CHRONO REPOS SYNCHRO DUO
                </div>
                <div className="mt-0.5 text-[11px] text-slate-300">{duoBanner}</div>
              </div>
              <div className="font-hud text-3xl font-black text-white">
                00:{String(restRemaining).padStart(2, '0')}
              </div>
            </div>

            <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-[#C8FF00] transition-all duration-300"
                style={{
                  width: `${restDuration > 0 ? (restRemaining / restDuration) * 100 : 0}%`,
                }}
              />
            </div>

            <div className="mt-2.5 flex items-center justify-between gap-2">
              <div className="flex gap-1.5">
                {[45, 60, 75].map((sec) => (
                  <button
                    key={sec}
                    onClick={() => startRest(sec)}
                    className={`font-hud rounded-xl border px-2.5 py-1 text-[10px] font-bold ${
                      restDuration === sec && restRunning
                        ? 'border-[#C8FF00] bg-[#C8FF00] text-black'
                        : 'border-white/10 bg-white/5 text-slate-200'
                    }`}
                  >
                    {sec}s
                  </button>
                ))}
              </div>
              <button
                onClick={() => {
                  if (restRemaining === 0) startRest(restDuration);
                  else setRestRunning((r) => !r);
                }}
                className="font-hud flex items-center gap-1 rounded-full bg-white/10 px-3 py-1.5 text-[10px] font-bold text-white"
              >
                <Play weight="duotone" className="h-3 w-3 text-[#C8FF00]" />
                {restRunning ? 'Pause' : 'Lancer'}
              </button>
            </div>
          </div>

          {/* Exercices synchronisés */}
          <div className="space-y-2">
            {exercises.map((ex) => {
              const done = ex.completedSets >= ex.sets;
              return (
                <div
                  key={ex.id}
                  className="rounded-3xl border border-white/10 bg-[#11151D] p-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <div className="font-hud text-xs font-bold text-white">{ex.name}</div>
                      <div className="text-[10px] text-slate-400">
                        {ex.sets} séries • {ex.reps} • Repos {ex.restSec}s
                      </div>
                    </div>
                    <button
                      disabled={done}
                      onClick={() => completeSet(ex.id)}
                      className={`font-hud rounded-full px-3 py-1.5 text-[10px] font-bold transition ${
                        done
                          ? 'bg-[#C8FF00]/15 text-[#C8FF00]'
                          : 'bg-[#C8FF00] text-black active:scale-95'
                      }`}
                    >
                      {done ? 'Terminé ✓' : `+1 Série`}
                    </button>
                  </div>

                  <div className="mt-2.5 grid grid-cols-2 gap-2 text-[10px]">
                    <div className="rounded-xl bg-white/5 px-2.5 py-1.5">
                      <span className="text-slate-400">Toi : </span>
                      <strong className="text-[#C8FF00]">
                        {ex.completedSets}/{ex.sets}
                      </strong>
                    </div>
                    <div className="rounded-xl bg-white/5 px-2.5 py-1.5">
                      <span className="text-slate-400">Moussa_Iron : </span>
                      <strong className="text-[#00E5FF]">
                        {ex.partnerSets}/{ex.sets}
                      </strong>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <button
            onClick={() => {
              playVictory();
              onDuoComplete(
                DUO_ROUTINES[routineKey].title,
                Math.max(1, totalSetsDone),
              );
            }}
            className="font-hud flex w-full items-center justify-center gap-2 rounded-full bg-[#C8FF00] py-3.5 text-xs font-bold text-black"
          >
            <CheckCircle weight="duotone" className="h-4 w-4" /> Clôturer séance Duo (
            {totalSetsDone}/{totalSetsPlanned} séries) • +120 XP
          </button>
        </div>
      )}

      {/* SOUS-ONGLET 3 : FORM CHECK */}
      {subTab === 'form' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-hud flex items-center gap-1.5 text-xs font-bold text-slate-300">
              <UsersThree weight="duotone" className="h-4 w-4 text-[#C8FF00]" /> Entraide technique
            </span>
            <button
              onClick={() => setShowNewForm((v) => !v)}
              className="font-hud flex items-center gap-1 rounded-full bg-[#C8FF00] px-3 py-1.5 text-[10px] font-bold text-black"
            >
              {showNewForm ? <X className="h-3 w-3" /> : <Plus className="h-3 w-3" />} Poster un Form Check
            </button>
          </div>

          {showNewForm && (
            <div className="space-y-2 rounded-3xl border border-[#C8FF00]/30 bg-[#11151D] p-3">
              <input
                value={newExName}
                onChange={(e) => setNewExName(e.target.value)}
                placeholder="Exercice & charge..."
                className="w-full rounded-xl border border-white/10 bg-[#0A0D13] px-3 py-2 text-xs text-white outline-none focus:border-[#C8FF00]"
              />
              <textarea
                rows={2}
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Décris ce que tu veux faire vérifier..."
                className="w-full rounded-xl border border-white/10 bg-[#0A0D13] px-3 py-2 text-xs text-white outline-none focus:border-[#C8FF00]"
              />
              <button
                onClick={publishFormCheck}
                className="font-hud w-full rounded-full bg-[#C8FF00] py-2 text-xs font-bold text-black"
              >
                Publier la demande technique
              </button>
            </div>
          )}

          {formChecks.map((fc) => (
            <div
              key={fc.id}
              className="rounded-3xl border border-white/10 bg-[#11151D] p-3.5"
            >
              <div className="flex items-center gap-2.5">
                <UserAvatar avatar={presetAvatar(fc.avatarPreset)} size="sm" />
                <div>
                  <div className="font-hud text-xs font-bold text-white">{fc.author}</div>
                  <div className="text-[10px] font-bold text-[#00E5FF]">{fc.exercise}</div>
                </div>
              </div>
              <p className="mt-2 text-xs text-slate-200">{fc.note}</p>

              <div className="mt-2.5 flex flex-wrap gap-1.5">
                {fc.tips.map((tip) => (
                  <span
                    key={tip}
                    className="inline-flex items-center gap-1 rounded-full border border-[#C8FF00]/25 bg-[#C8FF00]/10 px-2.5 py-1 text-[10px] font-medium text-[#C8FF00]"
                  >
                    <Sparkle weight="duotone" className="h-3 w-3" /> {tip}
                  </span>
                ))}
              </div>

              <div className="mt-2.5 border-t border-white/10 pt-2">
                <div className="mb-1.5 text-[9px] font-bold uppercase tracking-wider text-slate-400">
                  Conseil rapide en 1 tap :
                </div>
                <div className="flex flex-wrap gap-1">
                  {QUICK_TIPS.map((qt) => (
                    <button
                      key={qt}
                      onClick={() => addTipToForm(fc.id, qt)}
                      className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] text-slate-200 transition hover:border-[#C8FF00]/50 hover:text-[#C8FF00]"
                    >
                      + {qt}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
