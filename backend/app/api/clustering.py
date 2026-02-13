from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from uuid import uuid4
import json
import redis

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

@router.get("/results/{job_id}")
async def get_results(job_id: str):
    """Récupère les résultats d'une job terminée"""
    import os
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
