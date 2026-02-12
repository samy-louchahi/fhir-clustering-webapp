from celery import Celery
import sys
import os

# Add project paths
sys.path.insert(0, '/app')

from app.config import get_settings

settings = get_settings()

celery = Celery(
    'tasks',
    broker=settings.celery_broker_url,
    backend=settings.celery_result_backend
)

celery.conf.update(
    task_serializer='json',
    accept_content=['json'],
    result_serializer='json',
    timezone='Europe/Paris',
    enable_utc=True,
)

@celery.task(bind=True)
def run_pipeline_task(self, job_id: str, feature_mode: str, n_components: int, force: bool = False):
    """Exécute toute la pipeline de clustering"""
    try:
        # Import workflows
        from workflows.pre_process import run_preprocess
        from workflows.tune_kmeans import run_kmeans_tuning
        from workflows.tune_hdbscan import run_hdbscan_tuning
        from workflows.run_final import run_final
        from workflows.terminology_layer import build_terminology_layer
        
        out_dir = f"/app/results/jobs/{job_id}"
        os.makedirs(out_dir, exist_ok=True)
        
        # 0) Build terminology (if not exists)
        self.update_state(state='PREPROCESSING', meta={'progress': 5, 'message': 'Building terminology...'})
        build_terminology_layer(
            data_dir="/app/data",
            omop_dir="/app/terminology_omop",
            out_dir="/app/results/terminology",
            force=False,
            max_ancestor_distance=3
        )
        
        # 1) Preprocessing
        self.update_state(state='PREPROCESSING', meta={'progress': 15, 'message': 'Preprocessing data...'})
        artifacts = run_preprocess(
            force=force,
            feature_mode=feature_mode,
            out_dir=f"{out_dir}/pre_process",
            terminology_pkl="/app/results/terminology/terminology.pkl" if feature_mode == "domain_rollup" else None
        )
        
        # 2) Tuning KMeans
        self.update_state(state='TUNING', meta={'progress': 40, 'message': 'Tuning KMeans...'})
        chosen_k = run_kmeans_tuning(artifacts, force=force)
        
        # 3) Tuning HDBSCAN
        self.update_state(state='TUNING', meta={'progress': 55, 'message': 'Tuning HDBSCAN...'})
        chosen_hdb = run_hdbscan_tuning(artifacts, force=force)
        
        # 4) Final clustering
        self.update_state(state='CLUSTERING', meta={'progress': 75, 'message': 'Running final clustering...'})
        results = run_final(
            artifacts,
            chosen_k,
            chosen_hdb,
            out_kmeans=f"{out_dir}/k_mean/final",
            out_hdbscan=f"{out_dir}/hdbscan/final",
            force=force
        )
        
        self.update_state(state='SUCCESS', meta={'progress': 100, 'message': 'Completed'})
        
        return {
            "status": "completed",
            "results": results,
            "chosen_k": chosen_k,
            "chosen_hdb": chosen_hdb
        }
    
    except Exception as e:
        self.update_state(state='FAILURE', meta={'error': str(e)})
        raise
