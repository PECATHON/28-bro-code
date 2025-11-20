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
import { AuthContext } from "../../contexts/AuthContext";

const BACKEND_BASE = "http://172.31.68.164:3000";

export default function StudentRegister({ navigation }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const { updateUser } = useContext(AuthContext);

  async function saveToken(key, value) {
    try {
      await SecureStore.setItemAsync(key, value);
    } catch (e) {
      console.warn("SecureStore save error:", e);
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

      const signupPayload = await res.json().catch(() => null);

      if (!res.ok) {
        Alert.alert("Signup failed", signupPayload?.message || "Please try again");
        setLoading(false);
        return;
      }

      // 2) Signin to obtain session + user + profile
      const signInRes = await fetch(`${BACKEND_BASE}/api/auth/signin`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password })
      });

      const signInPayload = await signInRes.json().catch(() => null);

      if (!signInRes.ok || !signInPayload?.session?.access_token) {
        // fallback: go to Login so user can sign in manually
        Alert.alert(
          "Account created",
          "Automatic login failed. Please log in manually.",
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

      // 4) Update AuthContext with normalized user object
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
        // include any other user fields returned by backend
        ...user
      };

      try {
        await updateUser(userData);
      } catch (e) {
        console.warn("updateUser failed:", e);
      }

      // 5) Reset navigation to StudentApp (ensure StudentApp exists in root navigator)
      navigation.reset({
        index: 0,
        routes: [{ name: "StudentApp" }]
      });
    } catch (e) {
      console.error("student signup/signin error:", e);
      Alert.alert("Network error", "Check Wi-Fi & backend connection");
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Student Registration</Text>

      <TextInput placeholder="Full Name" value={name} onChangeText={setName} style={styles.input} />
      <TextInput placeholder="Email" value={email} onChangeText={setEmail} autoCapitalize="none" style={styles.input} />
      <TextInput placeholder="Password" secureTextEntry value={password} onChangeText={setPassword} style={styles.input} />

      <TouchableOpacity style={styles.btn} onPress={onRegister} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Register</Text>}
      </TouchableOpacity>
    </View>
  );
}

const palette = {
  cream: "#f7f3ec",
  navy: "#0f1724",
  gold: "#c59d5f",
  muted: "#6b7280"
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    margin: 20,
    marginTop: 10,
    padding: 20,
    borderRadius: 16,
    elevation: 5,
  },

  title: {
    textAlign: "center",
    fontSize: 20,
    fontWeight: "800",
    color: palette.navy,
    marginBottom: 12,
  },

  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
    backgroundColor: palette.cream,
  },

  btn: {
    backgroundColor: palette.navy,
    padding: 12,
    borderRadius: 12,
    alignItems: "center",
  },

  btnText: {
    color: "#fff",
    fontWeight: "700",
  },
});