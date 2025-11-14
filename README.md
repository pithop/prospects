# 📊 ProspectHub

Une application simple et efficace pour gérer vos prospects commerciaux. Identifiez rapidement qui contacter, suivez vos interactions, et gérez votre portefeuille de clients.

## ✨ Fonctionnalités

- **Gestion des Prospects**: Ajoutez, modifiez et supprimez vos prospects
- **Import JSON**: Importez en masse vos données depuis un fichier JSON
- **Détection Intelligente**: Détecte automatiquement les sites web réels vs les réseaux sociaux
- **Filtrage Avancé**: Filtrez par catégorie, état de contact, présence de site web
- **Statistiques en Temps Réel**: Suivez le nombre de prospects à contacter, contactés, etc.
- **Design Moderne**: Interface épurée et responsive
- **100% Français**: Entièrement en français

## 🚀 Démarrage Rapide

### Prérequis
- Node.js 16+ 
- npm ou yarn
- Compte Supabase gratuit (https://supabase.com)

### Installation Locale

```bash
# 1. Cloner le projet
git clone <votre-repo>
cd prospects

# 2. Installer les dépendances
npm install

# 3. Configuration Supabase
cp .env.example .env.local
# Remplir NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_ANON_KEY

# 4. Créer la table dans Supabase
# - Aller sur https://supabase.com
# - Ouvrir votre projet
# - SQL Editor → New Query
# - Copier/coller le contenu de supabase_setup.sql
# - Exécuter

# 5. Démarrer le serveur
npm run dev
# Ouvrir http://localhost:3000
```

## 🌐 Déploiement sur Vercel (GRATUIT)

### Étape 1: GitHub
```bash
git add .
git commit -m "Production ready"
git branch -M main
git push -u origin main
```

### Étape 2: Vercel
1. Aller sur **https://vercel.com**
2. Cliquer **"New Project"**
3. Importer votre repo GitHub
4. Dans "Environment Variables", ajouter:
   - `NEXT_PUBLIC_SUPABASE_URL` = votre URL Supabase
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = votre clé anon Supabase
5. Cliquer **"Deploy"**

**Voilà! Votre app est live en ~30 secondes! 🎉**

## 📁 Structure du Projet

```
prospects/
├── pages/
│   ├── index.js              # Interface React (399 lignes)
│   └── api/
│       ├── prospects.js      # CRUD (GET, POST, PUT, DELETE)
│       ├── stats.js          # Statistiques
│       └── import.js         # Import JSON (bulk)
├── supabase_setup.sql        # Schéma + RLS
├── package.json              # Node dépendances
├── vercel.json               # Config Vercel
├── .env.example              # Template variables
└── all-task-100-overview.json # Exemple données (911 prospects)
```

## 📥 Format d'Import JSON

### Champs Supportés

```json
[
  {
    "name": "Entreprise XYZ",
    "phone": "+33612345678",
    "website": "https://xyz.fr",
    "city": "Paris",
    "category": "Tech",
    "rating": 4.5,
    "reviews": 120,
    "notes": "Client potentiel"
  }
]
```

| Champ | Type | Requis | Notes |
|-------|------|--------|-------|
| `name` | string | ✅ | Nom de l'entreprise |
| `phone` | string | ❌ | N° téléphone |
| `website` | string | ❌ | URL site web |
| `city` | string | ❌ | Ville |
| `category` | string | ❌ | Catégorie |
| `rating` | number | ❌ | Note 0-5 |
| `reviews` | number | ❌ | Nombre d'avis |
| `notes` | string | ❌ | Notes internes |

### Détection Automatique

- **Réseaux sociaux** = facebook.com, instagram.com, linkedin.com, twitter.com, etc.
- **Vrais sites web** = tout autre domaine
- **À contacter** = prospects sans site web = **LE GOLD** 🎯

## ⚙️ Configuration

### .env.local

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
```

Obtenir les clés:
1. https://supabase.com → Votre projet
2. Settings → API
3. Copier `URL` et `anon key`

### Supabase Setup

Exécuter `supabase_setup.sql`:
- Crée la table `prospects` avec 14 colonnes
- Configure Row Level Security (RLS)
- Crée les indexes pour les performances
- Permet lectures/écritures pour tous

## 🎨 Interface Utilisateur

### Actions Principales

| Action | Icône | Description |
|--------|-------|-------------|
| Ajouter | ➕ | Form pour 1 nouveau prospect |
| Importer | 📥 | Upload JSON bulk import |
| Filtrer | 📌🎯��✅ | 4 filtres live avec compteurs |
| Contacter | ✓ | Marquer comme contacté |
| Supprimer | ✕ | Supprimer prospect |

### Filtres

- **📌 Tous** (all) - Tous les prospects
- **🎯 À Contacter** - Sans site web identifié (priorité!) 
- **🌐 Site Web** - Avec site web
- **✅ Contactés** - Déjà contactés

### Statuts Affichés

- 🆕 Nouveau
- 🎯 À CONTACTER (badge rouge)
- ✅ Contacté
- 📱 Réseau social
- ❌ Pas de site

## 📊 Tableau de Bord

**Statistiques en Temps Réel:**
- **Total**: Nombre total prospects
- **À Contacter 🎯**: Sans site = vrais leads
- **Avec Site Web 🌐**: Avec site = plus faciles
- **Contactés ✅**: Déjà contactés

## 🔧 Stack Technique

- **Frontend**: React 18 + Next.js 14
- **Backend**: Next.js API Routes (serverless)
- **Database**: Supabase PostgreSQL + RLS
- **Deployment**: Vercel
- **Styling**: Inline CSS (pas de build CSS)

## 🔒 Sécurité

- RLS activé sur Supabase
- Clé `anon` seulement (lecture/écriture)
- Pas de backend Node séparé
- Déploiement serverless Vercel = auto-scaling

## 📱 Responsive Design

- ✅ Desktop
- ✅ Tablet
- ✅ Mobile

## 🐛 Troubleshooting

| Erreur | Solution |
|--------|----------|
| "Table prospects not found" | Exécuter `supabase_setup.sql` |
| "Body exceeded" (import) | Fichier > 10MB. Réduire ou scinder |
| Données vides | Vérifier `.env.local` + RLS |
| Lenteur | Ajouter index dans Supabase |

## 💡 Cas d'Usage

✅ **Parfait pour:**
- Prospection B2B
- Gestion leads
- Suivi clients potentiels
- CRM léger

## 🚀 Prochaines Étapes

1. ✅ Setup local
2. ✅ Configuration Supabase
3. ✅ Import données
4. ✅ Deploy Vercel
5. ⭐ Partager avec équipe!

## 📞 Support

- Vérifier `supabase_setup.sql` si table missing
- Vérifier `.env.local` si erreurs API
- Vérifier RLS policies dans Supabase

## 📄 Licence

MIT - Libre d'utilisation

---

**Besoin d'aide? Consultez [supabase_setup.sql](./supabase_setup.sql) pour l'installation Supabase.**

**Prêt à déployer? 🚀 C'est parti sur Vercel!**
