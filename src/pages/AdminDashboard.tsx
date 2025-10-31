import React, { useState, useEffect } from 'react';
import { 
  Users, 
  TrendingUp, 
  DollarSign, 
  MessageSquare, 
  Calendar,
  Activity,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { AdminService } from '../lib/admin/adminService';
import { useAdmin } from '../lib/admin/useAdmin';

interface DashboardStats {
  total_users: number;
  total_owners: number;
  total_caretakers: number;
  active_subscriptions: number;
  total_conversations: number;
  total_messages: number;
  total_revenue: number;
  users_last_30_days: number;
}

const AdminDashboard: React.FC = () => {
  const { adminUser } = useAdmin();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardStats();
  }, []);

  const loadDashboardStats = async () => {
    try {
      setLoading(true);
      console.log('Loading dashboard stats...');
      
      // Timeout für Dashboard-Loading (10 Sekunden)
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Dashboard loading timeout')), 10000)
      );
      
      const dashboardStats = await Promise.race([
        AdminService.getDashboardStats(),
        timeoutPromise
      ]) as DashboardStats;
      
      console.log('Dashboard stats loaded:', dashboardStats);
      setStats(dashboardStats);
    } catch (error) {
      console.error('Error loading dashboard stats:', error);
      // Fallback zu leeren Daten
      setStats({
        total_users: 0,
        total_owners: 0,
        total_caretakers: 0,
        active_subscriptions: 0,
        total_conversations: 0,
        total_messages: 0,
        total_revenue: 0,
        users_last_30_days: 0
      });
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Gesamt Benutzer',
      value: stats?.total_users || 0,
      icon: Users,
      change: stats?.users_last_30_days || 0,
      changeType: 'positive' as const,
      description: 'Neue Benutzer in den letzten 30 Tagen'
    },
    {
      title: 'Aktive Abonnements',
      value: stats?.active_subscriptions || 0,
      icon: TrendingUp,
      change: 12,
      changeType: 'positive' as const,
      description: 'Premium-Abonnements'
    },
    {
      title: 'Gesamtumsatz',
      value: `€${(stats?.total_revenue || 0).toLocaleString()}`,
      icon: DollarSign,
      change: 8.2,
      changeType: 'positive' as const,
      description: 'Monatlicher Umsatz'
    },
    {
      title: 'Nachrichten',
      value: stats?.total_messages || 0,
      icon: MessageSquare,
      change: -2.1,
      changeType: 'negative' as const,
      description: 'Gesendete Nachrichten'
    }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-600">
          Willkommen zurück, {adminUser?.first_name}! Hier ist eine Übersicht über Ihre Plattform.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card, index) => {
          const Icon = card.icon;
          const ChangeIcon = card.changeType === 'positive' ? ArrowUpRight : ArrowDownRight;
          
          return (
            <div key={index} className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{card.title}</p>
                  <p className="text-2xl font-bold text-gray-900">{card.value}</p>
                </div>
                <div className="h-12 w-12 bg-primary-100 rounded-lg flex items-center justify-center">
                  <Icon className="h-6 w-6 text-primary-600" />
                </div>
              </div>
              <div className="mt-4 flex items-center">
                <ChangeIcon 
                  className={`h-4 w-4 mr-1 ${
                    card.changeType === 'positive' ? 'text-green-500' : 'text-red-500'
                  }`} 
                />
                <span 
                  className={`text-sm font-medium ${
                    card.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {Math.abs(card.change)}%
                </span>
                <span className="text-sm text-gray-500 ml-1">{card.description}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Benutzerverteilung</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="h-3 w-3 bg-blue-500 rounded-full mr-3"></div>
                <span className="text-sm text-gray-600">Besitzer</span>
              </div>
              <span className="text-sm font-medium text-gray-900">{stats?.total_owners || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="h-3 w-3 bg-green-500 rounded-full mr-3"></div>
                <span className="text-sm text-gray-600">Betreuer</span>
              </div>
              <span className="text-sm font-medium text-gray-900">{stats?.total_caretakers || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="h-3 w-3 bg-purple-500 rounded-full mr-3"></div>
                <span className="text-sm text-gray-600">Dienstleister</span>
              </div>
              <span className="text-sm font-medium text-gray-900">{Math.max(0, (stats?.total_caretakers || 0) - 4)}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Aktivität</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <MessageSquare className="h-4 w-4 text-gray-400 mr-3" />
                <span className="text-sm text-gray-600">Gespräche</span>
              </div>
              <span className="text-sm font-medium text-gray-900">{stats?.total_conversations || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Activity className="h-4 w-4 text-gray-400 mr-3" />
                <span className="text-sm text-gray-600">Nachrichten</span>
              </div>
              <span className="text-sm font-medium text-gray-900">{stats?.total_messages || 0}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Letzte Aktivitäten</h3>
        </div>
        <div className="p-6">
          <div className="text-center py-8">
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">Keine aktuellen Aktivitäten</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
