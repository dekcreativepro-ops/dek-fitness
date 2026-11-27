# Serveur DEK (comptes, XP, paiements). Aucune dépendance : seulement Node.
# Construire depuis la racine du projet :  docker build -f server/Dockerfile -t dek-server .
FROM node:22-alpine
WORKDIR /app
COPY server/ ./server/
# La base des comptes vit dans /data : monte-y un disque permanent, sinon tout est perdu à chaque redémarrage.
ENV DEK_DB=/data/db.json PORT=8788 NODE_ENV=production
VOLUME ["/data"]
EXPOSE 8788
USER node
CMD ["node", "server/payments-proxy.mjs"]
