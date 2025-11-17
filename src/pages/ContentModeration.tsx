import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Shield, 
  MessageSquare, 
  Star, 
  FileText, 
  UserX, 
  AlertCircle,
  Search,
  RefreshCw,
  Trash2,
  Eye,
  CheckCircle2,
  XCircle,
  Ban,
  Unlock,
  Filter
} from 'lucide-react';
import { supabaseAdmin } from '../lib/supabase/admin';
import { useToast } from '../lib/toast/ToastContext';

type ModerationTab = 'reviews' | 'messages' | 'content' | 'users' | 'tickets';

interface Review {
  id: string;
  user_id: string;
  caretaker_id: string | null;
  dienstleister_id: string | null;
  rating: number;
  comment: string | null;
  created_at: string;
  user?: {
    first_name: string;
    last_name: string;
    email: string;
  };
  caretaker?: {
    id: string;
  };
}

interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  message_type: string;
  created_at: string;
  sender?: {
    first_name: string;
    last_name: string;
    email: string;
  };
  conversation?: {
    owner_id: string;
    caretaker_id: string;
  };
}

interface ContentItem {
  id: string;
  type: string;
  title: string;
  excerpt: string | null;
  content: string;
  status: string;
  author_id: string | null;
  created_at: string;
  author?: {
    first_name: string;
    last_name: string;
    email: string;
  };
}

interface SuspendedUser {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  is_suspended: boolean;
  suspension_reason: string | null;
  suspended_at: string | null;
  suspended_by: string | null;
}

interface SupportTicket {
  id: string;
  user_id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  category: string;
  created_at: string;
  user?: {
    first_name: string;
    last_name: string;
    email: string;
  };
}

