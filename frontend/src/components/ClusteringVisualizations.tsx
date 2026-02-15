import React, { useState } from 'react';
import type { Plot } from '../types';

interface ClusteringVisualizationsProps {
  plots: Plot[];
  selectedMethod: 'kmeans' | 'hdbscan';
}

const ClusteringVisualizations: React.FC<ClusteringVisualizationsProps> = ({ plots, selectedMethod }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedPlot, setSelectedPlot] = useState<Plot | null>(null);

  if (!plots || plots.length === 0) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-yellow-800">Aucune visualisation disponible pour ce clustering.</p>
      </div>
    );
  }

  // Filtrer d'abord par méthode (kmeans ou hdbscan)
  const plotsForMethod = plots.filter(plot => {
    if (selectedMethod === 'kmeans') {
      // Pour kmeans: inclure tous les plots sous k_mean/ (incluant hdbscan_in_kmeans)
      return plot.path.includes('k_mean/');
    } else {
      // Pour hdbscan: uniquement les plots sous hdbscan/final/plots (pas ceux dans k_mean)
      return plot.path.includes('hdbscan/final/plots') && !plot.path.includes('k_mean');
    }
  });

  // Puis filtrer par catégorie
  const filteredPlots = selectedCategory === 'all' 
    ? plotsForMethod 
    : plotsForMethod.filter(plot => plot.category === selectedCategory);

  const categories = [
    { value: 'all', label: 'Toutes', count: plotsForMethod.length },
    { value: 'main', label: 'Principales', count: plotsForMethod.filter(p => p.category === 'main').length },
    { value: 'hierarchical', label: 'Hiérarchiques', count: plotsForMethod.filter(p => p.category === 'hierarchical').length },
    { value: 'preprocessing', label: 'Prétraitement', count: plotsForMethod.filter(p => p.category === 'preprocessing').length },
  ].filter(cat => cat.count > 0);

  return (
    <div className="space-y-6">
      {/* En-tête avec filtres */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center">
          <span className="text-3xl mr-3">📊</span>
          Visualisations - {selectedMethod.toUpperCase()}
        </h2>
        
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
        >
          {categories.map(cat => (
            <option key={cat.value} value={cat.value}>
              {cat.label} ({cat.count})
            </option>
          ))}
        </select>
      </div>

      {/* Grille de visualisations */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredPlots.map((plot) => (
          <PlotCard 
            key={plot.filename} 
            plot={plot} 
            onViewLarge={() => setSelectedPlot(plot)}
          />
        ))}
      </div>

      {/* Modal pour l'image en grand */}
      {selectedPlot && (
        <PlotModal 
          plot={selectedPlot} 
          onClose={() => setSelectedPlot(null)} 
        />
      )}
    </div>
  );
};

interface PlotCardProps {
  plot: Plot;
  onViewLarge: () => void;
}

const PlotCard: React.FC<PlotCardProps> = ({ plot, onViewLarge }) => {
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
  const imageUrl = `${apiUrl}${plot.url}`;

  const handleDownload = async () => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = plot.filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading plot:', error);
      alert('Erreur lors du téléchargement');
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
      {/* Image */}
      <div 
        className="relative h-64 bg-gray-100 cursor-pointer group"
        onClick={onViewLarge}
      >
        <img
          src={imageUrl}
          alt={plot.title}
          className="w-full h-full object-contain p-4"
        />
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-opacity flex items-center justify-center">
          <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-black bg-opacity-75 text-white px-4 py-2 rounded-lg text-sm font-medium">
            🔍 Cliquer pour agrandir
          </div>
        </div>
        <div className="absolute top-2 right-2">
          <span className={`text-xs px-2 py-1 rounded ${getCategoryColor(plot.category)}`}>
            {getCategoryLabel(plot.category)}
          </span>
        </div>
      </div>

      {/* Contenu */}
      <div className="p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          {plot.title}
        </h3>
        
        <p className="text-sm text-gray-600 mb-4 line-clamp-3">
          {plot.description}
        </p>

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={onViewLarge}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium flex items-center justify-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
              <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
            </svg>
            Voir en grand
          </button>
          <button
            onClick={handleDownload}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm font-medium flex items-center justify-center"
            title="Télécharger"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

interface PlotModalProps {
  plot: Plot;
  onClose: () => void;
}

const PlotModal: React.FC<PlotModalProps> = ({ plot, onClose }) => {
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
  const imageUrl = `${apiUrl}${plot.url}`;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div 
        className="max-w-7xl w-full bg-white rounded-lg overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b flex items-center justify-between bg-gray-50">
          <h3 className="text-xl font-semibold text-gray-900">{plot.title}</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-3xl leading-none p-1"
          >
            ×
          </button>
        </div>
        <div className="p-6 max-h-[calc(100vh-200px)] overflow-y-auto">
          <img
            src={imageUrl}
            alt={plot.title}
            className="w-full h-auto mb-4"
          />
          <p className="text-gray-600 leading-relaxed">{plot.description}</p>
        </div>
        <div className="p-4 border-t bg-gray-50 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
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
