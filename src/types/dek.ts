/** Onglets de la barre du bas + pages secondaires (nutrition, séances) ouvertes depuis l'accueil ou le bouton ＋. */
export type TabId = 'home' | 'missions' | 'house' | 'nutrition' | 'network' | 'workouts';

export type MissionDifficulty = 'Amateur' | 'Standard' | 'Pro' | 'Expert';

export interface MissionTier {
  id: MissionDifficulty;
  distanceKm: number;
  xpReward: number;
  timeLimitMin: number;
  color: string;
  badge: string;
  participantsCount: number;
}

export interface LobbyRunner {
  id: string;
  name: string;
  city: string;
  disciplineScore: number;
  rank: string;
  progressKm: number;
  status: 'pret' | 'en_course' | 'termine' | 'echoue';
  paceMinKm: number;
}

export type HouseExercise =
  | 'pompes'
  | 'squats'
  | 'jumping_jacks'
  | 'corde'
  | 'gainage'
  | 'burpees';

export type DemoExercise = HouseExercise;

export type OutdoorDiscipline = 'course' | 'marche' | 'velo';

export type OutdoorGameMode =
  | 'mission_5am'
  | 'survie_checkpoint'
  | 'relais_escouade'
  | 'conquete_territoire'
  | 'fantome';

export type HouseGameMode = 'ko_60s' | 'first_to_20' | 'survie_maison' | 'equipe_4v4';

export interface TerritoryZone {
  id: string;
  name: string;
  ownerClub: string;
  points: number;
  targetPoints: number;
  color: string;
}

export type ThursdayFormat = '2_equipes' | 'roi_du_terrain';

export interface ThursdayPlayer {
  id: string;
  name: string;
  category: MissionDifficulty;
  team: 'A' | 'B' | 'C' | 'waitlist';
  paid: boolean;
  checkedIn: boolean;
  goals: number;
  assists: number;
}

export interface GymSpotCall {
  id: string;
  author: string;
  avatarPreset: AvatarPresetId;
  gymName: string;
  focus: string;
  timeSlot: string;
  level: MissionDifficulty;
  joined?: boolean;
}

export interface GymDuoExercise {
  id: string;
  name: string;
  sets: number;
  reps: string;
  restSec: number;
  completedSets: number;
  partnerSets: number;
}

export interface FormCheckItem {
  id: string;
  author: string;
  avatarPreset: AvatarPresetId;
  exercise: string;
  note: string;
  tips: string[];
}

export interface WeekendRaid {
  id: string;
  title: string;
  host: string;
  dateLabel: string;
  location: string;
  participants: number;
  badgeName: string;
  joined?: boolean;
  checkedIn?: boolean;
}

export interface FriendPactMember {
  id: string;
  name: string;
  done: number;
  isMe?: boolean;
}

export interface FriendPact {
  id: string;
  title: string;
  targetPerWeek: number;
  members: FriendPactMember[];
}

export type FitnessGoal =
  | 'perte_poids'
  | 'prise_muscle'
  | 'endurance_5am'
  | 'foot_sante'
  | 'remise_forme';

export type MuscleGroup =
  | 'epaules'
  | 'pectoraux'
  | 'bras'
  | 'abdos'
  | 'dos'
  | 'jambes';

export interface SanteMatch {
  id: string;
  title: string;
  sport: 'Football 5v5' | 'Football 7v7' | 'Football 11v11' | 'Basket 3v3';
  location: string;
  city: string;
  dateLabel: string;
  time: string;
  teamA: string;
  teamB: string;
  playersJoined: number;
  playersMax: number;
  level: 'Loisir' | 'Compétitif' | 'Intensif';
  feeLabel: string;
  isJoined?: boolean;
}

export interface TournamentMatch {
  id: string;
  round: 'Quarts' | 'Demies' | 'Finale';
  teamA: string;
  teamB: string;
  scoreA?: number;
  scoreB?: number;
  status: 'termine' | 'en_cours' | 'a_venir';
}

export interface CoachReview {
  id: string;
  author: string;
  avatarPreset: AvatarPresetId;
  rating: number;
  timeAgo: string;
  text: string;
}

