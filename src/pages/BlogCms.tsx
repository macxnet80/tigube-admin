import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Search, RefreshCw, Edit, Trash2, Plus, X, Calendar, Tag, Folder, Loader2, AlertCircle } from 'lucide-react';
import { useToast } from '../lib/toast/ToastContext';
import { supabaseAdmin } from '../lib/supabase/admin';
import { AdminService } from '../lib/admin/adminService';
import { Upload } from 'lucide-react';

interface ContentItem {
  id: string;
  type: 'blog' | 'news';
  slug: string;
  title: string;
  excerpt: string | null;
  content: string;
  cover_image_url: string | null;
  status: 'draft' | 'published';
  published_at: string | null;
  author_id: string | null;
  created_at: string;
  updated_at: string;
  categories?: ContentCategory[];
  tags?: ContentTag[];
}

interface ContentCategory {
  id: string;
  slug: string;
  name: string;
  description: string | null;
}

interface ContentTag {
  id: string;
  slug: string;
  name: string;
}

const BlogCms: React.FC = () => {
  const { showSuccess, showError } = useToast();
  const [items, setItems] = useState<ContentItem[]>([]);
  const [categories, setCategories] = useState<ContentCategory[]>([]);
  const [tags, setTags] = useState<ContentTag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'blog' | 'news'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'draft' | 'published'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [selectedItem, setSelectedItem] = useState<ContentItem | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [formData, setFormData] = useState<Partial<ContentItem>>({});
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [imageInputMode, setImageInputMode] = useState<'url' | 'upload'>('url');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newTagName, setNewTagName] = useState('');
  const [creatingCategory, setCreatingCategory] = useState(false);
  const [creatingTag, setCreatingTag] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [editingTagId, setEditingTagId] = useState<string | null>(null);
  const [tempCategoryName, setTempCategoryName] = useState('');
  const [tempTagName, setTempTagName] = useState('');

  const itemsPerPage = 20;

  const loadItems = async (page: number = 1) => {
    try {
      setLoading(true);
      setError(null);

      const offset = (page - 1) * itemsPerPage;

      let queryBuilder = supabaseAdmin
        .from('content_items')
        .select(`
          *,
          content_item_categories(
            category_id,
            content_categories(*)
          ),
          content_item_tags(
            tag_id,
            content_tags(*)
          )
        `, { count: 'exact' });

      // Filter für Typ
      if (filterType !== 'all') {
        queryBuilder = queryBuilder.eq('type', filterType);
      }

      // Filter für Status
      if (filterStatus !== 'all') {
        queryBuilder = queryBuilder.eq('status', filterStatus);
      }

      // Suche
      if (searchTerm) {
        queryBuilder = queryBuilder.or(`title.ilike.%${searchTerm}%,excerpt.ilike.%${searchTerm}%,content.ilike.%${searchTerm}%`);
      }

      const { data, error, count } = await queryBuilder
        .order('created_at', { ascending: false })
        .range(offset, offset + itemsPerPage - 1);

      if (error) {
        throw error;
      }

      // Transformiere die Daten
      const transformedData = (data || []).map((item: any) => {
        const itemCategories = Array.isArray(item.content_item_categories)
          ? item.content_item_categories.map((cic: any) => cic.content_categories).filter(Boolean)
          : [];

        const itemTags = Array.isArray(item.content_item_tags)
          ? item.content_item_tags.map((cit: any) => cit.content_tags).filter(Boolean)
          : [];

        return {
          ...item,
          categories: itemCategories,
          tags: itemTags
        };
      });

      setItems(transformedData);
      setTotalItems(count || transformedData.length);
      setCurrentPage(page);
    } catch (err) {
      setError('Fehler beim Laden der Inhalte');
      console.error('Error loading content items:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const { data, error } = await supabaseAdmin
        .from('content_categories')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      setCategories(data || []);
    } catch (err) {
      console.error('Error loading categories:', err);
    }
  };

  const loadTags = async () => {
    try {
      const { data, error } = await supabaseAdmin
        .from('content_tags')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      setTags(data || []);
    } catch (err) {
      console.error('Error loading tags:', err);
    }
  };

  useEffect(() => {
    loadItems();
    loadCategories();
    loadTags();
  }, [filterType, filterStatus, searchTerm]);

  // Verhindere Body-Scroll wenn Sidepanel offen ist, behalte aber Scrollbar sichtbar
  useEffect(() => {
    if (showModal || showDeleteConfirm) {
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
  }, [showModal, showDeleteConfirm]);

  const handleRefresh = () => {
    loadItems(currentPage);
    loadCategories();
    loadTags();
  };

  const handleCreate = () => {
    setFormData({
      type: 'blog',
      slug: '',
      title: '',
      excerpt: '',
      content: '',
      cover_image_url: '',
      status: 'draft',
      published_at: null
    });
    setSelectedItem(null);
    setSelectedCategories([]);
    setSelectedTags([]);
    setImageInputMode('url');
    setUploadError(null);
    setUploadingImage(false);
    setIsEditMode(false);
    setShowModal(true);
  };

  const handleEdit = (item: ContentItem) => {
    setSelectedItem(item);
    setFormData(item);
    setSelectedCategories(item.categories?.map(c => c.id) || []);
    setSelectedTags(item.tags?.map(t => t.id) || []);
    setIsEditMode(true);
    setShowModal(true);
  };

  const generateSlug = (title: string): string => {
    return title
      .toLowerCase()
      .replace(/ä/g, 'ae')
      .replace(/ö/g, 'oe')
      .replace(/ü/g, 'ue')
      .replace(/ß/g, 'ss')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
      const imageUrl = await AdminService.uploadContentImage(file);
      setFormData(prev => ({ ...prev, cover_image_url: imageUrl }));
      showSuccess('Bild erfolgreich hochgeladen');
    } catch (err) {
      console.error('Error uploading image:', err);
      setUploadError('Fehler beim Hochladen des Bildes. Bitte versuchen Sie es erneut.');
      showError('Bild-Upload fehlgeschlagen');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleAddCategory = async () => {
    if (!newCategoryName.trim() || creatingCategory) return;

    try {
      setCreatingCategory(true);
      const newCategory = await AdminService.createContentCategory(newCategoryName.trim());
      await loadCategories();
      setSelectedCategories(prev => [...prev, newCategory.id]);
      setNewCategoryName('');
      showSuccess(`Kategorie "${newCategoryName}" erstellt`);
    } catch (err) {
      console.error('Error creating category:', err);
      showError('Fehler beim Erstellen der Kategorie');
    } finally {
      setCreatingCategory(false);
    }
  };

  const handleAddTag = async () => {
    if (!newTagName.trim() || creatingTag) return;

    try {
      setCreatingTag(true);
      const newTag = await AdminService.createContentTag(newTagName.trim());
      await loadTags();
      setSelectedTags(prev => [...prev, newTag.id]);
      setNewTagName('');
      showSuccess(`Tag "${newTagName}" erstellt`);
    } catch (err) {
      console.error('Error creating tag:', err);
      showError('Fehler beim Erstellen des Tags');
    } finally {
      setCreatingTag(false);
    }
  };

  const handleUpdateCategory = async (id: string) => {
    if (!tempCategoryName.trim()) return;

    try {
      await AdminService.updateContentCategory(id, tempCategoryName.trim());
      await loadCategories();
      setEditingCategoryId(null);
      showSuccess('Kategorie aktualisiert');
    } catch (err) {
      console.error('Error updating category:', err);
      showError('Fehler beim Aktualisieren der Kategorie');
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!window.confirm('Möchten Sie diese Kategorie wirklich löschen?')) return;

    try {
      await AdminService.deleteContentCategory(id);
      await loadCategories();
      setSelectedCategories(prev => prev.filter(catId => catId !== id));
      showSuccess('Kategorie gelöscht');
    } catch (err) {
      console.error('Error deleting category:', err);
      showError('Fehler beim Löschen der Kategorie');
    }
  };

  const handleUpdateTag = async (id: string) => {
    if (!tempTagName.trim()) return;

    try {
      await AdminService.updateContentTag(id, tempTagName.trim());
      await loadTags();
      setEditingTagId(null);
      showSuccess('Tag aktualisiert');
    } catch (err) {
      console.error('Error updating tag:', err);
      showError('Fehler beim Aktualisieren des Tags');
    }
  };

  const handleDeleteTag = async (id: string) => {
    if (!window.confirm('Möchten Sie diesen Tag wirklich löschen?')) return;

    try {
      await AdminService.deleteContentTag(id);
      await loadTags();
      setSelectedTags(prev => prev.filter(tagId => tagId !== id));
      showSuccess('Tag gelöscht');
    } catch (err) {
      console.error('Error deleting tag:', err);
      showError('Fehler beim Löschen des Tags');
    }
  };

  const handleSave = async () => {
    if (saving) return;

    try {
      // Validierung
      if (!formData.title || !formData.content) {
        showError('Bitte füllen Sie Titel und Inhalt aus.');
        return;
      }

      setSaving(true);

      // Generiere Slug falls nicht vorhanden
      const slug = formData.slug || generateSlug(formData.title || '');

      const itemData: any = {
        type: formData.type || 'blog',
        slug,
        title: formData.title,
        excerpt: formData.excerpt || null,
        content: formData.content,
        cover_image_url: formData.cover_image_url || null,
        status: formData.status || 'draft',
        updated_at: new Date().toISOString()
      };

      // Setze published_at wenn Status auf published gesetzt wird
      if (itemData.status === 'published' && !formData.published_at) {
        itemData.published_at = new Date().toISOString();
      } else if (itemData.status === 'draft') {
        itemData.published_at = null;
      } else {
        itemData.published_at = formData.published_at || null;
      }

      let itemId: string;

      if (isEditMode && selectedItem) {
        // Update
        const { data, error } = await supabaseAdmin
          .from('content_items')
          .update(itemData)
          .eq('id', selectedItem.id)
          .select()
          .single();

        if (error) throw error;
        itemId = data.id;
        showSuccess('Inhalt erfolgreich aktualisiert');
      } else {
        // Create
        itemData.created_at = new Date().toISOString();
        const { data, error } = await supabaseAdmin
          .from('content_items')
          .insert(itemData)
          .select()
          .single();

        if (error) throw error;
        itemId = data.id;
        showSuccess('Inhalt erfolgreich erstellt');
      }

      // Aktualisiere Kategorien
      if (selectedCategories.length > 0 || (isEditMode && selectedItem?.categories)) {
        // Lösche alte Zuordnungen
        await supabaseAdmin
          .from('content_item_categories')
          .delete()
          .eq('content_item_id', itemId);

        // Füge neue Zuordnungen hinzu
        if (selectedCategories.length > 0) {
          await supabaseAdmin
            .from('content_item_categories')
            .insert(selectedCategories.map(catId => ({
              content_item_id: itemId,
              category_id: catId
            })));
        }
      }

      // Aktualisiere Tags
      if (selectedTags.length > 0 || (isEditMode && selectedItem?.tags)) {
        // Lösche alte Zuordnungen
        await supabaseAdmin
          .from('content_item_tags')
          .delete()
          .eq('content_item_id', itemId);

        // Füge neue Zuordnungen hinzu
        if (selectedTags.length > 0) {
          await supabaseAdmin
            .from('content_item_tags')
            .insert(selectedTags.map(tagId => ({
              content_item_id: itemId,
              tag_id: tagId
            })));
        }
      }

      setShowModal(false);
      setFormData({});
      setSelectedItem(null);
      setImageInputMode('url');
      setUploadError(null);
      setUploadingImage(false);
      setNewCategoryName('');
      setNewTagName('');
      setEditingCategoryId(null);
      setEditingTagId(null);
      setTempCategoryName('');
      setTempTagName('');
      await loadItems(currentPage);
    } catch (err) {
      console.error('Error saving content item:', err);
      showError('Fehler beim Speichern des Inhalts. Bitte versuchen Sie es erneut.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      // Lösche zuerst die Zuordnungen
      await supabaseAdmin
        .from('content_item_categories')
        .delete()
        .eq('content_item_id', id);

      await supabaseAdmin
        .from('content_item_tags')
        .delete()
        .eq('content_item_id', id);

      // Lösche dann den Inhalt
      const { error } = await supabaseAdmin
        .from('content_items')
        .delete()
        .eq('id', id);

      if (error) throw error;

      showSuccess('Inhalt erfolgreich gelöscht');
      setShowDeleteConfirm(false);
      setDeleteTargetId(null);
      await loadItems(currentPage);
    } catch (err) {
      console.error('Error deleting content item:', err);
      showError('Fehler beim Löschen des Inhalts');
    }
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

  const getStatusBadge = (status: string) => {
    const badges: { [key: string]: { label: string; className: string } } = {
      'draft': { label: 'Entwurf', className: 'bg-gray-100 text-gray-800' },
      'published': { label: 'Veröffentlicht', className: 'bg-green-100 text-green-800' },
    };
    const badge = badges[status] || { label: status, className: 'bg-gray-100 text-gray-800' };
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${badge.className}`}>
        {badge.label}
      </span>
    );
  };

  const getTypeBadge = (type: string) => {
    const badges: { [key: string]: { label: string; className: string } } = {
      'blog': { label: 'Blog', className: 'bg-blue-100 text-blue-800' },
      'news': { label: 'News', className: 'bg-purple-100 text-purple-800' },
    };
    const badge = badges[type] || { label: type, className: 'bg-gray-100 text-gray-800' };
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${badge.className}`}>
        {badge.label}
      </span>
    );
  };

  const totalPages = Math.ceil(totalItems / itemsPerPage);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Blog & News</h2>
          <p className="text-gray-600">
            Verwalten Sie Blog-Inhalte und News ({totalItems} Einträge)
          </p>
        </div>

        <div className="flex items-center gap-2">
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
            Neuer Eintrag
          </button>
        </div>
      </div>

      {/* Filter und Suche */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Nach Titel, Excerpt oder Inhalt suchen..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value as 'all' | 'blog' | 'news')}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
        >
          <option value="all">Alle Typen</option>
          <option value="blog">Blog</option>
          <option value="news">News</option>
        </select>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as 'all' | 'draft' | 'published')}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
        >
          <option value="all">Alle Status</option>
          <option value="draft">Entwurf</option>
          <option value="published">Veröffentlicht</option>
        </select>
      </div>

      {/* Content Items Table */}
      <div className="bg-white rounded-lg border overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Inhalte</h3>
        </div>

        {loading ? (
          <div className="p-6 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-500">Lade Inhalte...</p>
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
        ) : items.length === 0 ? (
          <div className="p-6 text-center">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">Keine Inhalte gefunden</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Titel
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Typ
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Kategorien & Tags
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
                  {items.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {item.cover_image_url && (
                            <img
                              src={item.cover_image_url}
                              alt={item.title}
                              className="h-12 w-12 object-cover rounded"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                              }}
                            />
                          )}
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {item.title}
                            </div>
                            <div className="text-xs text-gray-500 line-clamp-1">
                              {item.excerpt || 'Kein Excerpt'}
                            </div>
                            <div className="text-xs text-gray-400 mt-1">
                              /{item.slug}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getTypeBadge(item.type)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(item.status)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {item.categories && item.categories.length > 0 && (
                            item.categories.map((cat) => (
                              <span key={cat.id} className="px-2 py-1 text-xs bg-blue-50 text-blue-700 rounded flex items-center gap-1">
                                <Folder className="h-3 w-3" />
                                {cat.name}
                              </span>
                            ))
                          )}
                          {item.tags && item.tags.length > 0 && (
                            item.tags.map((tag) => (
                              <span key={tag.id} className="px-2 py-1 text-xs bg-gray-50 text-gray-700 rounded flex items-center gap-1">
                                <Tag className="h-3 w-3" />
                                {tag.name}
                              </span>
                            ))
                          )}
                          {(!item.categories || item.categories.length === 0) && (!item.tags || item.tags.length === 0) && (
                            <span className="text-xs text-gray-400">Keine</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="space-y-1">
                          <div>Erstellt: {formatDate(item.created_at)}</div>
                          {item.published_at && (
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {formatDate(item.published_at)}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleEdit(item)}
                            className="text-blue-600 hover:text-blue-900"
                            title="Bearbeiten"
                          >
                            <Edit className="h-4 w-4" />
                          </button>

                          <button
                            onClick={() => {
                              setDeleteTargetId(item.id);
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
                    Seite {currentPage} von {totalPages} ({totalItems} Einträge)
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => loadItems(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Zurück
                    </button>
                    <button
                      onClick={() => loadItems(currentPage + 1)}
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

      {/* Create/Edit Sidepanel */}
      <AnimatePresence>
        {showModal && (
          <>
            <motion.div
              className="fixed top-0 left-0 right-0 bottom-0 bg-black/50 backdrop-blur-sm z-[100]"
              style={{ margin: 0, padding: 0 }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              onClick={() => {
                setShowModal(false);
                setFormData({});
                setSelectedItem(null);
                setSelectedCategories([]);
                setSelectedTags([]);
                setUploadError(null);
                setUploadingImage(false);
                setNewCategoryName('');
                setNewTagName('');
                setEditingCategoryId(null);
                setEditingTagId(null);
                setTempCategoryName('');
                setTempTagName('');
              }}
            />
            <motion.div
              className="fixed top-0 right-0 bottom-0 w-full max-w-4xl bg-white shadow-xl z-[101] flex flex-col"
              style={{ margin: 0, padding: 0 }}
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'tween', duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
            >
              <div className="p-6 flex flex-col h-full">
                <div className="flex justify-between items-center mb-4 flex-shrink-0">
                  <h3 className="text-lg font-medium text-gray-900">
                    {isEditMode ? 'Inhalt bearbeiten' : 'Neuen Inhalt erstellen'}
                  </h3>
                  <button
                    onClick={() => {
                      setShowModal(false);
                      setFormData({});
                      setSelectedItem(null);
                      setSelectedCategories([]);
                      setSelectedTags([]);
                      setImageInputMode('url');
                      setUploadError(null);
                      setUploadingImage(false);
                      setNewCategoryName('');
                      setNewTagName('');
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>

                <div className="space-y-4 flex-1 overflow-y-auto pb-9">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Typ *</label>
                      <select
                        value={formData.type || 'blog'}
                        onChange={(e) => setFormData({ ...formData, type: e.target.value as 'blog' | 'news' })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="blog">Blog</option>
                        <option value="news">News</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Status *</label>
                      <select
                        value={formData.status || 'draft'}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value as 'draft' | 'published' })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="draft">Entwurf</option>
                        <option value="published">Veröffentlicht</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Titel *</label>
                    <input
                      type="text"
                      value={formData.title || ''}
                      onChange={(e) => {
                        const newTitle = e.target.value;

                        setFormData(prev => {
                          const oldTitle = prev.title || '';
                          const currentSlug = prev.slug || '';
                          const newData = { ...prev, title: newTitle };

                          // Auto-generate slug wenn wir nicht im Edit-Mode sind
                          // UND (der Slug leer ist ODER der aktuelle Slug dem generierten Slug des alten Titels entspricht)
                          // Letzteres bedeutet, der User hat den Slug noch nicht manuell angefasst.
                          if (!isEditMode && (!currentSlug || currentSlug === generateSlug(oldTitle))) {
                            newData.slug = generateSlug(newTitle);
                          }

                          return newData;
                        });
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Titel des Inhalts"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Slug *</label>
                    <input
                      type="text"
                      value={formData.slug || ''}
                      onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="url-freundlicher-slug"
                    />
                    <p className="text-xs text-gray-500 mt-1">Wird automatisch aus dem Titel generiert</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Excerpt</label>
                    <textarea
                      value={formData.excerpt || ''}
                      onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Kurze Zusammenfassung..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Inhalt *</label>
                    <textarea
                      value={formData.content || ''}
                      onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                      rows={10}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                      placeholder="Inhalt des Artikels..."
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-sm font-medium text-gray-700">Cover Bild</label>
                      <div className="flex gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            setImageInputMode('url');
                            setUploadError(null);
                          }}
                          className={`px-2 py-1 text-xs rounded ${imageInputMode === 'url'
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
                          className={`px-2 py-1 text-xs rounded flex items-center gap-1 ${imageInputMode === 'upload'
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
                        value={formData.cover_image_url || ''}
                        onChange={(e) => setFormData({ ...formData, cover_image_url: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="https://..."
                      />
                    ) : (
                      <div className="space-y-2">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                        />
                        {uploadingImage && (
                          <div className="flex items-center gap-2 text-sm text-blue-600">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Bild wird hochgeladen...
                          </div>
                        )}
                        {uploadError && (
                          <div className="text-sm text-red-600 flex items-center gap-1">
                            <AlertCircle className="h-4 w-4" />
                            {uploadError}
                          </div>
                        )}
                      </div>
                    )}

                    {formData.cover_image_url && (
                      <div className="mt-2">
                        <img
                          src={formData.cover_image_url}
                          alt="Vorschau"
                          className="max-w-full h-32 object-cover rounded-lg border border-gray-300"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                        <p className="text-xs text-gray-500 mt-1 truncate">{formData.cover_image_url}</p>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <div className="flex flex-col gap-2 mb-2">
                        <label className="block text-sm font-medium text-gray-700">Kategorien</label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={newCategoryName}
                            onChange={(e) => setNewCategoryName(e.target.value)}
                            placeholder="Neu..."
                            className="text-xs px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 outline-none flex-1"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleAddCategory();
                              }
                            }}
                          />
                          <button
                            type="button"
                            onClick={handleAddCategory}
                            disabled={creatingCategory || !newCategoryName.trim()}
                            className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded hover:bg-blue-100 disabled:opacity-50 flex items-center gap-1"
                          >
                            {creatingCategory ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />}
                          </button>
                        </div>
                      </div>
                      <div className="flex flex-col gap-1 max-h-64 overflow-y-auto border border-gray-200 rounded-lg p-2 bg-gray-50/30">
                        {categories.map((category) => (
                          <div key={category.id} className="group relative flex items-center gap-2 p-1.5 hover:bg-white rounded border border-transparent hover:border-gray-200 transition-all shadow-sm">
                            {editingCategoryId === category.id ? (
                              <div className="flex items-center gap-1 w-full z-10">
                                <input
                                  type="text"
                                  value={tempCategoryName}
                                  onChange={(e) => setTempCategoryName(e.target.value)}
                                  className="flex-1 text-xs px-1 py-0.5 border border-blue-500 rounded outline-none"
                                  autoFocus
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      e.preventDefault();
                                      handleUpdateCategory(category.id);
                                    }
                                    if (e.key === 'Escape') setEditingCategoryId(null);
                                  }}
                                />
                                <button onClick={() => handleUpdateCategory(category.id)} className="text-green-600 hover:text-green-700">
                                  <RefreshCw className="h-3 w-3" />
                                </button>
                                <button onClick={() => setEditingCategoryId(null)} className="text-gray-400 hover:text-gray-600">
                                  <X className="h-3 w-3" />
                                </button>
                              </div>
                            ) : (
                              <>
                                <input
                                  type="checkbox"
                                  checked={selectedCategories.includes(category.id)}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setSelectedCategories([...selectedCategories, category.id]);
                                    } else {
                                      setSelectedCategories(selectedCategories.filter(id => id !== category.id));
                                    }
                                  }}
                                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                                />
                                <span className="text-sm text-gray-700 truncate flex-1">{category.name}</span>
                                <div className="hidden group-hover:flex items-center gap-1 absolute right-1 bg-white border border-gray-200 px-1 rounded shadow-sm z-10">
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      setEditingCategoryId(category.id);
                                      setTempCategoryName(category.name);
                                    }}
                                    className="text-gray-400 hover:text-blue-600 p-0.5"
                                    title="Bearbeiten"
                                  >
                                    <Edit className="h-3 w-3" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      handleDeleteCategory(category.id);
                                    }}
                                    className="text-gray-400 hover:text-red-600 p-0.5"
                                    title="Löschen"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </button>
                                </div>
                              </>
                            )}
                          </div>
                        ))}
                        {categories.length === 0 && (
                          <p className="text-xs text-gray-400 p-2">Keine Kategorien</p>
                        )}
                      </div>
                    </div>

                    <div>
                      <div className="flex flex-col gap-2 mb-2">
                        <label className="block text-sm font-medium text-gray-700">Tags</label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={newTagName}
                            onChange={(e) => setNewTagName(e.target.value)}
                            placeholder="Neu..."
                            className="text-xs px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 outline-none flex-1"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleAddTag();
                              }
                            }}
                          />
                          <button
                            type="button"
                            onClick={handleAddTag}
                            disabled={creatingTag || !newTagName.trim()}
                            className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded hover:bg-blue-100 disabled:opacity-50 flex items-center gap-1"
                          >
                            {creatingTag ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />}
                          </button>
                        </div>
                      </div>
                      <div className="flex flex-col gap-1 max-h-64 overflow-y-auto border border-gray-200 rounded-lg p-2 bg-gray-50/30">
                        {tags.map((tag) => (
                          <div key={tag.id} className="group relative flex items-center gap-2 p-1.5 hover:bg-white rounded border border-transparent hover:border-gray-200 transition-all shadow-sm">
                            {editingTagId === tag.id ? (
                              <div className="flex items-center gap-1 w-full z-10">
                                <input
                                  type="text"
                                  value={tempTagName}
                                  onChange={(e) => setTempTagName(e.target.value)}
                                  className="flex-1 text-xs px-1 py-0.5 border border-blue-500 rounded outline-none"
                                  autoFocus
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      e.preventDefault();
                                      handleUpdateTag(tag.id);
                                    }
                                    if (e.key === 'Escape') setEditingTagId(null);
                                  }}
                                />
                                <button onClick={() => handleUpdateTag(tag.id)} className="text-green-600 hover:text-green-700">
                                  <RefreshCw className="h-3 w-3" />
                                </button>
                                <button onClick={() => setEditingTagId(null)} className="text-gray-400 hover:text-gray-600">
                                  <X className="h-3 w-3" />
                                </button>
                              </div>
                            ) : (
                              <>
                                <input
                                  type="checkbox"
                                  checked={selectedTags.includes(tag.id)}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setSelectedTags([...selectedTags, tag.id]);
                                    } else {
                                      setSelectedTags(selectedTags.filter(id => id !== tag.id));
                                    }
                                  }}
                                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                                />
                                <span className="text-sm text-gray-700 truncate flex-1">{tag.name}</span>
                                <div className="hidden group-hover:flex items-center gap-1 absolute right-1 bg-white border border-gray-200 px-1 rounded shadow-sm z-10">
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      setEditingTagId(tag.id);
                                      setTempTagName(tag.name);
                                    }}
                                    className="text-gray-400 hover:text-blue-600 p-0.5"
                                    title="Bearbeiten"
                                  >
                                    <Edit className="h-3 w-3" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      handleDeleteTag(tag.id);
                                    }}
                                    className="text-gray-400 hover:text-red-600 p-0.5"
                                    title="Löschen"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </button>
                                </div>
                              </>
                            )}
                          </div>
                        ))}
                        {tags.length === 0 && (
                          <p className="text-xs text-gray-400 p-2">Keine Tags</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {formData.status === 'published' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Veröffentlichungsdatum</label>
                      <input
                        type="datetime-local"
                        value={formData.published_at ? new Date(formData.published_at).toISOString().slice(0, 16) : ''}
                        onChange={(e) => setFormData({ ...formData, published_at: e.target.value ? new Date(e.target.value).toISOString() : null })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-gray-200 flex-shrink-0 mt-auto">
                  <div className="flex gap-2 justify-end">
                    <button
                      onClick={() => {
                        setShowModal(false);
                        setFormData({});
                        setSelectedItem(null);
                        setSelectedCategories([]);
                        setSelectedTags([]);
                        setImageInputMode('url');
                        setUploadError(null);
                        setUploadingImage(false);
                        setNewCategoryName('');
                        setNewTagName('');
                        setEditingCategoryId(null);
                        setEditingTagId(null);
                        setTempCategoryName('');
                        setTempTagName('');
                      }}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                    >
                      Abbrechen
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {saving ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          {isEditMode ? 'Wird aktualisiert...' : 'Wird erstellt...'}
                        </>
                      ) : (
                        isEditMode ? 'Aktualisieren' : 'Erstellen'
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Sidepanel */}
      <AnimatePresence>
        {showDeleteConfirm && deleteTargetId && (
          <>
            <motion.div
              className="fixed top-0 left-0 right-0 bottom-0 bg-black/50 backdrop-blur-sm z-[100]"
              style={{ margin: 0, padding: 0 }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              onClick={() => {
                setShowDeleteConfirm(false);
                setDeleteTargetId(null);
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
                  <AlertCircle className="h-8 w-8 text-red-600" />
                  <h3 className="text-lg font-medium text-gray-900">Inhalt löschen?</h3>
                </div>
                <div className="flex-1 overflow-y-auto">
                  <p className="text-gray-600 mb-6">
                    Möchten Sie diesen Inhalt wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.
                  </p>
                </div>
                <div className="flex gap-2 justify-end pt-4 border-t border-gray-200 flex-shrink-0 mt-auto">
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
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default BlogCms;
