import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { clusteringAPI } from '../services/api';
import type { ClusteringRequest, Job } from '../types';

const Dashboard: React.FC = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Mise à jour de l'état initial avec les nouveaux paramètres
  const [formData, setFormData] = useState<ClusteringRequest>({
    feature_mode: 'domain_rollup',
    n_components: 30,
    force: false,
    include_demographics: true,
    age_weight: 2.0,
    gender_weight: 1.0
  });
  const navigate = useNavigate();

  const loadJobs = async () => {
    try {
      const data = await clusteringAPI.listJobs();
      setJobs(data.jobs);
    } catch (error) {
      console.error('Error loading jobs:', error);
    }
  };

  useEffect(() => {
    loadJobs();
    const interval = setInterval(loadJobs, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await clusteringAPI.runClustering(formData);
      alert(`Job créé avec succès! ID: ${result.job_id}`);
      navigate(`/job/${result.job_id}`);
    } catch (error) {
      console.error('Error submitting job:', error);
      alert('Erreur lors de la création du job');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Form Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Nouvelle Analyse de Clustering</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mode de Features
              </label>
              <select
                value={formData.feature_mode}
                onChange={(e) => setFormData({ ...formData, feature_mode: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="domain_rollup">Domain Rollup (Recommandé)</option>
                <option value="raw_codes">Raw Codes</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Composantes de Réduction
              </label>
              <input
                type="number"
                value={formData.n_components}
                onChange={(e) => setFormData({ ...formData, n_components: parseInt(e.target.value) })}
                min="2"
                max="100"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <hr className="my-4" />
          <h3 className="text-lg font-medium text-gray-800">Enrichissement Démographique</h3>

          {/* Toggle Démographie */}
          <div className="flex items-center mt-2">
            <input 
              type="checkbox" 
              id="demo" 
              checked={formData.include_demographics}
              onChange={(e) => setFormData({...formData, include_demographics: e.target.checked})} 
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="demo" className="ml-2 block text-sm text-gray-900 font-medium">
              Inclure l'Âge et le Sexe dans la matrice
            </label>
          </div>

          {/* Sliders Poids (affichés uniquement si demo est coché) */}
          {formData.include_demographics && (
            <div className="mt-4 p-4 bg-gray-50 rounded-md space-y-4 border border-gray-200">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Poids de l'Âge : <span className="text-blue-600 font-bold">{formData.age_weight}</span>
                </label>
                <input 
                  type="range" min="0" max="5" step="0.5" 
                  value={formData.age_weight}
                  onChange={(e) => setFormData({...formData, age_weight: parseFloat(e.target.value)})}
                  className="w-full"
                />
                <p className="text-xs text-gray-500">Augmentez pour forcer le clustering par tranches d'âge.</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Poids du Sexe : <span className="text-blue-600 font-bold">{formData.gender_weight}</span>
                </label>
                <input 
                  type="range" min="0" max="5" step="0.5" 
                  value={formData.gender_weight}
                  onChange={(e) => setFormData({...formData, gender_weight: parseFloat(e.target.value)})}
                  className="w-full"
                />
              </div>
            </div>
          )}

          <hr className="my-4" />

          <div className="flex items-center">
            <input
              type="checkbox"
              checked={formData.force}
              onChange={(e) => setFormData({ ...formData, force: e.target.checked })}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label className="ml-2 block text-sm text-gray-900">
              Force recalcul (ignorer cache)
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-400 font-medium text-lg mt-4"
          >
            {loading ? 'Lancement en cours...' : 'Lancer le Clustering'}
          </button>
        </form>
      </div>

      {/* Jobs List Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Jobs Récents</h2>
        {jobs.length === 0 ? (
          <p className="text-gray-500 text-center py-8">Aucun job disponible</p>
        ) : (
          <div className="space-y-2">
            {jobs.map((job) => (
              <div
                key={job.job_id}
                onClick={() => navigate(`/job/${job.job_id}`)}
                className="p-4 border border-gray-200 rounded-md hover:bg-gray-50 cursor-pointer transition"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium text-gray-900">Job: {job.job_id.slice(0, 8)}...</p>
                    {job.message && (
                      <p className="text-sm text-gray-500">{job.message}</p>
                    )}
                  </div>
                  <div className="flex items-center space-x-3">
                    {job.progress > 0 && job.status !== 'SUCCESS' && (
                      <span className="text-sm text-gray-500">{job.progress}%</span>
                    )}
                    <span className={`px-3 py-1 rounded-full text-sm ${
                      job.status === 'SUCCESS' ? 'bg-green-100 text-green-800' :
                      job.status === 'FAILURE' ? 'bg-red-100 text-red-800' :
                      job.status === 'QUEUED' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {job.status}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;