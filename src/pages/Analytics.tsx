import React from 'react';
import { BarChart3 } from 'lucide-react';

const Analytics: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">Analytics</h2>
        <p className="text-gray-600">Plattform-Analysen und Statistiken</p>
      </div>
      
      <div className="bg-white rounded-lg border p-6">
        <div className="text-center py-8">
          <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">Analytics-Dashboard wird implementiert...</p>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
