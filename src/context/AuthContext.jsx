import React, { createContext, useState, useEffect, useCallback } from 'react';
import { setKV, removeKV } from '../lib/idb';
import { getCurrentUser, getAuthHeaders, loginRequest, registerRequest } from '../lib/api';

export const AuthContext = createContext();

const TOKEN_KEY = 'duly-noted:token';

function decodeToken(token) {
  if (!token) return null;

  try {
    if (!token.includes('.')) {
      return JSON.parse(atob(token));
    }

    const [, payload] = token.split('.');
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized.padEnd(normalized.length + ((4 - normalized.length % 4) % 4), '=');
    return JSON.parse(atob(padded));
  } catch (error) {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));
  const [user, setUser] = useState(() => decodeToken(localStorage.getItem(TOKEN_KEY)));

  const saveToken = useCallback((t) => {
    if (t) {
      localStorage.setItem(TOKEN_KEY, t);
      setToken(t);
      try { setKV('token', t).catch(() => {}); } catch (e) {}
    } else {
      localStorage.removeItem(TOKEN_KEY);
      setToken(null);
      try { removeKV('token').catch(() => {}); } catch (e) {}
    }
  }, []);

  useEffect(() => {
    if (!token) {
      setUser(null);
      return undefined;
    }

    let cancelled = false;
    const decodedUser = decodeToken(token);
    if (decodedUser) {
      setUser({ id: decodedUser.id, username: decodedUser.username });
    }

    getCurrentUser(token)
      .then((nextUser) => {
        if (!cancelled) {
          setUser(nextUser);
        }
      })
      .catch(() => {
        if (!cancelled && !decodedUser) {
          setUser(null);
          saveToken(null);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [saveToken, token]);

  const login = async (username, password) => {
    const nextToken = await loginRequest(username, password);
    saveToken(nextToken);
    return nextToken;
  };

  const register = async (username, password) => {
    if (!username || !password) {
      throw new Error('Username and password required');
    }

    const nextToken = await registerRequest(username, password);
    saveToken(nextToken);
    return nextToken;
  };

  const logout = () => saveToken(null);

  const authHeaders = () => {
    return getAuthHeaders(token);
  };

  return (
    <AuthContext.Provider value={{ token, user, login, register, logout, authHeaders }}>
      {children}
    </AuthContext.Provider>
  );
}

export default AuthProvider;
