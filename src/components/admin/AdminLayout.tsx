import React from 'react';
import { useAuth } from '../../lib/auth/AuthContext';

type ActiveTab = 'dashboard' | 'users' | 'moderation' | 'analytics' | 'subscriptions' | 'content' | 'advertisements' | 'verification';

interface AdminLayoutProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  children: React.ReactNode;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ activeTab, onTabChange, children }) => {
  const { user, signOut } = useAuth();
  
  const tabs = [
    { id: 'dashboard' as ActiveTab, label: 'Dashboard', icon: '📊' },
    { id: 'users' as ActiveTab, label: 'Benutzer', icon: '👥' },
    { id: 'moderation' as ActiveTab, label: 'Moderation', icon: '🛡️' },
    { id: 'analytics' as ActiveTab, label: 'Analytics', icon: '📈' },
    { id: 'subscriptions' as ActiveTab, label: 'Abonnements', icon: '💳' },
    { id: 'content' as ActiveTab, label: 'Content', icon: '📝' },
    { id: 'advertisements' as ActiveTab, label: 'Werbung', icon: '📢' },
    { id: 'verification' as ActiveTab, label: 'Verifizierung', icon: '✅' },
  ];

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <div className="min-h-screen bg-secondary-50">
      <div className="flex">
        {/* Sidebar */}
        <nav className="w-64 bg-white shadow-sm fixed left-0 top-0 bottom-0 flex flex-col z-10">
          {/* Logo */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-center">
              <img 
                src="/Logos/tigube_logo.svg" 
                alt="Tigube Logo" 
                className="h-12 w-auto"
              />
            </div>
          </div>
          
          {/* Navigation */}
          <div className="flex-1 overflow-y-auto p-4">
            <ul className="space-y-2">
              {tabs.map((tab) => (
                <li key={tab.id}>
                  <button
                    onClick={() => onTabChange(tab.id)}
                    className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                      activeTab === tab.id
                        ? 'bg-primary-100 text-primary-700'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                  >
                    <span className="mr-3">{tab.icon}</span>
                    {tab.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>
          
          {/* Avatar Bereich - Fix am unteren Rand */}
          <div className="p-4 border-t border-gray-200 bg-white mt-auto">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-10 h-10 bg-primary-600 rounded-full flex items-center justify-center">
                <span className="text-white font-medium text-sm">
                  {user?.email?.charAt(0).toUpperCase() || 'A'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user?.email || 'Benutzer'}
                </p>
                <p className="text-xs text-gray-500">Administrator</p>
              </div>
            </div>
            <button 
              onClick={handleSignOut}
              className="w-full bg-gray-200 text-gray-700 px-3 py-2 rounded-md text-sm font-medium hover:bg-red-600 hover:text-white transition-colors"
            >
              Abmelden
            </button>
          </div>
        </nav>

        {/* Main Content */}
        <main className="flex-1 ml-64">
          <div className="max-w-7xl mx-auto p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
