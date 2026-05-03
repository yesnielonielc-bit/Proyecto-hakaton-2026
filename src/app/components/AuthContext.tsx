import React, { createContext, useContext, useState, ReactNode } from 'react';

interface User {
  id: string;
  name: string;
  email: string;
  type: 'seller' | 'buyer';
  verified: boolean;
  rating?: number;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string, type: 'seller' | 'buyer') => Promise<void>;
  register: (userData: Partial<User>) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  const login = async (email: string, password: string, type: 'seller' | 'buyer') => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    setUser({
      id: '1',
      name: 'Usuario Demo',
      email,
      type,
      verified: true,
      rating: 4.8
    });
  };

  const register = (userData: Partial<User>) => {
    setUser({
      id: Date.now().toString(),
      name: userData.name || '',
      email: userData.email || '',
      type: userData.type || 'buyer',
      verified: userData.verified || false,
      rating: 5.0
    });
  };

  const logout = () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
