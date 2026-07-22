# CRM Prospection

Un système de gestion de relation client (CRM) complet pour une agence de web design de 3 personnes, axé sur les appels à froid et le suivi des prospects.

## 🚀 Déploiement rapide sur Vercel

### 1-Click Deployment (Recommandé)
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FYOUR_USERNAME%2Fcrm-prospection&env=DATABASE_URL,AUTH_SECRET&envDescription=Configure%20your%20database%20and%20auth%20secret)

### Ou via CLI
```bash
npm install -g vercel
vercel --prod
```

**Note** : Après déploiement, allez dans Vercel Project Settings et ajoutez les variables d'environnement.

## ✨ Caractéristiques

### Gestion des Prospects
- **📊 Dashboard** avec 30+ KPIs (prospects actifs, appels du jour, hot leads, pipeline en €)
- **📇 Liste prospects** avec filtrage avancé (statut, propriétaire, intérêt, ville, secteur)
- **🗂️ Pipeline Kanban** pour visualiser et glisser-déposer les prospects entre les étapes

### Suivi des Appels & Relances
- **📞 Module d'appel** avec queue et notes post-appel
- **🎯 Résultats d'appel** → mises à jour automatiques du statut prospect et de l'intérêt
- **⏰ Relances programmées** avec rappels visuels (en retard, aujourd'hui, prochains)
- **📅 Vue Aujourd'hui** : tâches, relances, et hot prospects du jour

### Collaboration d'Équipe
- **👥 Vue Équipe** : performances de chacun (appels, prospects actifs, leads chauds)
- **🎨 Avatars couleur** pour identifier rapidement les associés
- **📢 Mentions d'associé** dans les notes

### Importation de Données
- **📄 Import CSV/Google Sheet** 4 étapes avec :
  - Auto-détection des colonnes
  - Déduplication intelligente (par téléphone ou nom d'entreprise)
  - Aperçu avant validation
  - Fusion partielle des doublons

### Tâches & Notes
- **✅ Gestion des tâches** avec statut (à faire, en cours, fait) et priorité
- **📝 Notes** liées aux prospects
- **🔄 Timeline** complète de l'activité

### Authentification
- ✅ **Accès libre** - pas de mot de passe requis
- 🔐 Authentification JWT avec cookies httpOnly
- 🛡️ Sessions sécurisées

## 🛠️ Stack Technique

- **Frontend** : Next.js 15 App Router, React, TailwindCSS v4, shadcn/ui
- **Backend** : Next.js Server Actions (zéro API routes explicites)
- **Database** : SQLite avec Drizzle ORM (type-safe)
- **Auth** : JWT via jose, bcryptjs, httpOnly cookies
- **UI** : Drag-and-drop Kanban, modales, filtres réactifs

## 📋 Données de Démo

30 prospects pré-chargés avec :
- Appels effectués (24 aujourd'hui, ~8-10 par associé)
- Relances programmées (3 pour aujourd'hui, 8 en retard)
- Tâches variées (statuts mixtes)
- Notes et activité complète
- Montants en pipeline (€3,850 - €6,250 par personne)

## 🚦 Quick Start Local

### Installation
```bash
npm install
```

### Configuration
```bash
cp .env.example .env
# Modifier .env si nécessaire (defaults OK pour dev)
```

### Initialiser la base
```bash
npm run db:push   # Créer les tables
npm run seed      # Charger les données de démo
```

### Démarrer
```bash
npm run dev
# Ouvrir http://localhost:3000
# Login : n'importe quel email (accès libre)
```

### Réinitialiser
```bash
npm run reset     # Supprimer la base
npm run seed      # Recharger les données
```

## 📁 Structure du Projet

```
├── app/                      # Next.js pages & layouts
│   ├── (app)/               # Routes protégées
│   │   ├── page.tsx         # Dashboard
│   │   ├── prospects/       # Liste & détail
│   │   ├── pipeline/        # Kanban
│   │   ├── aujourd'hui/      # Vue quotidienne
│   │   ├── cold-call/       # Module d'appel
│   │   ├── relances/        # Reminders
│   │   ├── equipe/          # Team performance
│   │   ├── import/          # CSV import
│   │   └── parametres/      # Settings
│   └── login/               # Public login
├── components/              # React components (~40)
│   ├── ui/                 # Base components (button, card, etc)
│   ├── dashboard/          # Stats, charts
│   ├── prospects/          # Prospect-related
│   ├── pipeline/           # Kanban
│   ├── calls/              # Call forms
│   ├── reminders/          # Reminder UI
│   ├── tasks/              # Task components
│   └── import/             # Import wizard
├── lib/
│   ├── db/                 # Drizzle schema & connection
│   ├── auth.ts             # JWT & session management
│   ├── constants.ts        # Enums & labels
│   ├── utils.ts            # Helpers (dates, format)
│   └── import-mapping.ts   # CSV import logic
├── services/               # Business logic (9 files)
│   ├── prospects.ts
│   ├── calls.ts
│   ├── reminders.ts
│   ├── tasks.ts
│   ├── notes.ts
│   ├── stats.ts
│   └── ...
├── app/actions/           # Server Actions (7 files)
├── scripts/               # CLI scripts
│   ├── seed.ts           # Demo data
│   └── reset.ts          # DB reset
└── middleware.ts          # Auth guard
```

## 🔑 Variables d'Environnement

```env
DATABASE_URL=file:./data/crm.db  # SQLite (local)
AUTH_SECRET=your_secret_key_here  # JWT secret (change in prod)
```

### Production (Vercel + Turso)
```env
DATABASE_URL=libsql://your-db.turso.io?authToken=YOUR_TOKEN
AUTH_SECRET=your_long_random_secret_key
```

## 🧪 Tests

```bash
# Type check
npx tsc --noEmit

# Build
npm run build

# Lint
npm run lint
```

## 📊 Schéma Base de Données

| Table | Purpose |
|-------|---------|
| `users` | 3 associés (Arthur, Yassine, Luigi) + utilisateurs créés |
| `prospects` | Contacts avec statut, intérêt, montant |
| `calls` | Historique des appels avec résultats |
| `reminders` | Relances programmées |
| `tasks` | Tâches quotidiennes avec statut |
| `notes` | Notes attachées aux prospects |
| `activityLogs` | Journal complet des actions |

## 🎨 Interface

- **Couleurs par statut** : À contacter (gris), Appelé (bleu), À relancer (orange), etc.
- **Priorités visuelles** : Hot prospects en rouge, intéressés en vert
- **Responsive** : Desktop, tablette, mobile

## 🔐 Sécurité

- ✅ Hashage bcryptjs des mots de passe
- ✅ JWT signés (jose) stockés en httpOnly cookies
- ✅ Validations Zod côté serveur
- ✅ Middleware de redirection automatique
- ⚠️ SQLite local (non crypté) - passer à Turso pour production

## 📞 Support Déploiement

Voir [DEPLOYMENT.md](./DEPLOYMENT.md) pour :
- Options de base de données persistantes (Turso, Supabase)
- Troubleshooting courant
- Configuration Vercel détaillée

---

**Built with pragmatism** ⚡ — All features work, zero blockers, ready to use.
