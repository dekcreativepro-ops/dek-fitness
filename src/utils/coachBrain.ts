import { BONUS_EXPLAIN, GOAL_LABEL, GOAL_PLANS, MOTIVATION, SYSTEM_PROMPT, TIPS } from '../data/coachKnowledge';
import { getRecommendedProgram } from '../data/workoutsData';
import type { FitnessGoal, UserProfile } from '../types/dek';
import { getTierIndex } from './categorization';
import type { ChatMsg, CoachProfile } from './coachProfile';
import { dayKey } from './progression';

// Cerveau du coach IA. Deux modes :
//  - « IA connectée » : si VITE_COACH_API_URL est défini, la conversation part vers un serveur qui appelle un vrai modèle
//    (la clé reste côté serveur, voir docs/COACH-IA.md) ;
//  - « hors-ligne » : moteur local qui s'appuie sur les connaissances et sur tes données (toujours disponible).

export interface CoachContext {
  firstName: string;
  goal: FitnessGoal | undefined;
  goals: FitnessGoal[];
  tier: string;
  rank: string;
  xp: number;
  streak: number;
  sessionsWeek: number;
  kcalToday: number;
  waterGlasses: number;
  mealsToday: number;
  body?: { sex: 'homme' | 'femme'; age: number; weightKg: number; heightCm: number };
  houseWins: number;
  missions: number;
  hour: number;
  city: string;
}

export function buildContext(user: UserProfile): CoachContext {
  const today = new Date();
  let sessionsWeek = 0;
  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    sessionsWeek += user.activityLog[dayKey(d)] ?? 0;
  }
  return {
    firstName: (user.name || 'champion').split(/[\s_]/)[0],
    goal: user.goals[0],
    goals: user.goals,
    tier: user.category,
    rank: user.rank,
    xp: user.xp,
    streak: user.streakDays,
    sessionsWeek,
    kcalToday: user.kcalLog[dayKey()] ?? 0,
    waterGlasses: user.waterGlasses,
    mealsToday: user.mealsChecked.length,
    body: user.body,
    houseWins: user.houseWins,
    missions: user.missionsCompleted,
    hour: today.getHours(),
    city: user.city,
  };
}

const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
const has = (t: string, words: string[]) => words.some((w) => t.includes(w));
const pick = <T,>(arr: T[], seed: number): T => arr[Math.abs(seed) % arr.length];

/** Applique le style du coach (bienveillant, équilibré, hardcore) à une réponse. */
function styled(coach: CoachProfile, ctx: CoachContext, text: string, kind: 'open' | 'close' = 'close'): string {
  if (kind === 'open') return text;
  const n = ctx.firstName;
  if (coach.style === 'hardcore') return `${text}\n\nPas d’excuses, ${n}. On y va.`;
  if (coach.style === 'bienveillant') return `${text}\n\nJe suis là avec toi, ${n}. Un pas à la fois.`;
  return `${text}\n\nOn avance, ${n}.`;
}

function bmrTdee(ctx: CoachContext): { tdee: number; bmr: number } | null {
  if (!ctx.body) return null;
  const { sex, age, weightKg, heightCm } = ctx.body;
  const bmr = 10 * weightKg + 6.25 * heightCm - 5 * age + (sex === 'homme' ? 5 : -161);
  return { bmr: Math.round(bmr), tdee: Math.round(bmr * 1.55) };
}

export function dailyBrief(ctx: CoachContext, coach: CoachProfile): string {
  const part = ctx.hour < 11 ? 'Bonjour' : ctx.hour < 18 ? 'Salut' : 'Bonsoir';
  const program = getRecommendedProgram(ctx.goal, Math.max(0, getTierIndex(ctx.tier as never)));
  const lines = [`${part} ${ctx.firstName}, c’est ${coach.name}, ton coach.`];
  if (ctx.sessionsWeek === 0) lines.push('Aucune séance cette semaine pour l’instant : on la lance aujourd’hui, même courte.');
  else lines.push(`Tu as fait ${ctx.sessionsWeek} séance${ctx.sessionsWeek > 1 ? 's' : ''} sur 7 jours${ctx.streak > 1 ? ` et ${ctx.streak} jours d’affilée` : ''}. ${ctx.sessionsWeek >= 4 ? 'Beau rythme.' : 'On peut monter d’un cran.'}`);
  lines.push(`Aujourd’hui : « ${program.title} » (${program.durationMin} min).`);
  if (ctx.waterGlasses < 4) lines.push('Pense à boire : tu es encore bas en eau.');
  return lines.join('\n');
}

