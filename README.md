# 🏥 FHIR Clustering Web Application

Application web complète pour le clustering de données FHIR avec visualisations interactives et génération de rapports par LLM.

## 🚀 Stack Technologique

### Backend
- **FastAPI** : API REST moderne et performante
- **Celery** : Traitement asynchrone des jobs de clustering
- **Redis** : Message broker et cache
- **Python 3.12** : Langage principal
- **Pandas** : Traitement de données optimisé (C engine)
- **Matplotlib** : Génération de visualisations (PCA, heatmaps, dendrogrammes)

### Frontend
- **React 18** : Interface utilisateur réactive
- **TypeScript** : Type safety et sécurité des types
- **Vite** : Build tool ultra-rapide avec hot-reload
- **TailwindCSS** : Styling moderne et responsive
- **React Router** : Navigation SPA
- **ReactMarkdown** : Rendu des rapports LLM
- **html2pdf** : Export PDF des rapports

### Infrastructure
- **Docker Compose** : Orchestration des services avec gestion mémoire
- **Ollama** : Serveur LLM local (Qwen 2.5 3B Instruct)

## 📋 Prérequis

```bash
# Logiciels requis
- Docker Desktop 4.x+ (avec 6-8GB RAM alloués)
- Node.js 20+ (LTS)
- 8GB RAM minimum (16GB recommandé)
- 20GB espace disque libre

# Configurations Docker recommandées
- Memory: 6-8GB
- CPU: 4 cores minimum
- Swap: 2GB
```

## 🏗️ Structure du Projet

```
fhir-clustering-webapp/
├── docker-compose.yml          # Production - limites mémoire strictes
├── docker-compose.dev.yml      # Dev - hot-reload activé
├── start.sh                    # 🚀 Démarrage rapide production
├── start-dev.sh                # 🔥 Démarrage dev avec hot-reload
├── stop.sh                     # Arrêt propre des services
├── logs.sh                     # Logs centralisés
├── check.sh                    # Health checks complets
├── cleanup-docker.sh           # Nettoyage Docker (--soft/--hard)
├── backend/                    # API FastAPI
│   ├── Dockerfile
│   ├── requirements.txt
│   └── app/
│       ├── main.py            # Point d'entrée FastAPI
│       ├── config.py          # Configuration centralisée
│       ├── api/               # Endpoints REST
│       │   └── clustering.py  # API clustering + plots
│       ├── workers/           # Tasks Celery
│       └── services/          # Services métier (LLM)
├── frontend/                   # Application React
│   ├── package.json
│   ├── vite.config.ts
│   └── src/
│       ├── App.tsx
│       ├── pages/             # JobDetail, Dashboard, etc.
│       ├── components/        # ClusteringVisualizations
│       ├── services/          # API client
│       └── types/             # Types TypeScript (Plot, etc.)
├── fhir_clustering/           # Algorithmes de clustering
├── workflows/                 # Pipelines de traitement
│   └── terminology_layer.py  # Chargement optimisé OMOP (C engine)
├── terminology_omop/          # Vocabulaire médical (CSV ~158MB)
├── data/                      # Données patients FHIR (JSON)
└── results/                   # Jobs + visualisations PNG
    └── jobs/
        └── {job_id}/
            ├── k_mean/final/
            │   ├── plots/              # Visualisations KMeans
            │   └── hdbscan_in_kmeans/  # Clustering hiérarchique
            │       └── plots/
            └── hdbscan/final/
                └── plots/              # Visualisations HDBSCAN
```

## 🚀 Installation Rapide

### 1. Cloner et Préparer

```bash
# Cloner le repo
git clone https://github.com/samy-louchahi/fhir-clustering-webapp.git
cd fhir-clustering-webapp

# Vérifier que vous avez les dossiers requis :
ls -la fhir_clustering/ workflows/ terminology_omop/ data/
```

### 2. Télécharger le Modèle LLM

