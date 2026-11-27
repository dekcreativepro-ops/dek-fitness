import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { PaperPlaneRight, SlidersHorizontal } from '../DekIcons';
import type { UserProfile } from '../../types/dek';
import { askCoach, buildContext, dailyBrief, SUGGESTIONS } from '../../utils/coachBrain';
import { coachSpeak, loadChat, saveChat, saveCoach, type ChatMsg, type CoachStyle } from '../../utils/coachProfile';
import { dayKey } from '../../utils/progression';
import { Button, Card, ChipTabs, IconButton, ScreenHeader } from '../ui/kit';
import { useCoach } from './coachHooks';

const BRIEF_KEY = 'dek_coach_brief_day';

/** Coach IA : conversation personnalisée, brief du jour, nom/genre/style au choix. */
export function CoachAIScreen({ user, onBack }: { user: UserProfile; onBack: () => void }) {
  const coach = useCoach();
  const ctx = useMemo(() => buildContext(user), [user]);
  const [msgs, setMsgs] = useState<ChatMsg[]>(() => {
    const saved = loadChat();
    try {
      if (window.localStorage.getItem(BRIEF_KEY) !== dayKey()) {
        window.localStorage.setItem(BRIEF_KEY, dayKey());
        return [...saved, { id: Date.now(), from: 'coach', text: dailyBrief(buildContext(user), coach) }];
      }
    } catch {
      // sans mémoire du brief, on le repropose
    }
    return saved.length ? saved : [{ id: Date.now(), from: 'coach', text: dailyBrief(buildContext(user), coach) }];
  });
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState(!coach.setupDone);
  const [chips, setChips] = useState<string[]>(SUGGESTIONS);
  const [source, setSource] = useState<'ia' | 'local'>('local');
  const [name, setName] = useState(coach.name);
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    saveChat(msgs);
    endRef.current?.scrollIntoView({ block: 'end', behavior: 'smooth' });
  }, [msgs, busy]);

  const send = async (text: string) => {
    const q = text.trim();
    if (!q || busy) return;
    const userMsg: ChatMsg = { id: Date.now(), from: 'user', text: q };
    const history = [...msgs, userMsg];
    setMsgs(history);
    setInput('');
    setBusy(true);
    const answer = await askCoach(msgs, q, ctx, coach);
    setSource(answer.source);
    setChips(answer.suggestions);
    setMsgs([...history, { id: Date.now() + 1, from: 'coach', text: answer.text }]);
    setBusy(false);
    // la voix lit seulement le début, pour rester court
    coachSpeak(answer.text.split('\n')[0].slice(0, 220), coach);
  };

  const saveSetup = () => {
    saveCoach({ name: name.trim() || coach.name, setupDone: true });
    setEditing(false);
  };

  return (
    <div className="flex h-full flex-col bg-ink px-5 pb-4 pt-4">
      <ScreenHeader
        title={`Coach ${coach.name}`}
        onBack={onBack}
        right={
          <IconButton label="Personnaliser mon coach" onClick={() => setEditing((e) => !e)}>
            <SlidersHorizontal className="h-5 w-5" />
          </IconButton>
        }
      />

      <div className="mb-3 flex items-center gap-2 text-[12px] font-semibold">
        <span className={`rounded-full px-3 py-1 ${source === 'ia' ? 'bg-lime text-on-lime' : 'bg-tile text-mute'}`}>{source === 'ia' ? 'IA connectée' : 'Mode hors-ligne'}</span>
        <span className="text-faint">Conseils basés sur ton profil et tes séances</span>
      </div>

      {editing && (
        <Card className="mb-3 space-y-3">
          <div className="text-[15px] font-bold text-fg">Ton coach, à ta façon</div>
          <label className="block text-[12px] font-medium text-mute">
            Son prénom
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={16}
              placeholder="Ex : Léa, Max, Coach Amina…"
              className="mt-1 h-11 w-full rounded-full bg-tile px-4 text-[15px] font-medium text-fg outline-none placeholder:text-faint"
            />
          </label>
          <ChipTabs
            items={[
              { id: 'femme', label: 'Une coach' },
              { id: 'homme', label: 'Un coach' },
            ]}
            value={coach.gender}
            onChange={(g) => saveCoach({ gender: g as 'femme' | 'homme' })}
            layoutId="coachGender"
          />
          <ChipTabs
            items={[
              { id: 'bienveillant', label: 'Bienveillant' },
              { id: 'equilibre', label: 'Équilibré' },
              { id: 'hardcore', label: 'Hardcore' },
            ]}
            value={coach.style}
            onChange={(st) => saveCoach({ style: st as CoachStyle })}
            layoutId="coachStyle"
          />
          <button
            type="button"
            role="switch"
            aria-checked={coach.voice}
            onClick={() => saveCoach({ voice: !coach.voice })}
            className="flex w-full items-center justify-between gap-3 rounded-[18px] bg-tile px-4 py-2.5 text-left"
          >
            <span>
              <span className="block text-[14px] font-semibold text-fg">Voix du coach</span>
              <span className="block text-[12px] font-medium text-mute">Il te parle en direct (voix {coach.gender === 'femme' ? 'féminine' : 'masculine'})</span>
            </span>
            <span className={`flex h-6 w-11 shrink-0 items-center rounded-full p-0.5 ${coach.voice ? 'bg-lime' : 'bg-rim'}`}>
              <span className={`h-5 w-5 rounded-full bg-ink transition-transform ${coach.voice ? 'translate-x-5' : ''}`} />
            </span>
          </button>
          <Button fullWidth onClick={saveSetup}>
            Valider
          </Button>
        </Card>
      )}

      <div className="no-scrollbar -mx-1 flex-1 space-y-2 overflow-y-auto px-1 py-1">
        {msgs.map((m) => (
          <motion.div key={m.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className={`flex ${m.from === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[85%] whitespace-pre-line rounded-[20px] px-4 py-2.5 text-[14px] font-medium leading-5 ${
                m.from === 'user' ? 'rounded-br-md bg-lime text-on-lime' : 'rounded-bl-md bg-card text-fg'
              }`}
            >
              {m.text}
            </div>
          </motion.div>
        ))}
        {busy && <div className="w-fit rounded-[20px] rounded-bl-md bg-card px-4 py-2.5 text-[14px] font-medium text-mute">{coach.name} réfléchit…</div>}
        <div ref={endRef} />
      </div>

      <div className="no-scrollbar -mx-1 mt-2 flex gap-2 overflow-x-auto px-1 pb-2">
        {chips.map((c) => (
          <button key={c} type="button" onClick={() => void send(c)} className="h-9 shrink-0 rounded-full bg-tile px-4 text-[13px] font-semibold text-fg transition active:scale-95">
            {c}
          </button>
        ))}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void send(input);
        }}
        className="flex items-center gap-2"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={`Parle à ${coach.name}…`}
          className="h-12 flex-1 rounded-full bg-card px-5 text-[15px] font-medium text-fg outline-none placeholder:text-faint"
        />
        <button type="submit" disabled={!input.trim() || busy} aria-label="Envoyer" className="flex h-12 w-12 items-center justify-center rounded-full bg-lime text-on-lime transition active:scale-95 disabled:opacity-40">
          <PaperPlaneRight className="h-5 w-5" />
        </button>
      </form>
    </div>
  );
}
