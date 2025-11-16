# 📊 ProspectHub

Une application **professionnelle** et **moderne** pour gérer vos prospects commerciaux. Design Apple-inspired, recherche avancée, et expérience utilisateur exceptionnelle.

## ✨ Fonctionnalités

### Gestion des Prospects
- **Ajout/Modification/Suppression** de prospects
- **Import JSON** en masse
- **Export CSV** des prospects filtrés
- **Détection Intelligente** des sites web vs réseaux sociaux

### Recherche et Filtrage Avancés
- **🔍 Recherche Globale**: Recherche en temps réel sur tous les champs
- **📍 Filtre par Ville**: Sélecteur de ville dédié
- **🎯 Filtres Catégories**: À contacter, Site web, Contactés
- **📊 Tri Multi-critères**: Par nom, ville, note, ou date
- **↕️ Ordre Personnalisable**: Croissant ou décroissant

### Interface Moderne
- **🎨 Design Apple-inspired**: Gradients professionnels et animations fluides
- **📱 100% Responsive**: Parfait sur mobile, tablette et desktop
- **▦ Deux Modes d'Affichage**: Vue grille (cartes) ou vue tableau
- **⌨️ Raccourcis Clavier**: Navigation rapide pour utilisateurs avancés
- **🇫🇷 100% Français**: Interface entièrement en français

### Statistiques en Temps Réel
- Total prospects
- À contacter (priorité!)
- Avec site web
- Contactés

## ⌨️ Raccourcis Clavier

- **⌘K / Ctrl+K** → Rechercher
- **⌘N / Ctrl+N** → Nouveau prospect
- **⌘I / Ctrl+I** → Importer
- **ESC** → Fermer les formulaires

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

## 🆕 Nouvelles Fonctionnalités (v2.0)

### Recherche Avancée
- **Recherche Globale**: Tapez n'importe quoi pour rechercher dans tous les champs
- **Filtre par Ville**: Sélecteur dédié pour filtrer par localisation
- **Résultats en Temps Réel**: Mise à jour instantanée pendant la saisie
- **Compteur de Résultats**: Affiche le nombre de correspondances

### Raccourcis Clavier
Gagnez du temps avec ces raccourcis:
- `⌘K` ou `Ctrl+K` - Focus sur la recherche
- `⌘N` ou `Ctrl+N` - Nouveau prospect
- `⌘I` ou `Ctrl+I` - Importer des données
- `ESC` - Fermer les formulaires

### Export de Données
- **Export CSV**: Exportez vos prospects filtrés en un clic
- **Format Standard**: Compatible avec Excel, Google Sheets, etc.
- **Nom Auto**: Fichier daté automatiquement (ex: prospects_2025-11-15.csv)

### Affichage Multi-modes
- **Vue Grille (▦)**: Cartes modernes avec toutes les informations
- **Vue Tableau (☰)**: Tableau traditionnel compact
- Basculez facilement entre les deux modes

### Tri Avancé
Triez vos prospects par:
- Nom (A-Z ou Z-A)
- Ville (A-Z ou Z-A) 
- Note (0-5 ou 5-0)
- Date (récent/ancien)

### Design Amélioré
- **Gradients Modernes**: Cartes avec dégradés professionnels
- **Animations Fluides**: Transitions douces et élégantes
- **Responsive**: Parfait sur mobile, tablette et desktop
- **Thème Apple**: Design inspiré des meilleures applications

