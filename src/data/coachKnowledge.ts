import type { FitnessGoal } from '../types/dek';

// Connaissances et consignes du coach IA. SYSTEM_PROMPT sert aussi de consigne au vrai modèle (serveur, voir docs/COACH-IA.md).

export const GOAL_LABEL: Record<FitnessGoal, string> = {
  perte_poids: 'perte de poids',
  prise_muscle: 'prise de muscle',
  endurance_5am: 'endurance & missions 5h',
  foot_sante: 'préparation foot',
  remise_forme: 'remise en forme',
};

export const SYSTEM_PROMPT = `Tu es le coach sportif personnel de l'utilisateur dans l'application DEK FITNESS (Cameroun).
Tu es un VRAI coach : tu le suis au quotidien, tu connais ses objectifs, son niveau, ses séances, ses séries et ses records, et tu l'orientes pour les atteindre.

PERSONNALITÉ
- Tu portes le nom et le genre choisis par l'utilisateur ; tu t'exprimes en français, au tutoiement, de façon directe, chaleureuse et motivante.
- Style choisi : bienveillant (encourageant, doux), équilibré (franc et positif) ou hardcore (exigeant, sans excuses, jamais humiliant).
- Phrases courtes, concrètes. Une idée forte par message, puis une action claire à faire maintenant.

CE QUE TU FAIS
- Planifier : programme du jour, plan sur 7 jours adapté à l'objectif (perte de poids, prise de muscle, endurance, préparation foot, remise en forme) et au niveau (Amateur, Standard, Pro, Expert).
- Suivre : comparer avec la dernière fois ("tu as fait mieux que la dernière fois"), féliciter les progrès, repérer les baisses et proposer un ajustement.
- Conseiller : échauffement, technique, récupération, sommeil, hydratation, nutrition avec des aliments locaux (plantain, manioc, ndolé, poisson braisé, haricots, arachides, riz, papaye, ananas, œufs).
- Accompagner en direct : pendant une séance, une course ou un duel, donner de courtes consignes (allure, respiration, rythme) et encourager à battre son record.
- Expliquer l'app : bonus (Guépard = vitesse, Faucon = précision, Lion = puissance, Éléphant = endurance, Panthère = dynamisme), tournoi Défi House, zones NO RUN, chrono de 30 secondes.

RÈGLES
- Progression raisonnable : +10 % de volume par semaine maximum, au moins 1 jour de repos complet par semaine.
- Jamais de régime extrême, de jeûne prolongé, de produit dopant ou de promesse de résultat garanti.
- Douleur vive, vertige, douleur à la poitrine, essoufflement anormal : tu dis d'arrêter et de consulter un professionnel de santé. Tu n'es pas médecin et tu le dis si besoin.
- Tu t'appuies sur le contexte fourni (profil, objectifs, historique). Si une donnée manque, tu poses UNE question courte.
- Tu ne parles que de sport, forme, récupération, nutrition de base et motivation ; pour le reste tu recentres poliment.`;

export interface GoalPlan {
  focus: string;
  week: string[];
  nutrition: string;
  mistake: string;
}

export const GOAL_PLANS: Record<FitnessGoal, GoalPlan> = {
  perte_poids: {
    focus: 'Dépenser plus que tu ne manges, sans te priver : cardio régulier + renforcement pour garder le muscle.',
    week: ['Lun : cardio brûle-graisse 20 min', 'Mar : full body 15 min', 'Mer : marche active 40 min ou mission Outdoor', 'Jeu : HIIT terrain 20 min', 'Ven : abdos + gainage 10 min', 'Sam : sortie longue facile 30-45 min', 'Dim : repos, étirements, eau'],
    nutrition: 'Déficit modéré (environ 300-400 kcal), protéines à chaque repas (poisson, œufs, haricots), légumes, féculents en portion (riz, manioc, plantain) et peu de boissons sucrées.',
    mistake: 'Sauter des repas puis craquer le soir : mange régulièrement, c’est ce qui tient sur la durée.',
  },
  prise_muscle: {
    focus: 'Surcharge progressive : plus de reps ou plus de charge chaque semaine, avec assez de protéines et de sommeil.',
    week: ['Lun : pecs & épaules (pompes lentes 3-1-3)', 'Mar : jambes (squats, fentes)', 'Mer : repos actif, marche', 'Jeu : dos & bras (tractions, rowing)', 'Ven : full body + gainage', 'Sam : jambes explosives 20 min', 'Dim : repos complet'],
    nutrition: 'Léger surplus (environ 250-300 kcal), 1,6 à 2,2 g de protéines par kg de poids, féculents autour de la séance, 7-9 h de sommeil.',
    mistake: 'Changer de programme chaque semaine : garde le même 4 à 6 semaines et fais monter les chiffres.',
  },
  endurance_5am: {
    focus: 'Construire le souffle par volume facile, avec une seule séance dure par semaine.',
    week: ['Lun : footing facile 20-30 min', 'Mar : renforcement jambes 15 min', 'Mer : mission Outdoor 3 à 5 km', 'Jeu : repos ou marche', 'Ven : fractionné court (6 x 1 min vite, 1 min lent)', 'Sam : sortie longue facile', 'Dim : repos, étirements'],
    nutrition: 'Glucides simples avant (banane, riz), eau régulière, protéines après la sortie, sel si forte chaleur.',
    mistake: 'Courir toutes les sorties trop vite : 80 % de tes sorties doivent te laisser parler.',
  },
  foot_sante: {
    focus: 'Explosivité, changements de direction et cardio intermittent, comme sur un match.',
    week: ['Lun : jambes explosives 20 min', 'Mar : HIIT terrain 20 min', 'Mer : mobilité + gainage', 'Jeu : match ou terrain (Terrains & matchs)', 'Ven : sprints courts (8 x 20 m)', 'Sam : footing léger 20 min', 'Dim : repos complet'],
    nutrition: 'Glucides la veille d’un match, hydratation avant/pendant/après, protéines dans les 2 h après.',
    mistake: 'Négliger le gainage et les chevilles : ce sont elles qui évitent les blessures.',
  },
  remise_forme: {
    focus: 'Retrouver de la régularité sans te brûler : 3 à 4 séances courtes par semaine, qui montent doucement.',
    week: ['Lun : full body starter 14 min', 'Mar : marche 30 min', 'Mer : repos', 'Jeu : abdos béton 10 min', 'Ven : marche rapide ou Outdoor 3 km', 'Sam : séance au choix', 'Dim : repos, étirements'],
    nutrition: 'Des repas simples et réguliers, plus d’eau, un fruit ou des légumes à chaque repas, moins de sucre ajouté.',
    mistake: 'Vouloir tout faire d’un coup : la régularité bat l’intensité.',
  },
};

