import React, { useState, useEffect } from 'react';
import Plot from 'react-plotly.js';

interface Feature {
  name: string;
  score: number;
  rank: number;
}

interface ClusterFeatures {
  cluster_id: number;
  features: Feature[];
}

interface TopFeaturesChartProps {
  data: ClusterFeatures[];
  selectedClusterId?: number | null;
}

const TopFeaturesChart: React.FC<TopFeaturesChartProps> = ({ data, selectedClusterId }) => {
  const [selectedCluster, setSelectedCluster] = useState<number | null>(
    selectedClusterId !== undefined ? selectedClusterId : (data.length > 0 ? data[0].cluster_id : null)
  );

  useEffect(() => {
    if (selectedClusterId !== undefined) {
      setSelectedCluster(selectedClusterId);
    }
  }, [selectedClusterId]);

  if (!data || data.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        Aucune donnée disponible
      </div>
    );
  }

  const clusterData = data.find(c => c.cluster_id === selectedCluster);
  
  if (!clusterData) {
    return (
      <div className="text-center py-8 text-gray-500">
        Cluster non trouvé
      </div>
    );
  }

  // Prepare data for Plotly (reversed for bottom-to-top display)
  const features = [...clusterData.features].reverse();
  const featureNames = features.map(f => f.name);
  const scores = features.map(f => f.score);

  // Color scale based on score
  const colors = scores.map(score => {
    const intensity = Math.min(score / 2, 1); // Normalize to 0-1
    return `rgba(59, 130, 246, ${0.4 + intensity * 0.6})`; // Blue with varying opacity
  });

  return (
    <div className="space-y-4">
      {/* Cluster selector */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-sm font-medium text-gray-700">Sélectionner un cluster :</span>
        {data.map(cluster => (
          <button
            key={cluster.cluster_id}
            onClick={() => setSelectedCluster(cluster.cluster_id)}
            className={`px-3 py-1.5 rounded-md font-medium text-sm transition-colors ${
              selectedCluster === cluster.cluster_id
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Cluster {cluster.cluster_id}
          </button>
        ))}
      </div>

      {/* Bar chart */}
      <div className="bg-gray-50 rounded-lg p-4">
        <Plot
          data={[
            {
              type: 'bar',
              x: scores,
              y: featureNames,
              orientation: 'h',
              marker: {
                color: colors,
                line: {
                  color: 'rgba(59, 130, 246, 1)',
                  width: 1.5
                }
              },
              text: scores.map(s => s.toFixed(3)),
              textposition: 'outside',
              hovertemplate: '<b>%{y}</b><br>Score: %{x:.3f}<extra></extra>',
            }
          ]}
          layout={{
            title: {
              text: `Top Features Distinctives - Cluster ${selectedCluster}`,
              font: { size: 18, family: 'Arial, sans-serif' }
            },
            xaxis: {
              title: 'Score de Distinctivité',
              showgrid: true,
              gridcolor: 'rgba(0,0,0,0.1)'
            },
            yaxis: {
              title: '',
              automargin: true
            },
            height: Math.max(400, features.length * 40),
            margin: { l: 200, r: 80, t: 60, b: 60 },
            paper_bgcolor: 'rgba(249, 250, 251, 1)',
            plot_bgcolor: 'rgba(255, 255, 255, 1)',
            hovermode: 'closest'
          }}
          config={{
            responsive: true,
            displayModeBar: true,
            displaylogo: false,
            modeBarButtonsToRemove: ['pan2d', 'lasso2d', 'select2d']
          }}
          style={{ width: '100%' }}
        />
      </div>

      {/* Legend/Info */}
      <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded-md">
        <p className="font-semibold mb-1">💡 Interprétation :</p>
        <p>
          Les scores de distinctivité indiquent à quel point chaque feature est caractéristique 
          de ce cluster par rapport aux autres. Plus le score est élevé, plus la feature est 
          spécifique à ce cluster.
        </p>
      </div>
    </div>
  );
};

export default TopFeaturesChart;
