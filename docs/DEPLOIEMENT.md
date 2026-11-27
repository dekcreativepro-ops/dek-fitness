# Mettre le serveur DEK en ligne

Le serveur (`server/`) gère les comptes, les XP, les bonus de performance et les paiements. Il ne dépend d'aucune bibliothèque : seulement Node. Il doit tourner **en ligne, en HTTPS**, avec un **disque permanent** pour la base des comptes.

## Option conseillée pour la bêta : Render (environ 7 $ par mois)
1. Crée un compte sur [render.com](https://render.com) et relie ton compte GitHub (`dekcreativepro-ops`).
2. **New +** → **Blueprint** → choisis le dépôt `dek-fitness`, branche `design/refonte-studio`. Render lit `render.yaml` et prépare le service `dek-server` avec un disque de 1 Go.
3. Dans le tableau de bord du service, **Environment**, renseigne les secrets (ils ne vont jamais dans GitHub) :
   - `CHARIOW_API_KEY` : ta clé `sk_…` ;
   - `CHARIOW_PRODUCT_IDS` : `{"5000":"prd_6jdmeofl","4500":"prd_…","4000":"prd_…","3500":"prd_…","3000":"prd_…","2500":"prd_…"}` (les 5 autres produits sont à créer) ;
   - `CHARIOW_PULSE_SECRET` : le secret `whsec_…` donné à l'étape 5.
4. Render donne une adresse du type `https://dek-server.onrender.com`. Vérifie que `https://…/health` répond `{"ok":true,…}`.
5. Dans Chariow : **Automatisations → Pulses → Ajouter**, adresse `https://…/webhook/chariow`, événements de vente réussie, échouée et abandonnée. Copie le secret dans `CHARIOW_PULSE_SECRET` (étape 3) et redéploie.
6. Dans l'app, mets `VITE_PAYMENT_API_URL=https://…` (fichier `.env.local`) et recompile l'APK (voir `docs/APPLICATION-MOBILE.md`).

Autres hébergeurs possibles : Railway, Fly.io, ou un petit serveur (VPS) avec Docker : `docker build -f server/Dockerfile -t dek-server .` puis `docker run -d -p 8788:8788 -v dek-data:/data --env-file .env dek-server`, derrière un proxy HTTPS (Caddy, nginx).

## Sauvegardes (obligatoires)
La base est un fichier : si le disque est perdu, tous les comptes et abonnements le sont aussi.
- `node server/backup.mjs` copie la base avec la date et garde les 30 dernières copies.
- Lance-le chaque jour (tâche planifiée de l'hébergeur, ou cron) **et copie régulièrement le dossier `backups` ailleurs** (autre service, ton PC).
- Pour restaurer : arrête le serveur, remplace `db.json` par la copie, relance.
- Quand tu dépasses quelques centaines d'utilisateurs, passe à une vraie base (PostgreSQL).

## Sécurité à vérifier avant d'inviter des testeurs
- Les clés `sk_…` et `whsec_…` ne doivent exister que dans les variables d'environnement de l'hébergeur.
- `ALLOWED_ORIGIN` : `*` accepte toutes les origines ; c'est acceptable pour la bêta, à resserrer ensuite.
- Le serveur bloque 5 essais de mot de passe ratés (10 minutes) mais n'a pas de limite générale de requêtes : place-le derrière le proxy de l'hébergeur, qui en offre une.
- Il n'y a pas encore de « mot de passe oublié » : en attendant, tu réinitialises à la main (voir la liste de ce qui manque pour la bêta).
