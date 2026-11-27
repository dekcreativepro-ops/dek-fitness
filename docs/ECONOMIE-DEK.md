# Économie DEK : abonnement + rabais en XP (cahier des charges, à valider)

Statut : **version simplifiée du 27/11/2026. Construit : comptes, registre d'XP, bonus de performance et remise, essai de 15 jours, limites de la version gratuite, paiement par Chariow (testé en démo et contre un faux Chariow). Pas encore construit : produits Chariow à 6 prix, espace coaching, XP achetables pour les tournois.** Remplace les versions précédentes (jauge, monnaie, retrait en argent, séquestre des coachs : tout cela est **abandonné**).

## 1. Le principe
- Un **abonnement mensuel à 5 000 FCFA** (30 jours), payé en Mobile Money.
- **La remise vient des performances, pas des XP.** Chaque **performance réussie** (défi précis, validé par le serveur) rapporte un **bonus** en pourcentage. À la fin du mois, on **additionne les bonus** : la somme est la réduction, plafonnée à **50 %**.
- Les **XP sont la jauge** qui mesure l'effort : ils s'affichent, ouvrent les **paliers** (minimum d'XP) et sont limités par des quotas, mais ils **ne calculent pas le prix**.
- Aucun retrait d'argent, aucun pari, aucune monnaie : c'est une **remise de fidélité**.

## 2. Valeur d'une heure en XP (« on vend du temps »)
Dans l'app, une séance de 10 minutes rapporte environ 90 XP, une de 22 minutes environ 190 XP : cela fait **environ 500 XP par heure d'entraînement**.
**Proposition : 1 heure d'effort = 500 XP.** (à valider)

## 3. Bonus de performance (plafond **50 %** validé par le fondateur le 27/11/2026)
Le serveur déduit les performances des efforts déclarés par l'app (le client ne réclame jamais un bonus lui-même) et applique la limite de chacune.

| Performance validée | Bonus | Limite |
|---|---|---|
| Séance guidée terminée | +0,5 % | 1 par jour |
| 200 pompes dans la journée | +2 % | 1 par jour |
| 3 pistes dans la même soirée | +2 % | 1 par jour |
| Victoire au Défi House | +0,5 % | 3 par jour |
| Semaine parfaite (5 séances) | +3 % | 1 par semaine |
| 7 jours d'entraînement d'affilée | +4 % | 1 par mois |
| Nouveau palier franchi | +5 % | une fois par palier |

- **Somme sur les 30 derniers jours**, plafonnée à 50 %.
- **Remise appliquée = somme arrondie vers le bas au palier de 10 %** (un produit Chariow par prix) : 0-9,5 % → 5 000 FCFA ; 10 % → 4 500 ; 20 % → 4 000 ; 30 % → 3 500 ; 40 % → 3 000 ; 50 % → 2 500 FCFA (minimum).
- Un bonus n'est accordé que si l'effort a rapporté des XP : une fois le **quota du jour atteint (1 250 XP, environ 2 h 30)**, plus rien ne compte. C'est aussi un garde-fou santé.
- Barème indicatif : le fondateur peut le modifier dans `server/economy.mjs` (`PERFORMANCES`).
- **Faiblesse connue** : le bonus « palier » est déclaré par l'app ; tant que les paliers ne sont pas suivis côté serveur, un utilisateur modifié pourrait réclamer les 3 paliers. Maximum 15 % de bonus ; à corriger avec le suivi serveur des paliers.

## 3 bis. Phase suivante (temporaire : pas dans la première version)
- Certains **tournois exigeront un minimum d'XP** pour s'inscrire.
- Si l'utilisateur n'a pas assez d'XP, il pourra **en acheter** pour participer.
- **Règle de sécurité du modèle** : les XP achetés forment un **solde à part**, utilisable seulement pour atteindre le seuil d'un tournoi. Ils **ne comptent pas dans la remise** de l'abonnement, qui ne dépend que des performances et ne sont **jamais échangeables contre de l'argent**.
- À définir plus tard : prix d'un XP acheté, seuils des tournois. Si un tournoi offre des **prix en argent**, c'est de l'organisation de concours : à faire valider par un juriste (la LONACAM pour les jeux d'argent).