export const TIPS = {
  echauffement: 'Échauffement de 5 minutes : 1 min de marche rapide, 10 cercles de bras, 10 squats lents, 10 fentes marchées, 20 s de jumping jacks. Tu dois être chaud, pas fatigué.',
  etirements: 'Étirements après l’effort, 20 à 30 secondes par muscle sans douleur : mollets, cuisses, fessiers, pectoraux, épaules. Respire lentement.',
  hydratation: 'Vise environ 2,5 L par jour (plus s’il fait chaud ou si tu t’entraînes). Bois avant d’avoir soif et une gorgée toutes les 15 minutes pendant l’effort. Urine claire = bon signe.',
  sommeil: '7 à 9 heures de sommeil : c’est là que le muscle se construit et que l’énergie revient. Couche-toi à heure fixe, écrans coupés 30 minutes avant, chambre fraîche et sombre.',
  recuperation: 'Récupération : un jour de repos complet par semaine, marche légère les jours off, étirements, eau et protéines après la séance. Si tu es courbaturé, fais plus doux, pas plus dur.',
  blessure: 'Si la douleur est vive, aiguë, localisée ou si tu as un vertige, une douleur à la poitrine ou un essoufflement anormal : arrête maintenant et consulte un professionnel de santé. Je ne suis pas médecin. Une simple courbature, elle, se calme avec du repos actif.',
  debutant: 'Pour bien commencer : 3 séances courtes par semaine, technique avant intensité, une seule chose à améliorer à la fois, et note chaque séance pour voir tes progrès.',
  progression: 'Règle simple : jamais plus de +10 % de volume par semaine. Une semaine sur quatre, allège un peu pour laisser le corps assimiler.',
  proteines: 'Protéines à chaque repas : œufs, poisson, poulet, haricots, arachides, soja, lait. Cible 1,6 à 2,2 g par kg de poids si tu veux du muscle, 1,2 à 1,6 g pour la forme.',
  aliments: 'Bons réflexes locaux : plantain mûr ou manioc pour l’énergie, poisson braisé ou œufs pour les protéines, ndolé et légumes verts pour les fibres, haricots et arachides pour le mix glucides-protéines, papaye et ananas en collation.',
  course: 'Pour courir mieux : 80 % de tes sorties à allure facile (tu peux parler), 1 séance de fractionné par semaine, foulée légère, respiration régulière sur 3 temps inspire / 2 temps expire.',
  cardio: 'Pour le cardio : alterne séances faciles et une séance plus dure, augmente la durée avant la vitesse, et suis ta fréquence cardiaque si tu peux.',
  force: 'Pour la force : mouvements de base (pompes, squats, tractions, gainage), 3 séries de 8 à 12 reps proches de l’échec technique, repos de 60 à 90 secondes.',
};

export const BONUS_EXPLAIN =
  'Les 5 bonus : Guépard = vitesse (reps enchaînées vite), Faucon = précision (rythme régulier), Lion = puissance (défi chrono de 30 s relevé), Éléphant = endurance (aller au bout), Panthère = dynamisme (combos et victoires enchaînées). Chacun a un niveau de 1 à 5 et une médaille.';

export const MOTIVATION: Record<'bienveillant' | 'equilibre' | 'hardcore', string[]> = {
  bienveillant: [
    'Tu n’as pas besoin d’être parfait, juste présent. Une petite séance aujourd’hui vaut mieux qu’une grande séance jamais faite.',
    'Chaque fois que tu t’entraînes, tu votes pour la personne que tu veux devenir. Je suis fier de ta régularité.',
    'Fatigué ? Commence 5 minutes. Si ça ne va toujours pas, tu t’arrêtes sans culpabiliser. Mais tu verras, le plus dur est de démarrer.',
  ],
  equilibre: [
    'Pas de magie : de la régularité. Fais la séance prévue, note-la, et on ajuste demain.',
    'Ton futur toi te remerciera pour les 20 minutes que tu fais maintenant. Allez, on y va.',
    'Tu as déjà prouvé que tu en es capable. Reprends là où tu t’es arrêté, un pas après l’autre.',
  ],
  hardcore: [
    'L’envie ne vient pas avant, elle vient pendant. Lève-toi et commence. Pas d’excuses.',
    'Le seul adversaire, c’est ta version d’hier. Bats-la. Maintenant.',
    'Ça pique ? C’est que ça marche. Serre les dents, termine la série.',
  ],
};
