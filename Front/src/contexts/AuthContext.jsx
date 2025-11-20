// src/contexts/AuthContext.jsx
import React, { createContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    // rehydrate user from AsyncStorage on startup
    (async function load() {
      try {
        const raw = await AsyncStorage.getItem("user");
        if (raw) setUser(JSON.parse(raw));
      } catch (e) {
        console.warn("Auth rehydrate failed", e);
      }
    })();
  }, []);

  async function persistUser(u) {
    setUser(u);
    if (u) await AsyncStorage.setItem("user", JSON.stringify(u));
    else await AsyncStorage.removeItem("user");
  }

  async function updateUser(patch) {
    // patch may be full user object or partial fields
    const next = { ...(user || {}), ...(patch || {}) };
    await persistUser(next);
    return next;
  }

  async function logout() {
    try {
      // attempt to call backend signout so server clears cookies (optional)
      try {
        await fetch(`${process.env.BACKEND_BASE || "http://172.31.68.164:3000"}/api/auth/signout`, {
          method: "POST",
          credentials: "include",
        });
      } catch (err) {
        console.warn("backend signout failed", err);
      }

      // remove tokens saved in SecureStore
      await SecureStore.deleteItemAsync("access_token");
      await SecureStore.deleteItemAsync("refresh_token");

      // clear local user state
      await persistUser(null);
    } catch (err) {
      console.warn("logout error", err);
      // still clear state
      await persistUser(null);
    }
  }

  return (
    <AuthContext.Provider value={{ user, updateUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
}