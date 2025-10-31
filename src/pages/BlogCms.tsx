import React from 'react';
import { FileText } from 'lucide-react';

const BlogCms: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">Blog & News</h2>
        <p className="text-gray-600">Verwalten Sie Blog-Inhalte und News</p>
      </div>
      
      <div className="bg-white rounded-lg border p-6">
        <div className="text-center py-8">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">Blog CMS wird implementiert...</p>
        </div>
      </div>
    </div>
  );
};

export default BlogCms;
