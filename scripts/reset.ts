/**
 * Réinitialise complètement la base : supprime le fichier SQLite et le recrée
 * avec le schéma à jour. Utile pendant le développement quand le schéma change.
 *
 * Usage : npm run db:reset
 */
import fs from "node:fs";
import path from "node:path";
import "./load-env";

const dbPath = path.resolve(process.cwd(), process.env.DATABASE_URL ?? "./data/crm.db");

for (const suffix of ["", "-shm", "-wal"]) {
  const file = `${dbPath}${suffix}`;
  if (fs.existsSync(file)) {
    fs.rmSync(file);
    console.log(`Supprimé : ${file}`);
  }
}

console.log("Base réinitialisée. Lance `npm run setup` pour recréer le schéma et les données de démo.");
