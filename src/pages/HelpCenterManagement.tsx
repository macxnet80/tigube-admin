import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Edit2, Trash2, X, RefreshCw, FileText, Video, BookOpen, AlertCircle } from 'lucide-react';
import { AdminService } from '../lib/admin/adminService';
import { useToast } from '../lib/toast/ToastContext';

interface HelpResource {
    id: string;
    title: string;
    description: string;
    type: 'tutorial' | 'pdf' | 'video';
    category: string;
    url: string;
    thumbnail_url: string;
    sort_order: number;
    is_published: boolean;
    created_at: string;
    updated_at: string;
}

const HelpCenterManagement: React.FC = () => {
    const { showSuccess, showError } = useToast();
    const [resources, setResources] = useState<HelpResource[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState<string>('all');
    const [currentPage, setCurrentPage] = useState(1);
    const resourcesPerPage = 20;

    // Modal states
    const [showModal, setShowModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [selectedResource, setSelectedResource] = useState<HelpResource | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [resourceToDelete, setResourceToDelete] = useState<string | null>(null);

    // Form states
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        type: 'tutorial',
        category: '',
        url: '',
        thumbnail_url: '',
        sort_order: 0,
        is_published: true
    });

    const loadResources = async (page: number = 1) => {
        try {
            setLoading(true);
            setError(null);
            const data = await AdminService.getHelpResources(page, resourcesPerPage);
            setResources(data.data as HelpResource[]);
            setCurrentPage(page);
        } catch (err) {
            setError('Fehler beim Laden der Hilfe-Ressourcen');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadResources();
    }, []);

    // Verhindere Body-Scroll wenn Sidepanel offen ist, behalte aber Scrollbar sichtbar
    useEffect(() => {
        if (showModal || showDeleteModal) {
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
    }, [showModal, showDeleteModal]);

    const handleRefresh = () => {
        loadResources(currentPage);
    };

    const handleOpenModal = (resource?: HelpResource) => {
        if (resource) {
            setSelectedResource(resource);
            setFormData({
                title: resource.title || '',
                description: resource.description || '',
                type: resource.type || 'tutorial',
                category: resource.category || '',
                url: resource.url || '',
                thumbnail_url: resource.thumbnail_url || '',
                sort_order: resource.sort_order || 0,
                is_published: resource.is_published
            });
        } else {
            setSelectedResource(null);
            setFormData({
                title: '',
                description: '',
                type: 'tutorial',
                category: '',
                url: '',
                thumbnail_url: '',
                sort_order: 0,
                is_published: true
            });
        }
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setSelectedResource(null);
        setFormData({
            title: '',
            description: '',
            type: 'tutorial',
            category: '',
            url: '',
            thumbnail_url: '',
            sort_order: 0,
            is_published: true
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.title || !formData.url) {
            showError('Bitte füllen Sie alle Pflichtfelder aus (Titel und URL)');
            return;
        }

        try {
            setIsSubmitting(true);
            if (selectedResource) {
                await AdminService.updateHelpResource(selectedResource.id, formData);
                showSuccess('Ressource erfolgreich aktualisiert');
            } else {
                await AdminService.createHelpResource(formData);
                showSuccess('Ressource erfolgreich erstellt');
            }
            handleCloseModal();
            loadResources(currentPage);
        } catch (err) {
            console.error(err);
            showError('Ein Fehler ist aufgetreten');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!resourceToDelete) return;
        try {
            await AdminService.deleteHelpResource(resourceToDelete);
            showSuccess('Ressource erfolgreich gelöscht');
            setShowDeleteModal(false);
            setResourceToDelete(null);
            loadResources(currentPage);
        } catch (err) {
            console.error(err);
            showError('Fehler beim Löschen der Ressource');
        }
    };

    const filteredResources = resources.filter(resource => {
        const matchesSearch = searchTerm === '' ||
            resource.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            resource.description?.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesType = filterType === 'all' || resource.type === filterType;
        return matchesSearch && matchesType;
    });

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'video':
                return <Video className="h-4 w-4 text-purple-500" />;
            case 'pdf':
                return <FileText className="h-4 w-4 text-red-500" />;
            case 'tutorial':
            default:
                return <BookOpen className="h-4 w-4 text-blue-500" />;
        }
    };

    const getTypeLabel = (type: string) => {
        switch (type) {
            case 'video': return 'Video';
            case 'pdf': return 'PDF';
            case 'tutorial': return 'Tutorial';
            default: return type;
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-xl font-semibold text-gray-900">Hilfe-Center</h2>
                    <p className="text-gray-600">
                        Verwalten Sie Tutorials, PDFs und Videos für das Hilfe-Center
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={handleRefresh}
                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 flex items-center gap-2"
                    >
                        <RefreshCw className="h-4 w-4" />
                        <span className="hidden sm:inline">Aktualisieren</span>
                    </button>
                    <button
                        onClick={() => handleOpenModal()}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium flex items-center gap-2"
                    >
                        <Plus className="h-4 w-4" />
                        Neu erstellen
                    </button>
                </div>
            </div>

            {/* Filter und Suche */}
            <div className="flex flex-col sm:flex-row gap-4">
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

                <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 outline-none focus:ring-2 focus:ring-blue-500"
                >
                    <option value="all">Alle Typen</option>
                    <option value="tutorial">Tutorials</option>
                    <option value="pdf">PDFs</option>
                    <option value="video">Videos</option>
                </select>
            </div>

            {/* Content Tabelle */}
            <div className="bg-white rounded-lg border overflow-hidden">
                {loading ? (
                    <div className="p-6 text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                        <p className="mt-2 text-gray-500">Lade Ressourcen...</p>
                    </div>
                ) : error ? (
                    <div className="p-6 text-center">
                        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-2" />
                        <p className="text-red-500 mb-4">{error}</p>
                        <button
                            onClick={handleRefresh}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                        >
                            Erneut versuchen
                        </button>
                    </div>
                ) : filteredResources.length === 0 ? (
                    <div className="p-12 text-center text-gray-500 focus:outline-none">
                        <BookOpen className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                        <p className="text-lg font-medium text-gray-900 mb-1">Keine Ressourcen gefunden</p>
                        <p>Es konnten keine Hilfe-Ressourcen mit den aktuellen Filtern gefunden werden.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Titel</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Typ</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kategorie</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sortierung</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aktionen</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {filteredResources.map((resource) => (
                                    <tr key={resource.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4">
                                            <div className="text-sm font-medium text-gray-900">{resource.title}</div>
                                            {resource.description && (
                                                <div className="text-sm text-gray-500 truncate max-w-xs">{resource.description}</div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-2">
                                                {getTypeIcon(resource.type)}
                                                <span className="text-sm text-gray-900">{getTypeLabel(resource.type)}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {resource.category || '-'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${resource.is_published
                                                ? 'bg-green-100 text-green-800'
                                                : 'bg-yellow-100 text-yellow-800'
                                                }`}>
                                                {resource.is_published ? 'Veröffentlicht' : 'Entwurf'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {resource.sort_order}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <div className="flex items-center gap-3">
                                                <button
                                                    onClick={() => handleOpenModal(resource)}
                                                    className="text-blue-600 hover:text-blue-900"
                                                    title="Bearbeiten"
                                                >
                                                    <Edit2 className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setResourceToDelete(resource.id);
                                                        setShowDeleteModal(true);
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
                )}
            </div>

            {/* Edit/Create Modal - Sidepanel Style */}
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
                            onClick={handleCloseModal}
                        />
                        <motion.div
                            className="fixed top-0 right-0 bottom-0 w-full max-w-2xl bg-white shadow-xl z-[101] flex flex-col"
                            style={{ margin: 0, padding: 0 }}
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: 'tween', duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
                        >
                            <div className="p-6 flex flex-col h-full overflow-hidden">
                                <div className="flex justify-between items-center mb-6 flex-shrink-0">
                                    <h3 className="text-xl font-semibold text-gray-900">
                                        {selectedResource ? 'Ressource bearbeiten' : 'Neue Ressource erstellen'}
                                    </h3>
                                    <button
                                        onClick={handleCloseModal}
                                        className="text-gray-400 hover:text-gray-600"
                                    >
                                        <X className="h-6 w-6" />
                                    </button>
                                </div>

                                <div className="flex-1 overflow-y-auto pr-2 pb-6">
                                    <form id="resourceForm" onSubmit={handleSubmit} className="space-y-4">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="md:col-span-2">
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Titel *</label>
                                                <input
                                                    type="text"
                                                    required
                                                    value={formData.title}
                                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                                />
                                            </div>

                                            <div className="md:col-span-2">
                                                <label className="block text-sm font-medium text-gray-700 mb-1">URL *</label>
                                                <input
                                                    type="text"
                                                    required
                                                    value={formData.url}
                                                    onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                                                    placeholder="https://..."
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                                />
                                            </div>

                                            <div className="md:col-span-2">
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Beschreibung</label>
                                                <textarea
                                                    value={formData.description}
                                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                                    rows={3}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                                ></textarea>
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Typ *</label>
                                                <select
                                                    required
                                                    value={formData.type}
                                                    onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                                >
                                                    <option value="tutorial">Tutorial</option>
                                                    <option value="pdf">PDF</option>
                                                    <option value="video">Video</option>
                                                </select>
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Kategorie</label>
                                                <input
                                                    type="text"
                                                    value={formData.category}
                                                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                                />
                                            </div>

                                            <div className="md:col-span-2">
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Thumbnail URL</label>
                                                <input
                                                    type="text"
                                                    value={formData.thumbnail_url}
                                                    onChange={(e) => setFormData({ ...formData, thumbnail_url: e.target.value })}
                                                    placeholder="https://..."
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Sortierung</label>
                                                <input
                                                    type="number"
                                                    value={formData.sort_order}
                                                    onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                                />
                                            </div>

                                            <div className="flex items-center h-full pt-6">
                                                <label className="flex items-center gap-2 cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        checked={formData.is_published}
                                                        onChange={(e) => setFormData({ ...formData, is_published: e.target.checked })}
                                                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                                    />
                                                    <span className="text-sm font-medium text-gray-700">Veröffentlicht</span>
                                                </label>
                                            </div>
                                        </div>
                                    </form>
                                </div>

                                <div className="pt-4 border-t border-gray-200 flex justify-end gap-3 flex-shrink-0 mt-auto">
                                    <button
                                        type="button"
                                        onClick={handleCloseModal}
                                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                                        disabled={isSubmitting}
                                    >
                                        Abbrechen
                                    </button>
                                    <button
                                        type="submit"
                                        form="resourceForm"
                                        disabled={isSubmitting}
                                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                                    >
                                        {isSubmitting ? 'Speichern...' : 'Speichern'}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Delete Confirmation Modal - Standard centered modal */}
            <AnimatePresence>
                {showDeleteModal && (
                    <div className="fixed inset-0 z-[120] overflow-y-auto">
                        <motion.div
                            className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                        >
                            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowDeleteModal(false)} />

                            <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>

                            <motion.div
                                className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6"
                                initial={{ scale: 0.95, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.95, opacity: 0 }}
                            >
                                <div className="sm:flex sm:items-start">
                                    <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                                        <AlertCircle className="h-6 w-6 text-red-600" />
                                    </div>
                                    <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                                        <h3 className="text-lg leading-6 font-medium text-gray-900">
                                            Ressource löschen
                                        </h3>
                                        <div className="mt-2">
                                            <p className="text-sm text-gray-500">
                                                Sind Sie sicher, dass Sie diese Ressource löschen möchten? Diese Aktion kann nicht rückgängig gemacht werden.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                                    <button
                                        type="button"
                                        onClick={handleDelete}
                                        className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
                                    >
                                        Löschen
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setShowDeleteModal(false)}
                                        className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:w-auto sm:text-sm"
                                    >
                                        Abbrechen
                                    </button>
                                </div>
                            </motion.div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default HelpCenterManagement;
