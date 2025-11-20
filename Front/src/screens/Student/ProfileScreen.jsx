// src/screens/Student/ProfileScreen.jsx
import React, { useContext, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { AuthContext } from '../../contexts/AuthContext';

const ROLE_LABELS = {
  student: 'Student',
  vendor: 'Vendor',
};

export default function ProfileScreen({ navigation }) {
  const { user, login, logout, setRole } = useContext(AuthContext);
  const [loadingRole, setLoadingRole] = useState(false);

  // If not logged in -> route to Login screen
  function goToLogin() {
    navigation.navigate('Login');
  }

  function goToRegister() {
    navigation.navigate('Register');
  }

  // Send user to their role home. These names are the ones used in AppNavigator.jsx
  function goToRoleHome(role) {
    if (role === 'student') navigation.navigate('StudentApp');
    else if (role === 'vendor') navigation.navigate('VendorApp');
    else Alert.alert('Role missing', 'Please choose a role first.');
  }

  async function chooseRole(role) {
    if (!user) {
      Alert.alert('Not logged in', 'Please login first to choose a role.');
      return;
    }
    setLoadingRole(true);
    try {
      // In a real app: call API to request vendor registration or role update
      await setRole(role);
      Alert.alert('Role set', `You are now a ${ROLE_LABELS[role]}.`);
      // Optionally, navigate to role home automatically:
      goToRoleHome(role);
    } catch (e) {
      console.warn(e);
      Alert.alert('Error', 'Could not set role. Try again.');
    } finally {
      setLoadingRole(false);
    }
  }

  if (!user) {
    // Not logged in UI
    return (
      <View style={styles.center}>
        <Text style={styles.title}>Welcome</Text>
        <Text style={styles.sub}>Sign in to order, review, and manage your vendor shop.</Text>

        <TouchableOpacity style={styles.primaryBtn} onPress={goToLogin}>
          <Text style={styles.primaryText}>Log in</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.ghostBtn} onPress={goToRegister}>
          <Text style={styles.ghostText}>Create account</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Logged in UI
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Hello, {user.name || 'User'}</Text>
      <Text style={styles.sub}>Role: <Text style={styles.roleText}>{ROLE_LABELS[user.role] || 'Not chosen'}</Text></Text>

      {!user.role && (
        <>
          <Text style={[styles.info, { marginTop: 16 }]}>Choose your role to continue:</Text>

          <View style={styles.row}>
            <TouchableOpacity style={styles.roleBtn} onPress={() => chooseRole('student')} disabled={loadingRole}>
              <Text style={styles.roleBtnText}>Student</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.roleBtn} onPress={() => chooseRole('vendor')} disabled={loadingRole}>
              <Text style={styles.roleBtnText}>Vendor</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.small}>Note: vendor role usually requires verification. This demo sets the role locally — integrate with your backend to request approval in production.</Text>
        </>
      )}

      {user.role && (
        <>
          <TouchableOpacity style={styles.primaryBtn} onPress={() => goToRoleHome(user.role)}>
            <Text style={styles.primaryText}>Go to {ROLE_LABELS[user.role]} Home</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.secondaryBtn} onPress={() => Alert.alert('Edit Profile', 'Profile editing feature coming soon!')}>
            <Text style={styles.secondaryText}>Edit profile</Text>
          </TouchableOpacity>

          {user.role === 'vendor' && (
            <TouchableOpacity style={styles.secondaryBtn} onPress={() => goToRoleHome('vendor')}>
              <Text style={styles.secondaryText}>Open Vendor Dashboard</Text>
            </TouchableOpacity>
          )}
        </>
      )}

      <View style={{ flex: 1 }} />

      <TouchableOpacity style={styles.logoutBtn} onPress={async () => {
        await logout();
        navigation.navigate('Login');
      }}>
        <Text style={styles.logoutText}>Log out</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#f7f3ec' },
  center: { flex: 1, padding: 28, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f7f3ec' },
  title: { fontSize: 22, fontWeight: '700', color: '#0f1724' },
  sub: { fontSize: 14, color: '#4b5563', marginTop: 6 },
  roleText: { fontWeight: '700', color: '#c59d5f' },
  info: { color: '#374151' },
  row: { flexDirection: 'row', marginTop: 12, alignItems: 'center' },
  roleBtn: {
    backgroundColor: '#0f1724',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
    marginRight: 8,
  },
  roleBtnText: { color: '#f7f3ec', fontWeight: '700' },
  small: { marginTop: 10, fontSize: 12, color: '#6b7280' },

  primaryBtn: {
    marginTop: 18,
    backgroundColor: '#0f1724',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  primaryText: { color: '#f7f3ec', fontWeight: '700' },

  secondaryBtn: {
    marginTop: 12,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e6e2d9',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  secondaryText: { color: '#0f1724', fontWeight: '700' },

  logoutBtn: {
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  logoutText: { color: '#ef4444', fontWeight: '700' },
});