**Option A : Ollama natif (recommandé pour Mac/Linux)**
```bash
# macOS
brew install ollama

# Linux
curl -fsSL https://ollama.com/install.sh | sh

# Télécharger le modèle (3.4GB)
ollama pull qwen2.5:3b-instruct
```

**Option B : Via Docker**
```bash
./start.sh
docker-compose exec ollama ollama pull qwen2.5:3b-instruct
```

### 3. Démarrer l'Application

**Mode Production (recommandé)**
```bash
# Démarrage complet avec limites mémoire
./start.sh

# Vérifier le statut
./check.sh

# Voir les logs
./logs.sh
```

**Mode Développement (hot-reload)**
```bash
# Backend avec hot-reload (pour modifier le code Python)
./start-dev.sh

# Dans un autre terminal : Frontend
cd frontend
npm install
npm run dev
```

### 4. Accéder à l'Application

- **Frontend** : http://localhost:5173
- **API Documentation** : http://localhost:8000/docs
- **Health Check** : http://localhost:8000/health

## 📖 Utilisation

### 1. Créer une Job de Clustering

1. Ouvrir http://localhost:5173
2. Remplir le formulaire :
   - **Mode de Features** : `domain_rollup` (recommandé) ou `raw_codes`
   - **Nombre de Composantes PCA** : 30 (par défaut)
   - **Force recalcul** : Cocher pour ignorer le cache
3. Cliquer sur "Lancer le Clustering"

### 2. Suivre l'Exécution

- La page de détail s'affiche automatiquement
- Progression en temps réel :
  - **Building terminology** : Chargement OMOP (~158MB CSV avec C engine optimisé)
  - **Preprocessing** : Construction des features et PCA
  - **Tuning** : Optimisation des hyperparamètres (K-Means + HDBSCAN)
  - **Clustering** : Exécution finale des deux méthodes
  - **Génération des visualisations** : Création des plots PNG
- Durée : 5-15 minutes selon les données

### 3. Analyser les Résultats

Une fois terminé, vous pouvez :

**Sélecteur de Méthode**
- Choisir entre **KMeans** ou **HDBSCAN** pour comparer les approches
- Les tableaux, visualisations et rapports s'adaptent automatiquement

**Visualisations Interactives** 📊
- **Principales** : 
  - Vue 2D des clusters (PCA projection)
  - Distribution de la taille des clusters
- **Hiérarchiques** (KMeans uniquement) :
  - Sous-clusters HDBSCAN dans chaque groupe KMeans
  - Heatmaps des codes médicaux distinctifs
- **Prétraitement** :
  - Variance expliquée par composantes PCA
  
**Fonctionnalités d'interaction :**
- 🔍 Clic pour zoom en plein écran
- 📥 Téléchargement PNG haute résolution (300 DPI)
- 🎯 Filtrage par catégorie
- 🔄 Synchronisation avec la méthode sélectionnée

### 4. Générer des Rapports LLM

**Rapport par Cluster**
1. Sélectionner un cluster dans le tableau
2. Cliquer sur "📄 Générer Rapport"
3. Le LLM analyse :
   - Profil clinique du cluster
   - Domaines médicaux principaux (Condition, Procedure, Drug, etc.)
   - Codes SNOMED/RxNorm les plus distinctifs
   - Recommandations de prise en charge
4. Export PDF disponible via bouton "Télécharger PDF"

**Rapport Global** 📊
1. Cliquer sur "Générer Rapport Global - [KMEANS/HDBSCAN]"
2. Analyse comparative de tous les clusters :
   - Vue d'ensemble de la segmentation
   - Caractéristiques de chaque sous-population
   - Patterns cliniques transversaux
3. Export PDF du rapport complet

## 🔧 Configuration Avancée

### Gestion de la Mémoire Docker

Le projet utilise des limites strictes pour éviter les crashes système :

```yaml
# docker-compose.yml
services:
  redis:
    deploy:
      resources:
        limits:
          memory: 256M
  
  backend:
    deploy:
      resources:
        limits:
          memory: 2G
  
  ollama:
    deploy:
      resources:
        limits:
          memory: 4G
```

