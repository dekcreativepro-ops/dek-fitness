import type { TournamentMatch } from '../types/dek';
import { INITIAL_TOURNAMENT } from './mockData';
import { TOURNAMENT_GROUP_TABLE, TOURNAMENT_TOP_SCORERS } from './gamesData';
import type { SportGroup } from './sports';

// Un tournoi (ou challenge) par discipline : poule, tableau final et meilleurs performeurs.

export interface TourRow {
  team: string;
  played: number;
  diff: string;
  pts: number;
}
export interface TourPerformer {
  name: string;
  team: string;
  value: number;
}
export interface Tournament {
  title: string;
  unit: string; // « buts », « paniers », « reps »…
  topTitle: string;
  table: TourRow[];
  bracket: TournamentMatch[];
  top: TourPerformer[];
}

interface Def {
  title: string;
  unit: string;
  topTitle: string;
  teams: string[];
  people: string[];
  /** fourchette du score d'une équipe dans un match */
  range: [number, number];
}

const DEFS: Record<Exclude<SportGroup, 'Foot'>, Def> = {
  Basket: { title: 'Coupe DEK Basket 3v3', unit: 'paniers', topTitle: 'Top marqueurs', teams: ['Hoopers DEK', 'Street Kings', 'Dunk Squad', 'Les Pivots', 'Zone Shooters', 'Akwa Ballers', 'Nord Hoops', 'Bonanjo 3x3'], people: ['Ngando_Sprint', 'Mbarga_Iron', 'Atangana_7'], range: [11, 21] },
  Volley: { title: 'Coupe DEK Volley', unit: 'points', topTitle: 'Meilleurs smasheurs', teams: ['Smash DEK', 'Filet Fou', 'Les Muraillers', 'Plage Team', 'Bonanjo Volley', 'Ace Club', 'Block Party', 'Akwa Spikers'], people: ['Estelle_5h', 'Mireille_Speed', 'Nkeng_Pace'], range: [18, 25] },
  Hand: { title: 'Coupe DEK Handball', unit: 'buts', topTitle: 'Top buteurs', teams: ['Hand DEK', 'Les Requins', 'Bonapriso Hand', 'Aigles du Wouri', 'Team Pivot', 'Lions Hand', 'Akwa Hand', 'Nord United'], people: ['Tchoua_Pace', 'Ousmane_W', 'Fonkam_Goal'], range: [17, 29] },
  Padel: { title: 'Open DEK Padel', unit: 'jeux', topTitle: 'Meilleurs duos', teams: ['Duo DEK', 'Vitres & Volées', 'Padel Akwa', 'Les Lobs', 'Smash Duo', 'Bandeja Boys', 'Wouri Padel', 'Club Palmiers'], people: ['Abdou_Cap', 'Cédric_K', 'Bekolo_9'], range: [4, 7] },
  Natation: { title: 'Challenge DEK Natation', unit: 'longueurs', topTitle: 'Meilleurs nageurs', teams: ['Groupe Santé DEK', 'Wouri Crawl', 'Les Dauphins', 'Bassin Club', 'Aqua Akwa', 'Team Papillon', 'Nage Libre', 'Crawl Express'], people: ['Mireille_Init', 'Ngando_Pro', 'Estelle_5h'], range: [28, 46] },
  Combat: { title: 'Tournoi DEK Boxe fitness', unit: 'points', topTitle: 'Top combattants', teams: ['Team Gants DEK', 'Fight Club', 'Les Crochets', 'Sac & Cardio', 'Bonamoussadi Box', 'Uppercut Crew', 'Jab Team', 'Ring Akwa'], people: ['Eto_Jr', 'Mbarga_Std', 'Atangana_7'], range: [24, 39] },
  Danse: { title: 'Battle DEK Danse', unit: 'pts jury', topTitle: 'Meilleurs danseurs', teams: ['Crew Afro DEK', 'Team Zumba DEK', 'Rythme 237', 'Les Griots', 'Afro Vibes', 'Bonanjo Dance', 'Makossa Crew', 'Bikutsi Squad'], people: ['Mireille_Speed', 'Estelle_5h', 'Franck_R'], range: [62, 94] },
  Cardio: { title: 'Challenge DEK Tabata & Crossfit', unit: 'reps', topTitle: 'Top performeurs', teams: ['Club 5h', 'Iron DEK', 'Tabata Squad', 'WOD Warriors', 'Cardio Crew', 'Burn Team', 'Sprint Box', 'Akwa Fit'], people: ['Ngando_Sprint', 'Tchoua_Pace', 'Nkeng_Pace'], range: [118, 176] },
  Vélo: { title: 'Défi DEK Spinning', unit: 'km', topTitle: 'Meilleurs rouleurs', teams: ['Pedal DEK', 'Wouri Cyclo', 'Les Rouleurs', 'Spin Akwa', 'Team Cadence', 'Bonamoussadi Bike', 'Roue Libre', 'Sprint Cycle'], people: ['Abdou_Cap', 'Mbarga_Iron', 'Ousmane_W'], range: [18, 31] },
  Street: { title: 'Street Battle DEK', unit: 'pts crew', topTitle: 'Meilleurs crews de rue', teams: ['Crew Bonanjo', 'Street Kings', 'Akwa Run Crew', 'Calisthénie 237', 'Rue Joss Fit', 'Deïdo Crew', 'Parkour 237', 'Ndokoti Squad'], people: ['Eto_Jr', 'Bekolo_9', 'Fonkam_Goal'], range: [44, 82] },
  'Bien-être': { title: 'Challenge DEK Régularité', unit: 'pts assiduité', topTitle: 'Les plus assidus', teams: ['Souffle & Souplesse', 'Zen DEK', 'Les Flexibles', 'Matin Calme', 'Studio Palmiers', 'Équilibre 237', 'Posture Club', 'Respire Team'], people: ['Mireille_Init', 'Estelle_5h', 'Cédric_K'], range: [70, 100] },
};

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

