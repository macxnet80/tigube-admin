import React, { useState, useEffect } from 'react';
import { 
  Users, 
  TrendingUp, 
  RefreshCw,
  Activity,
  UserCheck,
  Shield,
  AlertCircle,
  MapPin
} from 'lucide-react';
import { AdminService } from '../lib/admin/adminService';
import { supabaseAdmin } from '../lib/supabase/admin';
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from 'recharts';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '../components/ui/chart';

interface AnalyticsData {
  timeframe: '7d' | '30d' | '90d';
  userGrowth: Array<{ date: string; users: number }>;
  messageActivity: Array<{ date: string; messages: number }>;
  topFeatures: Array<{ name: string; usage: number }>;
}

interface DashboardStats {
  total_users: number;
  total_owners: number;
  total_caretakers: number;
  active_subscriptions: number;
  total_conversations: number;
  total_messages: number;
  users_last_30_days: number;
}

const Analytics: React.FC = () => {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [timeframe, setTimeframe] = useState<'7d' | '30d' | '90d'>('30d');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userTypeDistribution, setUserTypeDistribution] = useState<{ [key: string]: number }>({});
  const [statusDistribution, setStatusDistribution] = useState<{ [key: string]: number }>({});
  const [newUsersLast24h, setNewUsersLast24h] = useState<number>(0);
  const [topCities, setTopCities] = useState<Array<{ name: string; count: number }>>([]);

  useEffect(() => {
    loadAnalytics();
    loadDashboardStats();
    loadUserTypeDistribution();
    loadStatusDistribution();
    loadNewUsersLast24h();
    loadTopCities();
  }, [timeframe]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await AdminService.getAnalytics(timeframe);
      setAnalyticsData(data);
    } catch (err) {
      setError('Fehler beim Laden der Analytics-Daten');
      console.error('Error loading analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadDashboardStats = async () => {
    try {
      const stats = await AdminService.getDashboardStats();
      setDashboardStats(stats);
    } catch (err) {
      console.error('Error loading dashboard stats:', err);
    }
  };

  const loadUserTypeDistribution = async () => {
    try {
      const { data, error } = await supabaseAdmin
        .from('users')
        .select('user_type');

      if (error) throw error;

      const distribution: { [key: string]: number } = {};
      (data || []).forEach((user: any) => {
        const type = user.user_type || 'unknown';
        distribution[type] = (distribution[type] || 0) + 1;
      });

      setUserTypeDistribution(distribution);
    } catch (err) {
      console.error('Error loading user type distribution:', err);
    }
  };

  const loadStatusDistribution = async () => {
    try {
      const { data, error } = await supabaseAdmin
        .from('users')
        .select('verification_status, is_suspended');

      if (error) throw error;

      const distribution: { [key: string]: number } = {
        verified: 0,
        unverified: 0,
        suspended: 0,
        active: 0
      };

      (data || []).forEach((user: any) => {
        if (user.is_suspended) {
          distribution.suspended++;
        } else {
          distribution.active++;
        }
        if (user.verification_status === 'approved') {
          distribution.verified++;
        } else {
          distribution.unverified++;
        }
      });

      setStatusDistribution(distribution);
    } catch (err) {
      console.error('Error loading status distribution:', err);
    }
  };

  const loadNewUsersLast24h = async () => {
    try {
      const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const { error, count } = await supabaseAdmin
        .from('users')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', last24Hours.toISOString());

      if (error) throw error;
      setNewUsersLast24h(count || 0);
    } catch (err) {
      console.error('Error loading new users last 24h:', err);
      setNewUsersLast24h(0);
    }
  };

  const loadTopCities = async () => {
    try {
      const { data, error } = await supabaseAdmin
        .from('users')
        .select('city');

      if (error) throw error;

      // Zähle Benutzer pro Stadt
      const cityCount: { [key: string]: number } = {};
      (data || []).forEach((user: any) => {
        const city = user.city?.trim();
        if (city && city.length > 0) {
          cityCount[city] = (cityCount[city] || 0) + 1;
        }
      });

      // Sortiere nach Anzahl und nehme die Top 5
      const topCitiesList = Object.entries(cityCount)
        .map(([name, count]) => ({ name, count: count as number }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      setTopCities(topCitiesList);
    } catch (err) {
      console.error('Error loading top cities:', err);
      setTopCities([]);
    }
  };

  const handleRefresh = () => {
    loadAnalytics();
    loadDashboardStats();
    loadUserTypeDistribution();
    loadStatusDistribution();
    loadNewUsersLast24h();
    loadTopCities();
  };

  const formatChartDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' });
  };

  const SimplePieChart: React.FC<{
    data: { [key: string]: number };
    colors: { [key: string]: string };
    labels: { [key: string]: string };
  }> = ({ data, colors, labels }) => {
    const total = Object.values(data).reduce((sum, val) => sum + val, 0);
    if (total === 0) return <p className="text-gray-400 text-sm">Keine Daten</p>;

    return (
      <div className="space-y-2">
        {Object.entries(data).map(([key, value]) => {
          const percentage = (value / total) * 100;
          const color = colors[key] || 'bg-gray-400';
          const label = labels[key] || key;

          return (
            <div key={key} className="flex items-center gap-3">
              <div className="flex items-center gap-2 flex-1">
                <div className={`w-3 h-3 rounded-full ${color}`}></div>
                <span className="text-sm text-gray-700">{label}</span>
              </div>
              <div className="flex items-center gap-2 w-32">
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${color}`}
                    style={{ width: `${percentage}%` }}
                  ></div>
                </div>
                <span className="text-sm font-medium text-gray-900 w-8 text-right">
                  {value}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Analytics</h2>
          <p className="text-gray-600">Plattform-Analysen und Statistiken</p>
        </div>
        
        <div className="flex items-center gap-2">
          <select
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value as '7d' | '30d' | '90d')}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <option value="7d">Letzte 7 Tage</option>
            <option value="30d">Letzte 30 Tage</option>
            <option value="90d">Letzte 90 Tage</option>
          </select>
          <button 
            onClick={handleRefresh}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Aktualisieren
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      {dashboardStats && analyticsData && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Gesamt Benutzer</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{dashboardStats.total_users}</p>
                <p className="text-xs text-gray-500 mt-1">
                  +{dashboardStats.users_last_30_days} in den letzten 30 Tagen
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Aktive Abonnements</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{dashboardStats.active_subscriptions}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {dashboardStats.total_owners + dashboardStats.total_caretakers} aktive Accounts
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Benutzer Typen</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {dashboardStats.total_owners + dashboardStats.total_caretakers}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {dashboardStats.total_owners} Besitzer, {dashboardStats.total_caretakers} Betreuer
                </p>
              </div>
              <div className="p-3 bg-orange-100 rounded-lg">
                <Activity className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Neue Benutzer</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {newUsersLast24h}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  In den letzten 24 Stunden
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <UserCheck className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="bg-white rounded-lg border p-12 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-500">Lade Analytics-Daten...</p>
        </div>
      ) : error ? (
        <div className="bg-white rounded-lg border p-6 text-center">
          <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <p className="text-red-500">{error}</p>
          <button 
            onClick={handleRefresh}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Erneut versuchen
          </button>
        </div>
      ) : analyticsData ? (
        <>
          {/* User Growth Chart - Full Width */}
          <div className="bg-white rounded-lg border p-6">
            <div className="w-full h-full flex flex-col">
              <div className="text-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center justify-center gap-2">
                  <TrendingUp className="h-5 w-5 text-blue-600" />
                  Benutzer-Wachstum
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  {timeframe === '7d' ? 'Letzte 7 Tage' : timeframe === '30d' ? 'Letzte 30 Tage' : 'Letzte 90 Tage'}
                </p>
              </div>
              {analyticsData.userGrowth && analyticsData.userGrowth.length > 0 ? (
                <>
                    <div className="flex-1 flex items-center justify-center min-h-0">
                      <ChartContainer
                        config={{
                          users: {
                            label: 'Benutzer',
                            color: '#3b82f6',
                          },
                        }}
                        className="w-full h-[300px]"
                      >
                        <LineChart
                          accessibilityLayer
                          data={analyticsData.userGrowth.map(item => ({
                            date: formatChartDate(item.date),
                            users: Math.max(0, item.users || 0), // Stelle sicher, dass keine negativen Werte vorhanden sind
                          }))}
                          margin={{
                            left: 20,
                            right: 20,
                            top: 20,
                            bottom: 20,
                          }}
                        >
                          <CartesianGrid vertical={false} strokeDasharray="3 3" />
                          <XAxis
                            dataKey="date"
                            tickLine={false}
                            axisLine={false}
                            tickMargin={8}
                            tickFormatter={(value) => value}
                          />
                          <YAxis
                            tickLine={false}
                            axisLine={false}
                            tickMargin={8}
                            width={50}
                            domain={[0, 'dataMax']}
                            allowDecimals={false}
                            tickFormatter={(value) => Math.max(0, value).toString()}
                          />
                          <ChartTooltip
                            cursor={false}
                            content={<ChartTooltipContent hideLabel />}
                          />
                          <Line
                            dataKey="users"
                            type="monotone"
                            stroke="var(--color-users)"
                            strokeWidth={2}
                            dot={false}
                            isAnimationActive={false}
                            connectNulls={false}
                          />
                        </LineChart>
                      </ChartContainer>
                    </div>
                  <div className="flex flex-col gap-1 text-sm text-center mt-4">
                    <div className="flex items-center justify-center gap-2 leading-none font-medium text-gray-900">
                      {(() => {
                        const firstValue = analyticsData.userGrowth[0]?.users || 0;
                        const lastValue = analyticsData.userGrowth[analyticsData.userGrowth.length - 1]?.users || 0;
                        const change = firstValue > 0 ? ((lastValue - firstValue) / firstValue * 100).toFixed(1) : '0';
                        return (
                          <>
                            {parseFloat(change) > 0 ? (
                              <>
                                Wachstum um {change}% <TrendingUp className="h-4 w-4 text-green-600" />
                              </>
                            ) : parseFloat(change) < 0 ? (
                              <>
                                Rückgang um {Math.abs(parseFloat(change))}% <TrendingUp className="h-4 w-4 text-red-600 rotate-180" />
                              </>
                            ) : (
                              <>
                                Keine Änderung
                              </>
                            )}
                          </>
                        );
                      })()}
                    </div>
                    <div className="text-gray-500 flex items-center justify-center gap-2 leading-none">
                      {(() => {
                        const totalUsers = analyticsData.userGrowth.reduce((sum, item) => sum + (item.users || 0), 0);
                        const average = analyticsData.userGrowth.length > 0 
                          ? (totalUsers / analyticsData.userGrowth.length) 
                          : 0;
                        const roundedAverage = Math.round(average * 10) / 10; // Auf 1 Dezimalstelle runden
                        return `Durchschnitt: ${roundedAverage.toFixed(1)} neue Benutzer pro Tag (${totalUsers} insgesamt)`;
                      })()}
                    </div>
                  </div>
                </>
              ) : (
                <p className="text-gray-400 text-sm text-center">Keine Daten verfügbar</p>
              )}
            </div>
          </div>

          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* User Type Distribution */}
            <div className="bg-white rounded-lg border p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                  <Users className="h-5 w-5 text-orange-600" />
                  Benutzer-Typen Verteilung
                </h3>
              </div>
              <SimplePieChart
                data={userTypeDistribution}
                colors={{
                  owner: 'bg-blue-500',
                  caretaker: 'bg-green-500',
                  tierarzt: 'bg-purple-500',
                  hundetrainer: 'bg-yellow-500',
                  tierfriseur: 'bg-pink-500',
                  tierfotograf: 'bg-indigo-500',
                  unknown: 'bg-gray-400'
                }}
                labels={{
                  owner: 'Besitzer',
                  caretaker: 'Betreuer',
                  tierarzt: 'Tierarzt',
                  hundetrainer: 'Hundetrainer',
                  tierfriseur: 'Tierfriseur',
                  tierfotograf: 'Tierfotograf',
                  unknown: 'Unbekannt'
                }}
              />
            </div>

            {/* Status Distribution */}
            <div className="bg-white rounded-lg border p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                  <Shield className="h-5 w-5 text-green-600" />
                  Status Verteilung
                </h3>
              </div>
              <SimplePieChart
                data={statusDistribution}
                colors={{
                  verified: 'bg-green-500',
                  unverified: 'bg-yellow-500',
                  suspended: 'bg-red-500',
                  active: 'bg-blue-500'
                }}
                labels={{
                  verified: 'Verifiziert',
                  unverified: 'Nicht verifiziert',
                  suspended: 'Gesperrt',
                  active: 'Aktiv'
                }}
              />
            </div>
          </div>

          {/* Top Städte */}
          {topCities && topCities.length > 0 && (
            <div className="bg-white rounded-lg border p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
                <MapPin className="h-5 w-5 text-blue-600" />
                Top Städte
              </h3>
              <div className="space-y-3">
                {topCities.map((city, index) => {
                  const totalUsers = topCities.reduce((sum, c) => sum + c.count, 0);
                  const percentage = totalUsers > 0 ? Math.round((city.count / totalUsers) * 100) : 0;
                  return (
                    <div key={index} className="flex items-center gap-4">
                      <div className="w-12 text-sm font-medium text-gray-600">
                        #{index + 1}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-gray-900">{city.name}</span>
                          <span className="text-sm text-gray-600">{city.count} Benutzer ({percentage}%)</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-500 h-2 rounded-full transition-all"
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </>
      ) : null}
    </div>
  );
};

export default Analytics;
