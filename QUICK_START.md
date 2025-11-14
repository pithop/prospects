# 🚀 Quick Start - ProspectHub

## En 5 Minutes Chrono

### 1️⃣ Prérequis (2 min)

```bash
# A. Installer Node.js si pas déjà fait
# Télécharger: https://nodejs.org (version 16+)

# B. Créer un compte Supabase GRATUIT
# https://supabase.com → Sign up
```

### 2️⃣ Setup Local (2 min)

```bash
cd prospects

# Copier le fichier de configuration
cp .env.example .env.local

# ❌ NE PAS oublier: Remplir .env.local avec vos clés Supabase!
# NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
# NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...

# Installer les dépendances
npm install

# Lancer le serveur
npm run dev

# ✅ Ouvrir http://localhost:3000
```

### 3️⃣ Supabase Setup (1 min)

**Dans votre dashboard Supabase:**

1. SQL Editor → "New Query"
2. Copier le contenu de `supabase_setup.sql`
3. Coller et exécuter
4. ✅ Table créée + RLS configuré

### 4️⃣ Importer Vos Données

1. Cliquer le bouton **📥 Importer**
2. Sélectionner votre fichier JSON
3. Cliquer **📥 Importer**
4. ✅ Prospects importés!

### 5️⃣ Déployer sur Vercel (GRATUIT)

```bash
# Pousser sur GitHub
git add .
git commit -m "Production ready"
git push

# Sur https://vercel.com
# - New Project
# - Import GitHub repo
# - Add Environment Variables:
#   - NEXT_PUBLIC_SUPABASE_URL
#   - NEXT_PUBLIC_SUPABASE_ANON_KEY
# - Deploy

# ✅ Votre app est LIVE! 🎉
```

---

## 📦 Fichiers Important

| Fichier | Purpose |
|---------|---------|
| `pages/index.js` | Interface React (l'app!) |
| `pages/api/` | Backend API endpoints |
| `supabase_setup.sql` | Database setup |
| `.env.local` | Vos secrets Supabase |
| `README.md` | Documentation complète |

---

## 🎯 Cas d'Usage Typique

**Scénario:** Vous avez 500 prospects en JSON

1. Export données → `prospects.json`
2. Ouvrir app locale → `http://localhost:3000`
3. **📥 Importer** → Sélectionner `prospects.json`
4. ✅ 500 prospects chargés!
5. **🎯 Filtrer** → "À Contacter" = les meilleurs leads
6. **✓ Marquer** → Click pour marquer comme contacté
7. **Deploy** → Vercel → Share link avec équipe

---

## ⚠️ Problèmes Courants

**"Table prospects not found"**
→ Exécuter `supabase_setup.sql` dans Supabase

**"Cannot read properties of undefined"**
→ Vérifier `.env.local` → clés correctes?

**Import échoue**
→ Fichier < 10MB? Format JSON valide?

---

## 📞 Besoin d'aide?

1. Lire `README.md` → Doc complète
2. Vérifier `supabase_setup.sql` → SQL setup
3. Vérifier `.env.example` → Variables needed

---

## ✅ Checklist Avant Deploy

- [ ] `.env.local` rempli (Supabase clés)
- [ ] `supabase_setup.sql` exécuté dans Supabase
- [ ] `npm run build` = ✓ Compiled successfully
- [ ] Test local: `npm run dev` → http://localhost:3000 fonctionne
- [ ] Données importées (au moins 1 prospect)
- [ ] Repo push sur GitHub
- [ ] Vercel project créé
- [ ] Environment variables dans Vercel

---

**Prêt? C'est parti! 🚀**
