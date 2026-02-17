import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { clusteringAPI, llmAPI } from '../services/api';
import type { JobStatus, ClusterResults } from '../types';
import ReactMarkdown from 'react-markdown';
import html2pdf from 'html2pdf.js';
import ClusteringVisualizations from '../components/ClusteringVisualizations';

// Utilisation de la variable d'environnement Vite avec un fallback local
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

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
  
  // Refs pour l'export PDF
  const globalReportRef = useRef<HTMLDivElement>(null);
  const clusterReportRef = useRef<HTMLDivElement>(null);

  // Fonction pour nettoyer le markdown (enlève les balises de code markdown)
  const cleanMarkdown = (text: string): string => {
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

  // Fonction pour télécharger le rapport en PDF
  const downloadPDF = (elementRef: React.RefObject<HTMLDivElement>, filename: string) => {
    if (!elementRef.current) return;
    
    const opt = {
      margin: [10, 10],
      filename: filename,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, letterRendering: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' as const }
    };

    html2pdf().set(opt).from(elementRef.current).save();
  };

  // Polling du statut du Job
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

  // Générer rapport LLM pour un seul cluster
  const generateReport = async (clusterId: number) => {
    if (!jobId) return;
    setLoadingReport(true);
    setSelectedCluster(clusterId); 
    try {
      const data = await llmAPI.generateReport(jobId, clusterId, selectedMethod);
      setReport(cleanMarkdown(data.report));
    } catch (error) {
      console.error('Error generating report:', error);
      alert('Erreur lors de la génération du rapport');
      setSelectedCluster(null);
    } finally {
      setLoadingReport(false);
    }
  };

  // Générer rapport LLM global
  const generateGlobalReport = async () => {
    if (!jobId) return;
    setLoadingGlobalReport(true);
    setGlobalReport('');
    try {
      const data = await llmAPI.generateGlobalReport(jobId, selectedMethod);
      setGlobalReport(cleanMarkdown(data.report));
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
      {/* Carte de Statut */}
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

      {/* Résultats (Une fois complété) */}
      {results && (
        <>
          {/* Sélecteur de méthode (K-Means vs HDBSCAN) */}
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

          {/* Table des Clusters */}
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
                        <div className="flex space-x-4">
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

                          {/* Bouton Export DCAT-AP */}
                          <a
                            href={`${API_BASE_URL}/jobs/${jobId}/clusters/${cluster.cluster_id}/dcat`}
                            download
                            className="inline-flex items-center text-green-600 hover:text-green-800 font-medium transition"
                          >
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                            Exporter DCAT-AP (FAIR)
                          </a>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section Visualisations (Plotly + UMAP) */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-xl font-semibold mb-4">Visualisations</h3>
            
            {/* Graphiques Interactifs React-Plotly (si disponibles) */}
            {results.plots && results.plots.length > 0 && (
              <ClusteringVisualizations plots={results.plots} selectedMethod={selectedMethod} />
            )}

            {/* Graphique Statique UMAP */}
            <div className="mt-8 border-t pt-6">
              <h4 className="text-lg font-medium mb-3 text-gray-800">Projection Topologique Locale (UMAP)</h4>
              <div className="flex justify-center border border-gray-200 rounded p-4 bg-gray-50">
                <img 
                  src={`${API_BASE_URL}/jobs/${jobId}/files/plots/umap_projection.png`} 
                  alt="Projection UMAP indisponible ou en cours de génération..." 
                  className="max-w-full h-auto rounded shadow-sm"
                  onError={(e) => {
                    // Masque l'image si elle n'existe pas encore (fallback propre)
                    (e.target as HTMLImageElement).style.display = 'none';
                    (e.target as HTMLImageElement).parentElement!.innerHTML = '<p class="text-gray-500 italic text-sm">Image UMAP non générée pour ce job ou introuvable.</p>';
                  }}
                />
              </div>
              <p className="text-sm text-gray-500 mt-2 text-center">
                Cette carte non-linéaire (UMAP) permet de visualiser les cohortes de patients et leurs interconnexions (comorbidités).
              </p>
            </div>
          </div>

          {/* Affichage du Rapport Global */}
          {globalReport && (
            <div className="bg-white rounded-lg shadow p-6 border-2 border-green-200 mt-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <span className="text-2xl mr-3">📊</span>
                  <h3 className="text-xl font-semibold text-green-800">
                    Rapport Global - {selectedMethod.toUpperCase()}
                  </h3>
                </div>
                <button
                  onClick={() => downloadPDF(globalReportRef, `rapport-global-${selectedMethod}-${jobId?.substring(0, 8)}.pdf`)}
                  className="px-4 py-2 bg-green-600 text-white rounded-md font-medium hover:bg-green-700 transition-colors flex items-center gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                  Télécharger PDF
                </button>
              </div>
              
              <div ref={globalReportRef} className="prose prose-sm md:prose-base lg:prose-lg max-w-none overflow-hidden break-words">
                {/* Image UMAP intégrée dans le rapport pour l'export PDF */}
                <div className="my-6">
                   <img 
                      src={`${API_BASE_URL}/jobs/${jobId}/files/plots/umap_projection.png`} 
                      alt="UMAP" 
                      style={{ maxWidth: '100%', height: 'auto', display: 'block', margin: '0 auto' }}
                      crossOrigin="anonymous" // Nécessaire pour que html2pdf puisse capturer l'image
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                </div>
                
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

          {/* Affichage du Rapport par Cluster (LLM) */}
          {report && selectedCluster !== null && (
            <div className="bg-white rounded-lg shadow p-6 mt-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <span className="text-xl mr-2">📄</span>
                  <h3 className="text-xl font-semibold text-blue-800">
                    Rapport LLM - Cluster {selectedCluster}
                  </h3>
                </div>
                <button
                  onClick={() => downloadPDF(clusterReportRef, `rapport-cluster-${selectedCluster}-${selectedMethod}-${jobId?.substring(0, 8)}.pdf`)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                  Télécharger PDF
                </button>
              </div>
              <div ref={clusterReportRef} className="prose prose-sm md:prose-base lg:prose-lg max-w-none overflow-hidden break-words">
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