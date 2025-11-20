// src/contexts/AuthContext.jsx
import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null); // { token, role, name, id }

  useEffect(() => {
    async function load() {
      try {
        const raw = await AsyncStorage.getItem('user');
        if (raw) setUser(JSON.parse(raw));
      } catch (e) {
        console.warn('Auth rehydrate failed', e);
      }
    }
    load();
  }, []);

  const persistUser = async (u) => {
    setUser(u);
    if (u) {
      await AsyncStorage.setItem('user', JSON.stringify(u));
    } else {
      await AsyncStorage.removeItem('user');
    }
  };

  const login = async (credentials) => {
    // TODO: call your API and get token + role
    // For prototype we fake a response. Replace with real API call.
    const fake = { token: 'abc', role: credentials.role || null, name: credentials.name || 'Student User', id: 'u1' };
    await persistUser(fake);
    return fake;
  };

  const logout = async () => {
    await persistUser(null);
  };

  // Update role locally (and persist) — call server in real app
  const setRole = async (role) => {
    if (!user) return null;
    const next = { ...user, role };
    await persistUser(next);
    return next;
  };

  // Generic updater if you want to change other user props
  const updateUser = async (patch) => {
    const next = { ...(user || {}), ...patch };
    await persistUser(next);
    return next;
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, setRole, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}