function scoreOf(seed: string, [lo, hi]: [number, number]): number {
  return lo + (hash(seed) % (hi - lo + 1));
}

export function getTournament(group: SportGroup): Tournament {
  if (group === 'Foot') {
    return {
      title: 'Coupe DEK Football',
      unit: 'buts',
      topTitle: 'Top buteurs',
      table: TOURNAMENT_GROUP_TABLE,
      bracket: INITIAL_TOURNAMENT,
      top: TOURNAMENT_TOP_SCORERS.map((s) => ({ name: s.name, team: s.team, value: s.goals })),
    };
  }
  const d = DEFS[group];
  const t = d.teams;
  const sc = (a: string, b: string) => [scoreOf(a + b, d.range), scoreOf(b + a, d.range)] as const;
  const [q1a, q1b] = sc(t[0], t[7]);
  const [q2a, q2b] = sc(t[1], t[6]);
  const [s1a, s1b] = sc(t[0], t[1]);
  const table: TourRow[] = t.slice(0, 4).map((team, i) => {
    const pts = 9 - i * 3 + (hash(team) % 2);
    return { team, played: 3, diff: `${i < 2 ? '+' : '-'}${2 + ((hash(team + group) % 5) as number)}`, pts: Math.max(0, pts) };
  });
  const bracket: TournamentMatch[] = [
    { id: 'tq1', round: 'Quarts', teamA: t[0], teamB: t[7], scoreA: q1a, scoreB: Math.min(q1b, q1a - 1), status: 'termine' },
    { id: 'tq2', round: 'Quarts', teamA: t[1], teamB: t[6], scoreA: q2a, scoreB: Math.min(q2b, q2a - 1), status: 'termine' },
    { id: 'td1', round: 'Demies', teamA: t[0], teamB: t[1], scoreA: s1a, scoreB: s1b, status: 'en_cours' },
    { id: 'td2', round: 'Demies', teamA: t[2], teamB: t[3], status: 'a_venir' },
    { id: 'tf', round: 'Finale', teamA: 'Vainqueur D1', teamB: 'Vainqueur D2', status: 'a_venir' },
  ];
  const top: TourPerformer[] = d.people.map((name, i) => ({
    name,
    team: t[i],
    value: Math.round(d.range[1] * (0.34 - i * 0.05) * (d.range[1] > 60 ? 1 : 1)) + (hash(name + group) % 4),
  }));
  return { title: d.title, unit: d.unit, topTitle: d.topTitle, table, bracket, top };
}
