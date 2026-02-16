# 📊 Visualisations des Résultats de Clustering

## ✅ Fonctionnalité Ajoutée

Les résultats du clustering incluent maintenant des **visualisations graphiques** avec des légendes explicatives. Chaque plot est automatiquement généré et accessible via l'API.

## 🎨 Types de Visualisations Disponibles

### 1. **Visualisations Principales**

#### Vue 2D des Clusters
- **Fichier:** `cluster_2d.png`
- **Description:** Projection en 2 dimensions de l'espace des caractéristiques avec les patients colorés par cluster. Visualise la séparation et les chevauchements entre groupes.
- **Utilité:** Évaluer visuellement la qualité de la séparation des clusters

#### Distribution de la Taille des Clusters
- **Fichier:** `cluster_sizes.png`
- **Description:** Nombre de patients dans chaque cluster identifié. Permet d'évaluer l'équilibre de la segmentation.
- **Utilité:** Identifier les groupes dominants ou marginaux

### 2. **Visualisations Hiérarchiques** (HDBSCAN dans KMeans)

#### Vue 2D des Clusters Hiérarchiques
- **Fichier:** `hierarchical_scatter_2d.png`
- **Description:** Projection 2D (PCA) des patients colorés par leur cluster hiérarchique. Chaque point représente un patient, les couleurs distinguent les sous-groupes.
- **Utilité:** Comprendre la structure hiérarchique des groupes

#### Taille des Sous-Clusters
- **Fichiers:** `subcluster_sizes_kmeans_0.png`, `subcluster_sizes_kmeans_1.png`, etc.
- **Description:** Distribution du nombre de patients dans chaque sous-cluster HDBSCAN au sein de chaque cluster KMeans.
- **Utilité:** Voir la structure hiérarchique et l'équilibre des sous-groupes

#### Codes Médicaux les Plus Distinctifs
- **Fichiers:** `top_codes_heatmap_kmeans_0.png`, etc.
- **Description:** Heatmap montrant l'intensité des codes médicaux les plus caractéristiques pour chaque sous-cluster.
- **Utilité:** Identifier les pathologies ou traitements spécifiques à chaque groupe

### 3. **Visualisations de Prétraitement**

#### Variance Expliquée
- **Fichier:** `explained_variance.png`
- **Description:** Proportion de variance capturée par chaque composante principale (PCA).
- **Utilité:** Comprendre combien de dimensions sont nécessaires pour représenter les données

## 🚀 Comment Accéder aux Visualisations

### Via l'API

#### 1. Récupérer la liste des plots disponibles
```bash
curl http://localhost:8000/api/clustering/results/{job_id}
```

**Réponse JSON:**
```json
{
  "kmeans": {
    "clusters": [...],
    "top_codes": [...]
  },
  "hdbscan": {
    "clusters": [...]
  },
  "plots": [
    {
      "filename": "cluster_2d.png",
      "path": "k_mean/final/plots/cluster_2d.png",
      "url": "/api/clustering/plots/{job_id}/k_mean/final/plots/cluster_2d.png",
      "title": "Visualisation 2D des Clusters",
      "description": "Projection en 2 dimensions...",
      "type": "scatter",
      "category": "main"
    },
    {
      "filename": "hierarchical_scatter_2d.png",
      "path": "k_mean/final/hdbscan_in_kmeans/plots/hierarchical_scatter_2d.png",
      "url": "/api/clustering/plots/{job_id}/k_mean/final/hdbscan_in_kmeans/plots/hierarchical_scatter_2d.png",
      "title": "Vue 2D des Clusters Hiérarchiques",
      "description": "Projection 2D (PCA) des patients...",
      "type": "scatter",
      "category": "hierarchical"
    }
  ]
}
```

#### 2. Télécharger une image spécifique
```bash
# Via l'URL retournée dans la réponse
curl http://localhost:8000/api/clustering/plots/{job_id}/k_mean/final/plots/cluster_2d.png \
  --output cluster_2d.png
```

### Via le Frontend (à implémenter)

Les plots peuvent être affichés dans l'interface utilisateur en utilisant les URLs fournies:

