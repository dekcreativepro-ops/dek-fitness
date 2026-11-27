import { Button, Card } from './ui/kit';
import { Star } from './DekIcons';
import { LEVEL_COLORS, levelFromScore } from '../utils/gameFx';
import type { HouseChallenge } from '../utils/houseTournament';

/** Tableau du Tournoi Défi House : le plus fort de chaque défi et un bouton pour le relever. */
export function HouseTournamentBoard({
  challenges,
  labelOf,
  onChallenge,
}: {
  challenges: HouseChallenge[];
  labelOf: (c: HouseChallenge) => string;
  onChallenge: (c: HouseChallenge) => void;
}) {
  const strongest = challenges.reduce((a, b) => (b.score > a.score ? b : a), challenges[0]);
  const titles = challenges.filter((c) => c.mine).length;
  return (
    <div className="space-y-3">
      <Card className="space-y-2">
        <div className="flex items-center gap-2 text-[12px] font-semibold text-mute">
          <Star className="h-4 w-4 text-lime" /> Le plus fort du Tournoi
        </div>
        <div className="flex items-end justify-between gap-3">
          <div className="min-w-0">
            <div className="truncate text-[20px] font-bold leading-6 text-fg">{strongest.champion}</div>
            <div className="text-[13px] font-medium text-mute">
              {labelOf(strongest)} · {strongest.zone}
            </div>
          </div>
          <div className="num text-[34px] font-extrabold leading-none text-lime">
            {strongest.score}
            <span className="ml-1 text-[13px] font-semibold text-mute">reps</span>
          </div>
        </div>
        <p className="text-[13px] font-medium leading-5 text-mute">
          Chaque défi a un champion. Bats son score en 60 s pour prendre son titre : le défi monte alors d’un niveau et un challenger plus fort revient le lendemain.
          Tu détiens <strong className="text-fg">{titles}</strong> titre{titles > 1 ? 's' : ''}.
        </p>
      </Card>

      {challenges.map((c) => {
        const level = levelFromScore(c.score / 5 + c.level * 1.5, [5.5, 8.5, 12]);
        return (
          <Card key={c.id} className="space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="text-[12px] font-semibold text-mute">{c.zone}</div>
                <div className="truncate text-[17px] font-bold leading-6 text-fg">{labelOf(c)}</div>
              </div>
              <span className="flex h-7 shrink-0 items-center rounded-full bg-tile px-3 text-[12px] font-bold" style={{ color: LEVEL_COLORS[level] }}>
                {level}
              </span>
            </div>
            <div className="flex items-center justify-between rounded-[18px] bg-tile px-4 py-3">
              <div className="min-w-0">
                <div className="text-[12px] font-medium text-mute">{c.mine ? 'Ton titre' : 'Champion'}</div>
                <div className="truncate text-[15px] font-bold text-fg">{c.champion}</div>
              </div>
              <div className="num text-[24px] font-extrabold text-lime">
                {c.score}
                <span className="ml-1 text-[12px] font-semibold text-mute">reps</span>
              </div>
            </div>
            <div className="flex items-center justify-between gap-3 text-[12px] font-medium text-mute">
              <span>
                Niveau {c.level + 1} · {c.wins} titre{c.wins > 1 ? 's' : ''} pris
              </span>
              <span className="num font-bold text-lime">+{c.rewardXp + c.level * 40} XP</span>
            </div>
            <Button fullWidth variant={c.mine ? 'secondary' : 'primary'} onClick={() => onChallenge(c)}>
              {c.mine ? 'Défendre ton titre' : `Relever le défi · battre ${c.score} reps`}
            </Button>
          </Card>
        );
      })}
    </div>
  );
}
