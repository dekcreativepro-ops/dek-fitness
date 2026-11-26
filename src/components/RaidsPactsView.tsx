import { useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Bell,
  Calendar,
  CheckCircle,
  Flag,
  Handshake,
  MapPin,
  Plus,
  QrCode,
  Sparkle,
  Users,
  X,
} from './DekIcons';
import { INITIAL_PACTS, INITIAL_RAIDS } from '../data/gamesData';
import type { FriendPact, WeekendRaid } from '../types/dek';
import { playGo, playHit, playTick, playVictory } from '../utils/soundFx';

interface RaidsPactsViewProps {
  onRaidCheckin: (raidTitle: string, badgeName: string) => void;
  onPactAction: (kind: 'checkin' | 'nudge' | 'create', label: string) => void;
}

export function RaidsPactsView({ onRaidCheckin, onPactAction }: RaidsPactsViewProps) {
  const [subTab, setSubTab] = useState<'raids' | 'pacts'>('raids');
  const [raids, setRaids] = useState<WeekendRaid[]>(INITIAL_RAIDS);
  const [pacts, setPacts] = useState<FriendPact[]>(INITIAL_PACTS);
  const [nudgedIds, setNudgedIds] = useState<string[]>([]);

  // Modal nouveau pacte
  const [showNewPact, setShowNewPact] = useState(false);
  const [pactTitle, setPactTitle] = useState('');
  const [pactTarget, setPactTarget] = useState(3);

  const handleToggleRaidJoin = (id: string) => {
    playGo();
    setRaids((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r;
        const joining = !r.joined;
        return {
          ...r,
          joined: joining,
          participants: joining ? r.participants + 1 : Math.max(1, r.participants - 1),
        };
      }),
    );
  };

  const handleRaidCheckin = (raid: WeekendRaid) => {
    if (raid.checkedIn) return;
    playVictory();
    setRaids((prev) =>
      prev.map((r) =>
        r.id === raid.id ? { ...r, joined: true, checkedIn: true } : r,
      ),
    );
    onRaidCheckin(raid.title, raid.badgeName);
  };

  const handlePactMyCheckin = (pactId: string) => {
    const targetPact = pacts.find((p) => p.id === pactId);
    if (!targetPact) return;
    const me = targetPact.members.find((m) => m.isMe);
    if (!me || me.done >= targetPact.targetPerWeek) return;

    const reachedGoal = me.done + 1 >= targetPact.targetPerWeek;
    if (reachedGoal) playVictory();
    else playHit();

    setPacts((prev) =>
      prev.map((p) =>
        p.id === pactId
          ? {
              ...p,
              members: p.members.map((m) =>
                m.isMe ? { ...m, done: Math.min(p.targetPerWeek, m.done + 1) } : m,
              ),
            }
          : p,
      ),
    );
    onPactAction('checkin', targetPact.title);
  };

  const handleNudgeFriend = (memberKey: string, memberName: string, pactName: string) => {
    playTick();
    setNudgedIds((prev) => (prev.includes(memberKey) ? prev : [...prev, memberKey]));
    onPactAction('nudge', `${memberName} (${pactName})`);
  };

  const handleCreatePact = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pactTitle.trim()) return;
    const created: FriendPact = {
      id: `pact-${Date.now()}`,
      title: pactTitle.trim(),
      targetPerWeek: pactTarget,
      members: [
        { id: `me-${Date.now()}`, name: 'Toi', done: 0, isMe: true },
        { id: `f1-${Date.now()}`, name: 'Koffi_Sprint', done: 1 },
        { id: `f2-${Date.now()}`, name: 'Sarah_5AM', done: 0 },
      ],
    };
    setPacts((prev) => [created, ...prev]);
    onPactAction('create', created.title);
    playGo();
    setPactTitle('');
    setShowNewPact(false);
  };

  const overlayRoot =
    typeof document !== 'undefined' ? document.getElementById('dek-overlay-root') : null;

  const newPactSheet = (
    <AnimatePresence>
      {showNewPact && (
        <motion.div
          key="pact-create-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setShowNewPact(false)}
          className="pointer-events-auto absolute inset-0 flex flex-col justify-end bg-black/70 backdrop-blur-xs"
        >
          <motion.form
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 360, damping: 32 }}
            onClick={(e) => e.stopPropagation()}
            onSubmit={handleCreatePact}
            className="space-y-3 rounded-t-3xl border-t border-[#C8FF00]/30 bg-[#121722] p-4 pb-6 shadow-2xl"
          >
            <div className="mx-auto h-1 w-10 rounded-full bg-white/20" />
            <div className="flex items-center justify-between">
              <h3 className="font-hud text-sm font-bold text-[#C8FF00]">
                CRÉER UN PACTE ENTRE AMIS
              </h3>
              <button
                type="button"
                onClick={() => setShowNewPact(false)}
                className="rounded-xl bg-white/5 p-1.5 text-slate-400"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <input
              type="text"
              required
              placeholder="Ex : 4 séances cardio ou pompes cette semaine"
              value={pactTitle}
              onChange={(e) => setPactTitle(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-[#0B0E14] px-3 py-2.5 text-xs text-white outline-none focus:border-[#C8FF00]"
            />

            <div>
              <div className="mb-1.5 text-[11px] text-slate-300">
                Objectif hebdomadaire par membre :
              </div>
              <div className="grid grid-cols-4 gap-1.5">
                {[2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setPactTarget(n)}
                    className={`font-hud rounded-xl border py-2 text-xs font-bold ${
                      pactTarget === n
                        ? 'border-[#C8FF00] bg-[#C8FF00] text-black'
                        : 'border-white/10 bg-[#0B0E14] text-slate-300'
                    }`}
                  >
                    {n} / sem
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              className="font-hud w-full rounded-2xl bg-[#C8FF00] py-3 text-xs font-bold text-black"
            >
              SCELLER LE PACTE (+50 XP)
            </button>
          </motion.form>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <div className="space-y-3 pb-2">
      {/* Header Univers 5 */}
      <div className="rounded-3xl border border-white/15 bg-[#11151D] p-3.5">
        <div className="flex items-center justify-between gap-2">
          <div>
            <span className="font-hud inline-flex items-center gap-1 rounded-full bg-amber-400/15 px-2 py-0.5 text-[9px] font-bold text-amber-300">
              <Flag weight="duotone" className="h-3 w-3" /> UNIVERS 5 • COMMUNAUTÉ &amp; ENGAGEMENT
            </span>
            <h2 className="font-hud mt-1 text-base font-bold text-white">
              Raids Week-end &amp; Pactes Amis
            </h2>
          </div>
          {subTab === 'pacts' && (
            <button
              onClick={() => setShowNewPact(true)}
              className="font-hud flex items-center gap-1 rounded-xl bg-[#C8FF00] px-3 py-2 text-[11px] font-bold text-black"
            >
              <Plus weight="bold" className="h-3.5 w-3.5" /> Pacte
            </button>
          )}
        </div>

        <div className="mt-3 grid grid-cols-2 gap-1 rounded-2xl border border-white/10 bg-[#0B0E14] p-1">
          {(
            [
              { id: 'raids', label: 'Raids Week-end', Icon: Flag },
              { id: 'pacts', label: 'Pactes Amis', Icon: Handshake },
            ] as const
          ).map(({ id, label, Icon }) => {
            const active = subTab === id;
            return (
              <button
                key={id}
                onClick={() => setSubTab(id)}
                className={`font-hud relative flex items-center justify-center gap-1.5 rounded-xl py-2 text-[11px] font-bold transition ${
                  active ? 'text-black' : 'text-slate-300'
                }`}
              >
                {active && (
                  <motion.div
                    layoutId="raidsPactsPill"
                    transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                    className="absolute inset-0 rounded-xl bg-[#C8FF00]"
                  />
                )}
                <Icon weight="duotone" className="relative z-10 h-3.5 w-3.5" />
                <span className="relative z-10">{label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* RAIDS WEEK-END */}
      {subTab === 'raids' && (
        <div className="space-y-2.5">
          {raids.map((raid) => (
            <div
              key={raid.id}
              className="rounded-3xl border border-white/10 bg-[#11151D] p-3.5"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#C8FF00]/15 px-2 py-0.5 text-[10px] font-bold text-[#C8FF00]">
                    <Sparkle weight="duotone" className="h-3 w-3" /> Badge : {raid.badgeName}
                  </span>
                  <h3 className="font-hud mt-1.5 text-sm font-bold text-white">{raid.title}</h3>
                  <p className="text-[11px] text-slate-400">Encadré par {raid.host}</p>
                </div>
                <span className="font-hud flex items-center gap-1 rounded-xl border border-white/10 bg-[#0B0E14] px-2.5 py-1 text-[11px] font-bold text-[#00E5FF]">
                  <Users weight="duotone" className="h-3.5 w-3.5" /> {raid.participants}
                </span>
              </div>

              <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-300">
                <span className="flex items-center gap-1">
                  <Calendar weight="duotone" className="h-3.5 w-3.5 text-[#C8FF00]" />
                  {raid.dateLabel}
                </span>
                <span className="flex items-center gap-1">
                  <MapPin weight="duotone" className="h-3.5 w-3.5 text-[#00E5FF]" />
                  {raid.location}
                </span>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleToggleRaidJoin(raid.id)}
                  className={`font-hud rounded-2xl py-2.5 text-[11px] font-bold transition ${
                    raid.joined
                      ? 'border border-[#C8FF00]/40 bg-[#C8FF00]/12 text-[#C8FF00]'
                      : 'border border-white/15 bg-white/5 text-white'
                  }`}
                >
                  {raid.joined ? 'Inscrit ✓' : 'Rejoindre le Raid'}
                </button>

                <button
                  disabled={raid.checkedIn}
                  onClick={() => handleRaidCheckin(raid)}
                  className={`font-hud flex items-center justify-center gap-1 rounded-2xl py-2.5 text-[11px] font-bold transition ${
                    raid.checkedIn
                      ? 'border border-emerald-400/40 bg-emerald-500/15 text-emerald-300'
                      : 'bg-[#C8FF00] text-black'
                  }`}
                >
                  {raid.checkedIn ? (
                    <>
                      <CheckCircle weight="duotone" className="h-3.5 w-3.5" /> Badge débloqué !
                    </>
                  ) : (
                    <>
                      <QrCode weight="duotone" className="h-3.5 w-3.5" /> Check-in QR (+120 XP)
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* PACTES AMIS */}
      {subTab === 'pacts' && (
        <div className="space-y-3">
          {pacts.map((pact) => {
            const me = pact.members.find((m) => m.isMe);
            const myDone = me?.done ?? 0;
            const myComplete = myDone >= pact.targetPerWeek;

            return (
              <div
                key={pact.id}
                className="rounded-3xl border border-white/10 bg-[#11151D] p-3.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-bold uppercase text-[#00E5FF]">
                      Pacte Hebdo • Objectif {pact.targetPerWeek}/sem
                    </span>
                    <h3 className="font-hud mt-0.5 text-sm font-bold text-white">{pact.title}</h3>
                  </div>
                  <button
                    disabled={myComplete}
                    onClick={() => handlePactMyCheckin(pact.id)}
                    className={`font-hud shrink-0 rounded-full px-3 py-1.5 text-[10px] font-bold ${
                      myComplete
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : 'bg-[#C8FF00] text-black'
                    }`}
                  >
                    {myComplete ? 'Objectif tenu ✓' : 'Valider (+1)'}
                  </button>
                </div>

                <div className="mt-3 space-y-2">
                  {pact.members.map((m) => {
                    const pct = Math.min(100, Math.round((m.done / pact.targetPerWeek) * 100));
                    const nudgeKey = `${pact.id}:${m.id}`;
                    const alreadyNudged = nudgedIds.includes(nudgeKey);
                    const lagging = !m.isMe && m.done < pact.targetPerWeek;

                    return (
                      <div key={m.id} className="rounded-2xl bg-[#0B0E14] p-2.5">
                        <div className="flex items-center justify-between gap-2 text-xs">
                          <span className="font-semibold text-white">
                            {m.name} {m.isMe && <span className="text-[#C8FF00]">(Toi)</span>}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="font-hud text-[11px] font-bold text-slate-300">
                              {m.done}/{pact.targetPerWeek}
                            </span>
                            {lagging && (
                              <button
                                onClick={() => handleNudgeFriend(nudgeKey, m.name, pact.title)}
                                className={`font-hud flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold ${
                                  alreadyNudged
                                    ? 'bg-white/10 text-slate-400'
                                    : 'bg-amber-400/20 text-amber-300'
                                }`}
                              >
                                <Bell weight="duotone" className="h-3 w-3" />
                                {alreadyNudged ? 'Relancé ✓' : 'Réveiller'}
                              </button>
                            )}
                          </div>
                        </div>
                        <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/10">
                          <div
                            className={`h-full rounded-full transition-all ${
                              pct >= 100
                                ? 'bg-emerald-400'
                                : m.isMe
                                  ? 'bg-[#C8FF00]'
                                  : 'bg-[#00E5FF]'
                            }`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {overlayRoot ? createPortal(newPactSheet, overlayRoot) : newPactSheet}
    </div>
  );
}
