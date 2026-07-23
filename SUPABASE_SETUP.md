# 🚀 Setup Supabase PostgreSQL pour le CRM

## 3 étapes simples (2 minutes)

### 1️⃣ Créer un projet Supabase

Visite : https://app.supabase.com/projects

- Clique **"New Project"**
- Nom : `crm-prospection`
- Password: `futurriche540000@`
- Region : `Europe (eu-west-1)`
- Clique **"Create new project"** → **Attends 2 min**

### 2️⃣ Copier la DATABASE_URL

Une fois créé (Settings → Database → Connection string):
```
postgresql://postgres:PASSWORD@db.PROJECT_ID.supabase.co:5432/postgres
```

### 3️⃣ Configure Vercel Environment Variables

Dans https://vercel.com/dashboard → ton projet → Settings → Environment Variables

Ajoute :
```
DATABASE_URL = postgresql://postgres:futurriche540000@db.YOUR_PROJECT_ID.supabase.co:5432/postgres
```

C'est tout ! Les migrations et seed data se lancent automatiquement au déploiement.