**Total : ~6.3GB RAM maximum** (Worker partage la limite du Backend)

Si vous rencontrez des problèmes de mémoire :
```bash
# Nettoyer Docker
./cleanup-docker.sh --soft   # Arrêt propre + volumes préservés
./cleanup-docker.sh --hard   # Reset complet
./cleanup-docker.sh --volumes # Supprimer aussi les volumes

# Diagnostiquer
./diagnose-docker.sh
```

### Mode Développement

**docker-compose.dev.yml** active le hot-reload :
- ✅ Backend : `uvicorn --reload` sur modification Python
- ✅ Worker : Redémarrage automatique Celery
- ✅ Frontend : Vite HMR (Hot Module Replacement)
- ⚠️ **Workflows/** : Nécessite rebuild manuel (code externe)

```bash
# Lancer en mode dev
./start-dev.sh

# Modifier du code backend → rechargement auto
vim backend/app/api/clustering.py

# Pour les workflows, rebuild nécessaire
docker-compose restart worker
```

### Variables d'Environnement

Créer un fichier `.env` (optionnel) :

```bash
# Redis
REDIS_URL=redis://redis:6379/0

# Ollama
OLLAMA_URL=http://ollama:11434
LLM_MODEL=qwen2.5:3b-instruct

# Paths
DATA_DIR=/app/data
RESULTS_DIR=/app/results
TERMINOLOGY_DIR=/app/terminology_omop

# Performance
PANDAS_ENGINE=c  # 'c' (rapide) ou 'python' (compatible)
```

### GPU Support (NVIDIA Linux uniquement)

Décommenter dans `docker-compose.yml` :

```yaml
ollama:
  deploy:
    resources:
      reservations:
        devices:
          - driver: nvidia
            count: 1
            capabilities: [gpu]
```

## 🧪 Tests et Validation

### Scripts de Monitoring

```bash
# Health check complet (tous les services)
./check.sh

# Logs en temps réel
./logs.sh

# Logs d'un service spécifique
docker-compose logs -f backend
docker-compose logs -f worker
docker-compose logs -f redis
```

### Backend
```bash
# Health check API
curl http://localhost:8000/health
# Devrait retourner: {"status": "healthy", "redis": "healthy"}

# Documentation interactive
open http://localhost:8000/docs

# Lister les jobs
curl http://localhost:8000/api/clustering/jobs | jq

# Récupérer les résultats avec plots
curl http://localhost:8000/api/clustering/results/{job_id} | jq '.plots'
```

### Frontend
```bash
# Console browser : Pas d'erreurs
# Network tab : Appels API réussis
# Vérifier le chargement des images de visualisation
```

### Ollama
```bash
# Vérifier que le modèle est chargé
docker-compose exec ollama ollama list
# Doit afficher: qwen2.5:3b-instruct

# Tester la génération
curl http://localhost:11434/api/generate -d '{
  "model": "qwen2.5:3b-instruct",
  "prompt": "Hello, how are you?",
  "stream": false
}' | jq '.response'
```

## 📊 Endpoints API

### Clustering

- `POST /api/clustering/run` - Lancer une nouvelle job de clustering
  ```json
  {
    "feature_mode": "domain_rollup",
    "n_components": 30,
    "force_recompute": false
  }
  ```

- `GET /api/clustering/status/{job_id}` - Statut d'une job en cours
  ```json
  {
    "state": "RUNNING",
    "progress": 45,
    "message": "Tuning hyperparameters..."
  }
  ```

- `GET /api/clustering/results/{job_id}` - Résultats complets avec visualisations
  ```json
  {
    "kmeans": { "clusters": [...] },
    "hdbscan": { "clusters": [...] },
    "plots": [
      {
        "filename": "cluster_2d.png",
        "path": "k_mean/final/plots/cluster_2d.png",
        "url": "/api/clustering/plots/{job_id}/k_mean/final/plots/cluster_2d.png",
        "title": "Visualisation 2D des Clusters",
        "description": "...",
        "type": "scatter",
        "category": "main"
      }
    ]
  }
  ```

- `GET /api/clustering/plots/{job_id}/{plot_path}` - Servir une image de visualisation
  - Retourne PNG haute résolution (300 DPI)
  - Headers CORS configurés

- `GET /api/clustering/jobs` - Liste de toutes les jobs avec statuts

### LLM

- `POST /api/llm/generate-report` - Rapport détaillé pour un cluster spécifique
  ```json
  {
    "job_id": "abc123",
    "cluster_id": 0,
    "method": "kmeans"
  }
  ```

- `POST /api/llm/generate-global-report` - Rapport global sur tous les clusters
  ```json
  {
    "job_id": "abc123",
    "method": "kmeans"
  }
  ```

## 🐛 Troubleshooting

### Le clustering bloque à "Building terminology..."

**Problème** : Le chargement de `CONCEPT_ANCESTOR.csv` (158MB) prend plusieurs minutes.

**Solution** : Le projet utilise maintenant le C engine de Pandas (optimisé, 50-100x plus rapide).

```bash
# Vérifier les logs du worker
./logs.sh | grep -i "building terminology"

# Si bloqué, vérifier l'usage CPU
docker stats worker

# Devrait voir activité CPU élevée pendant le chargement
```

Si le problème persiste :
```bash
# Redémarrer le worker
docker-compose restart worker

# Ou en mode dev avec logs verbeux
./start-dev.sh
```

### Docker consomme trop de mémoire

**Symptômes** : Système lent, kernel panic sur Mac, OOM kills

**Solution** : Utiliser les limites mémoire configurées

```bash
# Vérifier l'usage actuel
docker stats

# Nettoyer et redémarrer avec limites
./cleanup-docker.sh --soft
./start.sh

# Ajuster les limites dans docker-compose.yml si nécessaire
```

### Le backend ne démarre pas

```bash
# Diagnostiquer le problème
./diagnose-docker.sh

# Vérifier Redis
docker-compose logs redis

# Rebuild complet si nécessaire
./cleanup-docker.sh --hard
docker-compose build --no-cache backend worker
./start.sh
```

### Worker reste en état PENDING

```bash
# Vérifier la connexion Redis
./check.sh

# Redémarrer le worker
docker-compose restart worker

# Voir les erreurs
docker-compose logs worker | grep -i error

# Si problème de connexion Celery
docker-compose restart redis worker
```

### Ollama ne répond pas ou est lent

```bash
# Vérifier les logs
docker-compose logs ollama | tail -50

# Vérifier que le modèle est chargé
docker-compose exec ollama ollama list

# Télécharger à nouveau si absent
docker-compose exec ollama ollama pull qwen2.5:3b-instruct

# Redémarrer Ollama
docker-compose restart ollama

# Si sur Mac/Linux, utiliser Ollama natif (beaucoup plus rapide)
brew install ollama
ollama serve
# Puis définir OLLAMA_URL=http://host.docker.internal:11434
```

### Frontend ne se connecte pas à l'API

```bash
# Vérifier que l'API tourne
curl http://localhost:8000/health

# Vérifier le proxy Vite (frontend/vite.config.ts)
cat frontend/vite.config.ts | grep -A5 proxy

# Vérifier VITE_API_URL
echo $VITE_API_URL  # Devrait être vide ou http://localhost:8000

# Redémarrer le frontend
cd frontend
npm run dev
```

### Les visualisations ne s'affichent pas

```bash
# Vérifier que les plots existent
ls -lh results/jobs/{job_id}/*/final/plots/

