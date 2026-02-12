# 🏥 FHIR Clustering Web Application

Application web complète pour le clustering de données FHIR avec génération de rapports par LLM.

## 🚀 Stack Technologique

### Backend
- **FastAPI** : API REST moderne et performante
- **Celery** : Traitement asynchrone des jobs de clustering
- **Redis** : Message broker et cache
- **Python 3.12** : Langage principal

### Frontend
- **React 18** : Interface utilisateur réactive
- **TypeScript** : Type safety
- **Vite** : Build tool rapide
- **TailwindCSS** : Styling moderne
- **React Router** : Navigation

### Infrastructure
- **Docker Compose** : Orchestration des services
- **Ollama** : Serveur LLM local (Llama 3.1)

## 📋 Prérequis

```bash
# Logiciels requis
- Docker Desktop 4.x+
- Node.js 20+ (LTS)
- 8GB RAM minimum (16GB recommandé)
- 20GB espace disque libre
```

## 🏗️ Structure du Projet

```
fhir-clustering-webapp/
├── docker-compose.yml          # Orchestration des services
├── backend/                    # API FastAPI
│   ├── Dockerfile
│   ├── requirements.txt
│   └── app/
│       ├── main.py            # Point d'entrée FastAPI
│       ├── config.py          # Configuration
│       ├── api/               # Endpoints REST
│       ├── workers/           # Tasks Celery
│       └── services/          # Services métier (LLM)
├── frontend/                   # Application React
│   ├── package.json
│   ├── vite.config.ts
│   └── src/
│       ├── App.tsx
│       ├── pages/             # Pages principales
│       ├── services/          # API client
│       └── types/             # Types TypeScript
├── fhir_clustering/           # Code de clustering existant
├── workflows/                 # Pipelines de traitement
├── terminology_omop/          # Données terminologiques
├── data/                      # Données patients (à ajouter)
└── results/                   # Outputs générés
```

## 🚀 Installation Rapide

### 1. Cloner et Préparer

```bash
# Cloner le repo
git clone <votre-repo>
cd fhir-clustering-webapp

# Vérifier que vous avez les dossiers requis :
# - fhir_clustering/
# - workflows/
# - terminology_omop/
# - data/
```

### 2. Télécharger le Modèle LLM

**Option A : Ollama natif (recommandé pour Mac)**
```bash
brew install ollama
ollama pull llama3.1:8b
```

**Option B : Via Docker**
```bash
docker-compose up -d ollama
docker-compose exec ollama ollama pull llama3.1:8b
```

### 3. Démarrer le Backend

```bash
# Démarrer tous les services
docker-compose up -d

# Vérifier les logs
docker-compose logs -f backend
docker-compose logs -f worker

# Tester l'API
curl http://localhost:8000/health
# Devrait retourner: {"status": "healthy", "redis": "healthy"}
```

### 4. Installer et Démarrer le Frontend

```bash
cd frontend
npm install
npm run dev
```

L'application sera accessible sur **http://localhost:5173**

## 📖 Utilisation

### 1. Créer une Job de Clustering

1. Ouvrir http://localhost:5173
2. Remplir le formulaire :
   - **Mode de Features** : `domain_rollup` (recommandé) ou `raw_codes`
   - **Nombre de Composantes** : 30 (par défaut)
   - **Force recalcul** : Cocher pour ignorer le cache
3. Cliquer sur "Lancer le Clustering"

### 2. Suivre l'Exécution

- La page de détail s'affiche automatiquement
- Progression en temps réel :
  - **Preprocessing** : Construction des features
  - **Tuning** : Optimisation des hyperparamètres
  - **Clustering** : Exécution finale
- Durée : 5-15 minutes selon les données

### 3. Analyser les Résultats

Une fois terminé :
- Visualiser les clusters K-Means et HDBSCAN
- Voir le nombre de patients par cluster
- Générer un rapport LLM pour chaque cluster

### 4. Générer des Rapports LLM

1. Cliquer sur "Générer Rapport LLM" pour un cluster
2. Le LLM analyse :
   - Profil clinique du cluster
   - Domaines médicaux principaux
   - Recommandations de prise en charge
3. Rapport affiché en Markdown

## 🔧 Configuration Avancée

### Variables d'Environnement

Créer un fichier `.env` :

```bash
# Redis
REDIS_URL=redis://redis:6379/0

# Ollama
OLLAMA_URL=http://ollama:11434

# Paths
DATA_DIR=/app/data
RESULTS_DIR=/app/results
TERMINOLOGY_DIR=/app/terminology_omop
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

### Backend
```bash
# Health check
curl http://localhost:8000/health

# Documentation API
open http://localhost:8000/docs

# Lister les jobs
curl http://localhost:8000/api/clustering/jobs
```

### Frontend
```bash
# Console browser : Pas d'erreurs
# Network tab : Appels API réussis
```

### Ollama
```bash
# Vérifier que le modèle est chargé
docker-compose exec ollama ollama list

# Tester la génération
curl http://localhost:11434/api/generate -d '{
  "model": "llama3.1:8b",
  "prompt": "Hello",
  "stream": false
}'
```

## 📊 Endpoints API

### Clustering

- `POST /api/clustering/run` - Lancer une job
- `GET /api/clustering/status/{job_id}` - Statut d'une job
- `GET /api/clustering/results/{job_id}` - Résultats
- `GET /api/clustering/jobs` - Liste des jobs

### LLM

- `POST /api/llm/generate-report` - Rapport pour un cluster
- `POST /api/llm/generate-global-report` - Rapport global

## 🐛 Troubleshooting

### Le backend ne démarre pas

```bash
# Vérifier Redis
docker-compose logs redis

# Rebuild
docker-compose down
docker-compose build --no-cache backend
docker-compose up -d
```

### Worker bloqué

```bash
# Redémarrer le worker
docker-compose restart worker
docker-compose logs -f worker
```

### Ollama ne répond pas

```bash
# Vérifier les logs
docker-compose logs ollama

# Redémarrer
docker-compose restart ollama

# Vérifier le modèle
docker-compose exec ollama ollama list
```

### Frontend ne se connecte pas

```bash
# Vérifier le proxy dans vite.config.ts
# Vérifier que l'API tourne sur localhost:8000
curl http://localhost:8000/health
```

## 🔄 Développement

### Backend

```bash
# Mode hot-reload activé par défaut
docker-compose up -d

# Modifier app/*.py
# Les changements sont appliqués automatiquement
```

### Frontend

```bash
cd frontend
npm run dev

# Mode hot-reload Vite
# Les changements sont instantanés
```

### Ajouter des dépendances

**Backend :**
```bash
# Ajouter dans requirements.txt
# Rebuild
docker-compose build backend
docker-compose up -d
```

**Frontend :**
```bash
cd frontend
npm install <package>
```

## 📦 Production

### Build Frontend

```bash
cd frontend
npm run build
# Outputs dans frontend/dist/
```

### Build Backend Image

```bash
docker build -t fhir-clustering-backend:latest ./backend
```

## 🤝 Contribution

1. Fork le projet
2. Créer une branche feature (`git checkout -b feature/AmazingFeature`)
3. Commit (`git commit -m 'Add AmazingFeature'`)
4. Push (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request

## 📝 License

MIT License - voir le fichier LICENSE

## 👥 Auteurs

- Votre Nom - [GitHub](https://github.com/votre-username)

## 🙏 Remerciements

- FastAPI pour le framework backend
- React & Vite pour le frontend moderne
- Ollama pour l'intégration LLM locale
- La communauté open-source

---

**Pour plus d'aide :** Ouvrir une issue sur GitHub
