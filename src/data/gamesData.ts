import type {
  FormCheckItem,
  FriendPact,
  GymDuoExercise,
  GymSpotCall,
  TerritoryZone,
  ThursdayPlayer,
  WeekendRaid,
} from '../types/dek';

export const INITIAL_TERRITORIES: TerritoryZone[] = [
  {
    id: 'z1',
    name: 'Zone Akwa',
    ownerClub: 'DEK Warriors',
    points: 820,
    targetPoints: 1000,
    color: '#C8FF00',
  },
  {
    id: 'z2',
    name: 'Zone Bonanjo',
    ownerClub: 'Team 5h',
    points: 910,
    targetPoints: 1000,
    color: '#00E5FF',
  },
  {
    id: 'z3',
    name: 'Zone Bonapriso',
    ownerClub: 'FC Bonapriso',
    points: 740,
    targetPoints: 1000,
    color: '#FF8A00',
  },
  {
    id: 'z4',
    name: 'Zone Bonamoussadi',
    ownerClub: 'Shadow Runners',
    points: 680,
    targetPoints: 1000,
    color: '#FF2E54',
  },
];

export const INITIAL_THURSDAY_PLAYERS: ThursdayPlayer[] = [
  { id: 'p1', name: 'Toi (DEK)', category: 'Standard', team: 'A', paid: true, checkedIn: false, goals: 0, assists: 0 },
  { id: 'p2', name: 'Ngando_Sprint', category: 'Pro', team: 'A', paid: true, checkedIn: true, goals: 1, assists: 1 },
  { id: 'p3', name: 'Mbarga_Iron', category: 'Standard', team: 'A', paid: false, checkedIn: true, goals: 0, assists: 0 },
  { id: 'p4', name: 'Tchoua_Pace', category: 'Amateur', team: 'A', paid: true, checkedIn: true, goals: 0, assists: 1 },
  { id: 'p5', name: 'Abdou_Cap', category: 'Pro', team: 'B', paid: true, checkedIn: true, goals: 1, assists: 0 },
  { id: 'p6', name: 'Atangana_7', category: 'Standard', team: 'B', paid: true, checkedIn: true, goals: 0, assists: 0 },
  { id: 'p7', name: 'Fonkam_Goal', category: 'Standard', team: 'B', paid: false, checkedIn: true, goals: 0, assists: 0 },
  { id: 'p8', name: 'Mireille_Speed', category: 'Amateur', team: 'B', paid: true, checkedIn: false, goals: 0, assists: 0 },
  { id: 'p9', name: 'Eto_Jr', category: 'Pro', team: 'C', paid: true, checkedIn: true, goals: 0, assists: 0 },
  { id: 'p10', name: 'Bekolo_9', category: 'Standard', team: 'C', paid: true, checkedIn: true, goals: 0, assists: 0 },
  { id: 'p11', name: 'Cédric_K', category: 'Amateur', team: 'C', paid: false, checkedIn: true, goals: 0, assists: 0 },
  { id: 'p12', name: 'Ousmane_W', category: 'Standard', team: 'waitlist', paid: false, checkedIn: true, goals: 0, assists: 0 },
  { id: 'p13', name: 'Franck_R', category: 'Amateur', team: 'waitlist', paid: false, checkedIn: false, goals: 0, assists: 0 },
];

export const TOURNAMENT_GROUP_TABLE = [
  { team: 'DEK Warriors', played: 3, diff: '+5', pts: 9 },
  { team: 'FC Bonapriso', played: 3, diff: '+2', pts: 6 },
  { team: 'Team 5h', played: 3, diff: '-1', pts: 3 },
  { team: 'Titan FC', played: 3, diff: '-6', pts: 0 },
];

export const TOURNAMENT_TOP_SCORERS = [
  { name: 'Ngando_Sprint', team: 'DEK Warriors', goals: 6 },
  { name: 'Abdou_Cap', team: 'FC Bonapriso', goals: 5 },
  { name: 'Eto_Jr', team: 'Team 5h', goals: 4 },
];

