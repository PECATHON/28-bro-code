// src/screens/Auth/RegisterScreen.jsx
import React, { useState, useContext } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from "react-native";
import * as SecureStore from "expo-secure-store";
import { AuthContext } from "../../contexts/AuthContext";

const BACKEND_BASE = "http://172.31.68.164:3000";

export default function RegisterScreen({ navigation }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("student"); // default role
  const [password, setPassword] = useState("");
  const [shopName, setShopName] = useState("");
  const [loading, setLoading] = useState(false);
  const { updateUser } = useContext(AuthContext);

  async function saveToken(key, value) {
    try {
      await SecureStore.setItemAsync(key, value, { keychainAccessible: "WHEN_UNLOCKED" });
    } catch (err) {
      console.warn("SecureStore save error:", err);
    }
  }

  async function onRegister() {
    if (!name || !email || !password) {
      Alert.alert("Missing fields", "Name, email and password are required.");
      return;
    }

    if (role === "vendor" && !shopName.trim()) {
      Alert.alert("Missing fields", "Shop name is required for vendor signup.");
      return;
    }

    setLoading(true);
    try {
      // Step 1: Register the user
      const res = await fetch(`${BACKEND_BASE}/api/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          email,
          password,
          full_name: name,
          role, // sends "student" OR "vendor"
          shop_name: role === "vendor" ? shopName : undefined,
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        Alert.alert("Signup failed", data?.message || "Could not create account.");
        setLoading(false);
        return;
      }

      // Step 2: Automatically sign in the user after successful registration
      const signInRes = await fetch(`${BACKEND_BASE}/api/auth/signin`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });

      const signInPayload = await signInRes.json().catch(() => null);

      if (!signInRes.ok) {
        Alert.alert(
          "Account created",
          "Your account was created, but automatic login failed. Please log in manually.",
          [{ text: "OK", onPress: () => navigation.navigate("Login") }]
        );
        setLoading(false);
        return;
      }

      // Extract session and user data
      const { user, session, profile } = signInPayload || {};

      if (!session?.access_token) {
        Alert.alert(
          "Account created",
          "Your account was created, but no session was returned. Please log in manually.",
          [{ text: "OK", onPress: () => navigation.navigate("Login") }]
        );
        setLoading(false);
        return;
      }

      // Store tokens securely
      await saveToken("access_token", session.access_token);
      if (session.refresh_token) {
        await saveToken("refresh_token", session.refresh_token);
      }

      // Update AuthContext with user data
      const userData = {
        token: session.access_token,
        role: profile?.role || role,
        name: profile?.full_name || name,
        id: user?.id || profile?.id || null,
        email: user?.email || email,
        ...user,
        profile,
        session,
      };

      await updateUser(userData);

      // Navigation will be handled automatically by AppNavigator based on user state
    } catch (err) {
      console.error("signup error:", err);
      Alert.alert("Network error", "Could not reach server. Check BACKEND_BASE and Wi-Fi.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create account</Text>

      <TextInput placeholder="Full Name" value={name} onChangeText={setName} style={styles.input} />

      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        style={styles.input}
      />

      <TextInput
        placeholder="Password"
        value={password}
        secureTextEntry
        onChangeText={setPassword}
        style={styles.input}
      />

      {/* Role Selector */}
      <View style={{ flexDirection: "row", marginBottom: 16 }}>
        <TouchableOpacity
          style={[styles.roleBtn, role === "student" && styles.roleActive]}
          onPress={() => setRole("student")}
        >
          <Text style={role === "student" ? styles.roleActiveText : styles.roleText}>Student</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.roleBtn, role === "vendor" && styles.roleActive]}
          onPress={() => setRole("vendor")}
        >
          <Text style={role === "vendor" ? styles.roleActiveText : styles.roleText}>Vendor</Text>
        </TouchableOpacity>
      </View>

      {/* Shop name input only for vendors */}
      {role === "vendor" && (
        <TextInput
          placeholder="Shop name"
          value={shopName}
          onChangeText={setShopName}
          style={styles.input}
        />
      )}

      <TouchableOpacity style={styles.btn} onPress={onRegister} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Register</Text>}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", padding: 20 },
  title: { fontSize: 20, fontWeight: "700", marginBottom: 12, textAlign: "center" },
  input: { borderWidth: 1, padding: 12, borderRadius: 8, marginBottom: 12, borderColor: "#ccc" },
  btn: { backgroundColor: "#000", padding: 12, borderRadius: 8, alignItems: "center" },
  btnText: { color: "#fff", fontWeight: "700" },

  roleBtn: {
    borderWidth: 1,
    borderColor: "#aaa",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginRight: 8,
  },
  roleActive: { backgroundColor: "#0f1724", borderColor: "#0f1724" },
  roleText: { color: "#222", fontWeight: "600" },
  roleActiveText: { color: "#fff", fontWeight: "700" },
});