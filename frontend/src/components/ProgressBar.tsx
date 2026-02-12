import React from 'react';

interface ProgressBarProps {
  progress: number;
  showPercentage?: boolean;
  size?: 'sm' | 'md' | 'lg';
  color?: 'blue' | 'green' | 'yellow' | 'red';
}

const ProgressBar: React.FC<ProgressBarProps> = ({ 
  progress, 
  showPercentage = true,
  size = 'md',
  color = 'blue'
}) => {
  const heightClasses = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3'
  };

  const colorClasses = {
    blue: 'bg-blue-600',
    green: 'bg-green-600',
    yellow: 'bg-yellow-600',
    red: 'bg-red-600'
  };

  return (
    <div className="flex items-center space-x-2 w-full">
      <div className={`flex-1 bg-gray-200 rounded-full ${heightClasses[size]}`}>
        <div
          className={`${colorClasses[color]} ${heightClasses[size]} rounded-full transition-all duration-300`}
          style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
        />
      </div>
      {showPercentage && (
        <span className="text-sm font-medium text-gray-700 min-w-[3rem] text-right">
          {Math.round(progress)}%
        </span>
      )}
    </div>
  );
};

export default ProgressBar;
