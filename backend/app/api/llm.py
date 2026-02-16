from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import pandas as pd
import os

from app.services.llm_service import LLMReportGenerator

router = APIRouter()

class ReportRequest(BaseModel):
    job_id: str
    cluster_id: int
    method: str = "kmeans"  # or "hdbscan"

class GlobalReportRequest(BaseModel):
    job_id: str
    method: str = "kmeans"  # or "hdbscan"

@router.post("/generate-report")
async def generate_report(request: ReportRequest):
    """Génère un rapport LLM pour un cluster"""
    
    # Map method name: frontend sends 'kmeans' but folder is 'k_mean'
    method_folder = "k_mean" if request.method == "kmeans" else request.method
    
    # Load cluster data
    results_dir = f"/app/results/jobs/{request.job_id}/{method_folder}/final"
    
    summary_path = f"{results_dir}/summary.csv"
    top_codes_path = f"{results_dir}/top_features_distinctiveness.csv"
    
    if not os.path.exists(summary_path):
        raise HTTPException(status_code=404, detail="Cluster data not found")
    
    summary_df = pd.read_csv(summary_path)
    top_codes_df = pd.read_csv(top_codes_path) if os.path.exists(top_codes_path) else None
    
    # Generate report
    generator = LLMReportGenerator()
    report = await generator.generate_cluster_report(
        cluster_id=request.cluster_id,
        summary_df=summary_df,
        top_codes_df=top_codes_df
    )
    
    return {
        "cluster_id": request.cluster_id,
        "report": report
    }

@router.post("/generate-global-report")
async def generate_global_report(request: GlobalReportRequest):
    """Génère un rapport global pour tous les clusters"""
    
    # Map method name: frontend sends 'kmeans' but folder is 'k_mean'
    method_folder = "k_mean" if request.method == "kmeans" else request.method
    
    results_dir = f"/app/results/jobs/{request.job_id}/{method_folder}/final"
    summary_path = f"{results_dir}/summary.csv"
    
    if not os.path.exists(summary_path):
        raise HTTPException(status_code=404, detail="Results not found")
    
    summary_df = pd.read_csv(summary_path)
    
    generator = LLMReportGenerator()
    report = await generator.generate_global_report(
        summary_df=summary_df,
        method=request.method
    )
    
    return {"report": report}
