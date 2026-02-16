# 🚀 Quick Start: Visualisations de Clustering

## Ce qui a été ajouté

✅ **Endpoint API** pour lister et servir les visualisations
✅ **Métadonnées** avec titres et légendes explicatives pour chaque plot
✅ **Composant React** prêt à l'emploi pour le frontend
✅ **Documentation complète** avec exemples

---

## 🏃 Test Rapide (5 minutes)

### 1. Le backend est déjà mis à jour
Le hot-reload a appliqué les changements automatiquement ✓

### 2. Tester l'API

```bash
# Lister les jobs disponibles
curl http://localhost:8000/api/clustering/jobs | jq '.jobs[0]'

# Remplacer {JOB_ID} par un ID de job terminé
export JOB_ID="votre-job-id-ici"

# Récupérer les résultats avec plots
curl http://localhost:8000/api/clustering/results/$JOB_ID | jq '.plots'
```

**Exemple de réponse:**
```json
{
  "plots": [
    {
      "filename": "cluster_2d.png",
      "title": "Visualisation 2D des Clusters",
      "description": "Projection en 2 dimensions...",
      "url": "/api/clustering/plots/abc123.../k_mean/final/plots/cluster_2d.png"
    }
  ]
}
```

### 3. Télécharger un plot

```bash
# Utiliser l'URL du plot
curl "http://localhost:8000/api/clustering/plots/$JOB_ID/k_mean/final/plots/cluster_2d.png" \
  -o mon_plot.png

# Ouvrir l'image
open mon_plot.png  # macOS
```

---

## 📱 Intégration Frontend

### Option 1: Composant React complet

Le fichier `frontend/components/ClusteringVisualizations.tsx` contient un composant prêt à l'emploi avec:
- ✅ Affichage en grille
- ✅ Filtrage par catégorie
- ✅ Modal pour voir en grand
- ✅ Téléchargement des images
- ✅ Loading states

**Utilisation:**
```tsx
import ClusteringVisualizations from '@/components/ClusteringVisualizations';

function ResultsPage() {
  return <ClusteringVisualizations jobId="abc123..." />;
}
```

### Option 2: Code minimaliste

```tsx
// Récupérer les plots
const response = await fetch(`/api/clustering/results/${jobId}`);
const data = await response.json();

// Afficher
data.plots?.map(plot => (
  <div key={plot.filename}>
    <img src={`http://localhost:8000${plot.url}`} alt={plot.title} />
    <h3>{plot.title}</h3>
    <p>{plot.description}</p>
  </div>
))
```

---

## 📊 Types de Plots Disponibles

| Plot | Description | Catégorie |
|------|-------------|-----------|
| **cluster_2d.png** | Vue 2D des clusters | Principale |
| **cluster_sizes.png** | Taille des clusters | Principale |
| **hierarchical_scatter_2d.png** | Vue 2D hiérarchique | Hiérarchique |
| **subcluster_sizes_kmeans_N.png** | Taille des sous-clusters | Hiérarchique |
| **top_codes_heatmap_kmeans_N.png** | Codes distinctifs | Hiérarchique |
| **explained_variance.png** | Variance PCA | Prétraitement |

---

## 🎨 Personnalisation

### Ajouter de nouvelles légendes

**Fichier:** `backend/app/api/clustering.py`

Modifier la fonction `_get_plot_metadata()`:

```python
def _get_plot_metadata() -> Dict[str, Dict]:
    return {
        "mon_nouveau_plot.png": {
            "title": "Mon Titre",
            "description": "Ma description détaillée",
            "type": "scatter",  # scatter, bar, heatmap, line
            "category": "main"  # main, hierarchical, preprocessing, other
        },
        # ... autres plots
    }
```

### Générer de nouveaux plots

**Fichier:** `workflows/run_final.py`

Les plots sont générés automatiquement par `save_all_plots()`. Pour en ajouter:

1. Créer la fonction de plot dans `fhir_clustering/visualization.py`
2. L'appeler dans `save_all_plots()` ou directement dans `run_final.py`
3. Ajouter les métadonnées dans `_get_plot_metadata()`

---

## 🧪 Vérification

### Backend
```bash
# Vérifier que l'endpoint plots existe
curl http://localhost:8000/docs | grep -i "plots"

# Devrait montrer les nouveaux endpoints
```

### Génération des plots
```bash
# Après un clustering, vérifier que les plots existent
ls -lh /app/results/jobs/*/k_mean/final/plots/
ls -lh /app/results/jobs/*/k_mean/final/hdbscan_in_kmeans/plots/
```

---

## 📚 Documentation Complète

- **[VISUALIZATIONS-GUIDE.md](VISUALIZATIONS-GUIDE.md)** - Guide complet avec tous les détails
- **[frontend/components/ClusteringVisualizations.tsx](frontend/components/ClusteringVisualizations.tsx)** - Composant React
- **[frontend/examples/ClusteringVisualizationsUsage.tsx](frontend/examples/ClusteringVisualizationsUsage.tsx)** - Exemples d'intégration

---

## ✅ Checklist d'intégration

### Backend ✓
- [x] Endpoint `/api/clustering/plots/{job_id}/{plot_path}`
- [x] Métadonnées dans `/api/clustering/results/{job_id}`
- [x] Fonction `_get_plot_metadata()`
- [x] Fonction `_scan_plots()`

### Frontend (À faire)
- [ ] Copier `ClusteringVisualizations.tsx` dans `frontend/components/`
- [ ] Ajouter dans la page de résultats
- [ ] Styliser selon votre design system
- [ ] Tester avec un vrai job_id

### Tests
- [ ] API retourne bien les plots
- [ ] Images sont servies correctement
- [ ] Frontend affiche les plots
- [ ] Téléchargement fonctionne

---

## 🎯 Prochaines Étapes

1. **Tester avec un nouveau clustering**
   ```bash
   # Lancer un clustering
   curl -X POST http://localhost:8000/api/clustering/run \
     -H "Content-Type: application/json" \
     -d '{"feature_mode": "domain_rollup", "force": false}'
   ```

2. **Implémenter le composant dans le frontend**
   - Copier `ClusteringVisualizations.tsx`
   - L'ajouter dans la page de résultats
   - Tester l'affichage

3. **Améliorer si besoin**
   - Ajouter plus de métadonnées
   - Créer des plots personnalisés
   - Intégrer dans les rapports PDF

---

## 💡 Conseils

- Les plots sont générés en **300 DPI** pour qualité élevée
- Format **PNG** par défaut (peut être étendu à SVG)
- Les légendes sont **en français** pour meilleure UX
- Le composant React est **responsive** et fonctionne sur mobile

---

**Tout est prêt côté backend ! Il ne reste plus qu'à intégrer dans le frontend.** 🚀
