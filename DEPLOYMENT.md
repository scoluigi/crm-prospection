# 🚀 Déploiement du CRM Prospection sur Vercel + Supabase

## ✅ Statut Actuel
- ✓ Code compilé et testable en local
- ✓ PostgreSQL migrations générées automatiquement
- ✓ Seed data (30 prospects) prêt à déployer
- ⏳ En attente : Configuration Supabase + Vercel

---

## 🎯 3 Étapes pour Lancer le CRM en Production

### Étape 1️⃣ : Créer une Base Supabase (2 min)

**Visite :** https://app.supabase.com/projects

1. Clique **"New Project"**
2. Remplis :
   - **Nom** : `crm-prospection`
   - **Password** : `futurriche540000@`
   - **Region** : `Europe (eu-west-1)` ← IMPORTANT
3. Clique **"Create new project"**
4. ⏳ Attends 2 minutes que le projet soit créé

### Étape 2️⃣ : Copier la CONNECTION STRING (30 sec)

Une fois le projet créé :

1. Va dans **Settings → Database**
2. Clique l'onglet **"Connection Pooling"**
3. Sélectionne le mode **"Session"**
4. Copie l'URL complète (ressemble à ça) :
   ```
   postgresql://postgres.ABC123DEF:[PASSWORD]@db.ABC123DEF.supabase.co:6543/postgres
   ```

### Étape 3️⃣ : Configurer Vercel (1 min)

**Visite :** https://vercel.com/dashboard → Ton Projet → Settings

1. Va dans **Environment Variables**
2. Ajoute une nouvelle variable :
   - **Nom** : `DATABASE_URL`
   - **Valeur** : Colle l'URL de Supabase (Étape 2)
3. Clique **"Save"**
4. Redéploie : **Deployments → Redeploy**

---

## ✨ C'est Fait !

Après 2-3 minutes, l'app va :
- ✅ Créer toutes les tables PostgreSQL
- ✅ Seeder 30 prospects de test
- ✅ Être prête à l'emploi

**Visite :** https://crm-prospection-5ralpijr7-luigisacco.vercel.app

### 🔑 Comptes de Test
```
Email : N'importe quel email
Password : (Accès libre - pas besoin de mot de passe)
```

---

## 🛠️ Troubleshooting

**"Application error"** ?
→ Vérifie que `DATABASE_URL` est bien dans Vercel Environment Variables

**Migrations ne s'appliquent pas** ?
→ Check que la connection string est correcte et que Supabase est prêt

**Besoin de réinitialiser** ?
→ Dans Supabase SQL Editor, exécute :
```sql
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
```

---

## 📊 Ce qui Est Inclus

✓ Dashboard avec stats 
✓ Gestion 30 prospects
✓ Pipeline Kanban
✓ Module appels & follow-up
✓ Tâches quotidiennes
✓ Vue équipe
✓ Import CSV
✓ Libre accès (pas d'auth)

**Le CRM est maintenant prêt pour la production !** 🎉
