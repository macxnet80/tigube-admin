import React from 'react';
import { CreditCard } from 'lucide-react';

const SubscriptionSync: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">Subscription Sync</h2>
        <p className="text-gray-600">Synchronisieren Sie Abonnement-Daten</p>
      </div>
      
      <div className="bg-white rounded-lg border p-6">
        <div className="text-center py-8">
          <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">Subscription Sync wird implementiert...</p>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionSync;
