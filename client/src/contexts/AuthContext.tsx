import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { User as LibUserType, FamilySimpleDto } from '@/lib/types';

export interface CurrentUser extends LibUserType {
  id: number;
  families: FamilySimpleDto[];
}

interface AuthContextType {
  token: string | null;
  user: CurrentUser | null;
  isLoadingUser: boolean;
  login: (newToken: string) => void;
  logout: () => void;
  isAuthenticated: boolean;
  refetchUserData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [isLoadingUser, setIsLoadingUser] = useState<boolean>(true);

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (storedToken) {
      setToken(storedToken);
    } else {
      setIsLoadingUser(false);
    }
  }, []);

  const fetchUser = async () => {
    if (token) {
      setIsLoadingUser(true);
      try {
        const response = await fetch('/api/users/current', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
        if (response.ok) {
          const userData = await response.json() as CurrentUser;
          setUser(userData);
        } else {
          console.error('Failed to fetch user data, status:', response.status);
          setUser(null);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        setUser(null);
      } finally {
        setIsLoadingUser(false);
      }
    } else {
      setUser(null);
      setIsLoadingUser(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, [token]);

  const login = (newToken: string) => {
    localStorage.setItem('token', newToken);
    setToken(newToken);
    setIsLoadingUser(false);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    setIsLoadingUser(false);
  };

  const isAuthenticated = !!token && !!user && !isLoadingUser;

  const refetchUserData = async () => {
    await fetchUser();
  };

  return (
    <AuthContext.Provider value={{ token, user, isLoadingUser, login, logout, isAuthenticated, refetchUserData }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 