import React, { useState, useEffect } from 'react';
import { 
  Users, 
  TrendingUp, 
  DollarSign, 
  MessageSquare, 
  Calendar,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle2,
  Clock,
  XCircle,
  RefreshCw
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

interface PendingUser {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  user_type: string;
  created_at: string;
  city: string | null;
  plz: string | null;
  approval_status: string;
  approval_notes: string | null;
}

const AdminDashboard: React.FC = () => {
  const { adminUser } = useAdmin();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [loadingPendingUsers, setLoadingPendingUsers] = useState(true);
  const [processingUsers, setProcessingUsers] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadDashboardStats();
    loadPendingUsers();
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

  const loadPendingUsers = async () => {
    try {
      setLoadingPendingUsers(true);
      const users = await AdminService.getPendingApprovalUsers(20);
      setPendingUsers(users);
    } catch (error) {
      console.error('Error loading pending users:', error);
      setPendingUsers([]);
    } finally {
      setLoadingPendingUsers(false);
    }
  };

  const handleApproveUser = async (userId: string) => {
    try {
      setProcessingUsers(prev => new Set(prev).add(userId));
      const success = await AdminService.approveUser(userId);
      if (success) {
        // Entferne den User aus der Liste
        setPendingUsers(prev => prev.filter(user => user.id !== userId));
      }
    } catch (error) {
      console.error('Error approving user:', error);
      alert('Fehler beim Freigeben des Benutzers');
    } finally {
      setProcessingUsers(prev => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    }
  };

  const getUserTypeLabel = (userType: string) => {
    const labels: { [key: string]: string } = {
      'owner': 'Tierbesitzer',
      'caretaker': 'Betreuer',
      'tierarzt': 'Tierarzt',
      'hundetrainer': 'Hundetrainer',
      'tierfriseur': 'Tierfriseur',
      'physiotherapeut': 'Physiotherapeut',
      'ernaehrungsberater': 'Ernährungsberater',
      'tierfotograf': 'Tierfotograf',
      'sonstige': 'Sonstige',
      'dienstleister': 'Dienstleister',
      'admin': 'Administrator'
    };
    return labels[userType] || userType;
  };

  const getApprovalStatusBadge = (status: string) => {
    switch (status) {
      case 'not_requested':
        return <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">Noch nicht angefragt</span>;
      case 'pending':
        return <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">Wartet auf Freigabe</span>;
      case 'rejected':
        return <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">Abgelehnt</span>;
      default:
        return <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">Unbekannt</span>;
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

      {/* Pending Approvals Task List */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">User-Freigaben erforderlich</h3>
            <p className="text-sm text-gray-500 mt-1">
              {pendingUsers.length} {pendingUsers.length === 1 ? 'User wartet' : 'User warten'} auf Freigabe
            </p>
          </div>
          <button
            onClick={loadPendingUsers}
            disabled={loadingPendingUsers}
            className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${loadingPendingUsers ? 'animate-spin' : ''}`} />
            Aktualisieren
          </button>
        </div>
        <div className="p-6">
          {loadingPendingUsers ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-500">Lade User...</p>
            </div>
          ) : pendingUsers.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle2 className="h-12 w-12 text-green-400 mx-auto mb-4" />
              <p className="text-gray-500">Alle User sind freigegeben!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingUsers.map((user) => {
                const isProcessing = processingUsers.has(user.id);
                
                return (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3">
                        <div className="flex-shrink-0">
                          <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                            <span className="text-sm font-medium text-gray-700">
                              {user.first_name?.[0]}{user.last_name?.[0]}
                            </span>
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-medium text-gray-900 truncate">
                              {user.first_name} {user.last_name}
                            </h4>
                            <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
                              {getUserTypeLabel(user.user_type)}
                            </span>
                          </div>
                          <p className="text-sm text-gray-500 truncate">{user.email}</p>
                          {user.city && (
                            <p className="text-xs text-gray-400">{user.city}, {user.plz}</p>
                          )}
                          <div className="mt-1">
                            {getApprovalStatusBadge(user.approval_status)}
                          </div>
                          {user.approval_notes && (
                            <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs">
                              <p className="text-red-800 font-medium mb-1">Ablehnungsgrund:</p>
                              <p className="text-red-700">{user.approval_notes}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <button
                        onClick={() => handleApproveUser(user.id)}
                        disabled={isProcessing}
                        className={`px-4 py-2 text-sm font-medium text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 ${
                          user.approval_status === 'rejected' 
                            ? 'bg-green-600 hover:bg-green-700' 
                            : 'bg-green-600 hover:bg-green-700'
                        }`}
                      >
                        {isProcessing ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            <span>Wird freigegeben...</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="h-4 w-4" />
                            <span>{user.approval_status === 'rejected' ? 'Erneut freigeben' : 'Freigeben'}</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
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
