// src/screens/Auth/StudentRegister.jsx
import React, { useState, useContext } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator
} from "react-native";
import * as SecureStore from "expo-secure-store";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AuthContext } from "../../contexts/AuthContext";

import { BACKEND_BASE } from '../../config/api';

export default function StudentRegister({ navigation }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const { updateUser } = useContext(AuthContext);

  async function saveToken(key, value) {
    try {
      // Try SecureStore first with keychainAccessible option for iOS
      await SecureStore.setItemAsync(key, value, {
        keychainAccessible: SecureStore.WHEN_UNLOCKED,
      });
      console.log(`✅ Token saved to SecureStore: ${key}`);
    } catch (secureError) {
      console.warn("⚠️ SecureStore save error (falling back to AsyncStorage):", secureError.message);
      try {
        // Fallback to AsyncStorage if SecureStore fails (common on iOS Simulator)
        await AsyncStorage.setItem(key, value);
        console.log(`✅ Token saved to AsyncStorage (fallback): ${key}`);
      } catch (asyncError) {
        console.error("❌ Both SecureStore and AsyncStorage failed:", asyncError);
        // Don't throw - allow registration to continue even if token storage fails
      }
    }
  }

  async function onRegister() {
    if (!name || !email || !password) {
      Alert.alert("Missing fields", "All fields are required.");
      return;
    }

    setLoading(true);

    try {
      // 1) Signup
      console.log("[StudentRegister] calling signup", { email, name });
      const res = await fetch(`${BACKEND_BASE}/api/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          email,
          password,
          full_name: name,
          role: "student"
        })
      });

      let signupPayload = null;
      try { signupPayload = await res.json(); } catch (e) { signupPayload = null; }

      console.log("[StudentRegister] signup response", res.status, signupPayload);

      if (!res.ok) {
        const message = signupPayload?.message || signupPayload?.error || `Signup failed (${res.status})`;
        Alert.alert("Signup failed", message.toString());
        setLoading(false);
        return;
      }

      // 2) Signin
      console.log("[StudentRegister] calling signin");
      const signInRes = await fetch(`${BACKEND_BASE}/api/auth/signin`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password })
      });

      let signInPayload = null;
      try { signInPayload = await signInRes.json(); } catch (e) { signInPayload = null; }

      console.log("[StudentRegister] signin response", signInRes.status, signInPayload);

      if (!signInRes.ok) {
        Alert.alert(
          "Account created",
          "Automatic login failed. Please log in manually.",
          [{ text: "OK", onPress: () => navigation.navigate("Login") }]
        );
        setLoading(false);
        return;
      }

      if (!signInPayload?.session?.access_token) {
        console.warn("[StudentRegister] no access token in signin payload", signInPayload);
        Alert.alert(
          "Account created",
          "No session token returned. Please login manually.",
          [{ text: "OK", onPress: () => navigation.navigate("Login") }]
        );
        setLoading(false);
        return;
      }

      // 3) Save tokens securely
      const session = signInPayload.session;
      await saveToken("access_token", session.access_token);
      if (session.refresh_token) {
        await saveToken("refresh_token", session.refresh_token);
      }

      // 4) Update AuthContext
      const user = signInPayload.user || {};
      const profile = signInPayload.profile || null;
      const userData = {
        token: session.access_token,
        id: user.id || (profile && profile.id) || null,
        name: profile?.full_name || user?.user_metadata?.full_name || name,
        email: user.email || email,
        role: profile?.role ? profile.role.toLowerCase() : "student",
        profile,
        session,
        ...user
      };

      console.log("[StudentRegister] updating AuthContext with", userData);
      try {
        await updateUser(userData);
      } catch (e) {
        console.warn("updateUser failed:", e);
      }

      // 5) Navigate to StudentApp (reset history)
      // Make sure your root navigator registers a route named "StudentApp"
      try {
        navigation.reset({
          index: 0,
          routes: [{ name: "StudentApp" }]
        });
      } catch (navErr) {
        console.warn("navigation.reset failed:", navErr);
        // fallback - try a plain navigate (will work if StudentApp is present)
        try {
          navigation.navigate("StudentApp");
        } catch (n2) {
          console.warn("navigation.navigate fallback failed:", n2);
          Alert.alert("Navigation error", "Account created but app couldn't navigate to StudentHome. Please restart the app.");
        }
      }
    } catch (e) {
      console.error("student signup/signin error:", e);
      Alert.alert("Network error", "Check Wi-Fi & backend connection. See console for details.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Student Registration</Text>

      <TextInput 
        placeholder="Full Name" 
        placeholderTextColor={palette.mutedLight}
        value={name} 
        onChangeText={setName} 
        style={styles.input} 
      />
      <TextInput 
        placeholder="Email" 
        placeholderTextColor={palette.mutedLight}
        value={email} 
        onChangeText={setEmail} 
        autoCapitalize="none" 
        style={styles.input} 
      />
      <TextInput 
        placeholder="Password" 
        placeholderTextColor={palette.mutedLight}
        secureTextEntry 
        value={password} 
        onChangeText={setPassword} 
        style={styles.input} 
      />

      <TouchableOpacity style={styles.btn} onPress={onRegister} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Register</Text>}
      </TouchableOpacity>
    </View>
  );
}

const palette = {
  darkBlue: '#0f1724',
  darkBlueLight: '#1a2332',
  orange: '#ff6b35',
  red: '#ef4444',
  white: '#ffffff',
  muted: '#9aa1a9',
  mutedLight: '#cbd5e1',
  card: '#1e293b',
  cardLight: '#2d3748',
  yellow: '#fbbf24',
  neonYellow: '#fffb00',
  neonYellowGlow: 'rgba(255, 251, 0, 0.5)',
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: palette.card,
    margin: 20,
    marginTop: 10,
    padding: 24,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: palette.neonYellow,
    shadowColor: palette.neonYellow,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 12,
  },

  title: {
    textAlign: "center",
    fontSize: 24,
    fontWeight: "800",
    color: palette.white,
    marginBottom: 20,
    letterSpacing: 0.5,
  },

  input: {
    borderWidth: 1,
    borderColor: palette.neonYellow,
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
    backgroundColor: palette.darkBlue,
    color: palette.white,
    fontSize: 16,
    shadowColor: palette.neonYellow,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 6,
  },

  btn: {
    backgroundColor: palette.orange,
    padding: 18,
    borderRadius: 25,
    alignItems: "center",
    borderWidth: 1,
    borderColor: palette.neonYellow,
    shadowColor: palette.neonYellow,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },

  btnText: {
    color: palette.white,
    fontWeight: "700",
    fontSize: 18,
  },
});