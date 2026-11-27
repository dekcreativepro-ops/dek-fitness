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
- **Serveur** (`npm run pay-server`) : endpoints `/pay`, `/status/:ref`, `/webhook`. Le prix est fixé côté serveur. Les fournisseurs `demo` et `chariow` sont écrits (voir plus bas) ; d'autres s'ajoutent dans la table `providers`.

## À faire avant de vendre pour de vrai
1. **Comptes utilisateurs + serveur de vérité** : aujourd'hui l'état Premium est gardé dans le téléphone (`dek_premium_v1`), donc modifiable. En production, le serveur doit enregistrer « ce compte est Premium jusqu'au… » et l'app doit le lire de là.
2. **Activer Chariow** avec ton compte (voir « Paiement via Chariow ») ou brancher un autre fournisseur.
3. **Renouvellement** : le Mobile Money ne prélève pas automatiquement de façon fiable. Le modèle retenu est un mois prépayé, avec rappel avant expiration (notification / SMS / WhatsApp) et paiement en un clic.
4. **Règles des boutiques** (voir plus bas).

## Paiement via Chariow (intégré, à activer avec ton compte)
Le code est écrit d'après la [documentation développeur de Chariow](https://help.chariow.com/fr/articles/259-documentation-developpeur-and-api) (chariow.dev) et **testé contre un faux Chariow** (`node server/payments-proxy.test.mjs`) ainsi que de bout en bout dans l'app. Il n'a **jamais été essayé avec un vrai compte Chariow**.

**Comment ça marche**
1. L'écran Premium demande numéro, e-mail et nom, puis appelle notre serveur (`POST /pay`).
2. Le serveur crée la vente chez Chariow (`POST /v1/checkout`) avec notre référence dans `custom_metadata`, et renvoie l'adresse de la page de paiement Chariow.
3. L'app ouvre cette page (navigateur intégré sur mobile) ; le client y choisit Mobile Money et paie.
4. Chariow prévient notre serveur (`POST /webhook/chariow`, événement `successful.sale`, signature HMAC-SHA256 vérifiée) ; l'app, qui interroge `/status`, active Premium. Si le webhook n'arrive pas, le serveur redemande l'état à Chariow (`GET /v1/sales/{id}`).

**Ce que tu dois faire côté Chariow**
1. Créer un compte vendeur et vérifier avec leur support : le **Cameroun**, **MTN MoMo et Orange Money**, et la devise **FCFA (XAF)** sont-ils pris en charge ? (La documentation ne le confirme pas.)
2. Créer un produit « DEK Premium » à 2 500 FCFA, de type **licence** (les autres types refusent un second achat : « already_purchased »). Noter son identifiant `prd_…`.
3. Créer une clé API (droits `checkout.write` et `sales.read`) : `sk_…`.
4. Créer un **Pulse** (Automatisation → Pulses) vers `https://TON-SERVEUR/webhook/chariow` pour l'événement `successful.sale` ; noter son secret `whsec_…`.

**Lancer le serveur**
```powershell
$env:PAYMENT_PROVIDER = 'chariow'; $env:CHARIOW_API_KEY = 'sk_...'; $env:CHARIOW_PRODUCT_ID = 'prd_...'; $env:CHARIOW_PULSE_SECRET = 'whsec_...'; npm run pay-server
```
Puis dans `.env.local` de l'app : `VITE_PAYMENT_API_URL=https://TON-SERVEUR` et reconstruire l'app / l'APK.

**Limites connues de Chariow (d'après sa documentation)**
- Page de paiement hébergée : pas d'envoi direct de la demande sur le téléphone du client.
- Pas d'abonnement récurrent documenté : chaque mois est un nouvel achat de 30 jours (c'est le modèle de l'app).
- Pas de mode test documenté : tester avec une vraie vente (le produit peut être mis à 100 FCFA le temps du test).
- Commission annoncée : 15 % (10 % après 5 000 $ de ventes), soit environ 375 FCFA sur 2 500 FCFA.
- Un autre agrégateur (Flutterwave, MeSomb, CinetPay…) coûte en général moins cher et peut envoyer la demande directement sur le téléphone : l'adaptateur se remplace dans `server/payments-proxy.mjs` sans toucher à l'app.

## Autres intermédiaires à comparer
[Flutterwave (Mobile Money francophone)](https://developer.flutterwave.com/reference/charge-via-francophone-mobile-money), MeSomb, SmobilPay / Maviance, CinetPay. Questions à leur poser : le Cameroun (MTN **et** Orange) est-il couvert ? Peut-on déclencher un paiement par API depuis notre serveur ? Quels frais exacts sur 2 500 FCFA ? Quel délai de reversement ? Faut-il une entreprise enregistrée ?

## Règles des boutiques (à vérifier avant publication)
- **APK installé directement** (lien de téléchargement, WhatsApp, site) : pas de règle de boutique, le Mobile Money est possible.
- **Google Play** : les abonnements à des fonctions numériques doivent en principe passer par Google Play Billing (des exceptions par pays existent).
- **App Store (iOS)** : les abonnements numériques doivent en principe passer par l'achat intégré d'Apple (commission 15–30 %). Un paiement Mobile Money dans l'app iOS risque d'être refusé.
