// src/contexts/AuthContext.jsx
import React, { createContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import { BACKEND_BASE } from "../config/api";

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
        // Suppress SecureStore directory errors on iOS Simulator (known issue, doesn't affect functionality)
        if (e.message && (
          e.message.includes("SecureStore") ||
          e.message.includes("ExponentExperienceData") ||
          e.message.includes("@anonymous") ||
          e.message.includes("storage directory")
        )) {
          // This is a known iOS Simulator issue - silently ignore
          return;
        }
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
        await fetch(`${BACKEND_BASE}/api/auth/signout`, {
          method: "POST",
          credentials: "include",
        });
      } catch (err) {
        console.warn("backend signout failed", err);
      }

      // remove tokens from both SecureStore and AsyncStorage (fallback)
      try {
        await SecureStore.deleteItemAsync("access_token");
      } catch (e) {
        console.warn("SecureStore delete access_token error:", e);
      }
      try {
        await SecureStore.deleteItemAsync("refresh_token");
      } catch (e) {
        console.warn("SecureStore delete refresh_token error:", e);
      }
      // Also remove from AsyncStorage (in case fallback was used)
      try {
        await AsyncStorage.removeItem("access_token");
        await AsyncStorage.removeItem("refresh_token");
      } catch (e) {
        console.warn("AsyncStorage delete tokens error:", e);
      }

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