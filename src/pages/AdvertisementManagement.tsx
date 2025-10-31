import React, { useState, useEffect } from 'react';
import { Megaphone, Search, RefreshCw, Edit, Trash2, Copy, Plus, X, XCircle, Upload, Loader2 } from 'lucide-react';
import { AdminService } from '../lib/admin/adminService';

interface Advertisement {
  id: string;
  title: string | null;
  description: string | null;
  image_url: string | null;
  link_url: string | null;
  cta_text: string | null;
  ad_type: string;
  target_pet_types: string[];
  target_locations: string[];
  target_subscription_types: string[];
  start_date: string | null;
  end_date: string | null;
  is_active: boolean;
  priority: number;
  max_impressions: number | null;
  current_impressions: number;
  max_clicks: number | null;
  current_clicks: number;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  format_id: string | null;
  custom_width: number | null;
  custom_height: number | null;
  // Format-Informationen aus der View advertisements_with_formats
  format_name?: string | null;
  format_description?: string | null;
  display_width?: number | null;
  display_height?: number | null;
  placement?: string | null;
  function_description?: string | null;
}

interface AdvertisementFormat {
  id: string;
  name: string;
  description: string | null;
  width: number;
  height: number;
  ad_type: string;
  placement: string;
  function_description: string | null;
  is_active: boolean;
}

