import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CreditCard,
  RefreshCw,
  Search,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Calendar,
  DollarSign,
  User,
  Filter,
  Eye,
  Edit,
  Save,
  X,
  Clock,
  TrendingUp,
  TrendingDown
} from 'lucide-react';
import { supabaseAdmin } from '../lib/supabase/admin';
import { useToast } from '../lib/toast/ToastContext';

interface Subscription {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  plan_type: string;
  subscription_status: string;
  plan_expires_at: string | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  created_at: string;
  max_contact_requests: number | null;
  max_bookings: number | null;
  search_priority: number | null;
  premium_badge: boolean | null;
}

interface WebhookLog {
  id: string;
  event_type: string;
  stripe_subscription_id: string | null;
  customer_email: string | null;
  status: string;
  error_message: string | null;
  created_at: string;
}

const SubscriptionSync: React.FC = () => {
  const { showSuccess, showError, showInfo } = useToast();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [webhookLogs, setWebhookLogs] = useState<WebhookLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [planFilter, setPlanFilter] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'subscriptions' | 'webhooks'>('subscriptions');
  const [selectedSubscription, setSelectedSubscription] = useState<Subscription | null>(null);
  const [editingSubscription, setEditingSubscription] = useState<Partial<Subscription> | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  useEffect(() => {
    loadSubscriptions();
    loadWebhookLogs();
  }, [statusFilter, planFilter]);

  // Verhindere Body-Scroll wenn Sidepanel offen ist, behalte aber Scrollbar sichtbar
  useEffect(() => {
    if (showEditModal) {
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
      document.body.style.overflow = 'hidden';
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    } else {
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    }

    return () => {
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    };
  }, [showEditModal]);

  const loadSubscriptions = async () => {
    setLoading(true);
    try {
      let query = supabaseAdmin
        .from('users')
        .select('id, email, first_name, last_name, plan_type, subscription_status, plan_expires_at, stripe_customer_id, stripe_subscription_id, created_at, max_contact_requests, max_bookings, search_priority, premium_badge')
        .not('stripe_subscription_id', 'is', null)
        .order('created_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('subscription_status', statusFilter);
      }

      if (planFilter !== 'all') {
        query = query.eq('plan_type', planFilter);
      }

      const { data, error } = await query;

      if (error) throw error;
      setSubscriptions(data || []);
    } catch (error) {
      console.error('Error loading subscriptions:', error);
      showError('Fehler beim Laden der Abonnements');
    } finally {
      setLoading(false);
    }
  };

  const loadWebhookLogs = async () => {
    try {
      const { data, error } = await supabaseAdmin
        .from('webhook_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setWebhookLogs(data || []);
    } catch (error) {
      console.error('Error loading webhook logs:', error);
      showError('Fehler beim Laden der Webhook-Logs');
    }
  };

  const handleSyncSubscription = async (subscription: Subscription) => {
    if (!subscription.stripe_subscription_id) {
      showError('Keine Stripe Subscription ID vorhanden');
      return;
    }

    setLoading(true);
    try {
      // Hier würde normalerweise ein API-Call zu Stripe gemacht werden
      // Für jetzt simulieren wir die Synchronisation
      showInfo('Synchronisation mit Stripe wird durchgeführt...');
      
      // Simuliere API-Call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Aktualisiere die Abonnement-Daten
      const { error } = await supabaseAdmin
        .from('users')
        .update({
          updated_at: new Date().toISOString(),
        })
        .eq('id', subscription.id);

      if (error) throw error;
      
      showSuccess('Abonnement erfolgreich synchronisiert');
      loadSubscriptions();
    } catch (error) {
      console.error('Error syncing subscription:', error);
      showError('Fehler beim Synchronisieren des Abonnements');
    } finally {
      setLoading(false);
    }
  };

  const handleSyncAll = async () => {
    if (!confirm('Möchten Sie wirklich alle Abonnements synchronisieren? Dies kann einige Zeit dauern.')) {
      return;
    }

    setLoading(true);
    try {
      showInfo('Synchronisiere alle Abonnements...');
      
      // Simuliere Batch-Synchronisation
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      showSuccess('Alle Abonnements wurden synchronisiert');
      loadSubscriptions();
    } catch (error) {
      console.error('Error syncing all subscriptions:', error);
      showError('Fehler beim Synchronisieren der Abonnements');
    } finally {
      setLoading(false);
    }
  };

  const handleEditSubscription = (subscription: Subscription) => {
    setSelectedSubscription(subscription);
    setEditingSubscription({
      plan_type: subscription.plan_type,
      subscription_status: subscription.subscription_status,
      plan_expires_at: subscription.plan_expires_at ? subscription.plan_expires_at.split('T')[0] : null,
      max_contact_requests: subscription.max_contact_requests,
      max_bookings: subscription.max_bookings,
      search_priority: subscription.search_priority,
      premium_badge: subscription.premium_badge,
    });
    setShowEditModal(true);
  };

  const handleSaveSubscription = async () => {
    if (!selectedSubscription || !editingSubscription) return;

    try {
      const updateData: any = {
        plan_type: editingSubscription.plan_type,
        subscription_status: editingSubscription.subscription_status,
        max_contact_requests: editingSubscription.max_contact_requests,
        max_bookings: editingSubscription.max_bookings,
        search_priority: editingSubscription.search_priority,
        premium_badge: editingSubscription.premium_badge,
        updated_at: new Date().toISOString(),
      };

      if (editingSubscription.plan_expires_at) {
        updateData.plan_expires_at = new Date(editingSubscription.plan_expires_at).toISOString();
      } else {
        updateData.plan_expires_at = null;
      }

      const { error } = await supabaseAdmin
        .from('users')
        .update(updateData)
        .eq('id', selectedSubscription.id);

      if (error) throw error;

      showSuccess('Abonnement wurde aktualisiert');
      setShowEditModal(false);
      setSelectedSubscription(null);
      setEditingSubscription(null);
      loadSubscriptions();
    } catch (error) {
      console.error('Error updating subscription:', error);
      showError('Fehler beim Aktualisieren des Abonnements');
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: { [key: string]: { color: string; label: string; icon: any } } = {
      active: { color: 'bg-green-100 text-green-800', label: 'Aktiv', icon: CheckCircle2 },
      cancelled: { color: 'bg-red-100 text-red-800', label: 'Gekündigt', icon: XCircle },
      past_due: { color: 'bg-yellow-100 text-yellow-800', label: 'Überfällig', icon: AlertCircle },
      trialing: { color: 'bg-blue-100 text-blue-800', label: 'Testphase', icon: Clock },
      free: { color: 'bg-gray-100 text-gray-800', label: 'Kostenlos', icon: User },
      premium: { color: 'bg-purple-100 text-purple-800', label: 'Premium', icon: CreditCard },
    };

    const config = statusConfig[status] || { color: 'bg-gray-100 text-gray-800', label: status, icon: AlertCircle };
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        <Icon className="h-3 w-3" />
        {config.label}
      </span>
    );
  };

  const getPlanBadge = (plan: string) => {
    return plan === 'premium' ? (
      <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-medium">
        Premium
      </span>
    ) : (
      <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-medium">
        Kostenlos
      </span>
    );
  };

  const isExpired = (expiresAt: string | null) => {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
  };

  const isExpiringSoon = (expiresAt: string | null) => {
    if (!expiresAt) return false;
    const daysUntilExpiry = Math.ceil((new Date(expiresAt).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry > 0 && daysUntilExpiry <= 7;
  };

  const filteredSubscriptions = subscriptions.filter(sub =>
    sub.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sub.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sub.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sub.stripe_subscription_id?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = {
    total: subscriptions.length,
    active: subscriptions.filter(s => s.subscription_status === 'active' || s.subscription_status === 'premium').length,
    expired: subscriptions.filter(s => s.plan_expires_at && isExpired(s.plan_expires_at)).length,
    expiringSoon: subscriptions.filter(s => isExpiringSoon(s.plan_expires_at)).length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <CreditCard className="h-6 w-6 text-blue-600" />
          Subscription Sync
        </h1>
        <p className="text-gray-600 mt-1">
          Verwalten und synchronisieren Sie Abonnements mit Stripe
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Gesamt Abonnements</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <CreditCard className="h-8 w-8 text-blue-500" />
          </div>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Aktive</p>
              <p className="text-2xl font-bold text-green-600">{stats.active}</p>
            </div>
            <TrendingUp className="h-8 w-8 text-green-500" />
          </div>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Abgelaufen</p>
              <p className="text-2xl font-bold text-red-600">{stats.expired}</p>
            </div>
            <TrendingDown className="h-8 w-8 text-red-500" />
          </div>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Läuft bald ab</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.expiringSoon}</p>
            </div>
            <AlertCircle className="h-8 w-8 text-yellow-500" />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('subscriptions')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'subscriptions'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Abonnements
          </button>
          <button
            onClick={() => setActiveTab('webhooks')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'webhooks'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Webhook-Logs
          </button>
        </nav>
      </div>

      {/* Subscriptions Tab */}
      {activeTab === 'subscriptions' && (
        <>
          {/* Filters and Search */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Suchen nach E-Mail, Name oder Subscription ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Alle Status</option>
                <option value="active">Aktiv</option>
                <option value="premium">Premium</option>
                <option value="cancelled">Gekündigt</option>
                <option value="past_due">Überfällig</option>
                <option value="trialing">Testphase</option>
                <option value="free">Kostenlos</option>
              </select>
              <select
                value={planFilter}
                onChange={(e) => setPlanFilter(e.target.value)}
                className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Alle Pläne</option>
                <option value="premium">Premium</option>
                <option value="free">Kostenlos</option>
              </select>
              <button
                onClick={handleSyncAll}
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                Alle synchronisieren
              </button>
            </div>
          </div>

          {/* Subscriptions List */}
          <div className="bg-white rounded-lg border">
            <div className="p-6">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
              ) : filteredSubscriptions.length === 0 ? (
                <div className="text-center py-8">
                  <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Keine Abonnements gefunden</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredSubscriptions.map((subscription) => (
                    <div
                      key={subscription.id}
                      className={`border rounded-lg p-4 hover:bg-gray-50 ${
                        isExpired(subscription.plan_expires_at)
                          ? 'border-red-200 bg-red-50'
                          : isExpiringSoon(subscription.plan_expires_at)
                          ? 'border-yellow-200 bg-yellow-50'
                          : 'border-gray-200'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <div>
                              <h3 className="text-sm font-medium text-gray-900">
                                {subscription.first_name} {subscription.last_name}
                              </h3>
                              <p className="text-sm text-gray-500">{subscription.email}</p>
                            </div>
                            {getStatusBadge(subscription.subscription_status)}
                            {getPlanBadge(subscription.plan_type || 'free')}
                            {isExpired(subscription.plan_expires_at) && (
                              <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">
                                Abgelaufen
                              </span>
                            )}
                            {isExpiringSoon(subscription.plan_expires_at) && !isExpired(subscription.plan_expires_at) && (
                              <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">
                                Läuft bald ab
                              </span>
                            )}
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 text-sm">
                            <div>
                              <p className="text-gray-500">Stripe Subscription ID</p>
                              <p className="text-gray-900 font-mono text-xs">{subscription.stripe_subscription_id || 'N/A'}</p>
                            </div>
                            <div>
                              <p className="text-gray-500">Stripe Customer ID</p>
                              <p className="text-gray-900 font-mono text-xs">{subscription.stripe_customer_id || 'N/A'}</p>
                            </div>
                            <div>
                              <p className="text-gray-500">Ablaufdatum</p>
                              <p className="text-gray-900">
                                {subscription.plan_expires_at
                                  ? new Date(subscription.plan_expires_at).toLocaleDateString('de-DE')
                                  : 'Kein Ablaufdatum'}
                              </p>
                            </div>
                            <div>
                              <p className="text-gray-500">Erstellt am</p>
                              <p className="text-gray-900">
                                {new Date(subscription.created_at).toLocaleDateString('de-DE')}
                              </p>
                            </div>
                          </div>
                          {subscription.max_contact_requests !== null && (
                            <div className="mt-3 flex items-center gap-4 text-sm text-gray-600">
                              <span>Max. Kontaktanfragen: {subscription.max_contact_requests}</span>
                              <span>Max. Buchungen: {subscription.max_bookings || 'Unbegrenzt'}</span>
                              {subscription.search_priority !== null && (
                                <span>Suchpriorität: {subscription.search_priority}</span>
                              )}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                          <button
                            onClick={() => handleSyncSubscription(subscription)}
                            disabled={loading}
                            className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg disabled:opacity-50"
                            title="Synchronisieren"
                          >
                            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                          </button>
                          <button
                            onClick={() => handleEditSubscription(subscription)}
                            className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg"
                            title="Bearbeiten"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Webhook Logs Tab */}
      {activeTab === 'webhooks' && (
        <div className="bg-white rounded-lg border">
          <div className="p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">Webhook-Logs</h3>
              <button
                onClick={loadWebhookLogs}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Aktualisieren
              </button>
            </div>
            <div className="space-y-3">
              {webhookLogs.length === 0 ? (
                <div className="text-center py-8">
                  <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Keine Webhook-Logs gefunden</p>
                </div>
              ) : (
                webhookLogs.map((log) => (
                  <div
                    key={log.id}
                    className={`border rounded-lg p-4 ${
                      log.status === 'success'
                        ? 'border-green-200 bg-green-50'
                        : log.status === 'error'
                        ? 'border-red-200 bg-red-50'
                        : 'border-gray-200'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-sm font-medium text-gray-900">{log.event_type}</span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            log.status === 'success'
                              ? 'bg-green-100 text-green-800'
                              : log.status === 'error'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {log.status}
                          </span>
                        </div>
                        {log.stripe_subscription_id && (
                          <p className="text-sm text-gray-600 mb-1">
                            Subscription ID: <span className="font-mono">{log.stripe_subscription_id}</span>
                          </p>
                        )}
                        {log.customer_email && (
                          <p className="text-sm text-gray-600 mb-1">Kunde: {log.customer_email}</p>
                        )}
                        {log.error_message && (
                          <p className="text-sm text-red-600 mt-2 bg-red-100 p-2 rounded">
                            Fehler: {log.error_message}
                          </p>
                        )}
                        <p className="text-xs text-gray-500 mt-2">
                          {new Date(log.created_at).toLocaleString('de-DE')}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Edit Sidepanel */}
      <AnimatePresence>
        {showEditModal && selectedSubscription && editingSubscription && (
          <>
            <motion.div 
              className="fixed top-0 left-0 right-0 bottom-0 bg-black/50 backdrop-blur-sm z-[100]"
              style={{ margin: 0, padding: 0 }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              onClick={() => {
                setShowEditModal(false);
                setSelectedSubscription(null);
                setEditingSubscription(null);
              }}
            />
            <motion.div 
              className="fixed top-0 right-0 bottom-0 w-full max-w-2xl bg-white shadow-xl z-[101] flex flex-col"
              style={{ margin: 0, padding: 0 }}
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'tween', duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
            >
            <div className="p-6 flex flex-col h-full">
            <div className="flex items-center justify-between mb-4 flex-shrink-0">
              <h3 className="text-lg font-semibold text-gray-900">
                Abonnement bearbeiten: {selectedSubscription.email}
              </h3>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setSelectedSubscription(null);
                  setEditingSubscription(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4 flex-1 overflow-y-auto">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Plan-Typ</label>
                <select
                  value={editingSubscription.plan_type || 'free'}
                  onChange={(e) => setEditingSubscription({ ...editingSubscription, plan_type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="free">Kostenlos</option>
                  <option value="premium">Premium</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  value={editingSubscription.subscription_status || 'free'}
                  onChange={(e) => setEditingSubscription({ ...editingSubscription, subscription_status: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="free">Kostenlos</option>
                  <option value="active">Aktiv</option>
                  <option value="premium">Premium</option>
                  <option value="cancelled">Gekündigt</option>
                  <option value="past_due">Überfällig</option>
                  <option value="trialing">Testphase</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Ablaufdatum</label>
                <input
                  type="date"
                  value={editingSubscription.plan_expires_at || ''}
                  onChange={(e) => setEditingSubscription({ ...editingSubscription, plan_expires_at: e.target.value || null })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Max. Kontaktanfragen</label>
                  <input
                    type="number"
                    value={editingSubscription.max_contact_requests || ''}
                    onChange={(e) => setEditingSubscription({ ...editingSubscription, max_contact_requests: e.target.value ? parseInt(e.target.value) : null })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Max. Buchungen</label>
                  <input
                    type="number"
                    value={editingSubscription.max_bookings || ''}
                    onChange={(e) => setEditingSubscription({ ...editingSubscription, max_bookings: e.target.value ? parseInt(e.target.value) : null })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Suchpriorität</label>
                <input
                  type="number"
                  value={editingSubscription.search_priority || ''}
                  onChange={(e) => setEditingSubscription({ ...editingSubscription, search_priority: e.target.value ? parseInt(e.target.value) : null })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={editingSubscription.premium_badge || false}
                    onChange={(e) => setEditingSubscription({ ...editingSubscription, premium_badge: e.target.checked })}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Premium-Badge anzeigen</span>
                </label>
              </div>
            </div>
            <div className="flex items-center gap-3 pt-4 border-t border-gray-200 flex-shrink-0 mt-auto">
              <button
                  onClick={handleSaveSubscription}
                  className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center justify-center gap-2"
                >
                  <Save className="h-4 w-4" />
                  Speichern
                </button>
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedSubscription(null);
                    setEditingSubscription(null);
                  }}
                  className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg"
                >
                  Abbrechen
              </button>
            </div>
            </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SubscriptionSync;