export const SUGGESTIONS = ['Mon programme du jour', 'Analyse ma semaine', 'Conseil nutrition', 'Plan sur 7 jours', 'Me motiver', 'Explique les bonus'];

export interface CoachAnswer {
  text: string;
  suggestions: string[];
  source: 'ia' | 'local';
}

export function answerLocal(input: string, ctx: CoachContext, coach: CoachProfile): CoachAnswer {
  const t = norm(input);
  const goal = ctx.goal ?? 'remise_forme';
  const plan = GOAL_PLANS[goal];
  const seed = input.length + ctx.xp;
  let text: string;
  let suggestions = SUGGESTIONS.slice(0, 4);

  if (has(t, ['douleur', 'mal au', 'blesse', 'vertige', 'poitrine', 'malaise'])) {
    text = TIPS.blessure;
    suggestions = ['Échauffement', 'Récupération', 'Mon programme du jour'];
  } else if (has(t, ['bonus', 'guepard', 'faucon', 'lion', 'elephant', 'panthere'])) {
    text = BONUS_EXPLAIN + '\nAstuce : enchaîne les reps vite (Tigre) puis régulier (Aigle), et relève le chrono de 30 s (Lion).';
  } else if (has(t, ['programme', 'seance', 'entrain', 'aujourd', 'quoi faire', 'workout'])) {
    const p = getRecommendedProgram(ctx.goal, Math.max(0, getTierIndex(ctx.tier as never)));
    text = `Pour ton objectif (${GOAL_LABEL[goal]}) et ton niveau ${ctx.tier}, je te propose « ${p.title} » : ${p.durationMin} min, ${p.level}.\nCommence par 5 minutes d’échauffement, garde la technique propre, et note ton ressenti après.`;
    suggestions = ['Échauffement', 'Plan sur 7 jours', 'Me motiver'];
  } else if (has(t, ['semaine', 'bilan', 'analyse', 'progres', 'perf', 'comment je'])) {
    const verdict = ctx.sessionsWeek >= 4 ? 'Tu es dans le vert, continue sans te cramer.' : ctx.sessionsWeek >= 2 ? 'Bon début : vise 1 séance de plus cette semaine.' : 'Semaine légère : fixons une séance courte aujourd’hui.';
    text = `Ton bilan : ${ctx.sessionsWeek} séance(s) sur 7 jours, série de ${ctx.streak} jour(s), ${ctx.missions} mission(s) Outdoor, ${ctx.houseWins} victoire(s) Défi House, rang ${ctx.rank} (${ctx.xp} XP).\n${verdict}\nTon point à travailler : ${plan.mistake}`;
    suggestions = ['Mon programme du jour', 'Plan sur 7 jours', 'Conseil nutrition'];
  } else if (has(t, ['plan', '7 jours', 'semaine type', 'programme de la semaine', 'objectif'])) {
    text = `Plan 7 jours pour « ${GOAL_LABEL[goal]} » :\n${plan.week.join('\n')}\n\nPrincipe : ${plan.focus}`;
    suggestions = ['Conseil nutrition', 'Échauffement', 'Me motiver'];
  } else if (has(t, ['manger', 'repas', 'nutrition', 'calorie', 'regime', 'proteine', 'diet', 'maigrir', 'grossir', 'poids'])) {
    const e = bmrTdee(ctx);
    const kcal = e ? (goal === 'perte_poids' ? e.tdee - 350 : goal === 'prise_muscle' ? e.tdee + 250 : e.tdee) : null;
    const prot = ctx.body ? Math.round(ctx.body.weightKg * (goal === 'prise_muscle' ? 1.9 : 1.5)) : null;
    text = `Nutrition pour « ${GOAL_LABEL[goal]} » : ${plan.nutrition}\n${kcal ? `Estimation pour toi : environ ${kcal} kcal/jour${prot ? ` et ${prot} g de protéines` : ''} (c’est un repère, pas une règle).` : 'Renseigne ton profil physique (poids, taille, âge) et je te donne une estimation de calories.'}\n${TIPS.aliments}`;
    suggestions = ['Hydratation', 'Plan sur 7 jours', 'Mon programme du jour'];
  } else if (has(t, ['eau', 'hydrat', 'boire', 'soif'])) {
    text = `${TIPS.hydratation}\nAujourd’hui : ${ctx.waterGlasses} verre(s) enregistré(s).`;
  } else if (has(t, ['dorm', 'sommeil', 'fatigue', 'recup', 'courbature', 'repos'])) {
    text = `${TIPS.recuperation}\n${TIPS.sommeil}`;
    suggestions = ['Étirements', 'Mon programme du jour', 'Me motiver'];
  } else if (has(t, ['echauff'])) {
    text = TIPS.echauffement;
  } else if (has(t, ['etir', 'souplesse', 'mobilite'])) {
    text = TIPS.etirements;
  } else if (has(t, ['motiv', 'flemme', 'envie', 'decourag', 'fatigue mentale', 'abandon', 'lache', 'pas le courage'])) {
    text = pick(MOTIVATION[coach.style], seed);
    suggestions = ['Mon programme du jour', 'Séance de 10 minutes', 'Analyse ma semaine'];
  } else if (has(t, ['10 minutes', 'courte', 'pas le temps', 'rapide'])) {
    text = 'Séance express de 10 minutes : 3 tours de 10 squats, 8 pompes, 20 s de gainage, 20 jumping jacks, 30 s de repos entre les tours. Chronomètre et vas-y.';
  } else if (has(t, ['course', 'courir', 'run', 'footing', '5 km', '10 km', 'marathon', 'outdoor'])) {
    text = `${TIPS.course}\nDans l’app : lance une mission Outdoor, garde la zone NO RUN en objectif pour conquérir de nouveaux quartiers, et essaie de battre ta dernière course.`;
    suggestions = ['Cardio', 'Plan sur 7 jours', 'Explique les bonus'];
  } else if (has(t, ['cardio', 'souffle', 'endurance'])) {
    text = TIPS.cardio;
  } else if (has(t, ['force', 'muscle', 'pompes', 'squat', 'traction', 'masse'])) {
    text = `${TIPS.force}\n${TIPS.proteines}`;
  } else if (has(t, ['defi house', 'duel', 'tournoi', 'chrono', 'rythme', 'rapidite'])) {
    text = 'Défi House : enchaîne tes reps à rythme régulier (Aigle), accélère par rafales de 5 (Tigre), relève le défi chrono de 30 s (Lion). Pour prendre un titre du Tournoi, vise le score du champion + 1 et garde de l’énergie pour les 10 dernières secondes.';
  } else if (has(t, ['debut', 'commenc', 'novice', 'jamais fait'])) {
    text = TIPS.debutant;
  } else if (has(t, ['salut', 'bonjour', 'hello', 'coucou', 'bonsoir', 'ca va'])) {
    text = dailyBrief(ctx, coach);
  } else if (has(t, ['merci', 'top', 'super', 'genial'])) {
    text = 'Avec plaisir. Ce qui compte maintenant : l’action. Quelle est ta prochaine séance ?';
  } else {
    text = `Je suis ton coach pour le sport, la récupération, la nutrition de base et la motivation. Dis-moi ce que tu veux : ton programme du jour, un bilan de ta semaine, un plan sur 7 jours, un conseil repas… Et si tu as une douleur, parle-m’en : je te dirai quand t’arrêter.`;
  }
  return { text: styled(coach, ctx, text), suggestions, source: 'local' };
}

