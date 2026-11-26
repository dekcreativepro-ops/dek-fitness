import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Check } from './DekIcons';
import { Button, Card, ChipTabs, TimerRing } from './ui/kit';
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
  onDuoComplete: (routineTitle: string, totalSets: number) => boolean;
  onSpotJoin?: (author: string, gymName: string) => void;
}

type GymSubTab = 'spot' | 'duo' | 'form';

const GYM_PLACES = [
  { name: 'Fitness Park Centre', activeCount: 7 },
  { name: 'Parc Street Workout', activeCount: 5 },
  { name: 'Basic-Fit Nord', activeCount: 4 },
];

const QUICK_TIPS = [
  'Posture propre',
  'Gaine les abdos',
  'Contrôle la descente',
  'Amplitude maximale',
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
          setDuoBanner('Repos terminé ! GO série suivante');
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
    const target = exercises.find((ex) => ex.id === exId);
    if (!target || target.completedSets >= target.sets) return;
    playHit();
    setExercises((prev) =>
      prev.map((ex) =>
        ex.id === exId ? { ...ex, completedSets: Math.min(ex.sets, ex.completedSets + 1) } : ex,
      ),
    );
    // Repos propre à l'exercice (avant : toujours 60 s, la valeur était lue trop tard)
    startRest(target.restSec);
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
    const call = calls.find((c) => c.id === id);
    if (!call) return;
    if (!call.joined) {
      playGo();
      onSpotJoin?.(call.author, call.gymName);
    }
    setCalls((prev) => prev.map((c) => (c.id === id ? { ...c, joined: !c.joined } : c)));
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
  // Il faut au moins la moitié des séries pour clôturer (avant : +120 XP même à 0 série)
  const minSetsToClose = Math.ceil(totalSetsPlanned / 2);
  const canCloseDuo = totalSetsDone >= minSetsToClose;

  const handleCloseDuo = () => {
    if (!canCloseDuo) return;
    if (onDuoComplete(DUO_ROUTINES[routineKey].title, totalSetsDone)) playVictory();
    setExercises(DUO_ROUTINES[routineKey].exercises.map((e) => ({ ...e })));
    setRestRunning(false);
    setRestRemaining(0);
    setDuoBanner('Séance clôturée. Nouvelle séance prête');
  };

  const inputCls =
    'w-full rounded-2xl bg-tile px-4 py-3 text-[14px] font-medium text-fg outline-none placeholder:text-faint focus:ring-1 focus:ring-lime';

  return (
    <div className="space-y-4 pb-2">
      {/* Segmented Gym Buddy */}
      <div role="tablist" className="grid grid-cols-3 gap-1 rounded-full bg-card p-1">
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
              role="tab"
              aria-selected={active}
              onClick={() => setSubTab(t.id)}
              className={`relative h-10 rounded-full text-[13px] font-semibold transition-colors ${
                active ? 'text-on-lime' : 'text-mute'
              }`}
            >
              {active && (
                <motion.div
                  layoutId="gymSubTabPill"
                  transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                  className="absolute inset-0 rounded-full bg-lime"
                />
              )}
              <span className="relative z-10">{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* SOUS-ONGLET 1 : SPOT ME */}
      {subTab === 'spot' && (
        <div className="space-y-4">
          <div>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-[18px] font-bold leading-6 text-fg">Lieux actifs autour</h3>
              <Button size="md" onClick={() => setShowNewCall((v) => !v)}>
                {showNewCall ? 'Fermer' : 'Appel Spot'}
              </Button>
            </div>

            <div className="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5">
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
                    className={`shrink-0 rounded-[20px] px-4 py-3 text-left transition-colors ${
                      isHere ? 'bg-lime text-on-lime' : 'bg-card text-fg'
                    }`}
                  >
                    <div className="text-[14px] font-bold leading-5">{g.name}</div>
                    <div className={`text-[12px] font-medium leading-4 ${isHere ? 'text-on-lime' : 'text-mute'}`}>
                      {isHere ? 'Présent sur place' : `${g.activeCount} athlètes DEK`}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {showNewCall && (
            <Card className="space-y-3">
              <div className="text-[15px] font-bold text-fg">Publier un appel partenaire ({selectedGym})</div>
              <input
                value={newFocus}
                onChange={(e) => setNewFocus(e.target.value)}
                placeholder="Séance / Muscles ciblés..."
                className={inputCls}
              />
              <input
                value={newSlot}
                onChange={(e) => setNewSlot(e.target.value)}
                placeholder="Créneau (ex: 19:00)"
                className={inputCls}
              />
              <Button fullWidth onClick={publishCall}>
                Publier
              </Button>
            </Card>
          )}

          {/* Liste des appels Spot Me */}
          <div className="space-y-2">
            {calls.map((c) => (
              <div key={c.id} className="flex items-center gap-3 rounded-[24px] bg-card p-3">
                <UserAvatar avatar={presetAvatar(c.avatarPreset)} size="sm" className="h-12! w-12!" />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[15px] font-bold leading-5 text-fg">{c.author}</div>
                  <div className="truncate text-[12px] font-medium leading-4 text-mute">{c.focus}</div>
                  <div className="truncate text-[12px] font-medium leading-4 text-mute">
                    {c.gymName} • {c.timeSlot}
                  </div>
                  <span className="text-[12px] font-semibold" style={{ color: TIER_COLORS[c.level] }}>
                    {c.level}
                  </span>
                </div>
                <button
                  onClick={() => toggleJoinCall(c.id)}
                  className={`flex h-9 shrink-0 items-center gap-1 rounded-full px-4 text-[13px] font-bold transition active:scale-95 ${
                    c.joined ? 'bg-tile text-fg' : 'bg-lime text-on-lime'
                  }`}
                >
                  {c.joined && <Check weight="bold" className="h-4 w-4" />}
                  {c.joined ? 'Inscrit' : 'Rejoindre'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SOUS-ONGLET 2 : DUO LIVE */}
      {subTab === 'duo' && (
        <div className="space-y-4">
          {/* Photo du duo : deux partenaires, même rythme */}
          <div className="relative h-40 overflow-hidden rounded-[24px] bg-card">
            <img src="/images/duo.jpg" alt="" draggable={false} className="absolute inset-0 h-full w-full select-none object-cover" style={{ objectPosition: '50% 30%' }} />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
            <div className="absolute inset-x-4 bottom-3">
              <div className="text-[20px] font-bold leading-6 text-white">Séance en duo</div>
              <div className="text-[13px] font-medium text-white/80">{duoBanner}</div>
            </div>
          </div>
          <ChipTabs
            items={[
              { id: 'salle', label: 'Push Salle (Pecs/Épaules)' },
              { id: 'street', label: 'Street Workout (Barres)' },
            ]}
            value={routineKey}
            onChange={selectRoutine}
            layoutId="gymRoutinePill"
          />

          {/* Chrono repos synchronisé */}
          <Card className="flex flex-col items-center">
            <div className="mb-3 text-[13px] font-medium text-mute">Chrono repos synchro duo</div>
            <TimerRing total={restDuration} remaining={restRemaining} size={170} stroke={8}>
              <span className="num text-[40px] font-extrabold leading-none text-fg">
                00:{String(restRemaining).padStart(2, '0')}
              </span>
            </TimerRing>
            <div className="mt-3 text-center text-[13px] font-medium text-mute">{duoBanner}</div>

            <div className="mt-4 grid w-full grid-cols-3 gap-1 rounded-full bg-tile p-1">
              {[45, 60, 75].map((sec) => {
                const active = restDuration === sec && restRunning;
                return (
                  <button
                    key={sec}
                    onClick={() => startRest(sec)}
                    className={`h-9 rounded-full text-[13px] font-semibold transition-colors ${
                      active ? 'bg-lime text-on-lime' : 'text-mute'
                    }`}
                  >
                    {sec}s
                  </button>
                );
              })}
            </div>
            <div className="mt-3 w-full">
              <Button
                variant="secondary"
                size="md"
                fullWidth
                onClick={() => {
                  if (restRemaining === 0) startRest(restDuration);
                  else setRestRunning((r) => !r);
                }}
              >
                {restRunning ? 'Pause' : 'Lancer'}
              </Button>
            </div>
          </Card>

          {/* Exercices synchronisés */}
          <div className="space-y-2">
            {exercises.map((ex) => {
              const done = ex.completedSets >= ex.sets;
              return (
                <Card key={ex.id} className="p-4!">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="truncate text-[15px] font-bold leading-5 text-fg">{ex.name}</div>
                      <div className="text-[12px] font-medium leading-4 text-mute">
                        {ex.sets} séries • {ex.reps} • Repos {ex.restSec}s
                      </div>
                    </div>
                    <button
                      disabled={done}
                      onClick={() => completeSet(ex.id)}
                      className={`h-9 shrink-0 rounded-full px-4 text-[13px] font-bold transition ${
                        done ? 'bg-tile text-mute' : 'bg-lime text-on-lime active:scale-95'
                      }`}
                    >
                      {done ? 'Terminé' : '+1 série'}
                    </button>
                  </div>

                  <div className="mt-3 space-y-2">
                    <SetDots label="Toi" done={ex.completedSets} total={ex.sets} />
                    <SetDots label="Moussa_Iron" done={ex.partnerSets} total={ex.sets} muted />
                  </div>
                </Card>
              );
            })}
          </div>

          <Button fullWidth disabled={!canCloseDuo} onClick={handleCloseDuo}>
            {canCloseDuo
              ? `Clôturer séance Duo (${totalSetsDone}/${totalSetsPlanned} séries) • +120 XP`
              : `Valide au moins ${minSetsToClose} séries (${totalSetsDone}/${totalSetsPlanned})`}
          </Button>
        </div>
      )}

      {/* SOUS-ONGLET 3 : FORM CHECK */}
      {subTab === 'form' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-[18px] font-bold leading-6 text-fg">Entraide technique</h3>
            <Button size="md" onClick={() => setShowNewForm((v) => !v)}>
              {showNewForm ? 'Fermer' : 'Poster un Form Check'}
            </Button>
          </div>

          {showNewForm && (
            <Card className="space-y-3">
              <input
                value={newExName}
                onChange={(e) => setNewExName(e.target.value)}
                placeholder="Exercice & charge..."
                className={inputCls}
              />
              <textarea
                rows={2}
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Décris ce que tu veux faire vérifier..."
                className={inputCls}
              />
              <Button fullWidth onClick={publishFormCheck}>
                Publier la demande technique
              </Button>
            </Card>
          )}

          {formChecks.map((fc) => (
            <Card key={fc.id}>
              <div className="flex items-center gap-3">
                <UserAvatar avatar={presetAvatar(fc.avatarPreset)} size="sm" className="h-12! w-12!" />
                <div className="min-w-0">
                  <div className="truncate text-[15px] font-bold leading-5 text-fg">{fc.author}</div>
                  <div className="truncate text-[12px] font-medium leading-4 text-lime">{fc.exercise}</div>
                </div>
              </div>
              <p className="mt-3 text-[14px] font-medium leading-5 text-fg">{fc.note}</p>

              <div className="mt-3 flex flex-wrap gap-2">
                {fc.tips.map((tip) => (
                  <span key={tip} className="rounded-full bg-tile px-3 py-1.5 text-[12px] font-medium text-fg">
                    {tip}
                  </span>
                ))}
              </div>

              <div className="mt-4 border-t border-rim pt-3">
                <div className="mb-2 text-[12px] font-medium text-mute">Conseil rapide en 1 tap</div>
                <div className="flex flex-wrap gap-2">
                  {QUICK_TIPS.map((qt) => (
                    <button
                      key={qt}
                      onClick={() => addTipToForm(fc.id, qt)}
                      className="rounded-full bg-tile px-3 py-1.5 text-[12px] font-medium text-mute transition active:scale-95"
                    >
                      + {qt}
                    </button>
                  ))}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

/** Rangée de pastilles rondes : une par série, cochée (lime) quand validée. */
function SetDots({ label, done, total, muted = false }: { label: string; done: number; total: number; muted?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-24 shrink-0 truncate text-[12px] font-medium text-mute">{label}</span>
      <div className="flex flex-wrap gap-1.5">
        {Array.from({ length: total }, (_, i) => {
          const on = i < done;
          return (
            <span
              key={i}
              className={`flex h-7 w-7 items-center justify-center rounded-full ${
                on ? (muted ? 'bg-fg text-ink' : 'bg-lime text-on-lime') : 'border-2 border-rim text-transparent'
              }`}
            >
              <Check weight="bold" className="h-3.5 w-3.5" />
            </span>
          );
        })}
      </div>
      <span className="num ml-auto text-[12px] font-semibold text-mute">
        {done}/{total}
      </span>
    </div>
  );
}
