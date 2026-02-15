/**
 * Exemple d'intégration du composant ClusteringVisualizations
 * dans une page de résultats de clustering
 */

import React from 'react';
import { useRouter } from 'next/router';
import ClusteringVisualizations from '@/components/ClusteringVisualizations';

// Exemple de page : pages/results/[jobId].tsx

const ClusteringResultsPage = () => {
  const router = useRouter();
  const { jobId } = router.query;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <button
          onClick={() => router.back()}
          className="text-blue-600 hover:text-blue-800 mb-4"
        >
          ← Retour
        </button>
        
        <h1 className="text-3xl font-bold mb-2">
          Résultats du Clustering
        </h1>
        <p className="text-gray-600">
          Job ID: <code className="bg-gray-100 px-2 py-1 rounded">{jobId}</code>
        </p>
      </div>

      {/* Tabs pour naviguer entre différentes sections */}
      <div className="mb-8">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <a
              href="#visualizations"
              className="border-b-2 border-blue-500 py-4 px-1 text-blue-600 font-medium"
            >
              📊 Visualisations
            </a>
            <a
              href="#clusters"
              className="border-b-2 border-transparent py-4 px-1 text-gray-500 hover:text-gray-700 hover:border-gray-300"
            >
              📋 Clusters
            </a>
            <a
              href="#report"
              className="border-b-2 border-transparent py-4 px-1 text-gray-500 hover:text-gray-700 hover:border-gray-300"
            >
              📄 Rapport
            </a>
          </nav>
        </div>
      </div>

      {/* Composant de visualisations */}
      <section id="visualizations">
        {jobId && typeof jobId === 'string' && (
          <ClusteringVisualizations jobId={jobId} />
        )}
      </section>

      {/* Section clusters (à implémenter) */}
      <section id="clusters" className="mt-12">
        <h2 className="text-2xl font-bold mb-4">Détails des Clusters</h2>
        {/* Tableau ou cards avec les infos de clusters */}
      </section>

      {/* Section rapport (à implémenter) */}
      <section id="report" className="mt-12">
        <h2 className="text-2xl font-bold mb-4">Rapport d'Analyse</h2>
        {/* Bouton de téléchargement du rapport, etc. */}
      </section>
    </div>
  );
};

export default ClusteringResultsPage;


// ========================================
// Alternative: Intégration dans un modal
// ========================================

import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';

interface VisualizationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  jobId: string;
}

export const VisualizationsModal: React.FC<VisualizationsModalProps> = ({
  isOpen,
  onClose,
  jobId,
}) => {
  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-10" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-7xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <Dialog.Title
                  as="h3"
                  className="text-lg font-medium leading-6 text-gray-900 mb-4"
                >
                  Visualisations du Clustering
                </Dialog.Title>

                <ClusteringVisualizations jobId={jobId} />

                <div className="mt-6">
                  <button
                    type="button"
                    className="inline-flex justify-center rounded-md border border-transparent bg-blue-100 px-4 py-2 text-sm font-medium text-blue-900 hover:bg-blue-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                    onClick={onClose}
                  >
                    Fermer
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};


// ========================================
// Alternative: Intégration dans un dashboard
// ========================================

interface DashboardProps {
  jobId: string;
}

export const ClusteringDashboard: React.FC<DashboardProps> = ({ jobId }) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Sidebar avec stats */}
      <div className="lg:col-span-1">
        <div className="bg-white rounded-lg shadow p-6 space-y-4">
          <h3 className="text-lg font-semibold">Statistiques</h3>
          {/* Stats ici */}
        </div>
      </div>

      {/* Visualisations principales */}
      <div className="lg:col-span-2">
        <ClusteringVisualizations jobId={jobId} />
      </div>
    </div>
  );
};
