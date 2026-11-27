// Sauvegarde de la base des comptes :  node server/backup.mjs [dossier]
// Copie le fichier avec la date dans le nom et garde les 30 dernières copies. À lancer chaque jour (voir docs/DEPLOIEMENT.md).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const source = process.env.DEK_DB ?? path.join(here, 'data', 'db.json');
const dir = process.argv[2] ?? path.join(path.dirname(source), 'backups');

if (!fs.existsSync(source)) {
  console.error(`Base introuvable : ${source}`);
  process.exit(1);
}
JSON.parse(fs.readFileSync(source, 'utf8')); // refuse de « sauvegarder » un fichier abîmé
fs.mkdirSync(dir, { recursive: true });
const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const target = path.join(dir, `db-${stamp}.json`);
fs.copyFileSync(source, target);
const old = fs.readdirSync(dir).filter((f) => /^db-.*\.json$/.test(f)).sort().slice(0, -30);
for (const f of old) fs.rmSync(path.join(dir, f));
console.log(`Sauvegarde : ${target} (${old.length} ancienne(s) supprimée(s))`);
