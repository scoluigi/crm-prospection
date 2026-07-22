# Configuration Turso (Base de Données Persistante)

Turso est une base de données SQLite managée et distribuée. C'est la meilleure option pour la production car :
- ✅ Persistance garantie (pas de réinitialisation à chaque déploiement)
- ✅ SQLite compatibilité 100% (zéro changement de code)
- ✅ Replication mondiale (faible latence)
- ✅ Gratuit pour commencer (5GB/mois)

## 🚀 Étape 1 : Créer une Base Turso

### Via Interface Web (Recommandé)
1. Aller sur https://turso.tech
2. Créer un compte (gratuit)
3. Cliquer "Create Database"
4. Nommer la base : `crm-prospection`
5. Sélectionner région la plus proche

### Via Turso CLI
```bash
# Installer
npm install -g @tursodatabase/cli

# Login
turso auth login

# Créer la base
turso db create crm-prospection

# Copier la connection string
turso db show crm-prospection
```

## 🔑 Étape 2 : Obtenir les Credentials

### Connection String
```bash
turso db show crm-prospection
# Copier la ligne "URL:"
# Format : libsql://YOUR_DB.turso.io
```

### Token d'Authentification
```bash
turso db tokens create crm-prospection
# Copier le token (commence par "eyJ...")
```

## ⚙️ Étape 3 : Configurer Vercel

### Via Interface Vercel
1. Aller dans **Project Settings > Environment Variables**
2. Ajouter `DATABASE_URL` = `libsql://YOUR_DB.turso.io?authToken=YOUR_TOKEN`
3. Ajouter `TURSO_CONNECTION_TOKEN` = `YOUR_TOKEN` (optionnel mais recommandé)
4. Cliquer "Save"
5. Redéployer (auto-détectée)

### Via Vercel CLI
```bash
vercel env add DATABASE_URL
# Entrer : libsql://YOUR_DB.turso.io?authToken=YOUR_TOKEN
```

## 📝 Étape 4 : Initialiser la Base

### Créer les Tables
```bash
# En local
DATABASE_URL="libsql://YOUR_DB.turso.io?authToken=YOUR_TOKEN" npm run db:push

# Ou depuis n'importe quel machine avec Node
npx tsx scripts/migrate.ts
```

### Charger les Données de Démo
```bash
DATABASE_URL="libsql://YOUR_DB.turso.io?authToken=YOUR_TOKEN" npm run db:seed
```

## ✅ Vérification

### Tester Localement
```bash
# .env local
DATABASE_URL="libsql://YOUR_DB.turso.io?authToken=YOUR_TOKEN"

npm run dev
# L'app devrait démarrer avec Turso
```

### Vérifier sur Vercel
1. Déployer une nouvelle version
2. Vérifier les logs de build
3. Tester le login sur URL live
4. Vérifier que les données persistent après redéploiement

## 🔍 Debugging

### Voir les Tables
```bash
turso db shell crm-prospection

# Lister les tables
.tables

# Voir le schema
.schema prospects

# Exécuter une requête
SELECT COUNT(*) FROM prospects;
```

### Voir les Logs Vercel
```bash
vercel logs
```

### Voir les Logs Build
Vercel → Deployments → Voir l'historique des erreurs

## 🚨 Problèmes Courants

### "Unauthorized: AuthToken is invalid"
- Vérifier que le token dans DATABASE_URL est correct
- Régénérer : `turso db tokens create crm-prospection`

### "Database does not exist"
- Vérifier le nom de la base dans la URL
- S'assurer que la base a été créée sur turso.tech

### "Connection timeout"
- Vérifier la connexion internet
- Essayer une région Turso plus proche

### Données vides après migration
- Vérifier que `npm run db:seed` s'est exécuté
- Vérifier les tables avec `turso db shell`

## 💾 Backup & Restore

### Exporter la Base
```bash
turso db dump crm-prospection > backup.sql
```

### Restaurer
```bash
turso db shell crm-prospection < backup.sql
```

## 🗺️ Regions Disponibles

- `ams` - Amsterdam (Europe)
- `cdg` - Paris (Europe)
- `iad` - Virginie (US East)
- `lax` - Los Angeles (US West)
- `syd` - Sydney (Australie)
- Et bien d'autres...

Choisir la région la plus proche pour minimiser la latence.

## 📊 Monitoring

Voir les stats sur https://app.turso.tech :
- Requêtes par jour
- Espace utilisé
- Latence
- Replicas actifs

## 🔐 Sécurité

✅ **Bonnes pratiques** :
- Token dans variables d'environnement (jamais en git)
- HTTPS obligatoire (automatique avec Turso)
- Pas d'accès direct sans token
- Audit logs disponibles

## 💰 Tarification

**Plan Gratuit** :
- 5 GB stockage
- Lectures/écritures illimitées
- 1 locations (région)
- Parfait pour démarrer

**Plan Pro** :
- Stockage illimité
- Scaling automatique
- Replicas multiples
- Support prioritaire

---

## ✨ Prochaines Étapes

1. ✅ Créer la base Turso
2. ✅ Configurer Vercel
3. ✅ Deployer l'app
4. ✅ Tester la persistance
5. (Optionnel) Ajouter monitoring/alertes

---

Turso + Vercel = Production-ready, scalable, gratuit (ou très peu cher) ! 🚀
