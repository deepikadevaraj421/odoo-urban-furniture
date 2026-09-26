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
          const me = response.data.user;
          if (me.accountant) {
            me.permissions = me.accountant.permissions || [];
            me.accountantType = me.accountant.accountantType;
            me.accountantCode = me.accountant.accountantCode;
          }
          setUser(me);
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

  // Refresh user data from backend
  const refreshUser = useCallback(async () => {
    try {
      const response = await authApi.getMe();
      const me = response.data.user;
      if (me.accountant) {
        me.permissions = me.accountant.permissions || [];
        me.accountantType = me.accountant.accountantType;
        me.accountantCode = me.accountant.accountantCode;
      }
      setUser(me);
      localStorage.setItem('uf_user', JSON.stringify(me));
      return me;
    } catch (err) {
      console.error('Failed to refresh user profile:', err);
    }
  }, []);

  /**
   * Check whether the active user has a specific granular permission.
   * Admins have full access to everything.
   * Accountants check their effective permissions array.
   */
  const hasPermission = useCallback(
    (permissionKey) => {
      if (!user) return false;
      if (user.role === 'ADMIN') return true;
      if (user.role !== 'ACCOUNTANT') return false;
      const userPerms = user.permissions || user.accountant?.permissions || [];
      return userPerms.includes(permissionKey);
    },
    [user]
  );

  const value = {
    user,
    token,
    loading,
    isAuthenticated,
    hasPermission,
    refreshUser,
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
