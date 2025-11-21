// src/screens/Auth/LoginScreen.jsx
import React, { useState, useContext } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import { LinearGradient } from 'expo-linear-gradient';
import * as SecureStore from "expo-secure-store";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AuthContext } from "../../contexts/AuthContext";

import { BACKEND_BASE } from '../../config/api';

export default function LoginScreen({ navigation }) {
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
        // Don't throw - allow login to continue even if token storage fails
      }
    }
  }

  async function onLogin() {
    if (!email || !password) {
      Alert.alert("Validation", "Please enter email and password");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${BACKEND_BASE}/api/auth/signin`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      // If network-level error occurs, fetch will throw and jump to catch()
      const payload = await res.json().catch(() => null);

      if (!res.ok) {
        const message = payload?.message || payload?.error || "Login failed";
        Alert.alert("Login error", message.toString());
        setLoading(false);
        return;
      }

      // backend returns { user, session, profile }
      const { user, session, profile } = payload || {};

      if (!session?.access_token) {
        Alert.alert("Login error", "No access token returned from server");
        setLoading(false);
        return;
      }

      // Store tokens securely on device
      await saveToken("access_token", session.access_token);
      if (session.refresh_token) {
        await saveToken("refresh_token", session.refresh_token);
      }

      // Update AuthContext with user data
      // Map API response to AuthContext format: { token, role, name, id, email, ... }
      // IMPORTANT: Set role AFTER spread to ensure it's not overwritten
      // Role comes from profile table, normalize to lowercase
      const userData = {
        token: session.access_token,
        name: profile?.full_name || user?.user_metadata?.full_name || user?.email?.split("@")[0] || "User",
        id: user?.id || profile?.id || null,
        email: user?.email || email,
        ...user,
        profile,
        session,
        // Set role AFTER spread to ensure it's not overwritten
        role: profile?.role ? profile.role.toLowerCase() : null,
      };
      
      console.log("Login - Profile role:", profile?.role, "Final role:", userData.role);

      await updateUser(userData);

      // Navigation will be handled automatically by AppNavigator based on user state
    } catch (err) {
      console.error("signin error:", err);
      Alert.alert(
        "Network error",
        "Unable to reach server. Check your network and backend URL. If using Expo Go, ensure BACKEND_BASE is set to your PC LAN IP."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <LinearGradient
      colors={['#0f1724', '#1a2332', '#0f1724']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <View style={styles.content}>
        {/* App Name & Team Branding */}
        <View style={styles.branding}>
          <Text style={styles.appName}>BiteBook</Text>
          <Text style={styles.teamName}>by BroCode</Text>
          <Text style={styles.welcomeText}>Welcome back! Order your favorite meals</Text>
        </View>

        <Text style={styles.title}>Login</Text>

        <TextInput
          placeholder="Email"
          placeholderTextColor={palette.mutedLight}
          value={email}
          onChangeText={setEmail}
          style={styles.input}
          autoCapitalize="none"
          keyboardType="email-address"
          autoComplete="email"
        />

        <TextInput
          placeholder="Password"
          placeholderTextColor={palette.mutedLight}
          value={password}
          secureTextEntry
          onChangeText={setPassword}
          style={styles.input}
          autoComplete="password"
        />

        <TouchableOpacity style={styles.btn} onPress={onLogin} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Login</Text>}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate("Register")} style={{ marginTop: 20, alignItems: 'center' }}>
          <Text style={{ color: palette.white, fontSize: 15, fontWeight: '600' }}>
            Don't have an account? <Text style={{ fontWeight: '700', textDecorationLine: 'underline', color: palette.neonYellow }}>Register</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
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
  container: { 
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: "center", 
    padding: 24,
  },
  branding: {
    alignItems: 'center',
    marginBottom: 40,
  },
  appName: {
    fontSize: 42,
    fontWeight: '900',
    color: palette.white,
    letterSpacing: 2,
    marginBottom: 8,
  },
  teamName: {
    fontSize: 16,
    fontWeight: '600',
    color: palette.neonYellow,
    letterSpacing: 1,
    marginBottom: 12,
  },
  welcomeText: {
    fontSize: 15,
    color: palette.mutedLight,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  title: { 
    fontSize: 32, 
    fontWeight: "800", 
    marginBottom: 32, 
    textAlign: "center",
    color: palette.white,
    letterSpacing: 1,
  },
  input: { 
    borderWidth: 1, 
    borderColor: palette.neonYellow, 
    padding: 16, 
    borderRadius: 16, 
    marginBottom: 16,
    backgroundColor: palette.card,
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
