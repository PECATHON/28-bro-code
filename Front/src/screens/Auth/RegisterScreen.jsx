// src/screens/Auth/RegisterSwitcher.jsx
import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import StudentRegister from "./StudentRegister";
import VendorRegister from "./VendorRegister";

export default function RegisterSwitcher({ navigation }) {
  const [tab, setTab] = useState("student");

  return (
    <View style={styles.root}>
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
    </View>
  );
}

const palette = {
  cream: "#f7f3ec",
  navy: "#0f1724",
  gold: "#c59d5f",
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: palette.cream },

  toggleRow: {
    flexDirection: "row",
    justifyContent: "center",
    paddingVertical: 18,
    backgroundColor: palette.cream,
    marginTop: 30, // ⬅ bigger top margin
  },

  toggleBtn: {
    paddingVertical: 10,
    paddingHorizontal: 22,
    borderRadius: 25,
    marginHorizontal: 6,
    borderWidth: 1.5,
    borderColor: palette.navy,
    backgroundColor: "#fff",
  },

  activeBtn: {
    backgroundColor: palette.navy,
    borderColor: palette.navy,
  },

  toggleText: {
    color: palette.navy,
    fontWeight: "700",
  },

  activeText: {
    color: palette.cream,
  },
});