import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { clusteringAPI, llmAPI } from '../services/api';
import type { JobStatus, ClusterResults } from '../types';
import ReactMarkdown from 'react-markdown';

const JobDetail: React.FC = () => {
  const { jobId } = useParams<{ jobId: string }>();
  const [status, setStatus] = useState<JobStatus | null>(null);
  const [results, setResults] = useState<ClusterResults | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<'kmeans' | 'hdbscan'>('kmeans');
  const [selectedCluster, setSelectedCluster] = useState<number | null>(null);
  const [report, setReport] = useState<string>('');
  const [loadingReport, setLoadingReport] = useState(false);

  useEffect(() => {
    if (!jobId) return;

    const checkStatus = async () => {
      try {
        const statusData = await clusteringAPI.getJobStatus(jobId);
        setStatus(statusData);

        if (statusData.status === 'completed') {
          const resultsData = await clusteringAPI.getResults(jobId);
          setResults(resultsData);
        }
      } catch (error) {
        console.error('Error checking status:', error);
      }
    };

    checkStatus();
    const interval = setInterval(checkStatus, 3000);
    return () => clearInterval(interval);
  }, [jobId]);

  const generateReport = async (clusterId: number) => {
    if (!jobId) return;
    setLoadingReport(true);
    try {
      const data = await llmAPI.generateReport(jobId, clusterId, selectedMethod);
      setReport(data.report);
      setSelectedCluster(clusterId);
    } catch (error) {
      console.error('Error generating report:', error);
      alert('Erreur lors de la génération du rapport');
    } finally {
      setLoadingReport(false);
    }
  };

  if (!status) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Chargement...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Status Card */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold mb-4">Job: {jobId}</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500">Statut</p>
            <p className="text-lg font-semibold capitalize">{status.status}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Progrès</p>
            <div className="flex items-center space-x-2">
              <div className="flex-1 bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all"
                  style={{ width: `${status.progress}%` }}
                />
              </div>
              <span className="text-sm font-medium">{status.progress}%</span>
            </div>
          </div>
        </div>
        {status.message && (
          <p className="mt-4 text-sm text-gray-600">{status.message}</p>
        )}
      </div>

      {/* Results */}
      {results && (
        <>
          {/* Method Selector */}
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex space-x-4">
              <button
                onClick={() => setSelectedMethod('kmeans')}
                className={`px-4 py-2 rounded-md font-medium ${
                  selectedMethod === 'kmeans'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                K-Means
              </button>
              <button
                onClick={() => setSelectedMethod('hdbscan')}
                className={`px-4 py-2 rounded-md font-medium ${
                  selectedMethod === 'hdbscan'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                HDBSCAN
              </button>
            </div>
          </div>

          {/* Clusters Table */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-xl font-semibold mb-4">
              Clusters - {selectedMethod.toUpperCase()}
            </h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Cluster ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Patients
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {(selectedMethod === 'kmeans' ? results.kmeans?.clusters : results.hdbscan?.clusters)?.map((cluster) => (
                    <tr key={cluster.cluster_id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {cluster.cluster_id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {cluster.n_patients}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button
                          onClick={() => generateReport(cluster.cluster_id)}
                          disabled={loadingReport}
                          className="text-blue-600 hover:text-blue-800 font-medium disabled:text-gray-400"
                        >
                          Générer Rapport LLM
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Report Display */}
          {report && selectedCluster !== null && (
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-xl font-semibold mb-4">
                Rapport LLM - Cluster {selectedCluster}
              </h3>
              <div className="prose max-w-none">
                <ReactMarkdown>{report}</ReactMarkdown>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default JobDetail;
