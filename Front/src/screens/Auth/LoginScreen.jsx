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
import * as SecureStore from "expo-secure-store";
import { AuthContext } from "../../contexts/AuthContext";

/**
 * IMPORTANT:
 * - For Expo Go on a real device, set BACKEND_BASE to your PC's LAN IP, e.g.:
 *     const BACKEND_BASE = "http://192.168.1.46:3000";
 * - For Android emulator (AVD) use: http://10.0.2.2:3000
 * - For iOS simulator use: http://localhost:3000
 *
 * Replace the value below with the correct one for your setup.
 */
const BACKEND_BASE = "http://172.31.68.164:3000";

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { updateUser } = useContext(AuthContext);

  async function saveToken(key, value) {
    try {
      await SecureStore.setItemAsync(key, value, { keychainAccessible: "WHEN_UNLOCKED" });
    } catch (err) {
      console.warn("SecureStore save error:", err);
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
      const userData = {
        token: session.access_token,
        role: user?.role || profile?.role || null,
        name: user?.name || profile?.name || user?.email?.split("@")[0] || "User",
        id: user?.id || profile?.id || null,
        email: user?.email || email,
        ...user,
        profile,
        session,
      };

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
    <View style={styles.container}>
      <Text style={styles.title}>Login</Text>

      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        style={styles.input}
        autoCapitalize="none"
        keyboardType="email-address"
        autoComplete="email"
      />

      <TextInput
        placeholder="Password"
        value={password}
        secureTextEntry
        onChangeText={setPassword}
        style={styles.input}
        autoComplete="password"
      />

      <TouchableOpacity style={styles.btn} onPress={onLogin} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Login</Text>}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate("Register")} style={{ marginTop: 15 }}>
        <Text style={{ color: "#007bff" }}>Don't have an account? Register</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", padding: 20 },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 20, textAlign: "center" },
  input: { borderWidth: 1, borderColor: "#ccc", padding: 12, borderRadius: 8, marginBottom: 12 },
  btn: { backgroundColor: "#000", padding: 15, borderRadius: 8, alignItems: "center" },
  btnText: { color: "#fff", fontWeight: "bold" },
});
