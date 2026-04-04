import { supabase } from '../supabase/client';
import { supabaseAdmin } from '../supabase/admin';

export interface DashboardStats {
  total_users: number;
  total_owners: number;
  total_caretakers: number;
  active_subscriptions: number;
  total_conversations: number;
  total_messages: number;
  total_revenue: number;
  users_last_30_days: number;
}

export interface AdminUser {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  created_at: string;
}

export interface AdminMarketplaceListing {
  id: string;
  user_id: string;
  title: string;
  status: string;
  created_at: string;
  listing_type: string;
  price_type: string;
  price: number | null;
  admin_deactivation_reason: string | null;
  users: { email: string | null; first_name: string | null; last_name: string | null } | null;
}

export interface AdminOwnerJobRow {
  id: string;
  owner_id: string;
  title: string;
  description: string;
  status: string;
  location_text: string | null;
  created_at: string;
  users: { email: string | null; first_name: string | null; last_name: string | null } | null;
}

export class AdminService {
  // Dashboard Statistiken abrufen
  static async getDashboardStats(): Promise<DashboardStats> {
    try {
      console.log('Fetching dashboard stats...');

      // Verwende normale Supabase-Queries (funktionieren auch ohne Service Role)
      const [
        { count: totalUsers, error: usersError },
        { count: totalOwners, error: ownersError },
        { count: totalCaretakers, error: caretakersError },
        { count: serviceProviders, error: serviceError },
        { count: activeSubscriptions, error: subscriptionsError },
        { count: totalConversations, error: conversationsError },
        { count: totalMessages, error: messagesError },
        { count: usersLast30Days, error: users30Error }
      ] = await Promise.allSettled([
        supabase.from('users').select('*', { count: 'exact', head: true }),
        supabase.from('users').select('*', { count: 'exact', head: true }).eq('user_type', 'owner'),
        supabase.from('users').select('*', { count: 'exact', head: true }).eq('user_type', 'caretaker'),
        supabase.from('users').select('*', { count: 'exact', head: true }).in('user_type', ['tierfotograf', 'hundetrainer', 'tierarzt', 'tierfriseur', 'physiotherapeut', 'ernaehrungsberater', 'sonstige']),
        supabase.from('users').select('*', { count: 'exact', head: true }).in('subscription_status', ['active', 'premium']),
        supabase.from('conversations').select('*', { count: 'exact', head: true }),
        supabase.from('messages').select('*', { count: 'exact', head: true }),
        supabase.from('users').select('*', { count: 'exact', head: true }).gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
      ]).then(results => results.map(result =>
        result.status === 'fulfilled' ? result.value : { count: 0, error: result.reason }
      ));

      // Debug alle Ergebnisse
      console.log('Dashboard Query Results:', {
        totalUsers, usersError,
        totalOwners, ownersError,
        totalCaretakers, caretakersError,
        serviceProviders, serviceError,
        activeSubscriptions, subscriptionsError,
        totalConversations, conversationsError,
        totalMessages, messagesError,
        usersLast30Days, users30Error
      });

      // Fehler loggen aber nicht stoppen
      if (usersError) console.warn('Users query failed:', usersError);
      if (ownersError) console.warn('Owners query failed:', ownersError);
      if (caretakersError) console.warn('Caretakers query failed:', caretakersError);
      if (serviceError) console.warn('Service providers query failed:', serviceError);
      if (subscriptionsError) console.warn('Subscriptions query failed:', subscriptionsError);
      if (conversationsError) console.warn('Conversations query failed:', conversationsError);
      if (messagesError) console.warn('Messages query failed:', messagesError);
      if (users30Error) console.warn('Users 30 days query failed:', users30Error);

      const stats = {
        total_users: totalUsers || 0,
        total_owners: totalOwners || 0,
        total_caretakers: (totalCaretakers || 0) + (serviceProviders || 0),
        active_subscriptions: activeSubscriptions || 0,
        total_conversations: totalConversations || 0,
        total_messages: totalMessages || 0,
        total_revenue: 0,
        users_last_30_days: usersLast30Days || 0
      };

      console.log('Dashboard Stats loaded successfully:', stats);
      return stats;
    } catch (error) {
      console.error('Critical error fetching dashboard stats:', error);
      // Fallback zu leeren Daten statt Fehler werfen
      return {
        total_users: 0,
        total_owners: 0,
        total_caretakers: 0,
        active_subscriptions: 0,
        total_conversations: 0,
        total_messages: 0,
        total_revenue: 0,
        users_last_30_days: 0
      };
    }
  }