/** Demande au vrai modèle (si un serveur est configuré), sinon répond avec le moteur local. */
export async function askCoach(history: ChatMsg[], input: string, ctx: CoachContext, coach: CoachProfile): Promise<CoachAnswer> {
  const url = (import.meta.env as Record<string, string | undefined>).VITE_COACH_API_URL;
  if (url) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 15000);
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          system: `${SYSTEM_PROMPT}\n\nTon prénom : ${coach.name} (${coach.gender === 'femme' ? 'coach femme' : 'coach homme'}). Style : ${coach.style}.`,
          context: ctx,
          messages: [...history.slice(-12).map((m) => ({ role: m.from === 'user' ? 'user' : 'assistant', content: m.text })), { role: 'user', content: input }],
        }),
      });
      clearTimeout(timer);
      if (res.ok) {
        const data = (await res.json()) as { text?: string };
        if (data.text) return { text: data.text, suggestions: SUGGESTIONS.slice(0, 4), source: 'ia' };
      }
    } catch {
      // serveur indisponible : repli local
    }
  }
  return answerLocal(input, ctx, coach);
}

// ---------- accompagnement en direct (course, duel, séance) ----------
export type LiveKind = 'start' | 'quarter' | 'half' | 'ahead' | 'behind' | 'record' | 'better' | 'final' | 'finish' | 'bonus' | 'ten';