# Tester l'endpoint de plots
curl -I http://localhost:8000/api/clustering/plots/{job_id}/k_mean/final/plots/cluster_2d.png

# Vérifier les permissions
docker-compose exec backend ls -la /app/results/jobs/

# Regénérer le clustering si les plots manquent
# (cocher "Force recalcul" dans l'interface)
```

### Hot-reload ne fonctionne pas

```bash
# Mode dev doit être activé
./start-dev.sh

# Vérifier que uvicorn reload est actif
docker-compose logs backend | grep reload

# Pour les fichiers workflows/, rebuild nécessaire
vim workflows/some_file.py
docker-compose restart worker
```

## 🔄 Développement

### Workflow de Développement Recommandé

**Backend/Worker**
```bash
# Lancer en mode hot-reload
./start-dev.sh

# Modifier du code Python
vim backend/app/api/clustering.py
# → Rechargement automatique détecté (uvicorn --reload)

# Modifier les workflows (nécessite restart)
vim workflows/terminology_layer.py
docker-compose restart worker

# Ajouter une nouvelle dépendance
echo "nouvelle-lib==1.0.0" >> backend/requirements.txt
docker-compose build backend worker
docker-compose up -d
```

**Frontend**
```bash
cd frontend

# Mode dev avec HMR
npm run dev