## 4. Anti-triche et santé
- **Quota journalier par exercice** : au-delà, les répétitions ne rapportent plus d'XP (pas de farming).
- Plafond d'XP par jour ; les séances et défis comptent seulement si validés par l'app (caméra du Défi House, GPS pour les pistes).
- Avertissement santé, repos conseillés.

## 5. Coachs
- **Le coach est payé sur place** par ses élèves, en direct. **Aucun paiement de coach dans l'application** (pas de séquestre, pas de retrait).
- **Espace coaching** : option payante en plus de l'abonnement client.
  - **1er mois gratuit**, puis **5 000 FCFA par mois**.
  - Un coach paie donc **10 000 FCFA par mois** (5 000 d'abonnement + 5 000 d'espace coaching) pour la plateforme complète.
  - En échange, les membres peuvent le trouver et le contacter.

## 6. Paliers
- Quelques paliers d'accès **libre** (à choisir) après des exercices d'initiation.
- Paliers supérieurs : minimum d'XP exigé, défis durs (ex. 3 pistes dans une soirée, un volume de pompes par jour).

## 7. Côté technique
- Les paiements passent par **Chariow** (déjà branché). Chariow n'a pas de prélèvement récurrent : le client repaie chaque mois.
- Prix variable (remise) : six produits Chariow à prix fixes (5 000 / 4 500 / 4 000 / 3 500 / 3 000 / 2 500), le serveur choisit celui qui correspond à la remise de performance du mois. L'espace coaching est un produit séparé.
- **Comptes utilisateurs + registre sur le serveur** nécessaires : date de fin d'abonnement, XP du mois, remise calculée. Sans cela, tout est modifiable dans le téléphone.
- Le code déjà écrit pour l'essai de 15 jours et les limites (3 pistes, 3 séances, 5 messages coach par jour) existe dans le projet, **non commité** ; à garder ou non selon la décision ci-dessous.

## 8. Aspects légaux
- Un abonnement avec remise de fidélité est beaucoup plus simple juridiquement qu'une monnaie échangeable.
- Si on passe sur Google Play / App Store, l'abonnement doit passer par leur système de paiement intégré ; l'APK direct permet le Mobile Money.

## 9. Questions ouvertes
1. ~~Plafond de la remise~~ : **50 %**, tranché.
2. Garde-t-on l'**essai gratuit de 15 jours** pour les clients (déjà codé) ?
3. Valide-t-on **500 XP = 1 heure** et le barème ci-dessus ?
4. Quels **paliers** sont libres ?

## 10. Ce qui est construit (27/11/2026)
- **Serveur** (`server/`, `npm run pay-server`, tests : `npm run pay-test`) : comptes (numéro + mot de passe, mot de passe jamais stocké en clair), sessions, registre d'XP **calculé par le serveur** avec quotas (par type et total par jour), bonus de performance (table ci-dessus) additionnés en remise 0-50 %, prix du mois, abonnement de 30 jours activé uniquement par une confirmation de paiement, données dans un fichier JSON (`DEK_DB`).
- **App** : création de compte / connexion dans l'écran d'abonnement, abonnement lu depuis le serveur, séances / pistes / Défi House / coach IA déclarés au serveur, essai gratuit de 15 jours, limites après l'essai (3 pistes, 3 séances, mode KO 60 s, 5 questions de coach par jour).
- **À faire** : créer les 5 produits Chariow manquants (4 500 / 4 000 / 3 500 / 3 000 / 2 500) et renseigner `CHARIOW_PRODUCT_IDS`, héberger le serveur en HTTPS, espace coaching, sauvegarde de la base (ou passage à PostgreSQL), mot de passe oublié (réinitialisation par SMS).
