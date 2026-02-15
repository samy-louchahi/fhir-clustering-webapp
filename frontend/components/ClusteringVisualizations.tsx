/**
 * Composant React pour afficher les visualisations de clustering
 * À ajouter dans le frontend Next.js
 */

import React, { useState, useEffect } from 'react';
import Image from 'next/image';

interface Plot {
  filename: string;
  path: string;
  url: string;
  title: string;
  description: string;
  type: 'scatter' | 'bar' | 'heatmap' | 'line' | 'unknown';
  category: 'main' | 'hierarchical' | 'preprocessing' | 'other';
}

interface ClusteringVisualizationsProps {
  jobId: string;
}

const ClusteringVisualizations: React.FC<ClusteringVisualizationsProps> = ({ jobId }) => {
  const [plots, setPlots] = useState<Plot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    const fetchPlots = async () => {
      try {
        setLoading(true);
        const response = await fetch(`http://localhost:8000/api/clustering/results/${jobId}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch results');
        }
        
        const data = await response.json();
        setPlots(data.plots || []);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    if (jobId) {
      fetchPlots();
    }
  }, [jobId]);

  const filteredPlots = selectedCategory === 'all' 
    ? plots 
    : plots.filter(plot => plot.category === selectedCategory);

  const categories = [
    { value: 'all', label: 'Toutes les visualisations' },
    { value: 'main', label: 'Principales' },
    { value: 'hierarchical', label: 'Hiérarchiques' },
    { value: 'preprocessing', label: 'Prétraitement' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        <span className="ml-4 text-gray-600">Chargement des visualisations...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">Erreur: {error}</p>
      </div>
    );
  }

  if (plots.length === 0) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-yellow-800">Aucune visualisation disponible pour ce clustering.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête avec filtres */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">
          📊 Visualisations du Clustering
        </h2>
        
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          {categories.map(cat => (
            <option key={cat.value} value={cat.value}>
              {cat.label} ({cat.value === 'all' ? plots.length : plots.filter(p => p.category === cat.value).length})
            </option>
          ))}
        </select>
      </div>

      {/* Grille de visualisations */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredPlots.map((plot) => (
          <PlotCard key={plot.filename} plot={plot} />
        ))}
      </div>
    </div>
  );
};

interface PlotCardProps {
  plot: Plot;
}

const PlotCard: React.FC<PlotCardProps> = ({ plot }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleDownload = async () => {
    const response = await fetch(`http://localhost:8000${plot.url}`);
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = plot.filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  return (
    <>
      <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
        {/* Image */}
        <div 
          className="relative h-64 bg-gray-100 cursor-pointer"
          onClick={() => setIsModalOpen(true)}
        >
          <img
            src={`http://localhost:8000${plot.url}`}
            alt={plot.title}
            className="w-full h-full object-contain p-4"
          />
          <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
            Cliquer pour agrandir
          </div>
        </div>

        {/* Contenu */}
        <div className="p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold text-gray-900">
              {plot.title}
            </h3>
            <span className={`text-xs px-2 py-1 rounded ${getCategoryColor(plot.category)}`}>
              {getCategoryLabel(plot.category)}
            </span>
          </div>
          
          <p className="text-sm text-gray-600 mb-4">
            {plot.description}
          </p>

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex-1 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors text-sm"
            >
              🔍 Voir en grand
            </button>
            <button
              onClick={handleDownload}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors text-sm"
            >
              ⬇️ Télécharger
            </button>
          </div>
        </div>
      </div>

      {/* Modal pour l'image en grand */}
      {isModalOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4"
          onClick={() => setIsModalOpen(false)}
        >
          <div className="max-w-6xl w-full bg-white rounded-lg overflow-hidden">
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="text-xl font-semibold">{plot.title}</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>
            <div className="p-4">
              <img
                src={`http://localhost:8000${plot.url}`}
                alt={plot.title}
                className="w-full h-auto"
              />
              <p className="mt-4 text-gray-600">{plot.description}</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

// Helpers
function getCategoryColor(category: string): string {
  const colors = {
    main: 'bg-blue-100 text-blue-800',
    hierarchical: 'bg-purple-100 text-purple-800',
    preprocessing: 'bg-green-100 text-green-800',
    other: 'bg-gray-100 text-gray-800',
  };
  return colors[category as keyof typeof colors] || colors.other;
}

function getCategoryLabel(category: string): string {
  const labels = {
    main: 'Principal',
    hierarchical: 'Hiérarchique',
    preprocessing: 'Prétraitement',
    other: 'Autre',
  };
  return labels[category as keyof typeof labels] || 'Autre';
}

export default ClusteringVisualizations;