  // Admin-Benutzer abrufen
  static async getAdminUser(): Promise<AdminUser | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) return null;

      // Benutzerdaten aus der Datenbank abrufen
      const { data: userData, error } = await supabase
        .from('users')
        .select('id, email, first_name, last_name, admin_role, created_at')
        .eq('id', user.id)
        .eq('is_admin', true)
        .single();

      if (error || !userData) {
        console.error('Admin user not found:', error);
        return null;
      }

      return {
        id: userData.id,
        email: userData.email || '',
        first_name: userData.first_name || '',
        last_name: userData.last_name || '',
        role: userData.admin_role || 'admin',
        created_at: userData.created_at
      };
    } catch (error) {
      console.error('Error fetching admin user:', error);
      return null;
    }
  }

  // Benutzer abrufen
  static async getUsers(page: number = 1, limit: number = 10) {
    try {
      const offset = (page - 1) * limit;

      // Verwende Admin-Client (mit Service Role Key wenn verfügbar, um RLS zu umgehen)
      // Der Admin-Client ist immer verfügbar (auch ohne Service Role Key)
      const client = supabaseAdmin;

      console.log('Fetching users - using admin client:', !!supabaseAdmin);

      const { data: users, error, count } = await client
        .from('users')
        .select(`
          id,
          email,
          first_name,
          last_name,
          user_type,
          created_at,
          updated_at,
          is_suspended,
          verification_status,
          subscription_status,
          profile_completed,
          is_admin,
          admin_role,
          city,
          plz,
          street,
          phone_number,
          profile_photo_url,
          show_ads,
          premium_badge,
          totp_secret,
          last_admin_login,
          plan_type,
          plan_expires_at,
          max_contact_requests,
          max_bookings,
          search_priority,
          stripe_customer_id,
          stripe_subscription_id,
          public_profile_visible,
          date_of_birth,
          gender,
          suspension_reason,
          suspended_at,
          suspended_by,
          owner_approval_status,
          owner_approval_notes,
          caretaker_profiles!caretaker_profiles_id_fkey(
            approval_status,
            approval_notes,
            short_about_me,
            long_about_me,
            services_with_categories
          )
        `, { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        console.error('Error fetching users from database:', error);
        console.error('Error details:', JSON.stringify(error, null, 2));
        throw error;
      }

      console.log(`Fetched ${users?.length || 0} users, total count: ${count}`);

      // Freigabe: Tierhalter aus users.owner_approval_*; Betreuer/Dienstleister aus caretaker_profiles
      const mappedUsers = (users || []).map((user: any) => {
        const caretakerProfile = Array.isArray(user.caretaker_profiles)
          ? user.caretaker_profiles[0]
          : user.caretaker_profiles || null;

        const isOwner = user.user_type === 'owner';
        const approval_status = isOwner
          ? (user.owner_approval_status || 'not_requested')
          : (caretakerProfile?.approval_status || 'not_requested');
        const approval_notes = isOwner
          ? (user.owner_approval_notes ?? null)
          : (caretakerProfile?.approval_notes || null);

        return {
          ...user,
          approval_status,
          approval_notes,
          short_about_me: caretakerProfile?.short_about_me || user.short_about_me || null,
          long_about_me: caretakerProfile?.long_about_me || user.long_about_me || null,
          services_with_categories: caretakerProfile?.services_with_categories || user.services_with_categories || null,
          caretaker_profiles: undefined // Entferne das verschachtelte Objekt
        };
      });

      return {
        data: mappedUsers,
        total: count || 0,
        page,
        limit
      };
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  }

  // Benutzer verifizieren
  static async verifyUser(userId: string): Promise<boolean> {
    try {
      const client = supabaseAdmin || supabase;

      const { error } = await client
        .from('users')
        .update({
          verification_status: 'approved',
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (error) {
        console.error('Error verifying user:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error verifying user:', error);
      return false;
    }
  }

  // Benutzer sperren/entsperren
  static async toggleUserStatus(userId: string, isActive: boolean): Promise<boolean> {
    try {
      const client = supabaseAdmin || supabase;

      const { error } = await client
        .from('users')
        .update({
          is_suspended: !isActive,
          suspended_at: !isActive ? new Date().toISOString() : null,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (error) {
        console.error('Error toggling user status:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error toggling user status:', error);
      return false;
    }
  }

  // Admin-Status umschalten
  static async toggleAdminStatus(userId: string, isAdmin: boolean): Promise<boolean> {
    try {
      const client = supabaseAdmin || supabase;

      const { error } = await client
        .from('users')
        .update({
          is_admin: isAdmin,
          admin_role: isAdmin ? 'admin' : null,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (error) {
        console.error('Error toggling admin status:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error toggling admin status:', error);
      return false;
    }
  }

  // User-Freigabe-Status setzen
  static async setUserApprovalStatus(
    userId: string,
    status: 'not_requested' | 'pending' | 'approved' | 'rejected',
    approvalNotes?: string | null
  ): Promise<boolean> {
    try {
      const client = supabaseAdmin || supabase;

      const { data: userRow, error: userFetchErr } = await client
        .from('users')
        .select('user_type')
        .eq('id', userId)
        .maybeSingle();

      if (userFetchErr || !userRow) {
        console.error('Error loading user for approval:', userFetchErr);
        return false;
      }

      // Tierhalter: Freigabe auf `users` (owner_approval_*)
      if (userRow.user_type === 'owner') {
        const ownerUpdate: Record<string, unknown> = {
          owner_approval_status: status,
          updated_at: new Date().toISOString()
        };
        if (status === 'rejected') {
          ownerUpdate.owner_approval_notes = approvalNotes !== undefined ? approvalNotes : null;
        } else if (approvalNotes !== undefined) {
          ownerUpdate.owner_approval_notes = approvalNotes;
        } else if (status === 'approved') {
          ownerUpdate.owner_approval_notes = null;
        }
        const { error: ownerErr } = await client
          .from('users')
          .update(ownerUpdate)
          .eq('id', userId);
        if (ownerErr) {
          console.error('Error setting owner approval status:', ownerErr);
          return false;
        }
        return true;
      }

      // Hole aktuellen Admin-User für approval_approved_by
      const { data: { user: adminUser } } = await supabase.auth.getUser();
      const updateData: any = {
        approval_status: status,
        updated_at: new Date().toISOString()
      };

      // Setze approval_notes - beim Ablehnen immer überschreiben, auch wenn leer/null
      if (status === 'rejected') {
        // Beim Ablehnen immer den neuen Grund setzen (oder null, wenn kein Grund angegeben)
        updateData.approval_notes = approvalNotes !== undefined ? approvalNotes : null;
      } else if (approvalNotes !== undefined) {
        // Bei anderen Status nur setzen, wenn explizit angegeben
        updateData.approval_notes = approvalNotes;
      }

      // Setze approval_approved_by und approval_approved_at nur wenn approved
      if (status === 'approved') {
        updateData.approval_approved_at = new Date().toISOString();
        if (adminUser?.id) {
          updateData.approval_approved_by = adminUser.id;
        }
      }

      // Aktualisiere caretaker_profiles Tabelle
      const { error } = await client
        .from('caretaker_profiles')
        .update(updateData)
        .eq('id', userId);

      if (error) {
        // Wenn kein Eintrag existiert, erstelle einen
        if (error.code === 'PGRST116' || error.message?.includes('not found')) {
          const insertData: any = {
            id: userId,
            approval_status: status,
            updated_at: new Date().toISOString()
          };

          // Beim Ablehnen immer approval_notes setzen
          if (status === 'rejected') {
            insertData.approval_notes = approvalNotes !== undefined ? approvalNotes : null;
          } else if (approvalNotes !== undefined) {
            insertData.approval_notes = approvalNotes;
          }

          // Bei Freigabe approval_approved_by und approval_approved_at setzen
          if (status === 'approved' && adminUser?.id) {
            insertData.approval_approved_at = new Date().toISOString();
            insertData.approval_approved_by = adminUser.id;
          }

          const { error: insertError } = await client
            .from('caretaker_profiles')
            .insert(insertData);

          if (insertError) {
            console.error('Error creating caretaker profile:', insertError);
            return false;
          }
          return true;
        }

        console.error('Error setting user approval status:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error setting user approval status:', error);
      return false;
    }
  }

  // User freigeben
  static async approveUser(userId: string): Promise<boolean> {
    return this.setUserApprovalStatus(userId, 'approved');
  }

  // User ablehnen
  static async rejectUser(userId: string, rejectionReason?: string): Promise<boolean> {
    return this.setUserApprovalStatus(userId, 'rejected', rejectionReason || null);
  }

  // Benutzer unwiderruflich löschen
  static async deleteUser(userId: string): Promise<boolean> {
    try {
      const client = supabaseAdmin;

      if (!client) {
        console.error('Admin client not available');
        return false;
      }

      // 1. Optional: Zuerst den Nutzer aus der öffentlichen users Tabelle löschen
      // Dies löst ggf. ON DELETE CASCADE auf zugehörigen Tabellen aus,
      // bevor der User aus auth.users entfernt wird.
      const { error: dbError } = await client
        .from('users')
        .delete()
        .eq('id', userId);

      if (dbError) {
        console.warn('Fehler beim Löschen des Datensatzes in public.users:', dbError);
        // Wir setzen trotzdem fort, da auth.admin.deleteUser das wichtigste ist
      }

      // 2. Nutzer komplett aus dem System (auth.users) löschen
      const { data, error: authError } = await client.auth.admin.deleteUser(userId);

      if (authError) {
        console.error('Fehler beim Löschen des Benutzers via Admin API:', authError);
        return false;
      }

      console.log('Benutzer erfolgreich endgültig gelöscht:', userId, data);
      return true;
    } catch (error) {
      console.error('Unerwarteter Fehler beim Löschen des Benutzers:', error);
      return false;
    }
  }

  // Benutzer abrufen, die freigegeben werden müssen
  static async getPendingApprovalUsers(limit: number = 10) {
    try {
      const client = supabaseAdmin;

      const { data: ownerRows, error: ownerErr } = await client
        .from('users')
        .select(`
          id,
          email,
          first_name,
          last_name,
          user_type,
          created_at,
          city,
          plz,
          profile_photo_url,
          owner_approval_status,
          owner_approval_notes
        `)
        .eq('user_type', 'owner')
        .eq('owner_approval_status', 'pending')
        .order('created_at', { ascending: false })
        .limit(Math.max(limit, 50));

      if (ownerErr) {
        console.error('Error fetching owner pending approvals:', ownerErr);
      }

      const pendingOwners = (ownerRows || []).map((user: any) => ({
        ...user,
        approval_status: user.owner_approval_status,
        approval_notes: user.owner_approval_notes || null,
        short_about_me: null,
        long_about_me: null,
        services_with_categories: null
      }));

      const { data: users, error } = await client
        .from('users')
        .select(`
          id,
          email,
          first_name,
          last_name,
          user_type,
          created_at,
          city,
          plz,
          profile_photo_url,
          caretaker_profiles!caretaker_profiles_id_fkey(
            approval_status,
            approval_notes,
            short_about_me,
            long_about_me,
            services_with_categories
          )
        `)
        .in('user_type', ['caretaker', 'dienstleister', 'tierarzt', 'hundetrainer', 'tierfriseur', 'physiotherapeut', 'ernaehrungsberater', 'tierfotograf', 'sonstige'])
        .order('created_at', { ascending: false })
        .limit(Math.max(limit, 100));

      if (error) {
        console.error('Error fetching pending approval users:', error);
        throw error;
      }

      // Filtere und mappe die Daten
      const pendingCaretakers = (users || [])
        .map((user: any) => {
          const caretakerProfile = Array.isArray(user.caretaker_profiles)
            ? user.caretaker_profiles[0]
            : user.caretaker_profiles || null;

          const approvalStatus = caretakerProfile?.approval_status || 'not_requested';

          return {
            ...user,
            approval_status: approvalStatus,
            approval_notes: caretakerProfile?.approval_notes || null,
            short_about_me: caretakerProfile?.short_about_me || null,
            long_about_me: caretakerProfile?.long_about_me || null,
            services_with_categories: caretakerProfile?.services_with_categories || null,
            caretaker_profiles: undefined
          };
        })
        .filter((user: any) => user.approval_status === 'pending');

      const merged = [...pendingOwners, ...pendingCaretakers].sort(
        (a: any, b: any) =>
          new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
      );

      return merged.slice(0, limit);
    } catch (error) {
      console.error('Error fetching pending approval users:', error);
      throw error;
    }
  }

  // Content moderieren
  static async moderateContent(contentId: string, action: 'approve' | 'reject' | 'flag'): Promise<boolean> {
    try {
      // Hier würdest du die Content-Moderation in der Datenbank aktualisieren
      console.log(`Moderating content ${contentId} with action: ${action}`);
      return true;
    } catch (error) {
      console.error('Error moderating content:', error);
      return false;
    }
  }

  // Analytics-Daten abrufen
  static async getAnalytics(timeframe: '7d' | '30d' | '90d' = '30d') {
    try {
      const days = timeframe === '7d' ? 7 : timeframe === '30d' ? 30 : 90;
      const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

      // Benutzer-Wachstum abrufen
      const client = supabaseAdmin || supabase;

      const { data: userGrowth } = await client
        .from('users')
        .select('created_at')
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: true });

      // Nachrichten-Aktivität abrufen
      const { data: messageActivity } = await client
        .from('messages')
        .select('created_at')
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: true });

      // Benutzer-Wachstum pro Tag gruppieren
      const userGrowthByDay = userGrowth?.reduce((acc: any, user: any) => {
        const date = user.created_at.split('T')[0];
        acc[date] = (acc[date] || 0) + 1;
        return acc;
      }, {}) || {};

      // Nachrichten-Aktivität pro Tag gruppieren
      const messageActivityByDay = messageActivity?.reduce((acc: any, message: any) => {
        const date = message.created_at.split('T')[0];
        acc[date] = (acc[date] || 0) + 1;
        return acc;
      }, {}) || {};

      // Daten für die letzten Tage generieren
      const userGrowthData = [];
      const messageActivityData = [];

      for (let i = days - 1; i >= 0; i--) {
        const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        userGrowthData.push({
          date,
          users: userGrowthByDay[date] || 0
        });
        messageActivityData.push({
          date,
          messages: messageActivityByDay[date] || 0
        });
      }

      return {
        timeframe,
        userGrowth: userGrowthData,
        messageActivity: messageActivityData,
        topFeatures: [
          { name: 'Nachrichten', usage: 85 },
          { name: 'Profil', usage: 72 },
          { name: 'Suche', usage: 68 },
          { name: 'Einstellungen', usage: 45 }
        ]
      };
    } catch (error) {
      console.error('Error fetching analytics:', error);
      throw error;
    }
  }

  // Werbungen abrufen (mit Format-Informationen)
  static async getAdvertisements(page: number = 1, limit: number = 20) {
    try {
      const client = supabaseAdmin || supabase;
      const offset = (page - 1) * limit;

      // Verwende die View advertisements_with_formats für Format-Informationen
      const { data: advertisements, error, count } = await client
        .from('advertisements_with_formats')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        console.error('Error fetching advertisements:', error);
        throw error;
      }

      return {
        data: advertisements || [],
        total: count || 0,
        page,
        limit
      };
    } catch (error) {
      console.error('Error fetching advertisements:', error);
      throw error;
    }
  }

  // Verfügbare Werbeformate abrufen
  static async getAdvertisementFormats() {
    try {
      const client = supabaseAdmin || supabase;

      const { data: formats, error } = await client
        .from('advertisement_formats')
        .select('*')
        .eq('is_active', true)
        .order('name', { ascending: true });

      if (error) {
        console.error('Error fetching advertisement formats:', error);
        throw error;
      }

      return formats || [];
    } catch (error) {
      console.error('Error fetching advertisement formats:', error);
      throw error;
    }
  }

  // Werbung erstellen
  static async createAdvertisement(advertisementData: any) {
    try {
      const client = supabaseAdmin || supabase;

      // Aktuellen Benutzer abrufen
      const { data: { user } } = await supabase.auth.getUser();

      // Wenn format_id gesetzt ist, ad_type immer aus dem Format holen (für Konsistenz)
      let finalAdType = advertisementData.ad_type;
      if (advertisementData.format_id) {
        const { data: format } = await client
          .from('advertisement_formats')
          .select('ad_type')
          .eq('id', advertisementData.format_id)
          .single();

        if (format) {
          finalAdType = format.ad_type;
        }
      }

      const { data, error } = await client
        .from('advertisements')
        .insert({
          ...advertisementData,
          ad_type: finalAdType,
          created_by: user?.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating advertisement:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error creating advertisement:', error);
      throw error;
    }
  }

  // Werbung aktualisieren
  static async updateAdvertisement(id: string, advertisementData: any) {
    try {
      const client = supabaseAdmin || supabase;

      // Wenn format_id gesetzt ist, ad_type immer aus dem Format holen (für Konsistenz)
      let finalAdType = advertisementData.ad_type;
      if (advertisementData.format_id) {
        const { data: format } = await client
          .from('advertisement_formats')
          .select('ad_type')
          .eq('id', advertisementData.format_id)
          .single();

        if (format) {
          finalAdType = format.ad_type;
        }
      }

      const { data, error } = await client
        .from('advertisements')
        .update({
          ...advertisementData,
          ad_type: finalAdType,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating advertisement:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error updating advertisement:', error);
      throw error;
    }
  }

  // Werbung löschen
  static async deleteAdvertisement(id: string) {
    try {
      const client = supabaseAdmin || supabase;

      const { error } = await client
        .from('advertisements')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting advertisement:', error);
        throw error;
      }

      return true;
    } catch (error) {
      console.error('Error deleting advertisement:', error);
      throw error;
    }
  }

  // Werbung duplizieren
  static async duplicateAdvertisement(id: string) {
    try {
      const client = supabaseAdmin || supabase;

      // Original-Werbung abrufen
      const { data: original, error: fetchError } = await client
        .from('advertisements')
        .select('*')
        .eq('id', id)
        .single();

      if (fetchError || !original) {
        console.error('Error fetching advertisement for duplication:', fetchError);
        throw fetchError || new Error('Advertisement not found');
      }

      // Aktuellen Benutzer abrufen
      const { data: { user } } = await supabase.auth.getUser();

      // Neue Werbung erstellen ohne ID und mit aktualisiertem Titel
      const { id: originalId, created_at, updated_at, ...adData } = original;
      const duplicatedData = {
        ...adData,
        title: `${adData.title || 'Neue Werbung'} (Kopie)`,
        created_by: user?.id,
        is_active: false, // Duplizierte Werbung ist immer inaktiv
        current_impressions: 0,
        current_clicks: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data: newAdvertisement, error: createError } = await client
        .from('advertisements')
        .insert(duplicatedData)
        .select()
        .single();

      if (createError) {
        console.error('Error duplicating advertisement:', createError);
        throw createError;
      }

      return newAdvertisement;
    } catch (error) {
      console.error('Error duplicating advertisement:', error);
      throw error;
    }
  }

  // Werbung nach ID abrufen
  static async getAdvertisementById(id: string) {
    try {
      const client = supabaseAdmin || supabase;

      const { data, error } = await client
        .from('advertisements')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching advertisement:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error fetching advertisement:', error);
      throw error;
    }
  }

  // Bild in Supabase Storage hochladen
  static async uploadAdvertisementImage(file: File): Promise<string> {
    try {
      const client = supabaseAdmin || supabase;

      // Eindeutigen Dateinamen erstellen
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2, 9);
      const fileExt = file.name.split('.').pop();
      const fileName = `${timestamp}_${randomString}.${fileExt}`;
      const filePath = `ads/${fileName}`;

      // Datei hochladen
      const { error } = await client.storage
        .from('advertisement-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error('Error uploading image:', error);
        throw error;
      }

      // Public URL abrufen
      const { data: urlData } = client.storage
        .from('advertisement-images')
        .getPublicUrl(filePath);

      if (!urlData?.publicUrl) {
        throw new Error('Could not get public URL for uploaded image');
      }

      return urlData.publicUrl;
    } catch (error) {
      console.error('Error uploading advertisement image:', error);
      throw error;
    }
  }

  // Bild für Blog/Content hochladen
  static async uploadContentImage(file: File): Promise<string> {
    try {
      const client = supabaseAdmin || supabase;

      // Eindeutigen Dateinamen erstellen
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2, 9);
      const fileExt = file.name.split('.').pop();
      const fileName = `${timestamp}_${randomString}.${fileExt}`;
      const filePath = `blog/${fileName}`;

      // Datei hochladen - Nutze content-images bucket
      const { error } = await client.storage
        .from('content-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.warn('Error uploading to content-images, trying advertisement-images as fallback:', error);

        // Fallback zu advertisement-images falls content-images nicht existiert
        const { error: fallbackError } = await client.storage
          .from('advertisement-images')
          .upload(`blog/${fileName}`, file, {
            cacheControl: '3600',
            upsert: false
          });

        if (fallbackError) {
          console.error('Fallback upload failed:', fallbackError);
          throw fallbackError;
        }

        const { data: fallbackUrlData } = client.storage
          .from('advertisement-images')
          .getPublicUrl(`blog/${fileName}`);

        return fallbackUrlData.publicUrl;
      }

      // Public URL abrufen
      const { data: urlData } = client.storage
        .from('content-images')
        .getPublicUrl(filePath);

      if (!urlData?.publicUrl) {
        throw new Error('Could not get public URL for uploaded content image');
      }

      return urlData.publicUrl;
    } catch (error) {
      console.error('Error uploading content image:', error);
      throw error;
    }
  }

  // ==== Hilfe-Center ====

  // Hilfe-Ressourcen abrufen
  static async getHelpResources(page: number = 1, limit: number = 20) {
    try {
      const client = supabaseAdmin || supabase;
      const offset = (page - 1) * limit;

      const { data: resources, error, count } = await client
        .from('help_resources')
        .select('*', { count: 'exact' })
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        console.error('Error fetching help resources:', error);
        throw error;
      }

      return {
        data: resources || [],
        total: count || 0,
        page,
        limit
      };
    } catch (error) {
      console.error('Error fetching help resources:', error);
      throw error;
    }
  }

  // Hilfe-Ressource nach ID abrufen
  static async getHelpResourceById(id: string) {
    try {
      const client = supabaseAdmin || supabase;

      const { data, error } = await client
        .from('help_resources')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching help resource:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error fetching help resource:', error);
      throw error;
    }
  }

  // Hilfe-Ressource erstellen
  static async createHelpResource(resourceData: any) {
    try {
      const client = supabaseAdmin || supabase;

      const { data, error } = await client
        .from('help_resources')
        .insert({
          ...resourceData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating help resource:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error creating help resource:', error);
      throw error;
    }
  }

  // Hilfe-Ressource aktualisieren
  static async updateHelpResource(id: string, resourceData: any) {
    try {
      const client = supabaseAdmin || supabase;

      const { data, error } = await client
        .from('help_resources')
        .update({
          ...resourceData,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating help resource:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error updating help resource:', error);
      throw error;
    }
  }

  // Hilfe-Ressource löschen
  static async deleteHelpResource(id: string) {
    try {
      const client = supabaseAdmin || supabase;

      const { error } = await client
        .from('help_resources')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting help resource:', error);
        throw error;
      }

      return true;
    } catch (error) {
      console.error('Error deleting help resource:', error);
      throw error;
    }
  }

  // ==== Blog / Content Management ====

  // Kategorie erstellen
  static async createContentCategory(name: string) {
    try {
      const client = supabaseAdmin || supabase;
      const slug = name
        .toLowerCase()
        .replace(/ä/g, 'ae')
        .replace(/ö/g, 'oe')
        .replace(/ü/g, 'ue')
        .replace(/ß/g, 'ss')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');

      const { data, error } = await client
        .from('content_categories')
        .insert({ name, slug })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating content category:', error);
      throw error;
    }
  }

  // Tag erstellen
  static async createContentTag(name: string) {
    try {
      const client = supabaseAdmin || supabase;
      const slug = name
        .toLowerCase()
        .replace(/ä/g, 'ae')
        .replace(/ö/g, 'oe')
        .replace(/ü/g, 'ue')
        .replace(/ß/g, 'ss')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');

      const { data, error } = await client
        .from('content_tags')
        .insert({ name, slug })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating content tag:', error);
      throw error;
    }
  }

  // Kategorie aktualisieren
  static async updateContentCategory(id: string, name: string) {
    try {
      const client = supabaseAdmin || supabase;
      const slug = name
        .toLowerCase()
        .replace(/ä/g, 'ae')
        .replace(/ö/g, 'oe')
        .replace(/ü/g, 'ue')
        .replace(/ß/g, 'ss')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');

      const { data, error } = await client
        .from('content_categories')
        .update({ name, slug })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating content category:', error);
      throw error;
    }
  }

  // Kategorie löschen
  static async deleteContentCategory(id: string) {
    try {
      const client = supabaseAdmin || supabase;
      const { error } = await client
        .from('content_categories')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting content category:', error);
      throw error;
    }
  }

  // Tag aktualisieren
  static async updateContentTag(id: string, name: string) {
    try {
      const client = supabaseAdmin || supabase;
      const slug = name
        .toLowerCase()
        .replace(/ä/g, 'ae')
        .replace(/ö/g, 'oe')
        .replace(/ü/g, 'ue')
        .replace(/ß/g, 'ss')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');

      const { data, error } = await client
        .from('content_tags')
        .update({ name, slug })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating content tag:', error);
      throw error;
    }
  }

  // Tag löschen
  static async deleteContentTag(id: string) {
    try {
      const client = supabaseAdmin || supabase;
      const { error } = await client
        .from('content_tags')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting content tag:', error);
      throw error;
    }
  }

  /** Marktplatz-Anzeigen (Service Role / Admin-Client, umgeht RLS) */
  static async getMarketplaceListingsForAdmin(limit = 200): Promise<AdminMarketplaceListing[]> {
    const client = supabaseAdmin || supabase;
    const { data, error } = await client
      .from('marketplace_listings')
      .select(
        `
        id,
        user_id,
        title,
        status,
        created_at,
        listing_type,
        price_type,
        price,
        admin_deactivation_reason,
        users!marketplace_listings_user_id_fkey ( email, first_name, last_name )
      `
      )
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('getMarketplaceListingsForAdmin:', error);
      throw error;
    }
    const raw = (data || []) as Array<
      Omit<AdminMarketplaceListing, 'users'> & {
        users:
          | AdminMarketplaceListing['users']
          | AdminMarketplaceListing['users'][]
          | null;
      }
    >;
    return raw.map((row) => {
      const u = row.users;
      const users =
        u == null
          ? null
          : Array.isArray(u)
            ? (u[0] ?? null)
            : u;
      return { ...row, users } as AdminMarketplaceListing;
    });
  }

  /** Deaktivieren: Status inactive + Hinweis für Inhaber (RPC, Admin-Session) */
  static async adminDeactivateMarketplaceListing(listingId: string, reason: string): Promise<void> {
    const { error } = await supabase.rpc('admin_deactivate_marketplace_listing', {
      p_listing_id: listingId,
      p_reason: reason.trim(),
    });
    if (error) throw error;
  }

  /** Endgültig löschen + Hinweis für Inhaber (RPC, Admin-Session) */
  static async adminDeleteMarketplaceListing(listingId: string, reason: string): Promise<void> {
    const { error } = await supabase.rpc('admin_delete_marketplace_listing', {
      p_listing_id: listingId,
      p_reason: reason.trim(),
    });
    if (error) throw error;
  }

  /** Tierhalter-Gesuche (owner_jobs), Service Role / Admin-Client */
  static async getOwnerJobsForAdmin(limit = 200): Promise<AdminOwnerJobRow[]> {
    const client = supabaseAdmin || supabase;
    const { data, error } = await client
      .from('owner_jobs')
      .select(
        `
        id,
        owner_id,
        title,
        description,
        status,
        location_text,
        created_at,
        users!owner_jobs_owner_id_fkey ( email, first_name, last_name )
      `
      )
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('getOwnerJobsForAdmin:', error);
      throw error;
    }
    const raw = (data || []) as Array<
      Omit<AdminOwnerJobRow, 'users'> & {
        users: AdminOwnerJobRow['users'] | AdminOwnerJobRow['users'][] | null;
      }
    >;
    return raw.map((row) => {
      const u = row.users;
      const users = u == null ? null : Array.isArray(u) ? (u[0] ?? null) : u;
      return { ...row, users } as AdminOwnerJobRow;
    });
  }

  /** Gesuch löschen + Hinweis für Tierhalter (RPC, Admin-Session) */
  static async adminDeleteOwnerJob(jobId: string, reason: string): Promise<void> {
    const { error } = await supabase.rpc('admin_delete_owner_job', {
      p_job_id: jobId,
      p_reason: reason.trim(),
    });
    if (error) throw error;
  }
}
