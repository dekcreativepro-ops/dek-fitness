import { motion } from 'framer-motion';
import { Check, Minus, Plus } from './DekIcons';
import type { UserProfile } from '../types/dek';
import { getNutritionPlan } from '../utils/programsAndNutrition';
import { ActivityRings, Card, CountUp, ProgressBar, SectionHeader } from './ui/kit';

interface NutritionViewProps {
  user: UserProfile;
  onUpdateWater: (delta: number) => void;
  onToggleMeal: (mealId: string) => void;
}

export function NutritionView({
  user,
  onUpdateWater,
  onToggleMeal,
}: NutritionViewProps) {
  const plan = getNutritionPlan(user.goals, user.category, user.body);

  const consumedKcal = plan.meals
    .filter((m) => user.mealsChecked.includes(m.id))
    .reduce((acc, m) => acc + m.kcal, 0);

  const consumedProtein = plan.meals
    .filter((m) => user.mealsChecked.includes(m.id))
    .reduce((acc, m) => acc + m.protein, 0);

  const calPct = Math.min(100, Math.round((consumedKcal / plan.targetCalories) * 100));
  const proteinPct = Math.min(100, Math.round((consumedProtein / plan.proteinG) * 100));
  const waterPct = Math.min(100, Math.round((user.waterGlasses / plan.waterTargetGlasses) * 100));

  return (
    <div className="space-y-5 pb-2">
      <p className="-mt-2 text-[13px] font-medium leading-[18px] text-mute">{plan.goalLabel}</p>

      {/* Calories & macros du jour */}
      <Card>
        <div className="flex items-center gap-4">
          <div className="min-w-0 flex-1">
            <div className="text-[13px] font-medium text-mute">Calories du jour</div>
            <div className="mt-1 flex items-baseline gap-1.5">
              <CountUp value={consumedKcal} className="text-[40px] font-extrabold leading-none text-fg" />
              <span className="num text-[15px] font-semibold text-mute">
                / {plan.targetCalories.toLocaleString('fr-FR')} kcal
              </span>
            </div>
          </div>
          <ActivityRings rings={[{ pct: calPct }]} size={84} stroke={10}>
            <span className="num text-[15px] font-bold text-fg">{calPct}%</span>
          </ActivityRings>
        </div>

        <div className="mt-5 space-y-4">
          <div>
            <div className="mb-2 flex justify-between text-[13px] font-medium">
              <span className="text-mute">Protéines</span>
              <span className="num text-fg">
                {consumedProtein} g / {plan.proteinG} g
              </span>
            </div>
            <ProgressBar value={proteinPct} />
          </div>
          <div>
            <div className="mb-2 flex justify-between text-[13px] font-medium">
              <span className="text-mute">Glucides cibles</span>
              <span className="num text-fg">{plan.carbsG} g / jour</span>
            </div>
            <ProgressBar value={Math.max(20, calPct)} />
          </div>
        </div>
      </Card>

      {/* Hydratation interactive */}
      <Card>
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="text-[13px] font-medium text-mute">Hydratation du jour</div>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="num text-[40px] font-extrabold leading-none text-aqua">
                {(user.waterGlasses * 0.25).toFixed(2)}
              </span>
              <span className="text-[15px] font-semibold text-mute">L</span>
            </div>
            <div className="mt-1 text-[12px] font-medium text-mute">
              {user.waterGlasses} / {plan.waterTargetGlasses} verres
            </div>
          </div>

          <div className="flex items-center gap-2">
            <motion.button
              type="button"
              whileTap={{ scale: 0.9 }}
              onClick={() => onUpdateWater(-1)}
              aria-label="Retirer un verre"
              className="flex h-11 w-11 items-center justify-center rounded-full bg-tile text-fg"
            >
              <Minus className="h-5 w-5" />
            </motion.button>
            <motion.button
              type="button"
              whileTap={{ scale: 0.9 }}
              onClick={() => onUpdateWater(1)}
              className="flex h-11 items-center gap-1.5 rounded-full bg-aqua px-4 text-[14px] font-bold text-on-lime"
            >
              <Plus className="h-4 w-4" /> +250 ml
            </motion.button>
          </div>
        </div>

        <div
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={waterPct}
          className="mt-4 h-2 w-full overflow-hidden rounded-full bg-rim"
        >
          <motion.div
            animate={{ width: `${waterPct}%` }}
            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
            className="h-full rounded-full bg-aqua"
          />
        </div>
      </Card>

      {/* Conseil avant mission */}
      <div className="rounded-[20px] bg-tile p-4 text-[13px] font-medium leading-5 text-mute">
        <span className="font-bold text-fg">Avant une mission 05h00 :</span>{' '}
        {plan.preMissionTip.replace(/^Avant.*?:\s*/i, '')}
      </div>

      {/* Plan repas du jour */}
      <section>
        <img src="/images/3d/nutrition-bandeau.jpg" alt="" loading="lazy" className="mb-3 h-36 w-full rounded-[28px] object-cover" />
        <SectionHeader title="Plan repas du jour" />
        <div className="space-y-2">
          {plan.meals.map((meal) => {
            const checked = user.mealsChecked.includes(meal.id);
            return (
              <motion.button
                key={meal.id}
                type="button"
                whileTap={{ scale: 0.98 }}
                onClick={() => onToggleMeal(meal.id)}
                aria-pressed={checked}
                className="flex w-full items-center gap-3 rounded-[24px] bg-card p-3 text-left"
              >
                <img
                  src={meal.imageUrl}
                  alt={meal.title}
                  className="h-14 w-14 shrink-0 rounded-full object-cover"
                />

                <div className="min-w-0 flex-1">
                  <div className="truncate text-[15px] font-bold leading-5 text-fg">{meal.title}</div>
                  <div className="truncate text-[12px] font-medium leading-4 text-mute">
                    {meal.time} • {meal.detail}
                  </div>
                  <div className="num text-[12px] font-medium leading-4 text-lime">
                    {meal.kcal} kcal • {meal.protein} g prot.
                  </div>
                </div>

                <span
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
                    checked ? 'bg-lime text-on-lime' : 'border-2 border-rim text-transparent'
                  }`}
                >
                  <Check weight="bold" className="h-4 w-4" />
                </span>
              </motion.button>
            );
          })}
        </div>
      </section>
    </div>
  );
}
