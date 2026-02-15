from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse
from pydantic import BaseModel
from uuid import uuid4
import json
import redis
import os
import glob
from typing import List, Dict, Optional

router = APIRouter()

# Redis client
redis_client = redis.Redis(host='redis', port=6379, decode_responses=True)

class ClusteringRequest(BaseModel):
    feature_mode: str = "domain_rollup"  # or "raw_codes"
    n_components: int = 30
    force: bool = False

class JobStatusResponse(BaseModel):
    job_id: str
    status: str
    progress: int
    message: str = ""

@router.post("/run")
async def run_clustering(request: ClusteringRequest):
    """Lance une job de clustering dans un thread (pas de fork)"""
    from app.workers.tasks import launch_pipeline
    
    job_id = str(uuid4())
    
    # Launch pipeline in a background thread
    launch_pipeline(
        job_id=job_id,
        feature_mode=request.feature_mode,
        n_components=request.n_components,
        force=request.force,
    )
    
    return {
        "job_id": job_id,
        "status": "queued"
    }

@router.get("/status/{job_id}", response_model=JobStatusResponse)
async def get_job_status(job_id: str):
    """Récupère le statut d'une job"""
    raw = redis_client.get(f"job:{job_id}")
    if not raw:
        raise HTTPException(status_code=404, detail="Job not found")
    
    data = json.loads(raw)
    
    state = data.get("state", "UNKNOWN")
    status_map = {
        "QUEUED": "queued",
        "PREPROCESSING": "preprocessing",
        "TUNING": "tuning",
        "CLUSTERING": "clustering",
        "SUCCESS": "completed",
        "FAILURE": "failed",
    }
    
    return JobStatusResponse(
        job_id=job_id,
        status=status_map.get(state, state.lower()),
        progress=data.get("progress", 0),
        message=data.get("message", ""),
    )

@router.get("/plots/{job_id}/{plot_path:path}")
async def get_plot_image(job_id: str, plot_path: str):
    """Sert une image de plot spécifique"""
    results_base = f"/app/results/jobs/{job_id}"
    full_path = os.path.join(results_base, plot_path)
    
    if not os.path.exists(full_path):
        raise HTTPException(status_code=404, detail="Plot not found")
    
    if not full_path.endswith(('.png', '.jpg', '.jpeg', '.svg')):
        raise HTTPException(status_code=400, detail="Invalid image format")
    
    return FileResponse(full_path, media_type="image/png")


def _get_plot_metadata() -> Dict[str, Dict]:
    """Retourne les métadonnées et légendes pour chaque type de plot"""
    return {
        "hierarchical_scatter_2d.png": {
            "title": "Vue 2D des Clusters Hiérarchiques",
            "description": "Projection 2D (PCA) des patients colorés par leur cluster hiérarchique (HDBSCAN dans KMeans). Chaque point représente un patient, les couleurs distinguent les sous-groupes identifiés.",
            "type": "scatter",
            "category": "hierarchical"
        },
        "subcluster_sizes_kmeans": {
            "title": "Taille des Sous-Clusters par Groupe KMeans",
            "description": "Distribution du nombre de patients dans chaque sous-cluster HDBSCAN au sein de chaque cluster KMeans. Permet de voir la structure hiérarchique et l'équilibre des groupes.",
            "type": "bar",
            "category": "hierarchical"
        },
        "top_codes_heatmap_kmeans": {
            "title": "Codes Médicaux les Plus Distinctifs",
            "description": "Heatmap montrant l'intensité des codes médicaux les plus caractéristiques pour chaque sous-cluster. Plus la couleur est intense, plus le code est spécifique au groupe.",
            "type": "heatmap",
            "category": "hierarchical"
        },
        "cluster_sizes.png": {
            "title": "Distribution de la Taille des Clusters",
            "description": "Nombre de patients dans chaque cluster identifié. Permet d'évaluer l'équilibre de la segmentation et d'identifier les groupes dominants ou marginaux.",
            "type": "bar",
            "category": "main"
        },
        "cluster_2d.png": {
            "title": "Visualisation 2D des Clusters",
            "description": "Projection en 2 dimensions de l'espace des caractéristiques avec les patients colorés par cluster. Visualise la séparation et les chevauchements entre groupes.",
            "type": "scatter",
            "category": "main"
        },
        "explained_variance.png": {
            "title": "Variance Expliquée par Composantes",
            "description": "Montre la proportion de variance capturée par chaque composante principale (PCA). Aide à comprendre combien de dimensions sont nécessaires pour représenter les données.",
            "type": "line",
            "category": "preprocessing"
        },
    }


