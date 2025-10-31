import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../supabase/client';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  // Ref um den letzten erfolgreichen Admin-Status zu speichern
  const lastKnownAdminStatus = useRef<boolean>(false);

  useEffect(() => {
    let mounted = true;
    let authStateSubscription: ReturnType<typeof supabase.auth.onAuthStateChange> | null = null;
    let initialLoadCompleted = false;

    // Timeout-Fallback: Nach 3 Sekunden definitiv loading auf false setzen
    const timeoutId = setTimeout(() => {
      if (mounted && !initialLoadCompleted) {
        console.warn('Auth initialization timeout - setting loading to false');
        initialLoadCompleted = true;
        setLoading(false);
      }
    }, 3000);

    // Initial session check
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (!mounted) return;
        
        if (error) {
          console.error('Error getting session:', error);
          initialLoadCompleted = true;
          clearTimeout(timeoutId);
          setLoading(false);
          return;
        }
        
        if (session?.user) {
          setUser(session.user);
          // Admin-Status prüfen, aber nicht auf loading warten
          checkAdminStatus(session.user.id).catch(err => {
            console.error('Error in checkAdminStatus:', err);
          });
        }
        
        initialLoadCompleted = true;
        clearTimeout(timeoutId);
        if (mounted) {
          setLoading(false);
        }
      } catch (error) {
        console.error('Error in getInitialSession:', error);
        initialLoadCompleted = true;
        clearTimeout(timeoutId);
        if (mounted) {
          setLoading(false);
        }
      }
    };

    // Erst Session prüfen, dann auf Auth-Änderungen hören
    getInitialSession().then(() => {
      if (!mounted) return;
      
      // Nach initialer Session-Prüfung auf Auth-Änderungen hören
      authStateSubscription = supabase.auth.onAuthStateChange(
        async (event, session) => {
          if (!mounted) return;
          
          // Überspringe INITIAL_SESSION Event, da wir das bereits verarbeitet haben
          if (initialLoadCompleted && event === 'INITIAL_SESSION') {
            return;
          }
          
          try {
            // Behandle TOKEN_REFRESHED - Session erneuert, aber User bleibt eingeloggt
            if (event === 'TOKEN_REFRESHED') {
              if (session?.user) {
                console.log('Token refreshed successfully');
                // Session ist noch gültig, nichts ändern
              }
              return;
            }
            
            // Behandle SIGNED_OUT nur wenn User wirklich ausgeloggt wurde
            if (event === 'SIGNED_OUT') {
              console.log('User signed out');
              setUser(null);
              lastKnownAdminStatus.current = false;
              setIsAdmin(false);
              return;
            }
            
            // Bei allen anderen Events (SIGNED_IN, USER_UPDATED, etc.) Session aktualisieren
            if (session?.user) {
              setUser(session.user);
              await checkAdminStatus(session.user.id);
            } else {
              // Session fehlt bei anderen Events (nicht SIGNED_OUT)
              // könnte temporär sein während Token-Refresh
              console.log('No session found for event:', event);
            }
          } catch (error) {
            console.error('Error in auth state change:', error);
          }
        }
      );
    });

    return () => {
      mounted = false;
      clearTimeout(timeoutId);
      if (authStateSubscription) {
        authStateSubscription.data.subscription.unsubscribe();
      }
    };
  }, []);

  const checkAdminStatus = async (userId: string, retryCount: number = 0): Promise<void> => {
    const maxRetries = 2;
    const timeoutMs = 15000; // 15 Sekunden Timeout (länger für langsame Verbindungen)
    
    // Verwende den letzten bekannten Status (aus Ref) als Fallback
    const previousAdminStatus = lastKnownAdminStatus.current || isAdmin;
    
    try {
      // Timeout-Promise, das null zurückgibt wenn Timeout erreicht
      const timeoutPromise = new Promise<{ data: null; error: { code: 'TIMEOUT' } }>((resolve) => {
        setTimeout(() => resolve({ data: null, error: { code: 'TIMEOUT' } }), timeoutMs);
      });

      // Query-Promise
      const queryPromise = supabase
        .from('users')
        .select('is_admin, admin_role')
        .eq('id', userId)
        .single();

      // Race zwischen Query und Timeout
      const result = await Promise.race([queryPromise, timeoutPromise]) as { data: any; error: any };

      // Prüfe ob Timeout erreicht wurde
      if (result.error?.code === 'TIMEOUT') {
        if (retryCount < maxRetries) {
          console.warn(`Admin status check timeout (attempt ${retryCount + 1}/${maxRetries + 1}), retrying...`);
          // Exponential backoff: 2s, 4s
          await new Promise(resolve => setTimeout(resolve, 2000 * Math.pow(2, retryCount)));
          return checkAdminStatus(userId, retryCount + 1);
        }
        
        // Nach allen Retries: Letzten bekannten Status wiederherstellen
        console.warn('Admin status check timeout after all retries - restoring last known status');
        if (previousAdminStatus !== isAdmin) {
          setIsAdmin(previousAdminStatus);
        }
        return;
      }

      const { data, error } = result;

      if (error) {
        console.error('Error checking admin status:', error);
        
        // Nur bei Tabellen-Fehlern Demo-Status setzen
        if (error.code === 'PGRST116' || error.code === '42P01') {
          console.log('Users table not found, setting admin status to true for demo');
          lastKnownAdminStatus.current = true;
          setIsAdmin(true);
          return;
        }
        
        // Bei anderen Fehlern: Nur beim ersten Check und wenn noch kein Status gesetzt wurde
        // Wenn bereits ein Admin-Status existiert (user war eingeloggt), behalte ihn
        if (retryCount === 0 && !previousAdminStatus) {
          console.log('User not found or other error, setting admin status to false');
          lastKnownAdminStatus.current = false;
          setIsAdmin(false);
        } else if (previousAdminStatus) {
          // Wenn user bereits Admin-Status hatte, behalte ihn bei temporären Fehlern
          console.warn('Admin check error but maintaining previous admin status');
          if (previousAdminStatus !== isAdmin) {
            setIsAdmin(previousAdminStatus);
          }
        }
        return;
      }

      // Erfolgreich: Admin-Status aus Datenbank setzen
      if (data) {
        const adminStatus = data.is_admin || false;
        console.log('Admin status from database:', adminStatus);
        lastKnownAdminStatus.current = adminStatus; // Speichere erfolgreichen Status
        setIsAdmin(adminStatus);
      } else {
        // Wenn kein Datensatz gefunden wird, nur beim ersten Check auf false setzen
        if (retryCount === 0 && !previousAdminStatus) {
          console.log('No user record found, setting admin status to false');
          lastKnownAdminStatus.current = false;
          setIsAdmin(false);
        } else if (previousAdminStatus) {
          console.warn('No user record found but maintaining previous admin status');
          if (previousAdminStatus !== isAdmin) {
            setIsAdmin(previousAdminStatus);
          }
        }
      }
    } catch (error: any) {
      console.error('Error checking admin status:', error);
      
      // Bei Fehlern nach allen Retries: Letzten bekannten Status wiederherstellen
      if (retryCount >= maxRetries) {
        console.warn('Admin status check failed after all retries - restoring last known status');
        if (previousAdminStatus !== isAdmin) {
          setIsAdmin(previousAdminStatus);
        }
        return;
      }
      
      // Retry bei Catch-Fehlern
      if (retryCount < maxRetries) {
        console.warn(`Admin status check error (attempt ${retryCount + 1}/${maxRetries + 1}), retrying...`);
        await new Promise(resolve => setTimeout(resolve, 2000 * Math.pow(2, retryCount)));
        return checkAdminStatus(userId, retryCount + 1);
      }
      
      // Nur beim ersten Versuch und wenn noch kein Status existiert auf false setzen
      if (retryCount === 0 && !previousAdminStatus) {
        console.log('Setting admin status to false due to error');
        lastKnownAdminStatus.current = false;
        setIsAdmin(false);
      } else if (previousAdminStatus) {
        console.warn('Error in admin check but maintaining previous admin status');
        if (previousAdminStatus !== isAdmin) {
          setIsAdmin(previousAdminStatus);
        }
      }
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      lastKnownAdminStatus.current = false;
      setIsAdmin(false);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const value = {
    user,
    loading,
    isAdmin,
    signOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

