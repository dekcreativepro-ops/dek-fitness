# Abonnement DEK Premium

## Ce qui est en place
- **Prix** : 2 500 FCFA / mois (`PREMIUM_PRICE_FCFA` dans `src/utils/premium.ts`), période de 30 jours, sans engagement.
- **Gratuit pour tous** : coach personnel (IA locale), séances guidées, suivi, classement, Réseau, Défi House en duel, Outdoor (piste de départ, mode Mission 05h, GPS).
- **Réservé Premium** :
  - onglet **Tournoi** de Terrains & Santé (poules, tableau final, classements par discipline) ;
  - **Tournoi Défi House** (champion de zone) ;
  - **nouvelles pistes Outdoor** : bouton « Nouveau tracé », changement de ville, recherche de lieu ;
  - **modes Outdoor spéciaux** : Survie Checkpoint, Relais Escouade, Conquête Territoire, Duel Fantôme.
- **Écran d'abonnement** (`src/components/premium/PremiumSheet.tsx`) : ouvert quand on touche une fonction verrouillée ou depuis Profil → « Passer Premium ». Choix MTN MoMo / Orange Money (détecté d'après le numéro), numéro à 9 chiffres commençant par 6, validation sur le téléphone.
- **Paiement** (`src/utils/payments.ts`) :
  - sans `VITE_PAYMENT_API_URL` → **mode démo** (paiement simulé, aucun argent, l'écran l'indique) ;
  - avec `VITE_PAYMENT_API_URL` → l'app appelle notre serveur (`server/payments-proxy.mjs`), qui parle au fournisseur.
- **Serveur** (`npm run pay-server`) : endpoints `/pay`, `/status/:ref`, `/webhook`. Le prix est fixé côté serveur. Le fournisseur `demo` fonctionne ; `chariow`, `mesomb` et `flutterwave` sont des **gabarits à compléter** (non testés avec un vrai compte).

## À faire avant de vendre pour de vrai
1. **Comptes utilisateurs + serveur de vérité** : aujourd'hui l'état Premium est gardé dans le téléphone (`dek_premium_v1`), donc modifiable. En production, le serveur doit enregistrer « ce compte est Premium jusqu'au… » et l'app doit le lire de là.
2. **Choisir le fournisseur** et compléter son adaptateur dans `server/payments-proxy.mjs`.
3. **Renouvellement** : le Mobile Money ne prélève pas automatiquement de façon fiable. Le modèle retenu est un mois prépayé, avec rappel avant expiration (notification / SMS / WhatsApp) et paiement en un clic.
4. **Règles des boutiques** (voir plus bas).

## Passer par un intermédiaire (Chariow ou un autre)
Comme l'accès direct aux API d'Orange et MTN est réservé aux entreprises enregistrées, un intermédiaire encaisse pour nous et se paie une commission.

**Chariow** (recherches du 27/11/2026) :
- Plateforme de vente de produits digitaux, pensée pour l'Afrique ; support du Mobile Money dans « plus de 25 pays » africains ([pays pris en charge](https://help.chariow.com/fr/articles/68-dans-quels-pays-pouvez-vous-vendre-avec-chariow)). **Le Cameroun n'apparaît pas dans l'extrait que j'ai pu lire : à confirmer auprès de Chariow.**
- Commission : **15 % par vente**, 10 % au-delà de 5 000 $ de chiffre d'affaires, pas d'abonnement mensuel ([tarifs](https://chariow.com/pricing), [modèle de tarification](https://help.chariow.com/fr/articles/166-modele-de-tarification-sur-chariow)). Sur 2 500 FCFA, il reste environ **2 125 FCFA** (≈ 375 FCFA de frais).
- API : [documentation développeur](https://help.chariow.com/fr/articles/259-documentation-developpeur-and-api), référence sur chariow.dev, URL de base `https://api.chariow.com/v1`. Je n'ai **pas** pu confirmer les événements webhook ni la gestion d'abonnements récurrents.

**Autres pistes à comparer** (frais à vérifier chez chacun) : [Flutterwave (Mobile Money francophone)](https://developer.flutterwave.com/reference/charge-via-francophone-mobile-money), MeSomb, SmobilPay / Maviance, CinetPay. Les agrégateurs de paiement facturent en général nettement moins de 15 %.

**Questions à poser à chaque fournisseur** : le Cameroun (MTN **et** Orange) est-il couvert ? Peut-on déclencher un paiement par API depuis notre serveur (et pas seulement une page de vente) ? Quels frais exacts sur 2 500 FCFA ? Quel délai de reversement ? Y a-t-il une notification (webhook) de paiement réussi ? Faut-il une entreprise enregistrée ?

## Règles des boutiques (à vérifier avant publication)
- **APK installé directement** (lien de téléchargement, WhatsApp, site) : pas de règle de boutique, le Mobile Money est possible.
- **Google Play** : les abonnements à des fonctions numériques doivent en principe passer par Google Play Billing (des exceptions par pays existent).
- **App Store (iOS)** : les abonnements numériques doivent en principe passer par l'achat intégré d'Apple (commission 15–30 %). Un paiement Mobile Money dans l'app iOS risque d'être refusé. Alternatives : distribuer iOS via un autre canal, ou prévoir l'achat intégré Apple en plus.
