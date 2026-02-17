"""
Pipeline runner — executes the clustering pipeline in a background thread.
No forking, no Celery. Status is tracked in Redis.
"""
import sys
import os
import json
import threading
import traceback
import logging

import matplotlib
matplotlib.use('Agg') # Requis pour sauvegarder des plots en tâche de fond
import matplotlib.pyplot as plt
import numpy as np

# Suppression du sys.path.insert(0, '/app') en dur (déconseillé, laissez l'environnement Python gérer)

import redis
from app.config import get_settings

settings = get_settings()
logger = logging.getLogger(__name__)

_redis = redis.Redis.from_url(settings.redis_url, decode_responses=True)

def _update_job(job_id: str, *, state: str, progress: int, message: str = "", error: str = "", result: dict | None = None):
    """Store job status in Redis (2h TTL)."""
    payload = {
        "state": state,
        "progress": progress,
        "message": message,
        "error": error,
    }
    if result is not None:
        payload["result"] = result
    _redis.setex(f"job:{job_id}", 7200, json.dumps(payload))

def _run_pipeline(job_id: str, feature_mode: str, n_components: int, force: bool, request_data: dict):
    """Runs the full pipeline — called inside a daemon thread."""
    try:
        from workflows.pre_process import run_preprocess
        from workflows.tune_kmeans import run_kmeans_tuning
        from workflows.tune_hdbscan import run_hdbscan_tuning
        from workflows.run_final import run_final
        from workflows.terminology_layer import build_terminology_layer
        from fhir_clustering.dimensionality_reduction import DimensionalityReducer

        # 1. Utilisation des paths dynamiques depuis config.py
        out_dir = os.path.join(settings.results_dir, "jobs", job_id)
        term_out_dir = os.path.join(settings.results_dir, "terminology")
        
        os.makedirs(out_dir, exist_ok=True)
        plots_dir = os.path.join(out_dir, "plots")
        os.makedirs(plots_dir, exist_ok=True)

        include_demographics = request_data.get("include_demographics", True)
        age_weight = request_data.get("age_weight", 2.0)
        gender_weight = request_data.get("gender_weight", 1.0)

        # 0) Terminology
        _update_job(job_id, state="PREPROCESSING", progress=5, message="Building terminology...")
        build_terminology_layer(
            data_dir=settings.data_dir,
            omop_dir=settings.terminology_dir,
            out_dir=term_out_dir,
            force=False,
            max_ancestor_distance=3,
        )

        # 1) Preprocessing
        _update_job(job_id, state="PREPROCESSING", progress=15, message="Preprocessing data...")
        artifacts = run_preprocess(
            force=force,
            feature_mode=feature_mode,
            out_dir=os.path.join(out_dir, "pre_process"),
            terminology_pkl=os.path.join(term_out_dir, "terminology.pkl") if feature_mode == "domain_rollup" else None,
            include_demographics=include_demographics,
            age_weight=age_weight,
            gender_weight=gender_weight
        )

        # 2) KMeans tuning
        _update_job(job_id, state="TUNING", progress=30, message="Tuning KMeans...")
        chosen_k = run_kmeans_tuning(artifacts, force=force)

        # 3) HDBSCAN tuning
        _update_job(job_id, state="TUNING", progress=45, message="Tuning HDBSCAN...")
        chosen_hdb = run_hdbscan_tuning(artifacts, force=force)

        # 4) Final clustering
        _update_job(job_id, state="CLUSTERING", progress=65, message="Running final clustering...")
        results = run_final(
            artifacts,
            chosen_k,
            chosen_hdb,
            out_kmeans=os.path.join(out_dir, "k_mean", "final"),
            out_hdbscan=os.path.join(out_dir, "hdbscan", "final"),
            force=force,
        )

        # 5) Génération UMAP
        _update_job(job_id, state="VISUALIZATION", progress=85, message="Generating UMAP projection...")
        
        if hasattr(artifacts, 'transformed_matrix') and artifacts.transformed_matrix is not None:
            X_input = artifacts.transformed_matrix
            MAX_SAMPLES = 5000
            
            labels = results.get('hdbscan', {}).get('labels')
            if labels is None:
                 labels = results.get('kmeans', {}).get('labels')
                 
            if labels is not None:
                if X_input.shape[0] > MAX_SAMPLES:
                    rng = np.random.default_rng(42)
                    indices = rng.choice(X_input.shape[0], size=MAX_SAMPLES, replace=False)
                    X_viz = X_input[indices]
                    labels_viz = np.array(labels)[indices]
                else:
                    X_viz = X_input
                    labels_viz = np.array(labels)

                try:
                    reducer_umap = DimensionalityReducer(method='umap', n_components=2)
                    X_umap = reducer_umap.fit_transform(X_viz)
                    
                    plt.figure(figsize=(10, 8))
                    scatter = plt.scatter(X_umap[:, 0], X_umap[:, 1], c=labels_viz, cmap='tab10', s=5, alpha=0.6)
                    plt.colorbar(scatter, label="Cluster ID")
                    plt.title("UMAP Projection")
                    plt.xlabel("UMAP 1")
                    plt.ylabel("UMAP 2")
                    plt.grid(True, alpha=0.2)
                    plt.savefig(os.path.join(plots_dir, "umap_projection.png"), dpi=150)
                    plt.close()
                except Exception as e:
                    logger.warning(f"Could not generate UMAP plot: {e}")

        _update_job(
            job_id,
            state="SUCCESS",
            progress=100,
            message="Completed",
            result={"status": "completed", "chosen_k": chosen_k, "chosen_hdb": chosen_hdb},
        )

    except Exception as e:
        logger.exception("Pipeline failed for job %s", job_id)
        _update_job(job_id, state="FAILURE", progress=0, error=str(e), message="Pipeline failed")

def launch_pipeline(job_id: str, feature_mode: str, n_components: int, force: bool, request_data: dict = None):
    """Start the pipeline in a background daemon thread."""
    if request_data is None:
        request_data = {}
        
    _update_job(job_id, state="QUEUED", progress=0, message="Job queued")
    t = threading.Thread(
        target=_run_pipeline,
        args=(job_id, feature_mode, n_components, force, request_data),
        daemon=True,
    )
    t.start()
    return t