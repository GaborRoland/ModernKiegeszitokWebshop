import React from 'react';

const ProductSkeleton: React.FC = () => {
  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg border border-gray-100 dark:border-slate-700 animate-pulse">
      <div className="relative">
        <div className="w-full h-48 bg-gray-200 dark:bg-slate-600 rounded-xl mb-4"></div>
        
        {/* Kedvenc gomb skeleton */}
        <div className="absolute top-3 right-3 w-10 h-10 bg-gray-200 dark:bg-slate-600 rounded-full"></div>
      </div>

      <div className="space-y-3">
        <div className="h-6 bg-gray-200 dark:bg-slate-600 rounded mb-2"></div>
        <div className="h-4 bg-gray-200 dark:bg-slate-600 rounded mb-3"></div>
        <div className="h-4 bg-gray-200 dark:bg-slate-600 rounded w-3/4 mb-4"></div>

        <div className="flex items-center justify-between">
          <div className="h-8 bg-gray-200 dark:bg-slate-600 rounded w-20"></div>
          <div className="h-10 bg-gray-200 dark:bg-slate-600 rounded-xl w-24"></div>
        </div>
      </div>
    </div>
  );
};

export default ProductSkeleton;