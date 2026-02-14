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
  const [globalReport, setGlobalReport] = useState<string>('');
  const [loadingGlobalReport, setLoadingGlobalReport] = useState(false);

  // Helper function to clean markdown from code block wrapping
  const cleanMarkdown = (text: string): string => {
    // Remove ```markdown at the beginning and ``` at the end
    let cleaned = text.trim();
    if (cleaned.startsWith('```markdown')) {
      cleaned = cleaned.replace(/^```markdown\n?/, '');
    } else if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```\n?/, '');
    }
    if (cleaned.endsWith('```')) {
      cleaned = cleaned.replace(/\n?```$/, '');
    }
    return cleaned.trim();
  };

  useEffect(() => {
    if (!jobId) return;

    const checkStatus = async () => {
      try {
        const statusData = await clusteringAPI.getJobStatus(jobId);
        setStatus(statusData);

        if (statusData.status === 'completed') {
          const resultsData = await clusteringAPI.getResults(jobId);
          setResults(resultsData);
          clearInterval(interval);
        } else if (statusData.status === 'failed') {
          clearInterval(interval);
        }
      } catch (error) {
        console.error('Error checking status:', error);
      }
    };

    checkStatus();
    const interval = setInterval(checkStatus, 2000);
    return () => clearInterval(interval);
  }, [jobId]);

  const generateReport = async (clusterId: number) => {
    if (!jobId) return;
    setLoadingReport(true);
    setSelectedCluster(clusterId); // Set immediately for loading indicator
    try {
      const data = await llmAPI.generateReport(jobId, clusterId, selectedMethod);
      setReport(cleanMarkdown(data.report));
    } catch (error) {
      console.error('Error generating report:', error);
      alert('Erreur lors de la génération du rapport');
      setSelectedCluster(null); // Reset on error
    } finally {
      setLoadingReport(false);
    }
  };

  const generateGlobalReport = async () => {
    if (!jobId) return;
    setLoadingGlobalReport(true);
    setGlobalReport(''); // Clear previous report
    try {
      const data = await llmAPI.generateGlobalReport(jobId, selectedMethod);
      setGlobalReport(cleanMarkdown(data.report));
      // Clear individual cluster report when showing global
      setSelectedCluster(null);
      setReport('');
    } catch (error) {
      console.error('Error generating global report:', error);
      alert('Erreur lors de la génération du rapport global');
    } finally {
      setLoadingGlobalReport(false);
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
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">
                Clusters - {selectedMethod.toUpperCase()}
              </h3>
              <button
                onClick={generateGlobalReport}
                disabled={loadingGlobalReport}
                className="px-4 py-2 bg-green-600 text-white rounded-md font-medium hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {loadingGlobalReport ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Génération...
                  </span>
                ) : (
                  '📊 Générer Rapport Global'
                )}
              </button>
            </div>
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
                          className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium disabled:text-gray-400 disabled:cursor-not-allowed"
                        >
                          {loadingReport && selectedCluster === cluster.cluster_id ? (
                            <>
                              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              Génération...
                            </>
                          ) : (
                            '📄 Générer Rapport'
                          )}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Global Report Display */}
          {globalReport && (
            <div className="bg-white rounded-lg shadow p-6 border-2 border-green-200">
              <div className="flex items-center mb-4">
                <span className="text-2xl mr-3">📊</span>
                <h3 className="text-xl font-semibold text-green-800">
                  Rapport Global - {selectedMethod.toUpperCase()}
                </h3>
              </div>
              <div className="prose prose-sm md:prose-base lg:prose-lg max-w-none overflow-hidden break-words">
                <div className="markdown-content">
                  <ReactMarkdown
                    components={{
                      h1: (props) => <h1 className="text-2xl font-bold mt-6 mb-4 text-gray-900" {...props} />,
                      h2: (props) => <h2 className="text-xl font-semibold mt-5 mb-3 text-gray-800" {...props} />,
                      h3: (props) => <h3 className="text-lg font-semibold mt-4 mb-2 text-gray-800" {...props} />,
                      p: (props) => <p className="mb-4 text-gray-700 leading-relaxed break-words" {...props} />,
                      ul: (props) => <ul className="list-disc list-inside mb-4 space-y-2 text-gray-700" {...props} />,
                      ol: (props) => <ol className="list-decimal list-inside mb-4 space-y-2 text-gray-700" {...props} />,
                      li: (props) => <li className="ml-4 break-words" {...props} />,
                      strong: (props) => <strong className="font-semibold text-gray-900" {...props} />,
                      code: (props) => <code className="bg-gray-100 px-1.5 py-0.5 rounded text-sm font-mono text-gray-800 break-words" {...props} />,
                      pre: (props) => <pre className="bg-gray-100 p-4 rounded-lg overflow-x-auto mb-4" {...props} />,
                      blockquote: (props) => <blockquote className="border-l-4 border-green-500 pl-4 italic text-gray-700 my-4" {...props} />,
                    }}
                  >
                    {globalReport}
                  </ReactMarkdown>
                </div>
              </div>
            </div>
          )}

          {/* Report Display */}
          {report && selectedCluster !== null && (
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center mb-4">
                <span className="text-xl mr-2">📄</span>
                <h3 className="text-xl font-semibold text-blue-800">
                  Rapport LLM - Cluster {selectedCluster}
                </h3>
              </div>
              <div className="prose prose-sm md:prose-base lg:prose-lg max-w-none overflow-hidden break-words">
                <div className="markdown-content">
                  <ReactMarkdown
                    components={{
                      h1: (props) => <h1 className="text-2xl font-bold mt-6 mb-4 text-gray-900" {...props} />,
                      h2: (props) => <h2 className="text-xl font-semibold mt-5 mb-3 text-gray-800" {...props} />,
                      h3: (props) => <h3 className="text-lg font-semibold mt-4 mb-2 text-gray-800" {...props} />,
                      p: (props) => <p className="mb-4 text-gray-700 leading-relaxed break-words" {...props} />,
                      ul: (props) => <ul className="list-disc list-inside mb-4 space-y-2 text-gray-700" {...props} />,
                      ol: (props) => <ol className="list-decimal list-inside mb-4 space-y-2 text-gray-700" {...props} />,
                      li: (props) => <li className="ml-4 break-words" {...props} />,
                      strong: (props) => <strong className="font-semibold text-gray-900" {...props} />,
                      code: (props) => <code className="bg-gray-100 px-1.5 py-0.5 rounded text-sm font-mono text-gray-800 break-words" {...props} />,
                      pre: (props) => <pre className="bg-gray-100 p-4 rounded-lg overflow-x-auto mb-4" {...props} />,
                      blockquote: (props) => <blockquote className="border-l-4 border-blue-500 pl-4 italic text-gray-700 my-4" {...props} />,
                    }}
                  >
                    {report}
                  </ReactMarkdown>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default JobDetail;