```jsx
// Exemple React/Next.js
{results.plots?.map((plot) => (
  <div key={plot.filename} className="plot-card">
    <img src={`http://localhost:8000${plot.url}`} alt={plot.title} />
    <h3>{plot.title}</h3>
    <p>{plot.description}</p>
  </div>
))}
```

## 📋 Structure des Métadonnées de Plot

Chaque plot retourné contient:

```typescript
interface Plot {
  filename: string;        // Nom du fichier (ex: "cluster_2d.png")
  path: string;           // Chemin relatif depuis results/jobs/{job_id}
  url: string;            // URL pour télécharger l'image
  title: string;          // Titre descriptif
  description: string;    // Légende explicative
  type: string;           // Type de visualisation: "scatter", "bar", "heatmap", "line"
  category: string;       // Catégorie: "main", "hierarchical", "preprocessing", "other"
}
```

## 🎨 Catégories de Plots

| Catégorie | Description | Plots inclus |
|-----------|-------------|--------------|
| `main` | Visualisations principales du clustering | cluster_2d, cluster_sizes |
| `hierarchical` | Clustering hiérarchique (HDBSCAN dans KMeans) | hierarchical_scatter_2d, subcluster_sizes, top_codes_heatmap |
| `preprocessing` | Analyses du prétraitement | explained_variance |
| `other` | Autres visualisations | Plots non catégorisés |

## 🔧 Configuration Technique

### Backend (FastAPI)

**Fichier:** `backend/app/api/clustering.py`

**Nouveaux endpoints:**
- `GET /api/clustering/results/{job_id}` - Inclut maintenant la liste des plots
- `GET /api/clustering/plots/{job_id}/{plot_path:path}` - Sert les images

**Fonctions ajoutées:**
- `_get_plot_metadata()` - Définit les métadonnées et légendes
- `_scan_plots()` - Scanne les dossiers de résultats pour trouver les plots

### Génération des Plots

Les plots sont générés automatiquement par le workflow:
- **Fichier:** `workflows/run_final.py`
- **Fonction:** `save_all_plots()` importée de `fhir_clustering/visualization.py`
- **Moment:** Après chaque exécution de clustering (KMeans et HDBSCAN)

### Emplacements des Plots

```
results/jobs/{job_id}/
├── k_mean/final/
│   ├── plots/                          # Plots KMeans principaux
│   │   ├── cluster_2d.png
│   │   ├── cluster_sizes.png
│   │   └── explained_variance.png
│   └── hdbscan_in_kmeans/
│       └── plots/                      # Plots hiérarchiques
│           ├── hierarchical_scatter_2d.png
│           ├── subcluster_sizes_kmeans_0.png
│           ├── subcluster_sizes_kmeans_1.png
│           └── top_codes_heatmap_kmeans_0.png
└── hdbscan/final/
    └── plots/                          # Plots HDBSCAN principaux
        ├── cluster_2d.png
        └── cluster_sizes.png
```

## 📊 Exemple d'Utilisation

### 1. Lancer un clustering
```bash
curl -X POST http://localhost:8000/api/clustering/run \
  -H "Content-Type: application/json" \
  -d '{
    "feature_mode": "domain_rollup",
    "n_components": 30,
    "force": false
  }'
```

**Réponse:**
```json
{
  "job_id": "abc123-def456-...",
  "status": "queued"
}
```

### 2. Attendre la fin du clustering
```bash
# Vérifier le statut
curl http://localhost:8000/api/clustering/status/abc123-def456-...
```

### 3. Récupérer les résultats avec les plots
```bash
curl http://localhost:8000/api/clustering/results/abc123-def456-...
```

### 4. Afficher les visualisations

Utilisez les URLs fournies dans `plots[]` pour afficher les images dans votre interface.

## 🎯 Avantages

✅ **Visualisation rapide** - Les plots sont générés automatiquement pendant le clustering

✅ **Légendes explicatives** - Chaque plot a un titre et une description claire

✅ **Multi-format** - Support des plots de différents types (scatter, bar, heatmap, line)

✅ **Hiérarchie claire** - Les plots sont catégorisés pour une navigation facile

✅ **API REST simple** - Accès facile via HTTP

✅ **Intégration frontend** - URLs directement utilisables dans React/Next.js

## 🧪 Test Rapide

```bash
# 1. Obtenir un job_id d'un clustering terminé
curl http://localhost:8000/api/clustering/jobs | jq '.jobs[0].job_id'

# 2. Récupérer les plots disponibles
curl http://localhost:8000/api/clustering/results/{job_id} | jq '.plots'

# 3. Télécharger un plot spécifique
curl http://localhost:8000/api/clustering/plots/{job_id}/k_mean/final/plots/cluster_2d.png \
  -o cluster_2d.png

# 4. Ouvrir l'image
open cluster_2d.png  # macOS
# ou
xdg-open cluster_2d.png  # Linux
```

## 📝 Notes

- Les plots sont générés avec **300 DPI** pour une qualité élevée
- Format: **PNG** (peut être étendu à SVG si nécessaire)
- Les métadonnées peuvent être configurées dans `_get_plot_metadata()`
- Les plots sont automatiquement découverts par scan des dossiers

## 🚀 Prochaines Étapes (Optionnel)

### Frontend
1. Créer une galerie de visualisations dans l'interface
2. Ajouter un viewer avec zoom et téléchargement
3. Permettre de comparer plusieurs plots côte à côte

### Backend
1. Ajouter support SVG pour des plots vectoriels
2. Générer des plots interactifs (Plotly, Bokeh)
3. Ajouter des thumbnails pour aperçu rapide
4. Cache des images déjà servies

### Rapports
1. Inclure les plots dans le PDF du rapport
2. Générer un rapport HTML avec les visualisations intégrées
3. Export PowerPoint avec les plots

---

**Les visualisations sont maintenant disponibles pour tous les clusterings !** 🎉
