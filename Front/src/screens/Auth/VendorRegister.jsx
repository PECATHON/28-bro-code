import React, { useState, useContext } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator
} from "react-native";
import * as SecureStore from "expo-secure-store";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AuthContext } from "../../contexts/AuthContext";

import { BACKEND_BASE } from '../../config/api';

export default function VendorRegister({ navigation }) {
  const [name, setName] = useState("");
  const [shop, setShop] = useState("");
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
      return; // Success, exit early
    } catch (secureError) {
      // SecureStore failed - this is common on iOS Simulator
      console.warn("⚠️ SecureStore save error (falling back to AsyncStorage):", secureError.message);
      console.warn("⚠️ Error details:", secureError.code, secureError.domain);
      
      try {
        // Fallback to AsyncStorage if SecureStore fails
        await AsyncStorage.setItem(key, value);
        console.log(`✅ Token saved to AsyncStorage (fallback): ${key}`);
        return; // Success with fallback
      } catch (asyncError) {
        // Both failed - log but don't throw
        console.error("❌ Both SecureStore and AsyncStorage failed:", asyncError.message);
        console.error("❌ This is non-critical - registration will continue");
        // Don't throw - allow registration to continue
        // User can still use the app, they'll just need to login again if app restarts
      }
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

      // STEP 3 → Save tokens securely (non-blocking - continue even if this fails)
      // Use fire-and-forget pattern - don't await to avoid blocking registration flow
      // Errors are handled inside saveToken function and won't throw
      saveToken("access_token", session.access_token).catch(() => {
        // Already handled in saveToken - just prevent unhandled promise rejection
      });
      
      if (session.refresh_token) {
        saveToken("refresh_token", session.refresh_token).catch(() => {
          // Already handled in saveToken
        });
      }

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
      // Check if it's a storage error (non-critical - registration likely succeeded)
      const isStorageError = err.message && (
        err.message.includes("storage directory") ||
        err.message.includes("SecureStore") ||
        err.message.includes("ExponentExperienceData") ||
        err.message.includes("@anonymous") ||
        err.message.includes("NSCocoaErrorDomain") ||
        (err.code && (err.code === 512 || err.code === "512"))
      );
      
      if (isStorageError) {
        // Storage error is non-critical - registration succeeded, just token storage failed
        // Log as warning instead of error to reduce console noise
        console.warn("⚠️ Storage error (non-critical):", err.message);
        console.warn("✅ Registration succeeded - user data is in AuthContext");
        console.warn("✅ User can continue - navigation will work");
        // Don't show error - registration succeeded, just storage failed
        // User can continue - navigation will work because user is in AuthContext
        // Show success message instead
        Alert.alert(
          "Registration Successful! ✅",
          "Your vendor account has been created. You can now use the app.",
          [{ text: "OK" }]
        );
      } else {
        // Real error - log and show to user
        console.error("❌ Vendor registration error:", err);
        Alert.alert("Registration Error", err.message || "Check Wi-Fi & backend connection");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Vendor Registration</Text>

      <TextInput 
        placeholder="Owner Name" 
        placeholderTextColor={palette.mutedLight}
        value={name} 
        onChangeText={setName} 
        style={styles.input} 
      />
      <TextInput 
        placeholder="Shop Name" 
        placeholderTextColor={palette.mutedLight}
        value={shop} 
        onChangeText={setShop} 
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
    marginTop: 20,
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