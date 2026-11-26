import { motion } from 'framer-motion';
import { BowlFood, Check, Drop, Fire, Minus, Plus } from './DekIcons';
import type { UserProfile } from '../types/dek';
import { getNutritionPlan } from '../utils/programsAndNutrition';

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
  const plan = getNutritionPlan(user.goals, user.category);

  const consumedKcal = plan.meals
    .filter((m) => user.mealsChecked.includes(m.id))
    .reduce((acc, m) => acc + m.kcal, 0);

  const consumedProtein = plan.meals
    .filter((m) => user.mealsChecked.includes(m.id))
    .reduce((acc, m) => acc + m.protein, 0);

  const calPct = Math.min(100, Math.round((consumedKcal / plan.targetCalories) * 100));
  const proteinPct = Math.min(100, Math.round((consumedProtein / plan.proteinG) * 100));
  const waterPct = Math.min(100, Math.round((user.waterGlasses / plan.waterTargetGlasses) * 100));

  const radius = 26;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (calPct / 100) * circumference;

  return (
    <div className="space-y-3.5 pb-2">
      {/* Bannière Tête d'affiche Nutrition */}
      <div className="relative overflow-hidden rounded-3xl border border-white/15 bg-[#0B0E14]">
        <img
          src="/images/banner-nutrition.jpg"
          alt="Nutrition Sportive DEK"
          className="h-32 w-full object-cover opacity-85"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#080A0E] via-[#080A0E]/55 to-transparent" />

        <div className="absolute inset-x-0 bottom-0 flex items-end justify-between p-3.5">
          <div>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-[10px] font-bold text-emerald-300 backdrop-blur">
              <BowlFood weight="duotone" className="h-3.5 w-3.5" /> NUTRITION SPORTIVE
            </span>
            <h2 className="font-hud mt-1 text-lg font-bold text-white">{plan.goalLabel}</h2>
          </div>
          <span className="font-hud rounded-xl border border-[#C8FF00]/35 bg-black/75 px-2.5 py-1 text-xs font-bold text-[#C8FF00] backdrop-blur">
            {plan.targetCalories} kcal
          </span>
        </div>
      </div>

      {/* Carte Macros & Calories du jour */}
      <div className="rounded-3xl border border-white/10 bg-[#11151D] p-3.5">
        <div className="flex items-center gap-4">
          <div className="relative flex h-18 w-18 shrink-0 items-center justify-center">
            <svg className="h-18 w-18 -rotate-90" viewBox="0 0 68 68">
              <circle
                cx="34"
                cy="34"
                r={radius}
                fill="none"
                stroke="rgba(255,255,255,0.08)"
                strokeWidth="6"
              />
              <motion.circle
                cx="34"
                cy="34"
                r={radius}
                fill="none"
                stroke="#C8FF00"
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={circumference}
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset: dashOffset }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
              />
            </svg>
            <div className="absolute flex flex-col items-center leading-none">
              <span className="font-hud text-sm font-bold text-white">{consumedKcal}</span>
              <span className="text-[8px] text-slate-400">kcal</span>
            </div>
          </div>

          <div className="flex-1 space-y-2.5">
            <div>
              <div className="mb-1 flex justify-between text-[10px] font-semibold">
                <span className="text-slate-300">Protéines</span>
                <span className="text-[#C8FF00]">
                  {consumedProtein}g / {plan.proteinG}g
                </span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-black/60">
                <motion.div
                  animate={{ width: `${proteinPct}%` }}
                  className="h-full rounded-full bg-[#C8FF00]"
                />
              </div>
            </div>

            <div>
              <div className="mb-1 flex justify-between text-[10px] font-semibold">
                <span className="text-slate-300">Glucides cibles</span>
                <span className="text-[#00E5FF]">{plan.carbsG}g / jour</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-black/60">
                <div
                  className="h-full rounded-full bg-[#00E5FF]"
                  style={{ width: `${Math.max(20, calPct)}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Hydratation interactive */}
      <div className="rounded-3xl border border-white/10 bg-[#11151D] p-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#00E5FF]/15 text-[#00E5FF]">
              <Drop weight="duotone" className="h-5 w-5" />
            </div>
            <div>
              <div className="font-hud text-xs font-bold text-white">HYDRATATION DU JOUR</div>
              <div className="text-[11px] text-slate-400">
                {user.waterGlasses} / {plan.waterTargetGlasses} verres (
                {(user.waterGlasses * 0.25).toFixed(2)} L)
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => onUpdateWater(-1)}
              className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/10 bg-[#0B0E14] text-slate-300"
            >
              <Minus className="h-3.5 w-3.5" />
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => onUpdateWater(1)}
              className="font-hud flex h-8 items-center gap-1 rounded-xl bg-[#00E5FF] px-2.5 text-[11px] font-bold text-black"
            >
              <Plus className="h-3.5 w-3.5" /> 250ml
            </motion.button>
          </div>
        </div>

        <div className="mt-2.5 h-2 w-full overflow-hidden rounded-full bg-black/60">
          <motion.div
            animate={{ width: `${waterPct}%` }}
            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
            className="h-full rounded-full bg-[#00E5FF]"
          />
        </div>
      </div>

      {/* Conseil avant mission 05h00 */}
      <div className="flex items-start gap-2 rounded-2xl border border-[#C8FF00]/25 bg-[#C8FF00]/8 px-3.5 py-2.5 text-[11px] leading-relaxed text-slate-200">
        <Fire weight="duotone" className="mt-0.5 h-4 w-4 shrink-0 text-[#C8FF00]" />
        <span>
          <strong className="text-[#C8FF00]">Avant une mission 05h00 :</strong>{' '}
          {plan.preMissionTip.replace(/^Avant.*?:\s*/i, '')}
        </span>
      </div>

      {/* Plan Repas du jour avec Vraies Photos */}
      <div className="space-y-2">
        <div className="px-0.5 text-xs font-bold text-white">Plan repas du jour</div>
        {plan.meals.map((meal) => {
          const checked = user.mealsChecked.includes(meal.id);
          return (
            <motion.button
              key={meal.id}
              type="button"
              whileTap={{ scale: 0.98 }}
              onClick={() => onToggleMeal(meal.id)}
              className={`flex w-full items-center gap-3 rounded-2xl border p-2.5 text-left transition ${
                checked
                  ? 'border-[#C8FF00]/50 bg-[#C8FF00]/10'
                  : 'border-white/10 bg-[#11151D]'
              }`}
            >
              <img
                src={meal.imageUrl}
                alt={meal.title}
                className="h-16 w-16 shrink-0 rounded-xl object-cover"
              />

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-hud text-[10px] font-bold text-[#00E5FF]">
                    {meal.time}
                  </span>
                  <span className="font-hud truncate text-xs font-bold text-white">
                    {meal.title}
                  </span>
                </div>
                <p className="mt-0.5 line-clamp-2 text-[11px] text-slate-400">{meal.detail}</p>
                <div className="mt-1 flex gap-2 text-[10px] font-semibold text-slate-300">
                  <span>{meal.kcal} kcal</span>
                  <span>•</span>
                  <span className="text-[#C8FF00]">{meal.protein}g prot.</span>
                </div>
              </div>

              <span
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border ${
                  checked
                    ? 'border-[#C8FF00] bg-[#C8FF00] text-black'
                    : 'border-white/25 text-transparent'
                }`}
              >
                <Check weight="bold" className="h-3.5 w-3.5" />
              </span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
