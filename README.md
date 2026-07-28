# CRM Prospection

CRM pour une petite agence de web design : suivi des prospects, appels à froid,
relances, tâches quotidiennes, pipeline Kanban et import CSV.

**En ligne :** https://crm-prospection-luigisacco.vercel.app (accès libre, sans mot de passe).

## Stack

- Next.js 15 (App Router, Server Actions)
- PostgreSQL (Supabase) via Drizzle ORM
- Auth JWT (jose) en cookie httpOnly
- Tailwind + Radix UI

## Démarrage local

```bash
npm install
cp .env.example .env   # renseigner DATABASE_URL et AUTH_SECRET
npm run db:push        # crée les tables
npm run db:seed        # données de démo (3 associés, 30 prospects)
npm run dev
```

## Variables d'environnement

| Nom            | Rôle                                             |
| -------------- | ------------------------------------------------ |
| `DATABASE_URL` | Connexion PostgreSQL (pooler Supabase, port 6543) |
| `AUTH_SECRET`  | Clé de signature des sessions JWT (≥ 16 car.)     |

## Scripts

| Commande           | Effet                          |
| ------------------ | ------------------------------ |
| `npm run dev`      | Serveur de développement       |
| `npm run build`    | Build de production            |
| `npm run db:push`  | Applique le schéma à la base   |
| `npm run db:seed`  | Insère les données de démo     |
| `npm run db:reset` | Vide la base                   |