export const INITIAL_GYM_CALLS: GymSpotCall[] = [
  {
    id: 'g1',
    author: 'Mbarga_Iron',
    avatarPreset: 'fantasy-paladin',
    gymName: 'Fitness Park Centre',
    focus: 'Pecs / Triceps (Développé couché)',
    timeSlot: 'Ce soir • 18:30',
    level: 'Pro',
  },
  {
    id: 'g2',
    author: 'Estelle_5h',
    avatarPreset: 'manga-fighter',
    gymName: 'Parc Street Workout',
    focus: 'Tractions / Dips / Gainage',
    timeSlot: 'Demain • 07:00',
    level: 'Standard',
  },
  {
    id: 'g3',
    author: 'Nkeng_Pace',
    avatarPreset: 'manga-sprint',
    gymName: 'Basic-Fit Nord',
    focus: 'Jambes & Squats (Spotter)',
    timeSlot: 'Ce soir • 19:15',
    level: 'Amateur',
  },
];

export const DUO_ROUTINES: Record<'salle' | 'street', { title: string; exercises: GymDuoExercise[] }> = {
  salle: {
    title: 'Push Pecs & Épaules (Duo)',
    exercises: [
      { id: 'e1', name: 'Développé couché', sets: 4, reps: '10 reps • 60 kg', restSec: 75, completedSets: 0, partnerSets: 1 },
      { id: 'e2', name: 'Développé militaire', sets: 3, reps: '12 reps • 35 kg', restSec: 60, completedSets: 0, partnerSets: 0 },
      { id: 'e3', name: 'Dips lestés / assistés', sets: 3, reps: '12 reps', restSec: 60, completedSets: 0, partnerSets: 0 },
    ],
  },
  street: {
    title: 'Street Workout Explositif (Duo)',
    exercises: [
      { id: 's1', name: 'Tractions pronation', sets: 4, reps: '8 reps propres', restSec: 60, completedSets: 0, partnerSets: 1 },
      { id: 's2', name: 'Dips barres parallèles', sets: 4, reps: '12 reps', restSec: 60, completedSets: 0, partnerSets: 0 },
      { id: 's3', name: 'Pompes diamant', sets: 3, reps: '15 reps', restSec: 45, completedSets: 0, partnerSets: 0 },
    ],
  },
};

export const INITIAL_FORM_CHECKS: FormCheckItem[] = [
  {
    id: 'fc1',
    author: 'Nkeng_Pace',
    avatarPreset: 'manga-sprint',
    exercise: 'Squat barre (70 kg)',
    note: 'Mes genoux rentrent légèrement sur les 2 dernières reps, des conseils ?',
    tips: ['Écarte un peu les pointes de pieds', 'Gaine fort avant de descendre'],
  },
  {
    id: 'fc2',
    author: 'Mireille_Speed',
    avatarPreset: 'manga-fighter',
    exercise: 'Pompes strictes',
    note: 'Est-ce que mon dos reste assez droit en bas du mouvement ?',
    tips: ['Posture super propre', 'Resserre légèrement les coudes à 45°'],
  },
];

export const INITIAL_RAIDS: WeekendRaid[] = [
  {
    id: 'raid1',
    title: 'Raid Dimanche 08h00 • 5 km + 100 Pompes',
    host: 'Coach Ibrahim D.',
    dateLabel: 'Dimanche • 08:00',
    location: 'Parc Central / Esplanade',
    participants: 38,
    badgeName: 'Raid Guerrier 08H',
  },
  {
    id: 'raid2',
    title: 'Raid Street & Cardio Nocturne',
    host: 'Coach Mélissa K.',
    dateLabel: 'Samedi • 18:30',
    location: 'Esplanade Street Workout',
    participants: 24,
    badgeName: 'Élite Nocturne',
  },
];

export const INITIAL_PACTS: FriendPact[] = [
  {
    id: 'pact1',
    title: '3 missions avant 06h00 cette semaine',
    targetPerWeek: 3,
    members: [
      { id: 'm_me', name: 'Toi', done: 1, isMe: true },
      { id: 'm2', name: 'Ngando_Sprint', done: 3 },
      { id: 'm3', name: 'Estelle_5h', done: 2 },
      { id: 'm4', name: 'Nkeng_Pace', done: 0 },
    ],
  },
  {
    id: 'pact2',
    title: '2 duels Défi House + 1 match',
    targetPerWeek: 3,
    members: [
      { id: 'm_me2', name: 'Toi', done: 2, isMe: true },
      { id: 'm5', name: 'Mbarga_Iron', done: 2 },
      { id: 'm6', name: 'Mireille_Speed', done: 1 },
    ],
  },
];
