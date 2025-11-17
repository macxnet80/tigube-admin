import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Search, RefreshCw, CheckCircle2, XCircle, UserCheck, UserX, Eye, AlertCircle, X } from 'lucide-react';
import { AdminService } from '../lib/admin/adminService';
import { useToast } from '../lib/toast/ToastContext';
import { supabaseAdmin } from '../lib/supabase/admin';

interface VerificationUser {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  user_type: string;
  verification_status: string | null;
  approval_status: string | null;
  approval_requested_at: string | null;
  approval_approved_at: string | null;
  approval_notes: string | null;
  created_at: string;
  city: string | null;
  plz: string | null;
  profile_photo_url: string | null;
  // Verification Request Daten
  verification_request_id?: string | null;
  verification_request_status?: string | null;
  verification_request_ausweis_url?: string | null;
  verification_request_zertifikate_urls?: string[] | null;
  verification_request_admin_comment?: string | null;
  verification_request_created_at?: string | null;
  verification_request_reviewed_at?: string | null;
}

const VerificationManagement: React.FC = () => {
  const { showSuccess, showError } = useToast();
  const [users, setUsers] = useState<VerificationUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'verification' | 'approval'>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedUser, setSelectedUser] = useState<VerificationUser | null>(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [userToReject, setUserToReject] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const usersPerPage = 20;

  const loadUsers = async (page: number = 1) => {
    try {
      setLoading(true);
      setError(null);

      const offset = (page - 1) * usersPerPage;

      // Verwende Supabase Admin Client für Datenbankabfrage
      // WICHTIG: Nur Benutzer anzeigen, die eine Verifizierung beantragt haben (verification_requests)
      // Zuerst hole alle user_ids aus verification_requests
      const { data: verificationRequestsData } = await supabaseAdmin
        .from('verification_requests')
        .select('user_id, id, status, ausweis_url, zertifikate_urls, admin_comment, created_at, reviewed_at');

      if (!verificationRequestsData || verificationRequestsData.length === 0) {
        setUsers([]);
        setTotalUsers(0);
        setCurrentPage(page);
        return;
      }

      // Erstelle Map für schnellen Zugriff auf verification_request Daten
      const verificationRequestsMap = new Map();
      verificationRequestsData.forEach((req: any) => {
        verificationRequestsMap.set(req.user_id, req);
      });

      // Filter user_ids basierend auf filterStatus
      let userIdsToLoad = verificationRequestsData.map((req: any) => req.user_id);
      if (filterType === 'verification' && filterStatus !== 'all') {
        userIdsToLoad = verificationRequestsData
          .filter((req: any) => req.status === filterStatus)
          .map((req: any) => req.user_id);
      }

      if (userIdsToLoad.length === 0) {
        setUsers([]);
        setTotalUsers(0);
        setCurrentPage(page);
        return;
      }

      // Lade Benutzer mit diesen IDs
      let queryBuilder = supabaseAdmin
        .from('users')
        .select(`
          id,
          email,
          first_name,
          last_name,
          user_type,
          verification_status,
          created_at,
          city,
          plz,
          profile_photo_url,
          caretaker_profiles!caretaker_profiles_id_fkey(
            approval_status,
            approval_requested_at,
            approval_approved_at,
            approval_notes
          )
        `, { count: 'exact' })
        .in('id', userIdsToLoad);

      // Suche
      if (searchTerm) {
        queryBuilder = queryBuilder.or(`email.ilike.%${searchTerm}%,first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%`);
      }

      const { data, error, count } = await queryBuilder
        .order('created_at', { ascending: false })
        .range(offset, offset + usersPerPage - 1);

      if (error) {
        throw error;
      }

      // Transformiere die Daten
      let transformedData = (data || []).map((user: any) => {
        const caretakerProfile = Array.isArray(user.caretaker_profiles) 
          ? user.caretaker_profiles[0] 
          : user.caretaker_profiles || null;

        const verificationRequest = verificationRequestsMap.get(user.id);

        return {
          id: user.id,
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name,
          user_type: user.user_type,
          verification_status: user.verification_status,
          approval_status: caretakerProfile?.approval_status || null,
          approval_requested_at: caretakerProfile?.approval_requested_at || null,
          approval_approved_at: caretakerProfile?.approval_approved_at || null,
          approval_notes: caretakerProfile?.approval_notes || null,
          created_at: user.created_at,
          city: user.city,
          plz: user.plz,
          profile_photo_url: user.profile_photo_url,
          // Verification Request Daten
          verification_request_id: verificationRequest?.id || null,
          verification_request_status: verificationRequest?.status || null,
          verification_request_ausweis_url: verificationRequest?.ausweis_url || null,
          verification_request_zertifikate_urls: verificationRequest?.zertifikate_urls || null,
          verification_request_admin_comment: verificationRequest?.admin_comment || null,
          verification_request_created_at: verificationRequest?.created_at || null,
          verification_request_reviewed_at: verificationRequest?.reviewed_at || null
        };
      });

      // Filter für approval_type und approval_status nach dem Laden
      if (filterType === 'approval') {
        transformedData = transformedData.filter(user => user.approval_status !== null);
        if (filterStatus !== 'all') {
          transformedData = transformedData.filter(user => user.approval_status === filterStatus);
        }
      }

      // Zähle die Gesamtanzahl basierend auf Filter
      let total = transformedData.length;
      if (filterType === 'verification' && filterStatus === 'all') {
        total = verificationRequestsData.length;
      } else if (filterType === 'verification' && filterStatus !== 'all') {
        total = verificationRequestsData.filter((req: any) => req.status === filterStatus).length;
      } else if (filterType === 'approval') {
        total = transformedData.length;
      } else {
        total = count || transformedData.length;
      }

      setUsers(transformedData);
      setTotalUsers(total);
      setCurrentPage(page);
    } catch (err) {
      setError('Fehler beim Laden der Benutzer');
      console.error('Error loading verification users:', err);
      
      // Fallback: Verwende AdminService
      try {
        const pendingUsers = await AdminService.getPendingApprovalUsers(usersPerPage);
        const transformedData = pendingUsers.map((user: any) => ({
          id: user.id,
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name,
          user_type: user.user_type,
          verification_status: user.verification_status || null,
          approval_status: user.approval_status || null,
          approval_requested_at: null,
          approval_approved_at: null,
          approval_notes: user.approval_notes || null,
          created_at: user.created_at,
          city: user.city,
          plz: user.plz,
          profile_photo_url: null
        }));
        setUsers(transformedData);
        setTotalUsers(transformedData.length);
      } catch (fallbackErr) {
        console.error('Fallback also failed:', fallbackErr);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, [filterType, filterStatus, searchTerm]);

  // Verhindere Body-Scroll wenn Sidepanel offen ist, behalte aber Scrollbar sichtbar
  useEffect(() => {
    if (showUserModal || showRejectModal) {
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
  }, [showUserModal, showRejectModal]);

  const handleRefresh = () => {
    loadUsers(currentPage);
  };

  const handleVerifyUser = async (userId: string, verificationRequestId?: string | null) => {
    try {
      // Aktualisiere verification_status in users Tabelle
      const success = await AdminService.verifyUser(userId);
      
      // Aktualisiere auch den verification_request Status
      if (success && verificationRequestId) {
        const { error: updateError } = await supabaseAdmin
          .from('verification_requests')
          .update({
            status: 'approved',
            reviewed_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', verificationRequestId);

        if (updateError) {
          console.error('Error updating verification request:', updateError);
        }
      }

      if (success) {
        showSuccess('Benutzer erfolgreich verifiziert');
        await loadUsers(currentPage);
      } else {
        showError('Fehler beim Verifizieren des Benutzers');
      }
    } catch (err) {
      console.error('Error verifying user:', err);
      showError('Fehler beim Verifizieren des Benutzers');
    }
  };

  const handleApproveUser = async (userId: string) => {
    try {
      const success = await AdminService.approveUser(userId);
      if (success) {
        showSuccess('Benutzer erfolgreich freigegeben');
        await loadUsers(currentPage);
      } else {
        showError('Fehler beim Freigeben des Benutzers');
      }
    } catch (err) {
      console.error('Error approving user:', err);
      showError('Fehler beim Freigeben des Benutzers');
    }
  };

  const handleRejectUser = async () => {
    if (!userToReject) return;

    try {
      const success = await AdminService.rejectUser(userToReject, rejectionReason || undefined);
      if (success) {
        showSuccess('Benutzer erfolgreich abgelehnt');
        setShowRejectModal(false);
        setRejectionReason('');
        setUserToReject(null);
        await loadUsers(currentPage);
      } else {
        showError('Fehler beim Ablehnen des Benutzers');
      }
    } catch (err) {
      console.error('Error rejecting user:', err);
      showError('Fehler beim Ablehnen des Benutzers');
    }
  };

  const getVerificationStatusBadge = (status: string | null, requestStatus?: string | null) => {
    // Verwende verification_request_status falls vorhanden, sonst verification_status
    const displayStatus = requestStatus || status;
    if (!displayStatus) return null;

    const badges: { [key: string]: { label: string; className: string } } = {
      'pending': { label: 'Ausstehend', className: 'bg-yellow-100 text-yellow-800' },
      'approved': { label: 'Verifiziert', className: 'bg-green-100 text-green-800' },
      'rejected': { label: 'Abgelehnt', className: 'bg-red-100 text-red-800' },
      'not_submitted': { label: 'Nicht eingereicht', className: 'bg-gray-100 text-gray-800' },
    };

    const badge = badges[displayStatus] || { label: displayStatus, className: 'bg-gray-100 text-gray-800' };
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${badge.className}`}>
        {badge.label}
      </span>
    );
  };

  const getApprovalStatusBadge = (status: string | null) => {
    if (!status) return null;

    const badges: { [key: string]: { label: string; className: string } } = {
      'not_requested': { label: 'Nicht beantragt', className: 'bg-gray-100 text-gray-800' },
      'pending': { label: 'Ausstehend', className: 'bg-yellow-100 text-yellow-800' },
      'approved': { label: 'Freigegeben', className: 'bg-green-100 text-green-800' },
      'rejected': { label: 'Abgelehnt', className: 'bg-red-100 text-red-800' },
    };

    const badge = badges[status] || { label: status, className: 'bg-gray-100 text-gray-800' };
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${badge.className}`}>
        {badge.label}
      </span>
    );
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Nicht gesetzt';
    return new Date(dateString).toLocaleDateString('de-DE', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = searchTerm === '' || 
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      `${user.first_name} ${user.last_name}`.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesSearch;
  });

  const totalPages = Math.ceil(totalUsers / usersPerPage);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Verifizierung</h2>
          <p className="text-gray-600">
            Verwalten Sie Benutzer-Verifizierungen ({totalUsers} Benutzer)
          </p>
        </div>
        
        <button 
          onClick={handleRefresh}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 flex items-center gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Aktualisieren
        </button>
      </div>

      {/* Filter und Suche */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Nach E-Mail oder Name suchen..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        
        <select
          value={filterType}
          onChange={(e) => {
            setFilterType(e.target.value as 'all' | 'verification' | 'approval');
            setFilterStatus('all');
          }}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
        >
          <option value="all">Alle Typen</option>
          <option value="verification">Verifizierung</option>
          <option value="approval">Freigabe (Caretaker)</option>
        </select>

        {filterType !== 'all' && (
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <option value="all">Alle Status</option>
            {filterType === 'verification' ? (
              <>
                <option value="pending">Ausstehend</option>
                <option value="approved">Verifiziert</option>
                <option value="rejected">Abgelehnt</option>
              </>
            ) : (
              <>
                <option value="not_requested">Nicht beantragt</option>
                <option value="pending">Ausstehend</option>
                <option value="approved">Freigegeben</option>
                <option value="rejected">Abgelehnt</option>
              </>
            )}
          </select>
        )}
      </div>

      {/* Benutzer Tabelle */}
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
            <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
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
            <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
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
                      Verifizierung
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Freigabe
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Erstellt
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Aktionen
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {user.profile_photo_url ? (
                            <img 
                              src={user.profile_photo_url} 
                              alt={`${user.first_name} ${user.last_name}`}
                              className="h-10 w-10 rounded-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                              }}
                            />
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                              <span className="text-gray-500 text-sm font-medium">
                                {user.first_name?.[0] || user.email[0].toUpperCase()}
                              </span>
                            </div>
                          )}
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {user.first_name} {user.last_name}
                            </div>
                            <div className="text-xs text-gray-500">{user.email}</div>
                            {user.city && (
                              <div className="text-xs text-gray-400">{user.city}{user.plz ? `, ${user.plz}` : ''}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900">{user.user_type || 'N/A'}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getVerificationStatusBadge(user.verification_status, user.verification_request_status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getApprovalStatusBadge(user.approval_status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(user.created_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-2">
                          {(user.verification_request_status === 'pending' || user.verification_status === 'pending') && (
                            <button
                              onClick={() => handleVerifyUser(user.id, user.verification_request_id)}
                              className="text-green-600 hover:text-green-900"
                              title="Verifizieren"
                            >
                              <CheckCircle2 className="h-4 w-4" />
                            </button>
                          )}
                          {user.approval_status === 'pending' && (
                            <>
                              <button
                                onClick={() => handleApproveUser(user.id)}
                                className="text-green-600 hover:text-green-900"
                                title="Freigeben"
                              >
                                <UserCheck className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => {
                                  setUserToReject(user.id);
                                  setShowRejectModal(true);
                                }}
                                className="text-red-600 hover:text-red-900"
                                title="Ablehnen"
                              >
                                <UserX className="h-4 w-4" />
                              </button>
                            </>
                          )}
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

      {/* Benutzer Details Modal */}
      <AnimatePresence>
        {showUserModal && selectedUser && (
          <>
            <motion.div 
              className="fixed top-0 left-0 right-0 bottom-0 bg-black/50 backdrop-blur-sm z-[100]"
              style={{ margin: 0, padding: 0 }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              onClick={() => setShowUserModal(false)}
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
            <div className="flex justify-between items-center mb-4 flex-shrink-0">
              <h3 className="text-lg font-medium text-gray-900">Benutzer Details</h3>
              <button
                onClick={() => {
                  setShowUserModal(false);
                  setSelectedUser(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="space-y-4 flex-1 overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <p className="text-sm text-gray-900">{selectedUser.first_name} {selectedUser.last_name}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">E-Mail</label>
                  <p className="text-sm text-gray-900">{selectedUser.email}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Benutzertyp</label>
                  <p className="text-sm text-gray-900">{selectedUser.user_type || 'N/A'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Erstellt am</label>
                  <p className="text-sm text-gray-900">{formatDate(selectedUser.created_at)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Verifizierungsstatus</label>
                  <div className="mt-1">
                    {getVerificationStatusBadge(selectedUser.verification_status, selectedUser.verification_request_status)}
                  </div>
                </div>
                {selectedUser.verification_request_created_at && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Antrag gestellt am</label>
                    <p className="text-sm text-gray-900">{formatDate(selectedUser.verification_request_created_at)}</p>
                  </div>
                )}
                {selectedUser.verification_request_reviewed_at && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Geprüft am</label>
                    <p className="text-sm text-gray-900">{formatDate(selectedUser.verification_request_reviewed_at)}</p>
                  </div>
                )}
                {selectedUser.verification_request_admin_comment && (
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Admin-Kommentar</label>
                    <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg">{selectedUser.verification_request_admin_comment}</p>
                  </div>
                )}
                {selectedUser.verification_request_ausweis_url && (
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Ausweis</label>
                    <a 
                      href={selectedUser.verification_request_ausweis_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 text-sm underline"
                    >
                      Ausweis anzeigen
                    </a>
                  </div>
                )}
                {selectedUser.verification_request_zertifikate_urls && selectedUser.verification_request_zertifikate_urls.length > 0 && (
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Zertifikate</label>
                    <div className="space-y-2">
                      {selectedUser.verification_request_zertifikate_urls.map((url: string, index: number) => (
                        <a 
                          key={index}
                          href={url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="block text-blue-600 hover:text-blue-800 text-sm underline"
                        >
                          Zertifikat {index + 1} anzeigen
                        </a>
                      ))}
                    </div>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Freigabestatus</label>
                  <div className="mt-1">
                    {getApprovalStatusBadge(selectedUser.approval_status)}
                  </div>
                </div>
                {selectedUser.approval_requested_at && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Freigabe beantragt am</label>
                    <p className="text-sm text-gray-900">{formatDate(selectedUser.approval_requested_at)}</p>
                  </div>
                )}
                {selectedUser.approval_approved_at && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Freigegeben am</label>
                    <p className="text-sm text-gray-900">{formatDate(selectedUser.approval_approved_at)}</p>
                  </div>
                )}
                {selectedUser.approval_notes && (
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Notizen</label>
                    <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg">{selectedUser.approval_notes}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="pt-4 border-t border-gray-200 flex gap-2 justify-end flex-shrink-0 mt-auto">
              {(selectedUser.verification_request_status === 'pending' || selectedUser.verification_status === 'pending') && (
                  <button
                    onClick={() => {
                      handleVerifyUser(selectedUser.id, selectedUser.verification_request_id);
                      setShowUserModal(false);
                    }}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium flex items-center gap-2"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Verifizieren
                  </button>
                )}
                {selectedUser.approval_status === 'pending' && (
                  <>
                    <button
                      onClick={() => {
                        handleApproveUser(selectedUser.id);
                        setShowUserModal(false);
                      }}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium flex items-center gap-2"
                    >
                      <UserCheck className="h-4 w-4" />
                      Freigeben
                    </button>
                    <button
                      onClick={() => {
                        setUserToReject(selectedUser.id);
                        setShowUserModal(false);
                        setShowRejectModal(true);
                      }}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium flex items-center gap-2"
                    >
                      <UserX className="h-4 w-4" />
                      Ablehnen
                    </button>
                  </>
                )}
                <button
                  onClick={() => {
                    setShowUserModal(false);
                    setSelectedUser(null);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Schließen
                </button>
            </div>
            </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Ablehnungs-Sidepanel */}
      <AnimatePresence>
        {showRejectModal && (
          <>
            <motion.div 
              className="fixed top-0 left-0 right-0 bottom-0 bg-black/50 backdrop-blur-sm z-[100]"
              style={{ margin: 0, padding: 0 }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              onClick={() => {
                setShowRejectModal(false);
                setRejectionReason('');
                setUserToReject(null);
              }}
            />
            <motion.div 
              className="fixed top-0 right-0 bottom-0 w-full max-w-md bg-white shadow-xl z-[101] flex flex-col"
              style={{ margin: 0, padding: 0 }}
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'tween', duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
            >
            <div className="p-6 flex flex-col h-full">
            <div className="flex items-center gap-3 mb-4 flex-shrink-0">
              <XCircle className="h-8 w-8 text-red-600" />
              <h3 className="text-lg font-medium text-gray-900">Benutzer ablehnen</h3>
            </div>
            <div className="flex-1 overflow-y-auto">
            <p className="text-gray-600 mb-4">
              Möchten Sie diesen Benutzer ablehnen? Bitte geben Sie optional einen Grund an.
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Ablehnungsgrund (optional)</label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                placeholder="Grund für die Ablehnung..."
              />
            </div>
            </div>
            <div className="flex gap-2 justify-end pt-4 border-t border-gray-200 flex-shrink-0 mt-auto">
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectionReason('');
                  setUserToReject(null);
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Abbrechen
              </button>
              <button
                onClick={handleRejectUser}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium"
              >
                Ablehnen
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

export default VerificationManagement;