def _scan_plots(results_base: str) -> List[Dict]:
    """Scanne tous les plots disponibles et retourne leurs métadonnées"""
    plots = []
    metadata = _get_plot_metadata()
    
    # Scan pour les plots dans différents dossiers
    search_patterns = [
        f"{results_base}/k_mean/final/hdbscan_in_kmeans/plots/*.png",
        f"{results_base}/k_mean/final/plots/*.png",
        f"{results_base}/hdbscan/final/plots/*.png",
    ]
    
    for pattern in search_patterns:
        for filepath in glob.glob(pattern):
            filename = os.path.basename(filepath)
            relative_path = os.path.relpath(filepath, results_base)
            
            # Trouver les métadonnées correspondantes
            plot_info = None
            for key, value in metadata.items():
                if key in filename:
                    plot_info = value.copy()
                    break
            
            if plot_info is None:
                # Métadonnées par défaut si non trouvées
                plot_info = {
                    "title": filename.replace(".png", "").replace("_", " ").title(),
                    "description": "Visualisation des résultats du clustering",
                    "type": "unknown",
                    "category": "other"
                }
            
            plots.append({
                "filename": filename,
                "path": relative_path,
                "url": f"/api/clustering/plots/{os.path.basename(results_base)}/{relative_path}",
                **plot_info
            })
    
    return plots


@router.get("/results/{job_id}")
async def get_results(job_id: str):
    """Récupère les résultats d'une job terminée avec les plots"""
    import pandas as pd
    
    results_base = f"/app/results/jobs/{job_id}"
    
    if not os.path.exists(results_base):
        raise HTTPException(status_code=404, detail="Results not found")
    
    # Load summary files
    response = {}
    
    # KMeans summary
    kmeans_summary = f"{results_base}/k_mean/final/summary.csv"
    if os.path.exists(kmeans_summary):
        df = pd.read_csv(kmeans_summary)
        response["kmeans"] = {
            "clusters": df.to_dict(orient="records")
        }
    
    # HDBSCAN summary
    hdbscan_summary = f"{results_base}/hdbscan/final/summary.csv"
    if os.path.exists(hdbscan_summary):
        df = pd.read_csv(hdbscan_summary)
        response["hdbscan"] = {
            "clusters": df.to_dict(orient="records")
        }
    
    # Top codes
    kmeans_top = f"{results_base}/k_mean/final/top_codes_distinctiveness.csv"
    if os.path.exists(kmeans_top):
        df = pd.read_csv(kmeans_top)
        response["kmeans"]["top_codes"] = df.to_dict(orient="records")
    
    # Ajouter les plots avec leurs métadonnées
    response["plots"] = _scan_plots(results_base)
    
    return response

@router.get("/jobs")
async def list_jobs():
    """Liste toutes les jobs"""
    keys = redis_client.keys("job:*")
    jobs = []
    
    for key in keys:
        job_id = key.split(":")[1]
        raw = redis_client.get(key)
        if raw:
            data = json.loads(raw)
            jobs.append({
                "job_id": job_id,
                "status": data.get("state", "UNKNOWN"),
                "progress": data.get("progress", 0),
                "message": data.get("message", ""),
            })
    
    return {"jobs": jobs}
