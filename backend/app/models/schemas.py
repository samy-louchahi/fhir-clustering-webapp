from pydantic import BaseModel
from typing import Optional, List

class ClusteringRequest(BaseModel):
    feature_mode: str = "domain_rollup"
    n_components: int = 30
    force: bool = False

    include_demographics: bool = True
    age_weight : float = 2.0
    gender_weight : float = 1.0

class JobStatusResponse(BaseModel):
    job_id: str
    status: str
    progress: int
    message: str = ""

class ReportRequest(BaseModel):
    job_id: str
    cluster_id: int
    method: str = "kmeans"

class ClusterInfo(BaseModel):
    cluster_id: int
    n_patients: int
    top_features: Optional[List[str]] = None
