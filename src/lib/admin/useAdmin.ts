import { useState, useEffect } from 'react';
import { AdminService, AdminUser } from './adminService';

export interface UseAdminReturn {
  adminUser: AdminUser | null;
  loading: boolean;
  error: string | null;
  refreshUser: () => Promise<void>;
}

export const useAdmin = (): UseAdminReturn => {
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshUser = async () => {
    try {
      setLoading(true);
      setError(null);
      const user = await AdminService.getAdminUser();
      setAdminUser(user);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ein Fehler ist aufgetreten');
      setAdminUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  return {
    adminUser,
    loading,
    error,
    refreshUser
  };
};



