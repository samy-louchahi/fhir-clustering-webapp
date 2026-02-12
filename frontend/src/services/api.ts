import axios from 'axios';
import type { ClusteringRequest, JobStatus, ClusterResults, Job } from '../types';

const api = axios.create({
  baseURL: 'http://localhost:8000/api',
  timeout: 300000, // 5 min
});

export const clusteringAPI = {
  runClustering: async (request: ClusteringRequest) => {
    const response = await api.post('/clustering/run', request);
    return response.data;
  },
  
  getJobStatus: async (jobId: string): Promise<JobStatus> => {
    const response = await api.get(`/clustering/status/${jobId}`);
    return response.data;
  },
  
  getResults: async (jobId: string): Promise<ClusterResults> => {
    const response = await api.get(`/clustering/results/${jobId}`);
    return response.data;
  },
  
  listJobs: async (): Promise<{ jobs: Job[] }> => {
    const response = await api.get('/clustering/jobs');
    return response.data;
  }
};

export const llmAPI = {
  generateReport: async (jobId: string, clusterId: number, method: string = 'kmeans') => {
    const response = await api.post('/llm/generate-report', {
      job_id: jobId,
      cluster_id: clusterId,
      method
    });
    return response.data;
  },
  
  generateGlobalReport: async (jobId: string, method: string = 'kmeans') => {
    const response = await api.post('/llm/generate-global-report', {
      job_id: jobId,
      method
    });
    return response.data;
  }
};

export default api;