export function liveLine(kind: LiveKind, coach: CoachProfile, ctx?: { name?: string }): string {
  const n = ctx?.name ?? '';
  const h = coach.style === 'hardcore';
  const b = coach.style === 'bienveillant';
  switch (kind) {
    case 'start':
      return h ? 'On y va. Donne tout, pas d’excuses.' : b ? 'Respire, trouve ton rythme. Je suis avec toi.' : 'C’est parti. Trouve ton rythme dès le début.';
    case 'quarter':
      return h ? 'Premier quart bouclé. Ne ralentis pas.' : b ? 'Bien parti. Reste relâché, respire.' : 'Un quart de fait. Garde cette allure.';
    case 'half':
      return h ? 'Mi-parcours. C’est maintenant que ça se joue.' : b ? 'Déjà la moitié ! Tu fais du bon boulot.' : 'Mi-parcours. Tu peux encore accélérer.';
    case 'ahead':
      return h ? 'Tu es devant ta dernière fois. Ne lâche rien, fais encore mieux.' : b ? 'Je pense que tu fais mieux que la dernière fois, et tu peux encore faire mieux !' : 'Tu fais mieux que la dernière fois. Continue, tu peux encore mieux faire.';
    case 'behind':
      return h ? 'Tu es en retard sur ton record. Accélère, maintenant !' : b ? 'Un peu derrière la dernière fois, rien de grave : une petite accélération et tu reviens.' : 'Un peu derrière ta dernière fois. Accélère légèrement pour la rattraper.';
    case 'record':
      return h ? 'Record battu ! Tu as monté tes performances. Maintenant on vise plus haut.' : b ? 'Bravo, nouveau record ! Tu as monté tes performances, continue ainsi.' : 'Nouveau record. Tu as monté tes performances, continue ainsi.';
    case 'better':
      return h ? 'Mieux que la dernière fois. Encore, encore.' : b ? 'Tu as progressé depuis la dernière fois, je suis fier de toi.' : 'Mieux que la dernière fois. La progression est là.';
    case 'final':
      return h ? 'Dernière ligne droite. Vide tout !' : b ? 'Presque fini, tu y es presque. Termine fort.' : 'Dernière ligne droite. Finis fort.';
    case 'ten':
      return h ? 'Dix secondes. Sors tout ce qu’il te reste.' : b ? 'Dix secondes, tu peux le faire.' : 'Dix secondes. Accélère jusqu’au bout.';
    case 'bonus':
      return h ? 'Bonus devant, va le chercher.' : b ? 'Un bonus près de toi, tu peux l’attraper.' : 'Bonus en vue. Prends-le avant la fin du chrono.';
    case 'finish':
    default:
      return n ? `Bien joué ${n}. Récupère, bois de l’eau.` : 'Bien joué. Récupère, bois de l’eau.';
  }
}