export interface CoachProfile {
  id: string;
  name: string;
  specialty: string;
  city: string;
  rating: number;
  studentsCount: number;
  verified: boolean;
  nextSession: string;
  priceMonth: string;
  tags: string[];
  avatarInitials: string;
  accent: string;
  avatarPreset?: AvatarPresetId;
  bio?: string;
  experienceYears?: number;
  completedSessions?: number;
  /** Répartition des notes [5★, 4★, 3★, 2★, 1★] */
  ratingBreakdown?: [number, number, number, number, number];
  reviews?: CoachReview[];
}

export type AvatarPresetId =
  | 'manga-sprint'
  | 'manga-fighter'
  | 'fantasy-paladin'
  | 'fantasy-shadow';

export type AvatarMode = 'preset' | 'custom';
export type DiceBearStyleId = 'lorelei' | 'adventurer' | 'bottts';

export interface UserAvatarConfig {
  mode: AvatarMode;
  presetId: AvatarPresetId;
  diceStyle: DiceBearStyleId;
  seed: string;
  bgColor: string;
  auraColor: string;
}

export interface FeedPost {
  id: string;
  author: string;
  initials: string;
  avatarPreset?: AvatarPresetId;
  bannerImage?: string;
  timeAgo: string;
  type: 'mission' | 'house' | 'sante' | 'coach';
  badge: string;
  content: string;
  stats: { label: string; value: string }[];
  reactions: { feu: number; force: number; respect: number };
  /** Réaction posée par l'utilisateur (une seule par publication, re-taper l'annule). */
  myReaction?: FeedReaction;
  /** Horodatage de création (ms) pour afficher un temps relatif juste après rechargement. */
  createdAt?: number;
}

export type FeedReaction = 'feu' | 'force' | 'respect';

export type AuthProvider = 'gmail' | 'whatsapp' | 'email';

export type Sex = 'homme' | 'femme';

export interface BodyProfile {
  sex: Sex;
  age: number;
  weightKg: number;
  heightCm: number;
}

export type CardioLevel = 'marche' | '3km' | '5km' | '10km_plus';

export interface InitiationResult {
  pushups: number;
  squats: number;
  plankSec: number;
  cardioLevel: CardioLevel;
  assignedCategory: MissionDifficulty;
  goals: FitnessGoal[];
  targetMuscles: MuscleGroup[];
  completedAt: string;
}

export interface UserProfile {
  name: string;
  handle: string;
  city: string;
  rank: string;
  xp: number;
  nextRankXp: number;
  disciplineScore: number;
  missionsCompleted: number;
  missionsFailed: number;
  houseWins: number;
  santePlayed: number;
  streakDays: number;
  isAuthenticated: boolean;
  authProvider?: AuthProvider;
  contactValue?: string;
  initiationCompleted: boolean;
  category: MissionDifficulty;
  missionsInCurrentTier: number;
  goals: FitnessGoal[];
  targetMuscles: MuscleGroup[];
  waterGlasses: number;
  mealsChecked: string[];
  badges: string[];
  avatar: UserAvatarConfig;
  initiationResult?: InitiationResult;
  /** Journal d'activité : jour (AAAA-MM-JJ) → nombre de séances validées. */
  activityLog: Record<string, number>;
  /** Récompenses déjà encaissées (clés uniques par jour/semaine) pour éviter le farm d'XP. */
  claimedRewards: string[];
  /** Dernier jour d'ouverture de l'app : sert à remettre à zéro eau & repas chaque jour. */
  lastActiveDay: string;
  /** Profil physique (sexe, âge, poids, taille) pour calibrer calories & séances. */
  body?: BodyProfile;
  /** true une fois l'écran profil physique proposé (rempli ou passé). */
  bodyAsked: boolean;
  /** Séances guidées enregistrées en favori. */
  savedWorkouts: string[];
  /** Séance guidée → nombre de fois terminée. */
  workoutsDone: Record<string, number>;
  /** XP gagnée par jour (classement hebdo). */
  xpLog: Record<string, number>;
  /** Calories estimées brûlées par jour (anneaux d'activité). */
  kcalLog: Record<string, number>;
}
