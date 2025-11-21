// src/screens/Auth/RegisterSwitcher.jsx
import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { LinearGradient } from 'expo-linear-gradient';
import StudentRegister from "./StudentRegister";
import VendorRegister from "./VendorRegister";

export default function RegisterSwitcher({ navigation }) {
  const [tab, setTab] = useState("student");

  return (
    <LinearGradient
      colors={['#0f1724', '#1a2332', '#0f1724']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.root}
    >
      {/* App Name & Team Branding */}
      <View style={styles.branding}>
        <Text style={styles.appName}>BiteBook</Text>
        <Text style={styles.teamName}>by BroCode</Text>
        <Text style={styles.welcomeText}>Join us and start ordering delicious meals</Text>
      </View>

      {/* Toggle */}
      <View style={styles.toggleRow}>
        <TouchableOpacity
          style={[styles.toggleBtn, tab === "student" && styles.activeBtn]}
          onPress={() => setTab("student")}
        >
          <Text style={[styles.toggleText, tab === "student" && styles.activeText]}>Student</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.toggleBtn, tab === "vendor" && styles.activeBtn]}
          onPress={() => setTab("vendor")}
        >
          <Text style={[styles.toggleText, tab === "vendor" && styles.activeText]}>Vendor</Text>
        </TouchableOpacity>
      </View>

      {/* Add margin between toggle and form */}
      <View style={{ marginTop: 18 }}>
        {tab === "student" ? (
          <StudentRegister navigation={navigation} />
        ) : (
          <VendorRegister navigation={navigation} />
        )}
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
  root: { flex: 1 },

  branding: {
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 20,
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

  toggleRow: {
    flexDirection: "row",
    justifyContent: "center",
    paddingVertical: 20,
    marginTop: 20,
  },

  toggleBtn: {
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderRadius: 25,
    marginHorizontal: 8,
    borderWidth: 1,
    borderColor: palette.neonYellow,
    backgroundColor: palette.card,
    shadowColor: palette.neonYellow,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 6,
  },

  activeBtn: {
    backgroundColor: palette.orange,
    borderColor: palette.neonYellow,
    shadowColor: palette.neonYellow,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 6,
  },

  toggleText: {
    color: palette.white,
    fontWeight: "700",
    fontSize: 15,
  },

  activeText: {
    color: palette.white,
  },
});