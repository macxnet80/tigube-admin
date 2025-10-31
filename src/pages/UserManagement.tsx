import React, { useState, useEffect } from 'react';
import { Users, Search, Filter, Download, RefreshCw, Eye, Shield, ShieldOff, CheckCircle, XCircle, MoreVertical, UserCheck, UserX, CheckCircle2, XCircle as XCircleIcon } from 'lucide-react';
import { AdminService } from '../lib/admin/adminService';

interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  user_type: string;
  city: string | null;
  plz: string | null;
  street: string | null;
  phone_number: string | null;
  profile_photo_url: string | null;
  created_at: string;
  updated_at: string | null;
  is_suspended: boolean;
  verification_status: string;
  subscription_status: string;
  profile_completed: boolean;
  is_admin: boolean;
  admin_role: string | null;
  approval_status: string | null;
  approval_notes: string | null;
  show_ads: boolean | null;
  premium_badge: boolean | null;
  totp_secret: string | null;
  last_admin_login: string | null;
  plan_type: string | null;
  plan_expires_at: string | null;
  max_contact_requests: number | null;
  max_bookings: number | null;
  search_priority: number | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  public_profile_visible: boolean | null;
  date_of_birth: string | null;
  gender: string | null;
  suspension_reason: string | null;
  suspended_at: string | null;
  suspended_by: string | null;
}

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showUserModal, setShowUserModal] = useState(false);

  const usersPerPage = 50; // Mehr User pro Seite laden, damit alle sichtbar sind

  const loadUsers = async (page: number = 1) => {
    try {
      setLoading(true);
      setError(null);
      const result = await AdminService.getUsers(page, usersPerPage);
      console.log('Loaded users:', result.data.length, 'Total:', result.total);
      setUsers(result.data);
      setTotalUsers(result.total);
      setCurrentPage(page);
    } catch (err) {
      setError('Fehler beim Laden der Benutzer');
      console.error('Error loading users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleRefresh = () => {
    loadUsers(currentPage);
  };

  const handleVerifyUser = async (userId: string) => {
    try {
      const success = await AdminService.verifyUser(userId);
      if (success) {
        await loadUsers(currentPage);
      }
    } catch (err) {
      console.error('Error verifying user:', err);
    }
  };

  const handleToggleUserStatus = async (userId: string, isActive: boolean) => {
    try {
      const success = await AdminService.toggleUserStatus(userId, isActive);
      if (success) {
        await loadUsers(currentPage);
      }
    } catch (err) {
      console.error('Error toggling user status:', err);
    }
  };

  const handleToggleAdminStatus = async (userId: string, isAdmin: boolean) => {
    try {
      const success = await AdminService.toggleAdminStatus(userId, isAdmin);
      if (success) {
        await loadUsers(currentPage);
      }
    } catch (err) {
      console.error('Error toggling admin status:', err);
    }
  };

  const handleSetApprovalStatus = async (userId: string, status: 'not_requested' | 'pending' | 'approved' | 'rejected') => {
    try {
      const success = await AdminService.setUserApprovalStatus(userId, status);
      if (success) {
        await loadUsers(currentPage);
      }
    } catch (err) {
      console.error('Error setting approval status:', err);
    }
  };

  const handleApproveUser = async (userId: string) => {
    await handleSetApprovalStatus(userId, 'approved');
  };

  const handleRejectUser = async (userId: string) => {
    await handleSetApprovalStatus(userId, 'rejected');
  };

  const handleExportUsers = () => {
    const csvData = [
      ['Name', 'E-Mail', 'Typ', 'Status', 'Verifiziert', 'Registriert', 'Stadt', 'PLZ'].join(','),
      ...filteredUsers.map(user => [
        `"${user.first_name} ${user.last_name}"`,
        `"${user.email}"`,
        `"${getUserTypeLabel(user.user_type)}"`,
        `"${user.is_suspended ? 'Gesperrt' : 'Aktiv'}"`,
        `"${user.verification_status === 'approved' ? 'Ja' : 'Nein'}"`,
        `"${formatDate(user.created_at)}"`,
        `"${user.city || ''}"`,
        `"${user.plz || ''}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `benutzer-export-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Wenn keine Filter aktiv sind, zeige alle geladenen User an
  // Sonst filtere clientseitig (für bessere Performance bei großen Datensätzen würde man serverseitig filtern)
  const filteredUsers = React.useMemo(() => {
    // Wenn keine Filterung aktiv ist, zeige alle User
    if (filterType === 'all' && searchTerm === '') {
      return users;
    }

    return users.filter(user => {
      const matchesSearch = searchTerm === '' || 
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.city?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesFilter = filterType === 'all' || 
        (filterType === 'owners' && user.user_type === 'owner') ||
        (filterType === 'caretakers' && user.user_type === 'caretaker') ||
        (filterType === 'service_providers' && ['tierarzt', 'hundetrainer', 'tierfriseur', 'physiotherapeut', 'ernaehrungsberater', 'tierfotograf', 'sonstige'].includes(user.user_type)) ||
        (filterType === 'admins' && user.is_admin) ||
        (filterType === 'suspended' && user.is_suspended) ||
        (filterType === 'unverified' && user.verification_status === 'not_submitted') ||
        (filterType === 'approval_pending' && user.approval_status === 'pending') ||
        (filterType === 'approval_approved' && user.approval_status === 'approved') ||
        (filterType === 'approval_rejected' && user.approval_status === 'rejected') ||
        (filterType === 'approval_not_requested' && (user.approval_status === 'not_requested' || !user.approval_status));

      return matchesSearch && matchesFilter;
    });
  }, [users, filterType, searchTerm]);

  const getStatusBadge = (user: User) => {
    if (user.is_suspended) {
      return <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">Gesperrt</span>;
    }
    if (user.verification_status === 'approved') {
      return <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">Verifiziert</span>;
    }
    if (user.verification_status === 'pending') {
      return <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">Ausstehend</span>;
    }
    return <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">Nicht verifiziert</span>;
  };

  const getApprovalStatusBadge = (user: User) => {
    const status = user.approval_status || 'not_requested';
    
    switch (status) {
      case 'not_requested':
        return <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">Noch nicht angefragt</span>;
      case 'pending':
        return <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">Wartet auf Freigabe</span>;
      case 'approved':
        return <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">Freigegeben</span>;
      case 'rejected':
        return <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">Abgelehnt</span>;
      default:
        return <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">Noch nicht angefragt</span>;
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
      'admin': 'Administrator'
    };
    return labels[userType] || userType;
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'Nicht verfügbar';
    try {
      return new Date(dateString).toLocaleDateString('de-DE', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
    } catch (error) {
      return 'Ungültiges Datum';
    }
  };

  const totalPages = Math.ceil(totalUsers / usersPerPage);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Benutzerverwaltung</h2>
          <p className="text-gray-600">
            Verwalten Sie alle Benutzer der Plattform ({totalUsers} Benutzer)
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <option value="all">Alle Benutzer</option>
            <option value="owners">Tierbesitzer</option>
            <option value="caretakers">Betreuer</option>
            <option value="service_providers">Dienstleister</option>
            <option value="admins">Administratoren</option>
            <option value="suspended">Gesperrte</option>
            <option value="unverified">Nicht verifiziert</option>
            <option value="approval_pending">Wartet auf Freigabe</option>
            <option value="approval_approved">Freigegeben</option>
            <option value="approval_rejected">Abgelehnt</option>
            <option value="approval_not_requested">Noch nicht angefragt</option>
          </select>
          <button 
            onClick={handleRefresh}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Aktualisieren
          </button>
          <button 
            onClick={handleExportUsers}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Export
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Nach E-Mail, Name, Stadt suchen..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
          Suchen
        </button>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg border overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Benutzer</h3>
        </div>
        
        {loading ? (
          <div className="p-6 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-500">Lade Benutzer...</p>
          </div>
        ) : error ? (
          <div className="p-6 text-center">
            <XCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
            <p className="text-red-500">{error}</p>
            <button 
              onClick={handleRefresh}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Erneut versuchen
            </button>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-6 text-center">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">Keine Benutzer gefunden</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Benutzer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Typ
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Freigabe-Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Registriert
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Aktionen
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                              <span className="text-sm font-medium text-gray-700">
                                {user.first_name?.[0]}{user.last_name?.[0]}
                              </span>
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {user.first_name} {user.last_name}
                            </div>
                            <div className="text-sm text-gray-500">{user.email}</div>
                            {user.city && (
                              <div className="text-xs text-gray-400">{user.city}, {user.plz}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900">
                          {getUserTypeLabel(user.user_type)}
                        </span>
                        {user.is_admin && (
                          <span className="ml-2 px-2 py-1 text-xs font-medium bg-purple-100 text-purple-800 rounded-full">
                            Admin
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(user)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getApprovalStatusBadge(user)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(user.created_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setSelectedUser(user);
                              setShowUserModal(true);
                            }}
                            className="text-blue-600 hover:text-blue-900"
                            title="Details anzeigen"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          
                          {user.verification_status === 'not_submitted' && (
                            <button
                              onClick={() => handleVerifyUser(user.id)}
                              className="text-green-600 hover:text-green-900"
                              title="Verifizieren"
                            >
                              <UserCheck className="h-4 w-4" />
                            </button>
                          )}

                          {(user.approval_status === 'pending' || user.approval_status === 'not_requested' || !user.approval_status) && (
                            <button
                              onClick={() => handleApproveUser(user.id)}
                              className="text-green-600 hover:text-green-900"
                              title="User freigeben"
                            >
                              <CheckCircle2 className="h-4 w-4" />
                            </button>
                          )}

                          {(user.approval_status === 'pending' || user.approval_status === 'approved') && (
                            <button
                              onClick={() => handleRejectUser(user.id)}
                              className="text-red-600 hover:text-red-900"
                              title="User ablehnen"
                            >
                              <XCircleIcon className="h-4 w-4" />
                            </button>
                          )}
                          
                          <button
                            onClick={() => handleToggleAdminStatus(user.id, !user.is_admin)}
                            className={user.is_admin ? "text-purple-600 hover:text-purple-900" : "text-gray-600 hover:text-gray-900"}
                            title={user.is_admin ? "Admin-Rechte entfernen" : "Admin-Rechte vergeben"}
                          >
                            {user.is_admin ? <Shield className="h-4 w-4" /> : <ShieldOff className="h-4 w-4" />}
                          </button>
                          
                          <button
                            onClick={() => handleToggleUserStatus(user.id, !user.is_suspended)}
                            className={user.is_suspended ? "text-green-600 hover:text-green-900" : "text-red-600 hover:text-red-900"}
                            title={user.is_suspended ? "Entsperren" : "Sperren"}
                          >
                            {user.is_suspended ? <UserCheck className="h-4 w-4" /> : <UserX className="h-4 w-4" />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-6 py-4 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-700">
                    Seite {currentPage} von {totalPages} ({totalUsers} Benutzer)
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => loadUsers(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Zurück
                    </button>
                    <button
                      onClick={() => loadUsers(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Weiter
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* User Details Modal */}
      {showUserModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Benutzerdetails</h3>
              <button
                onClick={() => setShowUserModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle className="h-6 w-6" />
              </button>
            </div>
            
            <div className="space-y-6">
              {/* Grundinformationen */}
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-3">Grundinformationen</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Name</label>
                    <p className="text-sm text-gray-900">{selectedUser.first_name} {selectedUser.last_name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">E-Mail</label>
                    <p className="text-sm text-gray-900">{selectedUser.email || 'Nicht angegeben'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Typ</label>
                    <p className="text-sm text-gray-900">{getUserTypeLabel(selectedUser.user_type)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Geschlecht</label>
                    <p className="text-sm text-gray-900">{selectedUser.gender ? (selectedUser.gender === 'male' ? 'Männlich' : selectedUser.gender === 'female' ? 'Weiblich' : selectedUser.gender === 'other' ? 'Divers' : 'Keine Angabe') : 'Nicht angegeben'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Geburtsdatum</label>
                    <p className="text-sm text-gray-900">{selectedUser.date_of_birth ? formatDate(selectedUser.date_of_birth) : 'Nicht angegeben'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Registriert am</label>
                    <p className="text-sm text-gray-900">{formatDate(selectedUser.created_at)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Zuletzt aktualisiert</label>
                    <p className="text-sm text-gray-900">{selectedUser.updated_at ? formatDate(selectedUser.updated_at) : 'Nicht verfügbar'}</p>
                  </div>
                </div>
              </div>

              {/* Kontaktinformationen */}
              <div className="pt-4 border-t border-gray-200">
                <h4 className="text-sm font-semibold text-gray-700 mb-3">Kontaktinformationen</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Telefonnummer</label>
                    <p className="text-sm text-gray-900">{selectedUser.phone_number || 'Nicht angegeben'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Straße</label>
                    <p className="text-sm text-gray-900">{selectedUser.street || 'Nicht angegeben'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">PLZ</label>
                    <p className="text-sm text-gray-900">{selectedUser.plz || 'Nicht angegeben'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Stadt</label>
                    <p className="text-sm text-gray-900">{selectedUser.city || 'Nicht angegeben'}</p>
                  </div>
                  <div className="col-span-2">
                    <label className="text-sm font-medium text-gray-500">Vollständige Adresse</label>
                    <p className="text-sm text-gray-900">
                      {[selectedUser.street, selectedUser.plz, selectedUser.city].filter(Boolean).join(', ') || 'Nicht angegeben'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Profilinformationen */}
              <div className="pt-4 border-t border-gray-200">
                <h4 className="text-sm font-semibold text-gray-700 mb-3">Profilinformationen</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Profilbild</label>
                    <div className="mt-1">
                      {selectedUser.profile_photo_url ? (
                        <img src={selectedUser.profile_photo_url} alt="Profilbild" className="w-16 h-16 rounded-full object-cover" />
                      ) : (
                        <p className="text-sm text-gray-500">Kein Profilbild</p>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Profil abgeschlossen</label>
                    <p className="text-sm text-gray-900">{selectedUser.profile_completed ? 'Ja' : 'Nein'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Öffentliches Profil sichtbar</label>
                    <p className="text-sm text-gray-900">{selectedUser.public_profile_visible ? 'Ja' : 'Nein'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Werbung anzeigen</label>
                    <p className="text-sm text-gray-900">{selectedUser.show_ads ? 'Ja' : 'Nein'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Premium Badge</label>
                    <p className="text-sm text-gray-900">{selectedUser.premium_badge ? 'Ja' : 'Nein'}</p>
                  </div>
                </div>
              </div>

              {/* Account-Status */}
              <div className="pt-4 border-t border-gray-200">
                <h4 className="text-sm font-semibold text-gray-700 mb-3">Account-Status</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Status</label>
                    <div className="mt-1">{getStatusBadge(selectedUser)}</div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Freigabe-Status</label>
                    <div className="mt-1">{getApprovalStatusBadge(selectedUser)}</div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Verifizierungs-Status</label>
                    <p className="text-sm text-gray-900">
                      {selectedUser.verification_status === 'approved' ? 'Verifiziert' : 
                       selectedUser.verification_status === 'pending' ? 'Ausstehend' : 
                       selectedUser.verification_status === 'rejected' ? 'Abgelehnt' : 
                       selectedUser.verification_status === 'in_review' ? 'In Prüfung' : 
                       'Nicht eingereicht'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Gesperrt</label>
                    <p className="text-sm text-gray-900">{selectedUser.is_suspended ? 'Ja' : 'Nein'}</p>
                  </div>
                  {selectedUser.is_suspended && (
                    <>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Sperrgrund</label>
                        <p className="text-sm text-gray-900">{selectedUser.suspension_reason || 'Nicht angegeben'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Gesperrt am</label>
                        <p className="text-sm text-gray-900">{selectedUser.suspended_at ? formatDate(selectedUser.suspended_at) : 'Nicht verfügbar'}</p>
                      </div>
                    </>
                  )}
                  {selectedUser.approval_notes && (
                    <div className="col-span-2">
                      <label className="text-sm font-medium text-gray-500">Freigabe-Notizen</label>
                      <p className="text-sm text-gray-900">{selectedUser.approval_notes}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Subscription-Informationen */}
              <div className="pt-4 border-t border-gray-200">
                <h4 className="text-sm font-semibold text-gray-700 mb-3">Abonnement-Informationen</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Abonnement-Status</label>
                    <p className="text-sm text-gray-900">{selectedUser.subscription_status || 'free'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Plan-Typ</label>
                    <p className="text-sm text-gray-900">{selectedUser.plan_type || 'free'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Plan läuft ab am</label>
                    <p className="text-sm text-gray-900">{selectedUser.plan_expires_at ? formatDate(selectedUser.plan_expires_at) : 'Nicht gesetzt'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Stripe Customer ID</label>
                    <p className="text-sm text-gray-900 font-mono text-xs">{selectedUser.stripe_customer_id || 'Nicht vorhanden'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Stripe Subscription ID</label>
                    <p className="text-sm text-gray-900 font-mono text-xs">{selectedUser.stripe_subscription_id || 'Nicht vorhanden'}</p>
                  </div>
                </div>
              </div>

              {/* Limits & Prioritäten */}
              <div className="pt-4 border-t border-gray-200">
                <h4 className="text-sm font-semibold text-gray-700 mb-3">Limits & Prioritäten</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Max. Kontaktanfragen</label>
                    <p className="text-sm text-gray-900">{selectedUser.max_contact_requests ?? 3}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Max. Buchungen</label>
                    <p className="text-sm text-gray-900">{selectedUser.max_bookings ?? 3}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Such-Priorität</label>
                    <p className="text-sm text-gray-900">{selectedUser.search_priority ?? 0}</p>
                  </div>
                </div>
              </div>

              {/* Admin-Informationen */}
              {selectedUser.is_admin && (
                <div className="pt-4 border-t border-gray-200">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">Admin-Informationen</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Admin-Rolle</label>
                      <p className="text-sm text-gray-900">{selectedUser.admin_role || 'admin'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Letzter Admin-Login</label>
                      <p className="text-sm text-gray-900">{selectedUser.last_admin_login ? formatDate(selectedUser.last_admin_login) : 'Niemals'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">2FA aktiviert</label>
                      <p className="text-sm text-gray-900">{selectedUser.totp_secret ? 'Ja' : 'Nein'}</p>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="pt-4 border-t border-gray-200">
                <div className="flex flex-wrap gap-2">
                  {selectedUser.verification_status === 'not_submitted' && (
                    <button
                      onClick={() => {
                        handleVerifyUser(selectedUser.id);
                        setShowUserModal(false);
                      }}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                    >
                      Verifizieren
                    </button>
                  )}

                  {(selectedUser.approval_status === 'pending' || selectedUser.approval_status === 'not_requested' || !selectedUser.approval_status) && (
                    <button
                      onClick={() => {
                        handleApproveUser(selectedUser.id);
                        setShowUserModal(false);
                      }}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                    >
                      Freigeben
                    </button>
                  )}

                  {(selectedUser.approval_status === 'pending' || selectedUser.approval_status === 'approved') && (
                    <button
                      onClick={() => {
                        handleRejectUser(selectedUser.id);
                        setShowUserModal(false);
                      }}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
                    >
                      Ablehnen
                    </button>
                  )}

                  {(selectedUser.approval_status === 'rejected') && (
                    <button
                      onClick={() => {
                        handleSetApprovalStatus(selectedUser.id, 'pending');
                        setShowUserModal(false);
                      }}
                      className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 text-sm"
                    >
                      Auf Freigabe setzen
                    </button>
                  )}
                  
                  <button
                    onClick={() => {
                      handleToggleAdminStatus(selectedUser.id, !selectedUser.is_admin);
                      setShowUserModal(false);
                    }}
                    className={`px-4 py-2 rounded-lg text-sm ${
                      selectedUser.is_admin 
                        ? 'bg-purple-600 text-white hover:bg-purple-700' 
                        : 'bg-gray-600 text-white hover:bg-gray-700'
                    }`}
                  >
                    {selectedUser.is_admin ? 'Admin-Rechte entfernen' : 'Admin-Rechte vergeben'}
                  </button>
                  
                  <button
                    onClick={() => {
                      handleToggleUserStatus(selectedUser.id, !selectedUser.is_suspended);
                      setShowUserModal(false);
                    }}
                    className={`px-4 py-2 rounded-lg text-sm ${
                      selectedUser.is_suspended 
                        ? 'bg-green-600 text-white hover:bg-green-700' 
                        : 'bg-red-600 text-white hover:bg-red-700'
                    }`}
                  >
                    {selectedUser.is_suspended ? 'Entsperren' : 'Sperren'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
