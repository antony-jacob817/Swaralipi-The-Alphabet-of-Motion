// src/contexts/AuthContext.tsx
import { createContext, useState, useEffect, ReactNode } from 'react';

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

export interface AuthContextType {
  user: User | null;
  login: (email: string, password: string, role?: string) => Promise<void>;
  register: (userData: {
    name: string;
    email: string;
    password: string;
    role: string;
    linkedStudentEmail?: string;
  }) => Promise<void>;
  logout: () => void;
  updateProfile: (profile: { name: string }) => Promise<void>;
  refreshUser: () => Promise<void>;
  loading: boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_BASE_URL = 'http://localhost:5000/api';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);

  // Check for saved user on app start
  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (error) {
        console.error('Error parsing saved user:', error);
        localStorage.removeItem('user');
      }
    }
  }, []);

  const login = async (email: string, password: string, role?: string) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, role }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      if (!data.user) {
        throw new Error('No user data received from server');
      }

      localStorage.setItem('user', JSON.stringify(data.user));
      setUser(data.user);
    } catch (error) {
      console.error('Login error:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData: {
    name: string;
    email: string;
    password: string;
    role: string;
    linkedStudentEmail?: string;
  }) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      const data = await response.json();
      console.log('Registration response:', data);

      if (!response.ok) {
        throw new Error(data.message || `Registration failed (${response.status})`);
      }

      if (!data.user) {
        throw new Error('No user data received from server');
      }

      localStorage.setItem('user', JSON.stringify(data.user));
      setUser(data.user);
    } catch (error) {
      console.error('Registration error:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('user');
    setUser(null);
  };

  const updateProfile = async (profile: { name: string }) => {
    if (!user) throw new Error('No user logged in');

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/update-profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: user.id, name: profile.name }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Update profile failed');
      }

      if (!data.user) {
        throw new Error('No user data received from server');
      }

      localStorage.setItem('user', JSON.stringify(data.user));
      setUser(data.user);
    } catch (error) {
      console.error('Update profile error:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Update profile failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const refreshUser = async () => {
    if (!user) return;

    try {
      const response = await fetch(`${API_BASE_URL}/user/${user.id}`);
      
      if (!response.ok) {
        throw new Error('Failed to refresh user data');
      }

      const userData = await response.json();
      
      // Update both local storage and state
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
    } catch (error) {
      console.error('Failed to refresh user data:', error);
      // Don't throw error here as it's not critical for the app to function
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      login, 
      register, 
      logout, 
      updateProfile, 
      refreshUser,
      loading 
    }}>
      {children}
    </AuthContext.Provider>
  );
}