# Ajouter une dépendance
npm install axios

# Modifier un composant
vim src/components/ClusteringVisualizations.tsx
# → Hot Module Replacement instantané

# Build production
npm run build
# → frontend/dist/
```

### Structure des Composants Frontend

```typescript
// src/types/index.ts - Types partagés
export interface Plot {
  filename: string;
  path: string;
  url: string;
  title: string;
  description: string;
  type: string;
  category: 'main' | 'hierarchical' | 'preprocessing';
}

// src/components/ClusteringVisualizations.tsx
// - Affichage grid des plots
// - Filtrage par méthode (kmeans/hdbscan)
// - Modal zoom + téléchargement

// src/pages/JobDetail.tsx
// - Sélecteur kmeans/hdbscan
// - Table des clusters
// - Intégration ClusteringVisualizations
// - Rapports LLM + export PDF
```

### Ajouter une Nouvelle Visualisation

**1. Backend - Générer le plot**
```python
# Dans fhir_clustering/plotting.py ou workflows/
import matplotlib.pyplot as plt

def create_my_plot(data, output_path):
    fig, ax = plt.subplots(figsize=(10, 6), dpi=300)
    # ... votre code de plotting
    plt.savefig(output_path, dpi=300, bbox_inches='tight')
    plt.close()
```

**2. Backend - Ajouter les métadonnées**
```python
# Dans backend/app/api/clustering.py
def _get_plot_metadata():
    return {
        # ...
        "my_new_plot.png": {
            "title": "Titre de Ma Visualisation",
            "description": "Description détaillée...",
            "type": "scatter",  # scatter, bar, heatmap, line
            "category": "main"  # main, hierarchical, preprocessing
        }
    }
```

**3. Frontend - Automatique !**
Le composant `ClusteringVisualizations` détecte et affiche automatiquement les nouveaux plots via l'API.

### Scripts Utiles

```bash
# Démarrage
./start.sh              # Production avec limites mémoire
./start-dev.sh          # Dev avec hot-reload

# Monitoring
./check.sh              # Health checks complets
./logs.sh               # Logs en temps réel
./diagnose-docker.sh    # Diagnostic approfondi

# Maintenance
./stop.sh               # Arrêt propre
./cleanup-docker.sh --soft    # Nettoyage léger
./cleanup-docker.sh --hard    # Reset complet
./cleanup-docker.sh --volumes # Supprimer les données
```

## 📦 Production

### Build et Déploiement

**Frontend**
```bash
cd frontend
npm run build
# Outputs dans frontend/dist/

# Servir avec nginx ou autre serveur statique
# Configurer VITE_API_URL pour pointer vers l'API de production
```

**Backend**
```bash
# Build image optimisée
docker build -t fhir-clustering-backend:latest ./backend

# Ou utiliser docker-compose pour tout
docker-compose -f docker-compose.yml build

