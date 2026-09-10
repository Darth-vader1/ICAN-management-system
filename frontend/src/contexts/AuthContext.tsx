import React, { createContext, useContext, useState, useEffect} from 'react';
import type { ReactNode } from 'react';
import type { User, LoginCredentials, RegisterData } from '../types/auth';
import { authService } from '../services/authService';

interface AuthContextType {
  user: User | null;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  isLoading: boolean;
  isAuthenticated: boolean;
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
    const token = localStorage.getItem('access_token');
    if (!token) {
      setIsLoading(false);
      return;
    }

    try {
      const userData = await authService.getMe();
      const staffRoles: User['role'][] = ['super_admin', 'manager', 'finance', 'student_officer', 'it_admin'];
      setUser({
        ...userData,
        is_staff_role: staffRoles.includes(userData.role),
      });
    } catch (error) {
      console.error('Failed to fetch user:', error);
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  const login = async (credentials: LoginCredentials) => {
    const response = await authService.login(credentials);
    localStorage.setItem('access_token', response.access);
    localStorage.setItem('refresh_token', response.refresh);
    await fetchUser();
  };

  const register = async (data: RegisterData) => {
    await authService.register(data);
    // After registration, user needs to login
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
