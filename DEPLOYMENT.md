# Déploiement sur Vercel

Ce CRM peut être déployé sur Vercel en quelques minutes. Voici les étapes :

## Option 1 : Déploiement rapide via GitHub

### 1. Créer un repository GitHub
```bash
git remote add origin https://github.com/YOUR_USERNAME/crm-prospection.git
git branch -M main
git push -u origin main
```

### 2. Connecter à Vercel
1. Allez sur [vercel.com](https://vercel.com)
2. Cliquez sur "New Project"
3. Sélectionnez votre repository GitHub
4. Vercel détectera automatiquement que c'est un projet Next.js
5. Cliquez sur "Deploy"

## Option 2 : Déploiement direct via Vercel CLI

### 1. Installer Vercel CLI
```bash
npm install -g vercel
```

### 2. Authentifier
```bash
vercel login
```

### 3. Déployer
```bash
vercel --prod
```

## Configuration de la Base de Données

### ⚠️ Important pour la Production

SQLite ne persiste pas sur Vercel (système de fichiers éphémère). Pour une utilisation en production, vous avez deux options :

#### Option A : Utiliser Turso (SQLite hébergé - Recommandé)
```bash
# 1. Créer un compte sur turso.tech
# 2. Installer la CLI
npm install -g @tursodatabase/cli

# 3. Créer une base de données
turso db create my-crm

# 4. Obtenir la connection string
turso db show my-crm

# 5. Mettre à jour dans Vercel (Settings > Environment Variables)
DATABASE_URL=libsql://your-db.turso.io?authToken=YOUR_TOKEN
```

#### Option B : Utiliser Supabase (PostgreSQL)
```bash
# Créer un compte sur supabase.com
# Créer un nouveau projet
# Copier la connection string PostgreSQL
# Ajouter à Vercel Environment Variables
```

## Variables d'Environnement Vercel

Allez dans **Projet Settings > Environment Variables** et ajoutez :

```
DATABASE_URL=file:./data/crm.db  (pour dev/preview)
AUTH_SECRET=votre_clé_secrète_très_longue_et_aléatoire
```

## Accès à l'Application

- **URL de production** : https://your-project.vercel.app
- **Login** : Accès libre - entrez simplement un email (ex: test@example.com)
- **Pas de mot de passe requis** - connexion instantanée

## Données de Démonstration

La base de données est pré-remplie avec :
- 30 prospects réalistes (4 depuis Google Sheet + 26 générés)
- 3 utilisateurs (Arthur, Yassine, Luigi)
- Appels, relances, notes, tâches pré-remplies
- Données prêtes à être testées

Pour réinitialiser la base de données localement :
```bash
npm run reset
npm run seed
```

## Troubleshooting

### "Module not found: better-sqlite3"
Cette dépendance native est compilée lors du build. Vercel gère cela automatiquement.

### Données effacées après déploiement
C'est normal avec SQLite. Passez à Turso ou Supabase pour la persistance.

### Erreur lors du login
- Vérifiez que `AUTH_SECRET` est défini dans Vercel
- Assurez-vous que la base de données existe

## Support

Pour toute question sur le déploiement :
- [Vercel Docs](https://vercel.com/docs)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Turso SQLite](https://docs.turso.tech)
