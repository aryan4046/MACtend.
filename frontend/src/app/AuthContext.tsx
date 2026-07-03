import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface Faculty {
  name: string;
  email: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  faculty: Faculty | null;
  login: (facultyData: Faculty) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  const [faculty, setFaculty] = useState<Faculty | null>(null);

  const login = (facultyData: Faculty) => {
    setIsAuthenticated(true);
    setFaculty(facultyData);
  };

  const logout = () => {
    setIsAuthenticated(false);
    setFaculty(null);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, faculty, login, logout }}>
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