const ContentModeration: React.FC = () => {
  const { showSuccess, showError } = useToast();
  const [activeTab, setActiveTab] = useState<ModerationTab>('reviews');
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Reviews
  const [reviews, setReviews] = useState<Review[]>([]);
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  
  // Messages
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  
  // Content Items
  const [contentItems, setContentItems] = useState<ContentItem[]>([]);
  const [selectedContent, setSelectedContent] = useState<ContentItem | null>(null);
  
  // Suspended Users
  const [suspendedUsers, setSuspendedUsers] = useState<SuspendedUser[]>([]);
  const [suspensionReason, setSuspensionReason] = useState('');
  const [showSuspendModal, setShowSuspendModal] = useState(false);
  const [userToSuspend, setUserToSuspend] = useState<string | null>(null);
  
  // Support Tickets
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [ticketFilter, setTicketFilter] = useState<string>('all');

  useEffect(() => {
    loadData();
  }, [activeTab]);

  // Verhindere Body-Scroll wenn Sidepanel offen ist, behalte aber Scrollbar sichtbar
  useEffect(() => {
    if (showSuspendModal) {
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
  }, [showSuspendModal]);

  const loadData = async () => {
    setLoading(true);
    try {
      switch (activeTab) {
        case 'reviews':
          await loadReviews();
          break;
        case 'messages':
          await loadMessages();
          break;
        case 'content':
          await loadContentItems();
          break;
        case 'users':
          await loadSuspendedUsers();
          break;
        case 'tickets':
          await loadTickets();
          break;
      }
    } catch (error) {
      console.error('Error loading data:', error);
      showError('Fehler beim Laden der Daten');
    } finally {
      setLoading(false);
    }
  };

  const loadReviews = async () => {
    try {
      const { data: reviewsData, error } = await supabaseAdmin
        .from('reviews')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      // Lade Benutzer-Daten separat
      if (reviewsData && reviewsData.length > 0) {
        const userIds = [...new Set(reviewsData.map(r => r.user_id).filter(Boolean))];
        const { data: usersData } = await supabaseAdmin
          .from('users')
          .select('id, first_name, last_name, email')
          .in('id', userIds);

        const usersMap = new Map((usersData || []).map(u => [u.id, u]));
        
        const reviewsWithUsers = reviewsData.map(review => ({
          ...review,
          user: usersMap.get(review.user_id) || null,
        }));

        setReviews(reviewsWithUsers);
      } else {
        setReviews([]);
      }
    } catch (error) {
      console.error('Error loading reviews:', error);
      showError('Fehler beim Laden der Bewertungen');
    }
  };

  const loadMessages = async () => {
    try {
      const { data: messagesData, error } = await supabaseAdmin
        .from('messages')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      // Lade Sender-Daten separat
      if (messagesData && messagesData.length > 0) {
        const senderIds = [...new Set(messagesData.map(m => m.sender_id).filter(Boolean))];
        const { data: usersData } = await supabaseAdmin
          .from('users')
          .select('id, first_name, last_name, email')
          .in('id', senderIds);

        const usersMap = new Map((usersData || []).map(u => [u.id, u]));
        
        const messagesWithSenders = messagesData.map(message => ({
          ...message,
          sender: usersMap.get(message.sender_id) || null,
        }));

        setMessages(messagesWithSenders);
      } else {
        setMessages([]);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
      showError('Fehler beim Laden der Nachrichten');
    }
  };

  const loadContentItems = async () => {
    try {
      const { data: contentData, error } = await supabaseAdmin
        .from('content_items')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      // Lade Autor-Daten separat
      if (contentData && contentData.length > 0) {
        const authorIds = [...new Set(contentData.map(c => c.author_id).filter(Boolean))];
        if (authorIds.length > 0) {
          const { data: usersData } = await supabaseAdmin
            .from('users')
            .select('id, first_name, last_name, email')
            .in('id', authorIds);

          const usersMap = new Map((usersData || []).map(u => [u.id, u]));
          
          const contentWithAuthors = contentData.map(item => ({
            ...item,
            author: item.author_id ? (usersMap.get(item.author_id) || null) : null,
          }));

          setContentItems(contentWithAuthors);
        } else {
          setContentItems(contentData.map(item => ({ ...item, author: null })));
        }
      } else {
        setContentItems([]);
      }
    } catch (error) {
      console.error('Error loading content items:', error);
      showError('Fehler beim Laden der Inhalte');
    }
  };

  const loadSuspendedUsers = async () => {
    try {
      const { data, error } = await supabaseAdmin
        .from('users')
        .select('id, email, first_name, last_name, is_suspended, suspension_reason, suspended_at, suspended_by')
        .eq('is_suspended', true)
        .order('suspended_at', { ascending: false });

      if (error) throw error;
      setSuspendedUsers(data || []);
    } catch (error) {
      console.error('Error loading suspended users:', error);
      showError('Fehler beim Laden der gesperrten Benutzer');
    }
  };

  const loadTickets = async () => {
    try {
      let query = supabaseAdmin
        .from('support_tickets')
        .select('*')
        .order('created_at', { ascending: false });

      if (ticketFilter !== 'all') {
        query = query.eq('status', ticketFilter);
      }

      const { data: ticketsData, error } = await query;

      if (error) throw error;

      // Lade Benutzer-Daten separat
      if (ticketsData && ticketsData.length > 0) {
        const userIds = [...new Set(ticketsData.map(t => t.user_id).filter(Boolean))];
        const { data: usersData } = await supabaseAdmin
          .from('users')
          .select('id, first_name, last_name, email')
          .in('id', userIds);

        const usersMap = new Map((usersData || []).map(u => [u.id, u]));
        
        const ticketsWithUsers = ticketsData.map(ticket => ({
          ...ticket,
          user: usersMap.get(ticket.user_id) || null,
        }));

        setTickets(ticketsWithUsers);
      } else {
        setTickets([]);
      }
    } catch (error) {
      console.error('Error loading tickets:', error);
      showError('Fehler beim Laden der Support-Tickets');
    }
  };

  const handleDeleteReview = async (id: string) => {
    if (!confirm('Möchten Sie diese Bewertung wirklich löschen?')) return;

    try {
      const { error } = await supabaseAdmin
        .from('reviews')
        .delete()
        .eq('id', id);

      if (error) throw error;
      showSuccess('Bewertung wurde gelöscht');
      loadReviews();
    } catch (error) {
      console.error('Error deleting review:', error);
      showError('Fehler beim Löschen der Bewertung');
    }
  };

  const handleDeleteMessage = async (id: string) => {
    if (!confirm('Möchten Sie diese Nachricht wirklich löschen?')) return;

    try {
      const { error } = await supabaseAdmin
        .from('messages')
        .delete()
        .eq('id', id);

      if (error) throw error;
      showSuccess('Nachricht wurde gelöscht');
      loadMessages();
    } catch (error) {
      console.error('Error deleting message:', error);
      showError('Fehler beim Löschen der Nachricht');
    }
  };

  const handleDeleteContent = async (id: string) => {
    if (!confirm('Möchten Sie diesen Inhalt wirklich löschen?')) return;

    try {
      const { error } = await supabaseAdmin
        .from('content_items')
        .delete()
        .eq('id', id);

      if (error) throw error;
      showSuccess('Inhalt wurde gelöscht');
      loadContentItems();
    } catch (error) {
      console.error('Error deleting content:', error);
      showError('Fehler beim Löschen des Inhalts');
    }
  };

  const handleUpdateContentStatus = async (id: string, status: 'draft' | 'published') => {
    try {
      const { error } = await supabaseAdmin
        .from('content_items')
        .update({ status })
        .eq('id', id);

      if (error) throw error;
      showSuccess(`Inhalt wurde auf "${status === 'published' ? 'Veröffentlicht' : 'Entwurf'}" gesetzt`);
      loadContentItems();
    } catch (error) {
      console.error('Error updating content status:', error);
      showError('Fehler beim Aktualisieren des Inhalts');
    }
  };

  const handleSuspendUser = async () => {
    if (!userToSuspend || !suspensionReason.trim()) {
      showError('Bitte geben Sie einen Grund für die Sperrung an');
      return;
    }

    try {
      // Prüfe ob es eine E-Mail oder eine UUID ist
      let userId = userToSuspend;
      const isEmail = userToSuspend.includes('@');
      
      if (isEmail) {
        // Suche nach Benutzer per E-Mail
        const { data: userData, error: userError } = await supabaseAdmin
          .from('users')
          .select('id')
          .eq('email', userToSuspend)
          .single();

        if (userError || !userData) {
          showError('Benutzer mit dieser E-Mail wurde nicht gefunden');
          return;
        }
        userId = userData.id;
      }

      const { error } = await supabaseAdmin
        .from('users')
        .update({
          is_suspended: true,
          suspension_reason: suspensionReason,
          suspended_at: new Date().toISOString(),
        })
        .eq('id', userId);

      if (error) throw error;
      showSuccess('Benutzer wurde gesperrt');
      setShowSuspendModal(false);
      setSuspensionReason('');
      setUserToSuspend(null);
      loadSuspendedUsers();
    } catch (error) {
      console.error('Error suspending user:', error);
      showError('Fehler beim Sperren des Benutzers');
    }
  };

  const handleUnsuspendUser = async (userId: string) => {
    if (!confirm('Möchten Sie diesen Benutzer wirklich entsperren?')) return;

    try {
      const { error } = await supabaseAdmin
        .from('users')
        .update({
          is_suspended: false,
          suspension_reason: null,
          suspended_at: null,
          suspended_by: null,
        })
        .eq('id', userId);

      if (error) throw error;
      showSuccess('Benutzer wurde entsperrt');
      loadSuspendedUsers();
    } catch (error) {
      console.error('Error unsuspending user:', error);
      showError('Fehler beim Entsperren des Benutzers');
    }
  };

  const handleUpdateTicketStatus = async (ticketId: string, status: string) => {
    try {
      const updateData: any = { status };
      if (status === 'resolved' || status === 'closed') {
        updateData.resolved_at = new Date().toISOString();
      }

      const { error } = await supabaseAdmin
        .from('support_tickets')
        .update(updateData)
        .eq('id', ticketId);

      if (error) throw error;
      showSuccess(`Ticket wurde auf "${status}" gesetzt`);
      loadTickets();
    } catch (error) {
      console.error('Error updating ticket:', error);
      showError('Fehler beim Aktualisieren des Tickets');
    }
  };

  const filteredReviews = reviews.filter(review => 
    review.comment?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    review.user?.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredMessages = messages.filter(message =>
    message.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
    message.sender?.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredContent = contentItems.filter(item =>
    item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.excerpt?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const tabs = [
    { id: 'reviews' as ModerationTab, label: 'Bewertungen', icon: Star, count: reviews.length },
    { id: 'messages' as ModerationTab, label: 'Nachrichten', icon: MessageSquare, count: messages.length },
    { id: 'content' as ModerationTab, label: 'Inhalte', icon: FileText, count: contentItems.length },
    { id: 'users' as ModerationTab, label: 'Benutzer-Sperrungen', icon: UserX, count: suspendedUsers.length },
    { id: 'tickets' as ModerationTab, label: 'Support-Tickets', icon: AlertCircle, count: tickets.length },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Shield className="h-6 w-6 text-blue-600" />
          Content Moderation
        </h1>
        <p className="text-gray-600 mt-1">
          Moderieren Sie Inhalte, Bewertungen, Nachrichten und Benutzer
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setSearchTerm('');
                }}
                className={`
                  flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap
                  ${activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
                {tab.count > 0 && (
                  <span className="ml-1 bg-gray-100 text-gray-600 py-0.5 px-2 rounded-full text-xs">
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Search and Actions */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Suchen..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
        <button
          onClick={loadData}
          disabled={loading}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Aktualisieren
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <>
          {/* Reviews Tab */}
          {activeTab === 'reviews' && (
            <div className="bg-white rounded-lg border">
              <div className="p-6">
                <div className="space-y-4">
                  {filteredReviews.length === 0 ? (
                    <div className="text-center py-8">
                      <Star className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">Keine Bewertungen gefunden</p>
                    </div>
                  ) : (
                    filteredReviews.map((review) => (
                      <div key={review.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <div className="flex items-center gap-1">
                                {[...Array(5)].map((_, i) => (
                                  <Star
                                    key={i}
                                    className={`h-4 w-4 ${
                                      i < review.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                                    }`}
                                  />
                                ))}
                              </div>
                              <span className="text-sm text-gray-600">
                                von {review.user?.first_name} {review.user?.last_name} ({review.user?.email})
                              </span>
                            </div>
                            {review.comment && (
                              <p className="text-sm text-gray-900 mt-2">{review.comment}</p>
                            )}
                            <p className="text-xs text-gray-500 mt-2">
                              {new Date(review.created_at).toLocaleString('de-DE')}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 ml-4">
                            <button
                              onClick={() => setSelectedReview(review)}
                              className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                              title="Details anzeigen"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteReview(review.id)}
                              className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg"
                              title="Löschen"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Messages Tab */}
          {activeTab === 'messages' && (
            <div className="bg-white rounded-lg border">
              <div className="p-6">
                <div className="space-y-4">
                  {filteredMessages.length === 0 ? (
                    <div className="text-center py-8">
                      <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">Keine Nachrichten gefunden</p>
                    </div>
                  ) : (
                    filteredMessages.map((message) => (
                      <div key={message.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-sm font-medium text-gray-900">
                                {message.sender?.first_name} {message.sender?.last_name}
                              </span>
                              <span className="text-sm text-gray-500">({message.sender?.email})</span>
                            </div>
                            <p className="text-sm text-gray-900 mt-2">{message.content}</p>
                            <p className="text-xs text-gray-500 mt-2">
                              {new Date(message.created_at).toLocaleString('de-DE')}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 ml-4">
                            <button
                              onClick={() => setSelectedMessage(message)}
                              className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                              title="Details anzeigen"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteMessage(message.id)}
                              className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg"
                              title="Löschen"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Content Items Tab */}
          {activeTab === 'content' && (
            <div className="bg-white rounded-lg border">
              <div className="p-6">
                <div className="space-y-4">
                  {filteredContent.length === 0 ? (
                    <div className="text-center py-8">
                      <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">Keine Inhalte gefunden</p>
                    </div>
                  ) : (
                    filteredContent.map((item) => (
                      <div key={item.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-sm font-medium text-gray-900">{item.title}</span>
                              <span className={`text-xs px-2 py-1 rounded-full ${
                                item.status === 'published' 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-gray-100 text-gray-800'
                              }`}>
                                {item.status === 'published' ? 'Veröffentlicht' : 'Entwurf'}
                              </span>
                              <span className="text-xs text-gray-500">
                                {item.type === 'blog' ? 'Blog' : 'News'}
                              </span>
                            </div>
                            {item.excerpt && (
                              <p className="text-sm text-gray-600 mt-2">{item.excerpt}</p>
                            )}
                            <p className="text-xs text-gray-500 mt-2">
                              von {item.author?.first_name} {item.author?.last_name} • {new Date(item.created_at).toLocaleString('de-DE')}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 ml-4">
                            {item.status === 'draft' ? (
                              <button
                                onClick={() => handleUpdateContentStatus(item.id, 'published')}
                                className="px-3 py-1.5 text-sm font-medium text-green-700 bg-green-50 hover:bg-green-100 rounded-lg flex items-center gap-2"
                              >
                                <CheckCircle2 className="h-4 w-4" />
                                Veröffentlichen
                              </button>
                            ) : (
                              <button
                                onClick={() => handleUpdateContentStatus(item.id, 'draft')}
                                className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-lg flex items-center gap-2"
                              >
                                <XCircle className="h-4 w-4" />
                                Zurückziehen
                              </button>
                            )}
                            <button
                              onClick={() => setSelectedContent(item)}
                              className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                              title="Details anzeigen"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteContent(item.id)}
                              className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg"
                              title="Löschen"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Suspended Users Tab */}
          {activeTab === 'users' && (
            <div className="bg-white rounded-lg border">
              <div className="p-6">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900">Gesperrte Benutzer</h3>
                  <button
                    onClick={() => {
                      setShowSuspendModal(true);
                      setUserToSuspend(null);
                    }}
                    className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg flex items-center gap-2"
                  >
                    <Ban className="h-4 w-4" />
                    Benutzer sperren
                  </button>
                </div>
                <div className="space-y-4">
                  {suspendedUsers.length === 0 ? (
                    <div className="text-center py-8">
                      <UserX className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">Keine gesperrten Benutzer</p>
                    </div>
                  ) : (
                    suspendedUsers.map((user) => (
                      <div key={user.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-sm font-medium text-gray-900">
                                {user.first_name} {user.last_name}
                              </span>
                              <span className="text-sm text-gray-500">({user.email})</span>
                            </div>
                            {user.suspension_reason && (
                              <p className="text-sm text-gray-700 mt-2 bg-red-50 p-2 rounded">
                                <span className="font-medium">Grund:</span> {user.suspension_reason}
                              </p>
                            )}
                            {user.suspended_at && (
                              <p className="text-xs text-gray-500 mt-2">
                                Gesperrt am: {new Date(user.suspended_at).toLocaleString('de-DE')}
                              </p>
                            )}
                          </div>
                          <button
                            onClick={() => handleUnsuspendUser(user.id)}
                            className="px-4 py-2 text-sm font-medium text-green-700 bg-green-50 hover:bg-green-100 rounded-lg flex items-center gap-2"
                          >
                            <Unlock className="h-4 w-4" />
                            Entsperren
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Support Tickets Tab */}
          {activeTab === 'tickets' && (
            <div className="bg-white rounded-lg border">
              <div className="p-6">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900">Support-Tickets</h3>
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-gray-400" />
                    <select
                      value={ticketFilter}
                      onChange={(e) => {
                        setTicketFilter(e.target.value);
                        loadTickets();
                      }}
                      className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="all">Alle</option>
                      <option value="open">Offen</option>
                      <option value="in_progress">In Bearbeitung</option>
                      <option value="resolved">Gelöst</option>
                      <option value="closed">Geschlossen</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-4">
                  {tickets.length === 0 ? (
                    <div className="text-center py-8">
                      <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">Keine Tickets gefunden</p>
                    </div>
                  ) : (
                    tickets.map((ticket) => (
                      <div key={ticket.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-sm font-medium text-gray-900">{ticket.title}</span>
                              <span className={`text-xs px-2 py-1 rounded-full ${
                                ticket.status === 'open' ? 'bg-yellow-100 text-yellow-800' :
                                ticket.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                                ticket.status === 'resolved' ? 'bg-green-100 text-green-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {ticket.status === 'open' ? 'Offen' :
                                 ticket.status === 'in_progress' ? 'In Bearbeitung' :
                                 ticket.status === 'resolved' ? 'Gelöst' : 'Geschlossen'}
                              </span>
                              <span className={`text-xs px-2 py-1 rounded-full ${
                                ticket.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                                ticket.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                                ticket.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {ticket.priority}
                              </span>
                            </div>
                            <p className="text-sm text-gray-700 mt-2">{ticket.description}</p>
                            <p className="text-xs text-gray-500 mt-2">
                              von {ticket.user?.first_name} {ticket.user?.last_name} ({ticket.user?.email}) • {new Date(ticket.created_at).toLocaleString('de-DE')}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 ml-4">
                            {ticket.status === 'open' && (
                              <button
                                onClick={() => handleUpdateTicketStatus(ticket.id, 'in_progress')}
                                className="px-3 py-1.5 text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg"
                              >
                                In Bearbeitung
                              </button>
                            )}
                            {ticket.status === 'in_progress' && (
                              <button
                                onClick={() => handleUpdateTicketStatus(ticket.id, 'resolved')}
                                className="px-3 py-1.5 text-sm font-medium text-green-700 bg-green-50 hover:bg-green-100 rounded-lg"
                              >
                                Als gelöst markieren
                              </button>
                            )}
                            {ticket.status !== 'closed' && (
                              <button
                                onClick={() => handleUpdateTicketStatus(ticket.id, 'closed')}
                                className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-lg"
                              >
                                Schließen
                              </button>
                            )}
                            <button
                              onClick={() => setSelectedTicket(ticket)}
                              className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                              title="Details anzeigen"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Suspend User Sidepanel */}
      <AnimatePresence>
        {showSuspendModal && (
          <>
            <motion.div 
              className="fixed top-0 left-0 right-0 bottom-0 bg-black/50 backdrop-blur-sm z-[100]"
              style={{ margin: 0, padding: 0 }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              onClick={() => {
                setShowSuspendModal(false);
                setSuspensionReason('');
                setUserToSuspend(null);
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
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex-shrink-0">Benutzer sperren</h3>
            <div className="space-y-4 flex-1 overflow-y-auto">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Benutzer-ID oder E-Mail
                </label>
                <input
                  type="text"
                  value={userToSuspend || ''}
                  onChange={(e) => setUserToSuspend(e.target.value)}
                  placeholder="Benutzer-ID oder E-Mail eingeben"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sperrgrund *
                </label>
                  <textarea
                    value={suspensionReason}
                    onChange={(e) => setSuspensionReason(e.target.value)}
                    placeholder="Grund für die Sperrung..."
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
              </div>
            </div>
            <div className="flex items-center gap-3 pt-4 border-t border-gray-200 flex-shrink-0 mt-auto">
              <button
                  onClick={handleSuspendUser}
                  className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg"
                >
                  Sperren
                </button>
                <button
                  onClick={() => {
                    setShowSuspendModal(false);
                    setSuspensionReason('');
                    setUserToSuspend(null);
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

export default ContentModeration;
