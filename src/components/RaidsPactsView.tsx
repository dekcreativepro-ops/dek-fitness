import { useState } from 'react';
import { Bell, Calendar, MapPin, Plus, Users } from './DekIcons';
import { BottomSheet, Button, Card, ChipTabs, ProgressBar } from './ui/kit';
import { INITIAL_PACTS, INITIAL_RAIDS } from '../data/gamesData';
import type { FriendPact, WeekendRaid } from '../types/dek';
import { usePhoto } from '../utils/usePhoto';
import { playGo, playHit, playTick, playVictory } from '../utils/soundFx';

interface RaidsPactsViewProps {
  onRaidCheckin: (raidTitle: string, badgeName: string) => void;
  onPactAction: (kind: 'checkin' | 'nudge' | 'create', label: string) => boolean;
}

function TeamPhoto() {
  const src = usePhoto('raids', 'wide');
  return <img src={src} alt="" loading="lazy" draggable={false} className="absolute inset-0 h-full w-full select-none object-cover" />;
}

export function RaidsPactsView({ onRaidCheckin, onPactAction }: RaidsPactsViewProps) {
  const [subTab, setSubTab] = useState<'raids' | 'pacts'>('raids');
  const [raids, setRaids] = useState<WeekendRaid[]>(INITIAL_RAIDS);
  const [pacts, setPacts] = useState<FriendPact[]>(INITIAL_PACTS);
  const [nudgedIds, setNudgedIds] = useState<string[]>([]);

  // Feuille nouveau pacte
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

    // Une séance validée par jour et par pacte (sinon on pouvait remplir la semaine en 3 taps)
    if (!onPactAction('checkin', targetPact.title)) return;

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
  };

  const handleNudgeFriend = (memberKey: string, memberName: string, pactName: string) => {
    playTick();
    setNudgedIds((prev) => (prev.includes(memberKey) ? prev : [...prev, memberKey]));
    onPactAction('nudge', `${memberName} (${pactName})`);
  };

  const handleCreatePact = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pactTitle.trim()) return;
    const stamp = Date.now();
    const created: FriendPact = {
      id: `pact-${stamp}`,
      title: pactTitle.trim(),
      targetPerWeek: pactTarget,
      members: [
        { id: `me-${stamp}`, name: 'Toi', done: 0, isMe: true },
        { id: `f1-${stamp}`, name: 'Ngando_Sprint', done: 1 },
        { id: `f2-${stamp}`, name: 'Estelle_5h', done: 0 },
      ],
    };
    setPacts((prev) => [created, ...prev]);
    onPactAction('create', created.title);
    playGo();
    setPactTitle('');
    setShowNewPact(false);
  };

  return (
    <div className="space-y-5 pb-2">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-[20px] font-bold leading-[26px] text-fg">
          {subTab === 'raids' ? 'Raids week-end' : 'Pactes amis'}
        </h2>
        {subTab === 'pacts' && (
          <Button size="md" onClick={() => setShowNewPact(true)}>
            <span className="flex items-center gap-1.5">
              <Plus weight="bold" className="h-4 w-4" /> Pacte
            </span>
          </Button>
        )}
      </div>

      <ChipTabs
        items={[
          { id: 'raids', label: 'Raids Week-end' },
          { id: 'pacts', label: 'Pactes Amis' },
        ]}
        value={subTab}
        onChange={setSubTab}
        layoutId="raidsPactsPill"
      />

      {/* RAIDS WEEK-END */}
      {subTab === 'raids' && (
        <div className="space-y-4">
          {raids.map((raid) => (
            <div key={raid.id} className="overflow-hidden rounded-[28px] bg-card">
              <div className="relative h-36">
                <TeamPhoto />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <span className="num absolute right-3 top-3 flex items-center gap-1.5 rounded-full bg-black/40 px-3 py-1 text-[13px] font-bold text-white">
                  <Users className="h-4 w-4" /> {raid.participants}
                </span>
                <div className="absolute inset-x-4 bottom-3">
                  <h3 className="text-[18px] font-bold leading-6 text-white">{raid.title}</h3>
                  <p className="text-[13px] font-medium text-white/80">Encadré par {raid.host}</p>
                </div>
              </div>
              <div className="p-4">
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] font-medium text-mute">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="h-4 w-4" />
                    {raid.dateLabel}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <MapPin className="h-4 w-4" />
                    {raid.location}
                  </span>
                </div>
                <div className="mt-1 text-[13px] font-medium text-faint">Badge : {raid.badgeName}</div>

                <div className="mt-4 grid grid-cols-2 gap-2">
                  <Button variant="secondary" size="md" onClick={() => handleToggleRaidJoin(raid.id)}>
                    {raid.joined ? 'Inscrit' : 'Rejoindre le Raid'}
                  </Button>
                  <Button size="md" disabled={raid.checkedIn} onClick={() => handleRaidCheckin(raid)}>
                    {raid.checkedIn ? 'Badge débloqué' : 'Check-in (+120 XP)'}
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* PACTES AMIS */}
      {subTab === 'pacts' && (
        <div className="space-y-4">
          {pacts.map((pact) => {
            const me = pact.members.find((m) => m.isMe);
            const myDone = me?.done ?? 0;
            const myComplete = myDone >= pact.targetPerWeek;

            return (
              <Card key={pact.id}>
                <div className="text-[12px] font-medium text-mute">
                  Pacte hebdo · Objectif <span className="num">{pact.targetPerWeek}</span>/sem
                </div>
                <h3 className="mt-0.5 text-[16px] font-bold leading-[22px] text-fg">{pact.title}</h3>

                <div className="mt-4 space-y-4">
                  {pact.members.map((m) => {
                    const pct = Math.min(100, Math.round((m.done / pact.targetPerWeek) * 100));
                    const nudgeKey = `${pact.id}:${m.id}`;
                    const alreadyNudged = nudgedIds.includes(nudgeKey);
                    const lagging = !m.isMe && m.done < pact.targetPerWeek;

                    return (
                      <div key={m.id}>
                        <div className="mb-2 flex items-center justify-between gap-2">
                          <span className="truncate text-[14px] font-semibold text-fg">
                            {m.name} {m.isMe && <span className="text-lime">(Toi)</span>}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="num text-[13px] font-bold text-mute">
                              {m.done}/{pact.targetPerWeek}
                            </span>
                            {lagging && (
                              <button
                                onClick={() => handleNudgeFriend(nudgeKey, m.name, pact.title)}
                                className={`flex h-8 items-center gap-1 rounded-full px-3 text-[12px] font-semibold ${
                                  alreadyNudged ? 'text-faint' : 'text-mute'
                                }`}
                              >
                                <Bell className="h-3.5 w-3.5" />
                                {alreadyNudged ? 'Relancé' : 'Relancer'}
                              </button>
                            )}
                          </div>
                        </div>
                        <ProgressBar value={pct} />
                      </div>
                    );
                  })}
                </div>

                <Button
                  className="mt-5"
                  fullWidth
                  size="md"
                  disabled={myComplete}
                  onClick={() => handlePactMyCheckin(pact.id)}
                >
                  {myComplete ? 'Objectif tenu' : 'Valider (+1)'}
                </Button>
              </Card>
            );
          })}
        </div>
      )}

      <BottomSheet open={showNewPact} onClose={() => setShowNewPact(false)} title="Créer un pacte entre amis">
        <form onSubmit={handleCreatePact} className="space-y-4">
          <input
            type="text"
            required
            placeholder="Ex : 4 séances cardio ou pompes cette semaine"
            value={pactTitle}
            onChange={(e) => setPactTitle(e.target.value)}
            className="h-12 w-full rounded-2xl bg-tile px-4 text-[14px] font-medium text-fg outline-none placeholder:text-faint focus:ring-1 focus:ring-lime"
          />
          <div>
            <div className="mb-2 text-[13px] font-medium text-mute">Objectif hebdomadaire par membre</div>
            <div className="grid grid-cols-4 gap-2">
              {[2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setPactTarget(n)}
                  className={`h-10 rounded-full text-[13px] font-semibold ${
                    pactTarget === n ? 'bg-lime text-on-lime' : 'bg-tile text-mute'
                  }`}
                >
                  <span className="num">{n}</span> / sem
                </button>
              ))}
            </div>
          </div>
          <Button type="submit" fullWidth>
            Sceller le pacte (+50 XP)
          </Button>
        </form>
      </BottomSheet>
    </div>
  );
}