const AdvertisementManagement: React.FC = () => {
  const [advertisements, setAdvertisements] = useState<Advertisement[]>([]);
  const [formats, setFormats] = useState<AdvertisementFormat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterActive, setFilterActive] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalAdvertisements, setTotalAdvertisements] = useState(0);
  const [selectedAdvertisement, setSelectedAdvertisement] = useState<Advertisement | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [formData, setFormData] = useState<Partial<Advertisement>>({});
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [imageInputMode, setImageInputMode] = useState<'url' | 'upload'>('url');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const advertisementsPerPage = 20;

  const loadAdvertisements = async (page: number = 1) => {
    try {
      setLoading(true);
      setError(null);
      const result = await AdminService.getAdvertisements(page, advertisementsPerPage);
      setAdvertisements(result.data);
      setTotalAdvertisements(result.total);
      setCurrentPage(page);
    } catch (err) {
      setError('Fehler beim Laden der Werbungen');
      console.error('Error loading advertisements:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadFormats = async () => {
    try {
      const formatsData = await AdminService.getAdvertisementFormats();
      setFormats(formatsData);
    } catch (err) {
      console.error('Error loading formats:', err);
    }
  };

  useEffect(() => {
    loadAdvertisements();
    loadFormats();
  }, []);

  // Verhindere Body-Scroll wenn Modal offen ist
  useEffect(() => {
    if (showModal || showDeleteConfirm) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    // Cleanup beim Unmount
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showModal, showDeleteConfirm]);

  const handleRefresh = () => {
    loadAdvertisements(currentPage);
  };

  const handleCreate = () => {
    setFormData({
      title: '',
      description: '',
      image_url: '',
      link_url: '',
      cta_text: 'Mehr erfahren',
      ad_type: '',
      format_id: null,
      target_pet_types: [],
      target_locations: [],
      target_subscription_types: ['free'], // Free als Default
      is_active: true,
      priority: 0,
      max_impressions: null,
      max_clicks: null
    });
    setImageInputMode('url');
    setUploadError(null);
    setUploadingImage(false);
    setIsEditMode(false);
    setShowModal(true);
  };

  const handleEdit = (ad: Advertisement) => {
    // Wenn format_id vorhanden ist, aber custom_width/custom_height fehlen,
    // hole sie aus dem Format
    let customWidth = ad.custom_width;
    let customHeight = ad.custom_height;
    
    if (ad.format_id && (!customWidth || !customHeight)) {
      const format = formats.find(f => f.id === ad.format_id);
      if (format) {
        customWidth = format.width;
        customHeight = format.height;
      }
    }
    
    setFormData({
      ...ad,
      target_subscription_types: ad.target_subscription_types && ad.target_subscription_types.length > 0 
        ? ad.target_subscription_types 
        : ['free'], // Fallback zu Free wenn leer
      custom_width: customWidth,
      custom_height: customHeight
    });
    // Beim Bearbeiten standardmäßig URL-Modus verwenden
    setImageInputMode('url');
    setUploadError(null);
    setUploadingImage(false);
    setIsEditMode(true);
    setShowModal(true);
  };

  const handleFormatChange = (formatId: string) => {
    const selectedFormat = formats.find(f => f.id === formatId);
    if (selectedFormat) {
      setFormData({
        ...formData,
        format_id: formatId,
        ad_type: selectedFormat.ad_type,
        custom_width: selectedFormat.width || null,
        custom_height: selectedFormat.height || null
      });
    } else {
      // Wenn kein Format ausgewählt wird (z.B. zurücksetzen auf "-- Format auswählen --")
      setFormData({
        ...formData,
        format_id: null,
        ad_type: '',
        custom_width: null,
        custom_height: null
      });
    }
  };

  const handleDuplicate = async (id: string) => {
    try {
      await AdminService.duplicateAdvertisement(id);
      await loadAdvertisements(currentPage);
    } catch (err) {
      console.error('Error duplicating advertisement:', err);
      alert('Fehler beim Duplizieren der Werbung');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await AdminService.deleteAdvertisement(id);
      await loadAdvertisements(currentPage);
      setShowDeleteConfirm(false);
      setDeleteTargetId(null);
    } catch (err) {
      console.error('Error deleting advertisement:', err);
      alert('Fehler beim Löschen der Werbung');
    }
  };

  const handleSave = async () => {
    try {
      // Validierung: Format-ID muss vorhanden sein
      if (!formData.format_id) {
        alert('Bitte wählen Sie ein Anzeigeformat aus.');
        return;
      }

      // Filtere nur die Spalten, die tatsächlich in der advertisements Tabelle existieren
      // (nicht die zusätzlichen Spalten aus der View advertisements_with_formats)
      const cleanFormData: any = {
        title: formData.title,
        description: formData.description,
        image_url: formData.image_url,
        link_url: formData.link_url,
        cta_text: formData.cta_text,
        ad_type: formData.ad_type,
        format_id: formData.format_id,
        target_pet_types: formData.target_pet_types,
        target_locations: formData.target_locations,
        target_subscription_types: formData.target_subscription_types,
        start_date: formData.start_date,
        end_date: formData.end_date,
        is_active: formData.is_active,
        priority: formData.priority,
        max_impressions: formData.max_impressions,
        max_clicks: formData.max_clicks,
        custom_width: formData.custom_width,
        custom_height: formData.custom_height
      };

      if (isEditMode && selectedAdvertisement) {
        await AdminService.updateAdvertisement(selectedAdvertisement.id, cleanFormData);
      } else {
        await AdminService.createAdvertisement(cleanFormData);
      }
      setShowModal(false);
      setFormData({});
      await loadAdvertisements(currentPage);
    } catch (err) {
      console.error('Error saving advertisement:', err);
      alert('Fehler beim Speichern der Werbung');
    }
  };

  const filteredAdvertisements = advertisements.filter(ad => {
    const matchesSearch = searchTerm === '' || 
      (ad.title?.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (ad.description?.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesFilter = filterActive === 'all' ||
      (filterActive === 'active' && ad.is_active) ||
      (filterActive === 'inactive' && !ad.is_active);

    return matchesSearch && matchesFilter;
  });

  const getAdTypeLabel = (adType: string) => {
    const labels: { [key: string]: string } = {
      'search_card': 'Suchkarte',
      'search_filter': 'Suchfilter',
      'search_card_filter': 'Suchkarte & Filter',
      'profile_banner': 'Profil Banner',
      'dashboard_banner': 'Dashboard Banner'
    };
    return labels[adType] || adType;
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

  const getStatusBadge = (ad: Advertisement) => {
    if (!ad.is_active) {
      return <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">Inaktiv</span>;
    }
    
    const now = new Date();
    const startDate = ad.start_date ? new Date(ad.start_date) : null;
    const endDate = ad.end_date ? new Date(ad.end_date) : null;

    if (startDate && now < startDate) {
      return <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">Geplant</span>;
    }
    
    if (endDate && now > endDate) {
      return <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">Abgelaufen</span>;
    }

    return <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">Aktiv</span>;
  };

  const totalPages = Math.ceil(totalAdvertisements / advertisementsPerPage);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Werbeverwaltung</h2>
          <p className="text-gray-600">
            Verwalten Sie alle Werbeanzeigen ({totalAdvertisements} Werbungen)
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <select
            value={filterActive}
            onChange={(e) => setFilterActive(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <option value="all">Alle</option>
            <option value="active">Aktive</option>
            <option value="inactive">Inaktive</option>
          </select>
          <button 
            onClick={handleRefresh}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Aktualisieren
          </button>
          <button 
            onClick={handleCreate}
            className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Neue Werbung
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Nach Titel oder Beschreibung suchen..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Advertisements Table */}
      <div className="bg-white rounded-lg border overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Werbungen</h3>
        </div>
        
        {loading ? (
          <div className="p-6 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-500">Lade Werbungen...</p>
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
        ) : filteredAdvertisements.length === 0 ? (
          <div className="p-6 text-center">
            <Megaphone className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">Keine Werbungen gefunden</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Werbung
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Typ
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Statistiken
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Datum
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Aktionen
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredAdvertisements.map((ad) => (
                    <tr key={ad.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {ad.image_url && (
                            <img 
                              src={ad.image_url} 
                              alt={ad.title || 'Werbung'} 
                              className="h-12 w-12 object-cover rounded"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                              }}
                            />
                          )}
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {ad.title || 'Kein Titel'}
                            </div>
                            <div className="text-xs text-gray-500 line-clamp-1">
                              {ad.description || 'Keine Beschreibung'}
                            </div>
                            <div className="text-xs text-gray-400 mt-1">
                              Priorität: {ad.priority}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm">
                          <div className="text-gray-900 font-medium">
                            {ad.format_name || getAdTypeLabel(ad.ad_type)}
                          </div>
                          {ad.format_id && (
                            <div className="text-xs text-gray-500 mt-1">
                              {ad.display_width && ad.display_height && (
                                <div>{ad.display_width} x {ad.display_height} px</div>
                              )}
                              {ad.placement && (
                                <div>{ad.placement}</div>
                              )}
                            </div>
                          )}
                          {!ad.format_id && (
                            <div className="text-xs text-red-500 mt-1">⚠ Kein Format zugewiesen</div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(ad)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="space-y-1">
                          <div>Impressions: {ad.current_impressions}{ad.max_impressions ? ` / ${ad.max_impressions}` : ''}</div>
                          <div>Clicks: {ad.current_clicks}{ad.max_clicks ? ` / ${ad.max_clicks}` : ''}</div>
                          {ad.current_impressions > 0 && (
                            <div className="text-xs text-gray-400">
                              CTR: {((ad.current_clicks / ad.current_impressions) * 100).toFixed(2)}%
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="space-y-1">
                          <div>Erstellt: {formatDate(ad.created_at)}</div>
                          {ad.start_date && <div>Start: {formatDate(ad.start_date)}</div>}
                          {ad.end_date && <div>Ende: {formatDate(ad.end_date)}</div>}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setSelectedAdvertisement(ad);
                              handleEdit(ad);
                            }}
                            className="text-blue-600 hover:text-blue-900"
                            title="Bearbeiten"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          
                          <button
                            onClick={() => handleDuplicate(ad.id)}
                            className="text-green-600 hover:text-green-900"
                            title="Duplizieren"
                          >
                            <Copy className="h-4 w-4" />
                          </button>
                          
                          <button
                            onClick={() => {
                              setDeleteTargetId(ad.id);
                              setShowDeleteConfirm(true);
                            }}
                            className="text-red-600 hover:text-red-900"
                            title="Löschen"
                          >
                            <Trash2 className="h-4 w-4" />
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
                    Seite {currentPage} von {totalPages} ({totalAdvertisements} Werbungen)
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => loadAdvertisements(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Zurück
                    </button>
                    <button
                      onClick={() => loadAdvertisements(currentPage + 1)}
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

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                {isEditMode ? 'Werbung bearbeiten' : 'Neue Werbung erstellen'}
              </h3>
              <button
                onClick={() => {
                  setShowModal(false);
                  setFormData({});
                  setSelectedAdvertisement(null);
                  setImageInputMode('url');
                  setUploadError(null);
                  setUploadingImage(false);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Titel</label>
                  <input
                    type="text"
                    value={formData.title || ''}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Anzeigeformat *</label>
                  <select
                    value={formData.format_id || ''}
                    onChange={(e) => handleFormatChange(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">-- Format auswählen --</option>
                    {formats.map((format) => (
                      <option key={format.id} value={format.id}>
                        {format.name} ({format.width} x {format.height} px)
                      </option>
                    ))}
                  </select>
                  {formData.format_id && (
                    <div className="mt-2 p-2 bg-blue-50 rounded-lg">
                      {(() => {
                        const selectedFormat = formats.find(f => f.id === formData.format_id);
                        if (selectedFormat) {
                          return (
                            <div className="text-xs text-gray-700">
                              <div className="font-medium">{selectedFormat.name}</div>
                              {selectedFormat.description && (
                                <div className="mt-1">{selectedFormat.description}</div>
                              )}
                              {selectedFormat.function_description && (
                                <div className="mt-1 text-gray-600">{selectedFormat.function_description}</div>
                              )}
                              <div className="mt-1">
                                <strong>Größe:</strong> {selectedFormat.width} x {selectedFormat.height} px
                              </div>
                              {(formData.custom_width || formData.custom_height) && (
                                <div className="mt-1 text-green-600">
                                  <strong>Gesetzt:</strong> {formData.custom_width || '-'} x {formData.custom_height || '-'} px
                                </div>
                              )}
                              <div>
                                <strong>Platzierung:</strong> {selectedFormat.placement}
                              </div>
                            </div>
                          );
                        }
                        return null;
                      })()}
                    </div>
                  )}
                  {!formData.format_id && (
                    <p className="text-xs text-gray-500 mt-1">
                      Wählen Sie ein Format aus, um die korrekte Platzierung und Größe zu gewährleisten.
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Beschreibung</label>
                <textarea
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col">
                  <div className="flex items-center justify-between mb-1 h-5">
                    <label className="block text-sm font-medium text-gray-700">Bild</label>
                    {/* Toggle zwischen URL und Upload */}
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          setImageInputMode('url');
                          setUploadError(null);
                        }}
                        className={`px-2 py-1 text-xs rounded ${
                          imageInputMode === 'url'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        URL
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setImageInputMode('upload');
                          setUploadError(null);
                        }}
                        className={`px-2 py-1 text-xs rounded flex items-center gap-1 ${
                          imageInputMode === 'upload'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        <Upload className="h-3 w-3" />
                        Upload
                      </button>
                    </div>
                  </div>

                  {imageInputMode === 'url' ? (
                    <input
                      type="text"
                      value={formData.image_url || ''}
                      onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                      placeholder="https://..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent h-10"
                    />
                  ) : (
                    <input
                      type="file"
                      accept="image/*"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;

                        // Validierung
                        if (!file.type.startsWith('image/')) {
                          setUploadError('Bitte wählen Sie eine Bilddatei aus');
                          return;
                        }

                        if (file.size > 5 * 1024 * 1024) {
                          setUploadError('Die Datei ist zu groß (max. 5MB)');
                          return;
                        }

                        try {
                          setUploadingImage(true);
                          setUploadError(null);
                          const imageUrl = await AdminService.uploadAdvertisementImage(file);
                          setFormData({ ...formData, image_url: imageUrl });
                        } catch (err) {
                          console.error('Error uploading image:', err);
                          setUploadError('Fehler beim Hochladen des Bildes. Bitte versuchen Sie es erneut.');
                        } finally {
                          setUploadingImage(false);
                        }
                      }}
                      disabled={uploadingImage}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed h-10"
                    />
                  )}
                  {uploadingImage && (
                    <div className="flex items-center gap-2 text-sm text-blue-600 mt-1">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Bild wird hochgeladen...</span>
                    </div>
                  )}
                  {uploadError && (
                    <div className="text-sm text-red-600 mt-1">{uploadError}</div>
                  )}
                  {formData.image_url && imageInputMode === 'upload' && (
                    <div className="mt-2">
                      <img
                        src={formData.image_url}
                        alt="Vorschau"
                        className="max-w-full h-32 object-cover rounded-lg border border-gray-300"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                      <p className="text-xs text-gray-500 mt-1">Bild erfolgreich hochgeladen</p>
                    </div>
                  )}
                </div>
                <div className="flex flex-col">
                  <div className="mb-1 h-5">
                    <label className="block text-sm font-medium text-gray-700">Link-URL</label>
                  </div>
                  <input
                    type="text"
                    value={formData.link_url || ''}
                    onChange={(e) => setFormData({ ...formData, link_url: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent h-10"
                  />
                </div>
              </div>

              {/* Bildvorschau für URL-Modus */}
              {imageInputMode === 'url' && formData.image_url && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Vorschau</label>
                  <img
                    src={formData.image_url}
                    alt="Vorschau"
                    className="max-w-full h-32 object-cover rounded-lg border border-gray-300"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </div>
              )}

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">CTA-Text</label>
                  <input
                    type="text"
                    value={formData.cta_text || 'Mehr erfahren'}
                    onChange={(e) => setFormData({ ...formData, cta_text: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Priorität</label>
                  <input
                    type="number"
                    value={formData.priority || 0}
                    onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div className="flex items-end">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.is_active ?? true}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-gray-700">Aktiv</span>
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Startdatum</label>
                  <input
                    type="datetime-local"
                    value={formData.start_date ? new Date(formData.start_date).toISOString().slice(0, 16) : ''}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value ? new Date(e.target.value).toISOString() : null })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Enddatum</label>
                  <input
                    type="datetime-local"
                    value={formData.end_date ? new Date(formData.end_date).toISOString().slice(0, 16) : ''}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value ? new Date(e.target.value).toISOString() : null })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Max. Impressions (optional)</label>
                  <input
                    type="number"
                    value={formData.max_impressions || ''}
                    onChange={(e) => setFormData({ ...formData, max_impressions: e.target.value ? parseInt(e.target.value) : null })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Max. Clicks (optional)</label>
                  <input
                    type="number"
                    value={formData.max_clicks || ''}
                    onChange={(e) => setFormData({ ...formData, max_clicks: e.target.value ? parseInt(e.target.value) : null })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Tiergruppen Auswahl */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tiergruppen</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {['Hund', 'Katze', 'Vogel', 'Kaninchen', 'Fisch', 'Kleintier', 'Andere'].map((petType) => (
                    <label key={petType} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={(formData.target_pet_types || []).includes(petType)}
                        onChange={(e) => {
                          const currentTypes = formData.target_pet_types || [];
                          if (e.target.checked) {
                            setFormData({ ...formData, target_pet_types: [...currentTypes, petType] });
                          } else {
                            setFormData({ ...formData, target_pet_types: currentTypes.filter(t => t !== petType) });
                          }
                        }}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">{petType}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Abonnement-Typen Auswahl */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Abonnement-Typen</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={(formData.target_subscription_types || ['free']).includes('free')}
                      onChange={(e) => {
                        const currentTypes = formData.target_subscription_types || ['free'];
                        if (e.target.checked) {
                          setFormData({ ...formData, target_subscription_types: [...currentTypes.filter(t => t !== 'free'), 'free'] });
                        } else {
                          const newTypes = currentTypes.filter(t => t !== 'free');
                          // Mindestens einer muss ausgewählt sein
                          if (newTypes.length === 0) {
                            return;
                          }
                          setFormData({ ...formData, target_subscription_types: newTypes });
                        }
                      }}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">Free User</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={(formData.target_subscription_types || ['free']).includes('premium')}
                      onChange={(e) => {
                        const currentTypes = formData.target_subscription_types || ['free'];
                        if (e.target.checked) {
                          setFormData({ ...formData, target_subscription_types: [...currentTypes.filter(t => t !== 'premium'), 'premium'] });
                        } else {
                          const newTypes = currentTypes.filter(t => t !== 'premium');
                          // Mindestens einer muss ausgewählt sein
                          if (newTypes.length === 0) {
                            setFormData({ ...formData, target_subscription_types: ['free'] });
                            return;
                          }
                          setFormData({ ...formData, target_subscription_types: newTypes });
                        }
                      }}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">Premium User</span>
                  </label>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-200">
                <div className="flex gap-2 justify-end">
                  <button
                    onClick={() => {
                      setShowModal(false);
                      setFormData({});
                      setSelectedAdvertisement(null);
                      setImageInputMode('url');
                      setUploadError(null);
                      setUploadingImage(false);
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                  >
                    Abbrechen
                  </button>
                  <button
                    onClick={handleSave}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium"
                  >
                    {isEditMode ? 'Aktualisieren' : 'Erstellen'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && deleteTargetId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center gap-3 mb-4">
              <XCircle className="h-8 w-8 text-red-600" />
              <h3 className="text-lg font-medium text-gray-900">Werbung löschen?</h3>
            </div>
            <p className="text-gray-600 mb-6">
              Möchten Sie diese Werbung wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.
            </p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setDeleteTargetId(null);
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Abbrechen
              </button>
              <button
                onClick={() => handleDelete(deleteTargetId)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium"
              >
                Löschen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdvertisementManagement;
