import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './lib/auth/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import AdminLayout from './components/admin/AdminLayout';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import UserManagement from './pages/UserManagement';
import Analytics from './pages/Analytics';
import ContentModeration from './pages/ContentModeration';
import SubscriptionSync from './pages/SubscriptionSync';
import BlogCms from './pages/BlogCms';
import AdvertisementManagement from './pages/AdvertisementManagement';
import VerificationManagement from './pages/VerificationManagement';

type ActiveTab = 'dashboard' | 'users' | 'moderation' | 'analytics' | 'subscriptions' | 'content' | 'advertisements' | 'verification';

function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <AdminDashboard />;
      case 'users':
        return <UserManagement />;
      case 'moderation':
        return <ContentModeration />;
      case 'analytics':
        return <Analytics />;
      case 'subscriptions':
        return <SubscriptionSync />;
      case 'content':
        return <BlogCms />;
      case 'advertisements':
        return <AdvertisementManagement />;
      case 'verification':
        return <VerificationManagement />;
      default:
        return <AdminDashboard />;
    }
  };

  return (
    <AuthProvider>
      <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route 
            path="/admin" 
            element={
              <ProtectedRoute>
                <AdminLayout 
                  activeTab={activeTab} 
                  onTabChange={setActiveTab}
                >
                  {renderContent()}
                </AdminLayout>
              </ProtectedRoute>
            } 
          />
          <Route path="/" element={<Navigate to="/admin" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
