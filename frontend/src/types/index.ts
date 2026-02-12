export interface ClusteringRequest {
  feature_mode: 'raw_codes' | 'domain_rollup';
  n_components: number;
  force?: boolean;
}

export interface JobStatus {
  job_id: string;
  status: string;
  progress: number;
  message: string;
}

export interface ClusterInfo {
  cluster_id: number;
  n_patients: number;
  [key: string]: any;
}

export interface ClusterResults {
  kmeans?: {
    clusters: ClusterInfo[];
    top_codes?: any[];
  };
  hdbscan?: {
    clusters: ClusterInfo[];
    top_codes?: any[];
  };
}

export interface ReportRequest {
  job_id: string;
  cluster_id: number;
  method: string;
}

export interface Job {
  job_id: string;
  status: string;
  task_id: string;
}