# Tag et push vers registry
docker tag fhir-clustering-backend:latest registry.example.com/fhir-clustering:v1.0.0
docker push registry.example.com/fhir-clustering:v1.0.0
```

**Ajout de dépendances**

Backend :
```bash
# Ajouter dans requirements.txt
echo "nouvelle-lib==1.0.0" >> backend/requirements.txt
# Rebuild
docker-compose build backend worker
docker-compose up -d
```

Frontend :
```bash
cd frontend
npm install <package>
```

### Optimisations de Performance

**Pandas CSV Loading**
- ✅ Utilise le C engine par défaut (50-100x plus rapide que Python engine)
- ✅ Logs des tailles de fichiers pour monitoring
- ⚠️ Si erreurs de parsing, fallback automatique sur Python engine

**Mémoire Docker**
- Redis: 256MB (cache + broker léger)
- Backend: 2GB (API + preprocessing)
- Worker: Partage la limite du Backend
- Ollama: 4GB (modèle LLM de 3.4GB)
- **Total: ~6.3GB** (ajuster selon vos ressources)

**Caching**
- Features preprocessées cachées dans `results/cache/`
- PCA persisté pour éviter recalculs
- LLM streaming pour réponse progressive

### Monitoring en Production

```bash
# Vérifier la santé
curl http://your-domain.com/health

# Métriques Docker
docker stats

# Logs centralisés
docker-compose logs --tail=100 --follow

# Utiliser un outil comme Prometheus + Grafana pour monitoring avancé
```

## 🎯 Fonctionnalités Clés

- ✅ **Clustering Dual** : K-Means + HDBSCAN pour comparaison
- ✅ **Clustering Hiérarchique** : HDBSCAN dans chaque cluster K-Means
- ✅ **Visualisations Interactives** : 6+ types de plots (PCA, heatmaps, dendrogrammes)
- ✅ **Rapports LLM** : Par cluster ou global avec export PDF
- ✅ **Hot-Reload Dev** : Backend + Frontend pour dev rapide
- ✅ **Gestion Mémoire** : Limites Docker strictes pour stabilité
- ✅ **Performance Optimisée** : Pandas C engine, caching intelligent
- ✅ **Interface Moderne** : React + TypeScript + TailwindCSS
- ✅ **API REST Complète** : Documentation interactive (Swagger)

## 📚 Documentation Complémentaire

- [QUICKSTART.md](QUICKSTART.md) - Guide de démarrage rapide
- [DOCKER-OPTIMIZATION.md](DOCKER-OPTIMIZATION.md) - Optimisations Docker et mémoire
- [VISUALIZATIONS-GUIDE.md](VISUALIZATIONS-GUIDE.md) - Guide complet des visualisations
- [PLOTS-IN-PDF-GUIDE.md](PLOTS-IN-PDF-GUIDE.md) - Intégration des plots dans les PDF

## 🤝 Contribution

1. Fork le projet
2. Créer une branche feature (`git checkout -b feature/AmazingFeature`)
3. Commit (`git commit -m 'Add: Description de la feature'`)
4. Push (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request

**Guidelines :**
- Utiliser les types TypeScript strict
- Tester avec `./check.sh` avant PR
- Documenter les nouvelles fonctionnalités
- Suivre le style de code existant (Black pour Python, Prettier pour TS)

## 📝 License

MIT License - voir le fichier LICENSE pour plus de détails.

## 👥 Auteurs

- **Samy Louchahi** - [GitHub](https://github.com/samy-louchahi)
- **Alexis Chartier** - [GitHub](https://github.com/AlexisChartier)

## 🧹 Maintenance et Nettoyage Docker
```bash
# Nettoyage régulier pour éviter l'accumulation de ressources
./cleanup-docker.sh --soft      # Nettoyage léger (sans volumes)
./cleanup-docker.sh --hard      # Nettoyage complet (sans volumes)
./cleanup-docker.sh --volumes   # Nettoie aussi les volumes (perte de données)
./cleanup-docker.sh --all       # ⚠️ Supprime TOUT (images, containers, volumes)
```
**Quick Start :** `./start.sh` → http://localhost:5173 🚀
