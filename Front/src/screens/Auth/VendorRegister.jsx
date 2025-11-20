import React, { useState, useContext } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator
} from "react-native";
import * as SecureStore from "expo-secure-store";
import { AuthContext } from "../../contexts/AuthContext";

const BACKEND_BASE = "http://172.31.68.164:3000";

export default function VendorRegister({ navigation }) {
  const [name, setName] = useState("");
  const [shop, setShop] = useState("");
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
    if (!name || !email || !password || !shop) {
      Alert.alert("Missing fields", "All fields are required.");
      return;
    }

    setLoading(true);

    try {
      // STEP 1 → Register vendor on backend (creates auth user + vendors row)
      const res = await fetch(`${BACKEND_BASE}/api/auth/vendor-signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          full_name: name,
          shop_name: shop
        }),
      });

      const signupPayload = await res.json().catch(() => null);

      if (!res.ok) {
        Alert.alert("Signup failed", signupPayload?.message || "Please try again");
        setLoading(false);
        return;
      }

      // STEP 2 → Auto-login using signin endpoint to get session + user + profile
      const loginRes = await fetch(`${BACKEND_BASE}/api/auth/signin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const loginPayload = await loginRes.json().catch(() => null);

      if (!loginRes.ok || !loginPayload?.session?.access_token) {
        Alert.alert(
          "Registered",
          "Account created but automatic login failed. Please log in manually.",
          [{ text: "OK", onPress: () => navigation.navigate("Login") }]
        );
        setLoading(false);
        return;
      }

      const { user, session, profile } = loginPayload;

      // STEP 3 → Save tokens securely
      await saveToken("access_token", session.access_token);
      if (session.refresh_token) await saveToken("refresh_token", session.refresh_token);

      // STEP 4 → Update AuthContext with user data
      // IMPORTANT: Set role AFTER spread to ensure it's not overwritten
      // Role comes from profile table, normalize to lowercase
      const userData = {
        token: session.access_token,
        name: profile?.full_name || name,
        id: user?.id || profile?.id || null,
        email: user?.email || email,
        ...user,
        profile,
        session,
        // Set role AFTER spread to ensure it's not overwritten
        role: profile?.role ? profile.role.toLowerCase() : "vendor",
      };

      console.log("VendorRegister - Profile role:", profile?.role, "Final role:", userData.role);

      await updateUser(userData);

      // Navigation will be handled automatically by AppNavigator based on user state
      // AppNavigator detects user.role === 'vendor' and routes to VendorApp (VendorTabs)
      // VendorTabs has initialRouteName="VendorHome", so user lands on VendorHome
    } catch (err) {
      console.error("vendor signup/login error:", err);
      Alert.alert("Network Error", "Check Wi-Fi & backend connection");
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Vendor Registration</Text>

      <TextInput placeholder="Owner Name" value={name} onChangeText={setName} style={styles.input} />
      <TextInput placeholder="Shop Name" value={shop} onChangeText={setShop} style={styles.input} />
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
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    margin: 20,
    marginTop: 80,
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
    backgroundColor: palette.gold,
    padding: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  btnText: {
    color: palette.navy,
    fontWeight: "700",
  },
});