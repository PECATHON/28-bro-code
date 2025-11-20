// src/screens/Vendor/VendorProfile.jsx
import React, { useContext } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert
} from 'react-native';
import { AuthContext } from '../../contexts/AuthContext';

export default function VendorProfile({ navigation }) {
  const { user, logout, setRole } = useContext(AuthContext);

  async function handleRoleChange(newRole) {
    try {
      await setRole(newRole);
      Alert.alert('Role Updated', `You are now a ${newRole}.`);

      // Redirect based on updated role
      if (newRole === 'student') navigation.navigate('StudentApp');
      else if (newRole === 'vendor') navigation.navigate('VendorApp');
    } catch (err) {
      console.warn(err);
      Alert.alert("Error", "Couldn't update role");
    }
  }

  function openRoleSelector() {
    Alert.alert(
      "Change Role",
      "Select your new role",
      [
        { text: "Student", onPress: () => handleRoleChange("student") },
        { text: "Vendor", onPress: () => handleRoleChange("vendor") },
        { text: "Cancel", style: "cancel" }
      ]
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f7f3ec' }}>
      <View style={{ padding: 16 }}>
        
        {/* User Info */}
        <Text style={{ fontSize: 20, fontWeight: '700', color: '#0f1724' }}>
          {user?.name || 'Vendor'}
        </Text>
        <Text style={{ color: '#6b7280', marginTop: 6 }}>
          {user?.email || 'No email'}
        </Text>

        {/* Edit Menu */}
        <TouchableOpacity
          style={[styles.btn, { marginTop: 20 }]}
          onPress={() => navigation.navigate('VendorMenu')}
        >
          <Text style={styles.btnText}>Edit Menu</Text>
        </TouchableOpacity>

        {/* View Orders */}
        <TouchableOpacity
          style={[styles.btn, { marginTop: 12 }]}
          onPress={() => navigation.navigate('VendorOrders')}
        >
          <Text style={styles.btnText}>View Orders</Text>
        </TouchableOpacity>

        {/* CHANGE ROLE BUTTON */}
        <TouchableOpacity
          style={[styles.btnSecondary, { marginTop: 20 }]}
          onPress={openRoleSelector}
        >
          <Text style={styles.btnSecondaryText}>Change Role</Text>
        </TouchableOpacity>

        {/* Logout */}
        <TouchableOpacity
          style={[styles.logoutBtn, { marginTop: 40 }]}
          onPress={async () => {
            await logout();
            navigation.navigate('Login');
          }}
        >
          <Text style={{ color: '#ef4444', fontWeight: '800' }}>Log out</Text>
        </TouchableOpacity>

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  btn: {
    backgroundColor: '#0f1724',
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  btnText: { color: '#fff', fontWeight: '700' },

  btnSecondary: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#c59d5f',
    alignItems: 'center',
  },
  btnSecondaryText: { color: '#c59d5f', fontWeight: '700' },

  logoutBtn: { alignItems: 'center' },
});