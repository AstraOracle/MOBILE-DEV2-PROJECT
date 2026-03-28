import React, { createContext, useState, useEffect, useCallback } from 'react';
import { setKV, removeKV } from '../lib/idb';

export const AuthContext = createContext();

const TOKEN_KEY = 'duly-noted:token';

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));
  const [user, setUser] = useState(null);

  useEffect(() => {
    if (token) {
      try {
        // Handle both JWT format (header.payload.signature) and simple base64 format
        if (token.includes('.')) {
          // JWT format
          const parts = token.split('.');
          if (parts.length === 3) {
            const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
            setUser({ id: payload.id, username: payload.username });
          }
        } else {
          // Simple base64 format
          const payload = JSON.parse(atob(token));
          setUser({ id: payload.id, username: payload.username });
        }
      } catch (e) { 
        console.warn('Token decode failed:', e);
        setUser(null); 
      }
    } else {
      setUser(null);
    }
  }, [token]);

  const saveToken = useCallback((t) => {
    if (t) {
      localStorage.setItem(TOKEN_KEY, t);
      setToken(t);
      // also persist to IndexedDB so service worker can access it
      try { setKV('token', t).catch(() => {}); } catch (e) {}
    } else {
      localStorage.removeItem(TOKEN_KEY);
      setToken(null);
      try { removeKV('token').catch(() => {}); } catch (e) {}
    }
  }, []);

  const login = async (username, password) => {
    // Client-side authentication without backend
    const users = JSON.parse(localStorage.getItem('duly-noted:users') || '[]');
    const user = users.find(u => u.username === username);
    
    if (!user || user.password !== password) {
      throw new Error('Invalid credentials');
    }
    
    // Create a simple JWT-like token
    const token = btoa(JSON.stringify({ id: user.id, username: user.username }));
    saveToken(token);
    return token;
  };

  const register = async (username, password) => {
    // Client-side registration without backend
    if (!username || !password) {
      throw new Error('Username and password required');
    }
    
    const users = JSON.parse(localStorage.getItem('duly-noted:users') || '[]');
    const existing = users.find(u => u.username === username);
    
    if (existing) {
      throw new Error('User already exists');
    }
    
    // Add new user
    const userId = String(Date.now());
    users.push({ id: userId, username, password });
    localStorage.setItem('duly-noted:users', JSON.stringify(users));
    
    // Create a simple JWT-like token
    const token = btoa(JSON.stringify({ id: userId, username }));
    saveToken(token);
    return token;
  };

  const logout = () => saveToken(null);

  const authHeaders = () => {
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  return (
    <AuthContext.Provider value={{ token, user, login, register, logout, authHeaders }}>
      {children}
    </AuthContext.Provider>
  );
}

export default AuthProvider;