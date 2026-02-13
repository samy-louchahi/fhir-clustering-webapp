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

sys.path.insert(0, '/app')

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


def _run_pipeline(job_id: str, feature_mode: str, n_components: int, force: bool):
    """Runs the full pipeline — called inside a daemon thread."""
    try:
        from workflows.pre_process import run_preprocess
        from workflows.tune_kmeans import run_kmeans_tuning
        from workflows.tune_hdbscan import run_hdbscan_tuning
        from workflows.run_final import run_final
        from workflows.terminology_layer import build_terminology_layer

        out_dir = f"/app/results/jobs/{job_id}"
        os.makedirs(out_dir, exist_ok=True)

        # 0) Terminology
        _update_job(job_id, state="PREPROCESSING", progress=5, message="Building terminology...")
        build_terminology_layer(
            data_dir="/app/data",
            omop_dir="/app/terminology_omop",
            out_dir="/app/results/terminology",
            force=False,
            max_ancestor_distance=3,
        )

        # 1) Preprocessing
        _update_job(job_id, state="PREPROCESSING", progress=15, message="Preprocessing data...")
        artifacts = run_preprocess(
            force=force,
            feature_mode=feature_mode,
            out_dir=f"{out_dir}/pre_process",
            terminology_pkl="/app/results/terminology/terminology.pkl" if feature_mode == "domain_rollup" else None,
        )

        # 2) KMeans tuning
        _update_job(job_id, state="TUNING", progress=40, message="Tuning KMeans...")
        chosen_k = run_kmeans_tuning(artifacts, force=force)

        # 3) HDBSCAN tuning
        _update_job(job_id, state="TUNING", progress=55, message="Tuning HDBSCAN...")
        chosen_hdb = run_hdbscan_tuning(artifacts, force=force)

        # 4) Final clustering
        _update_job(job_id, state="CLUSTERING", progress=75, message="Running final clustering...")
        results = run_final(
            artifacts,
            chosen_k,
            chosen_hdb,
            out_kmeans=f"{out_dir}/k_mean/final",
            out_hdbscan=f"{out_dir}/hdbscan/final",
            force=force,
        )

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


def launch_pipeline(job_id: str, feature_mode: str, n_components: int, force: bool):
    """Start the pipeline in a background daemon thread (no fork)."""
    _update_job(job_id, state="QUEUED", progress=0, message="Job queued")
    t = threading.Thread(
        target=_run_pipeline,
        args=(job_id, feature_mode, n_components, force),
        daemon=True,
    )
    t.start()
    return t
