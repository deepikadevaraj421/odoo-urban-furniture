import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi } from '../services/authApi';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('uf_token'));
  const [loading, setLoading] = useState(true);

  const isAuthenticated = !!token && !!user;

  // Fetch user info on mount if token exists
  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('uf_token');
      if (storedToken) {
        try {
          const response = await authApi.getMe();
          setUser(response.data.user);
          setToken(storedToken);
        } catch (error) {
          // Token invalid or expired
          localStorage.removeItem('uf_token');
          localStorage.removeItem('uf_user');
          setToken(null);
          setUser(null);
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  // Login — stores token and user data
  const login = useCallback((tokenValue, userData) => {
    localStorage.setItem('uf_token', tokenValue);
    localStorage.setItem('uf_user', JSON.stringify(userData));
    setToken(tokenValue);
    setUser(userData);
  }, []);

  // Logout — clears everything
  const logout = useCallback(() => {
    localStorage.removeItem('uf_token');
    localStorage.removeItem('uf_user');
    setToken(null);
    setUser(null);
  }, []);

  // Update user data
  const updateUser = useCallback((userData) => {
    localStorage.setItem('uf_user', JSON.stringify(userData));
    setUser(userData);
  }, []);

  const value = {
    user,
    token,
    loading,
    isAuthenticated,
    login,
    logout,
    updateUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
