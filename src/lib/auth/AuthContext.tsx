import React, { createContext, useContext, useEffect, useState } from 'react';
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

  useEffect(() => {
    let mounted = true;
    let authStateSubscription: { unsubscribe: () => void } | null = null;
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
              setIsAdmin(false);
              return;
            }
            
            // Bei allen anderen Events (SIGNED_IN, USER_UPDATED, etc.) Session aktualisieren
            if (session?.user) {
              setUser(session.user);
              await checkAdminStatus(session.user.id);
            } else if (event !== 'SIGNED_OUT') {
              // Nur bei explizitem SIGNED_OUT ausloggen, nicht bei fehlender Session
              // (könnte temporär sein während Token-Refresh)
              console.log('No session found, but event is not SIGNED_OUT:', event);
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
        authStateSubscription.unsubscribe();
      }
    };
  }, []);

  const checkAdminStatus = async (userId: string) => {
    try {
      // Timeout für die Admin-Status-Prüfung (3 Sekunden)
      const timeoutPromise = new Promise<null>((resolve) => {
        setTimeout(() => resolve(null), 3000);
      });

      const queryPromise = supabase
        .from('users')
        .select('is_admin, admin_role')
        .eq('id', userId)
        .single();

      const result = await Promise.race([queryPromise, timeoutPromise]);

      if (result === null) {
        // Timeout erreicht
        console.warn('Admin status check timeout - setting to false');
        setIsAdmin(false);
        return;
      }

      const { data, error } = result as { data: any; error: any };

      if (error) {
        console.error('Error checking admin status:', error);
        // Nur bei Tabellen-Fehlern Demo-Status setzen
        if (error.code === 'PGRST116' || error.code === '42P01') {
          console.log('Users table not found, setting admin status to true for demo');
          setIsAdmin(true);
          return;
        }
        // Bei anderen Fehlern (z.B. Benutzer nicht gefunden) Admin-Status auf false setzen
        console.log('User not found or other error, setting admin status to false');
        setIsAdmin(false);
        return;
      }

      // Wenn Benutzer in der Tabelle gefunden wird, prüfe is_admin
      if (data) {
        console.log('Admin status from database:', data.is_admin);
        setIsAdmin(data.is_admin || false);
      } else {
        // Wenn kein Datensatz gefunden wird, setze Admin-Status auf false
        console.log('No user record found, setting admin status to false');
        setIsAdmin(false);
      }
    } catch (error) {
      console.error('Error checking admin status:', error);
      // Bei Fehlern Admin-Status auf false setzen
      console.log('Setting admin status to false due to error');
      setIsAdmin(false);
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
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

