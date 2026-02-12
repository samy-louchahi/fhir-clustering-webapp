import React from 'react';

interface StatusBadgeProps {
  status: string;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const getStatusStyles = () => {
    switch (status.toLowerCase()) {
      case 'completed':
      case 'success':
        return 'bg-green-100 text-green-800';
      case 'failed':
      case 'failure':
        return 'bg-red-100 text-red-800';
      case 'queued':
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'running':
      case 'preprocessing':
      case 'tuning':
      case 'clustering':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusStyles()}`}>
      {status}
    </span>
  );
};

export default StatusBadge;
