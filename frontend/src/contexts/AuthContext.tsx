import React, { createContext, useContext, useState, useEffect} from 'react';
import type { ReactNode } from 'react';
import type { User, LoginCredentials, RegisterData } from '../types/auth';
import { authService } from '../services/authService';
import { logger } from '../lib/logger';

interface AuthContextType {
  user: User | null;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  isLoading: boolean;
  isAuthenticated: boolean;
  hasPermission: (permCodename: string) => boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  refetchUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUser = async () => {
    try {
      const userData = await authService.getMe();
      setUser({
        ...userData,
        // Check dynamic roles array, fallback to legacy role string if missing. 
        // Staff is any role other than 'student'.
        is_staff_role: userData.roles && userData.roles.length > 0 
          ? userData.roles.some(r => r !== 'student') 
          : userData.role !== 'student',
      });
    } catch (error: any) {
      if (error?.response?.status !== 401 && error?.response?.status !== 400) {
        logger.error('Failed to fetch user:', error);
      } else {
        logger.debug('No active session found');
      }
      setUser(null);
    }
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await authService.bootstrapCsrf();
        if (!cancelled) {
          await fetchUser();
        }
      } catch (error: any) {
        if (error?.response?.status !== 401 && error?.response?.status !== 400) {
          logger.error('Auth bootstrap failed:', error);
        }
        setUser(null);
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const hasPermission = (permCodename: string): boolean => {
    if (!user) return false;
    if (user.role === 'super_admin' || user.roles?.includes('super_admin')) return true;
    return user.permissions?.includes(permCodename) ?? false;
  };

  const login = async (credentials: LoginCredentials) => {
    await authService.login(credentials);
    await fetchUser();
  };

  const register = async (data: RegisterData) => {
    setUser(null);
    const response = await authService.register(data);
    if (response?.access) {
      await fetchUser();
    }
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
  };

  const refetchUser = async () => {
    await fetchUser();
  };

  const value: AuthContextType = {
    user,
    setUser,
    isLoading,
    isAuthenticated: !!user,
    hasPermission,
    login,
    register,
    logout,
    refetchUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
