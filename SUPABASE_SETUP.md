# Setup Supabase - 5 minutes ⚡

## 1️⃣ Créer un compte (2 min)

Aller sur → https://app.supabase.com/sign-up

Authentifier avec : GitHub / Google / Email

## 2️⃣ Créer un projet (2 min)

1. Dashboard → "New Project"
2. Nom : `crm-prospection`
3. Database Password : garder celui généré
4. Region : choisir la plus proche (Europe si possible)
5. Cliquer "Create new project"
6. **Attendre 2-3 min** (provisioning...)

## 3️⃣ Obtenir la Connection String (1 min)

Une fois le projet créé :

1. Aller dans **Settings** (bas à gauche)
2. Cliquer **Database**
3. Aller dans l'onglet **Connection pooling**
4. Copier la string qui commence par `postgresql://`

Format :
```
postgresql://postgres:[PASSWORD]@[HOST]:6543/postgres
```

## 4️⃣ Me donner la connection string

Copie-la ici (privatement) et je configure tout le reste !

```
DATABASE_URL = postgresql://postgres:...
```

---

## ✅ C'est tout !

Pas de CLI, pas de token, juste PostgreSQL standard.
