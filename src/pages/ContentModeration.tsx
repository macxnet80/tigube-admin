import React from 'react';
import { Shield } from 'lucide-react';

const ContentModeration: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">Content Moderation</h2>
        <p className="text-gray-600">Moderieren Sie Inhalte und Berichte</p>
      </div>
      
      <div className="bg-white rounded-lg border p-6">
        <div className="text-center py-8">
          <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">Content Moderation wird implementiert...</p>
        </div>
      </div>
    </div>
  );
};

export default ContentModeration;
