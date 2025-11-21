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
  container: { flex: 1, padding: 24, backgroundColor: palette.darkBlue },
  center: { flex: 1, padding: 32, justifyContent: 'center', alignItems: 'center', backgroundColor: palette.darkBlue },
  title: { fontSize: 28, fontWeight: '700', color: palette.white, letterSpacing: 0.5 },
  sub: { fontSize: 15, color: palette.mutedLight, marginTop: 8 },
  roleText: { fontWeight: '700', color: palette.orange },
  info: { color: palette.mutedLight, fontSize: 15 },
  row: { flexDirection: 'row', marginTop: 16, alignItems: 'center' },
  roleBtn: {
    backgroundColor: palette.orange,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    marginRight: 12,
    borderWidth: 1,
    borderColor: palette.neonYellow,
    shadowColor: palette.neonYellow,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  roleBtnText: { color: palette.white, fontWeight: '700', fontSize: 15 },
  small: { marginTop: 12, fontSize: 12, color: palette.muted, paddingHorizontal: 20 },

  primaryBtn: {
    marginTop: 20,
    backgroundColor: palette.orange,
    paddingVertical: 16,
    borderRadius: 25,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: palette.neonYellow,
    shadowColor: palette.neonYellow,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  primaryText: { color: palette.white, fontWeight: '700', fontSize: 16 },

  secondaryBtn: {
    marginTop: 16,
    backgroundColor: palette.card,
    borderWidth: 1,
    borderColor: palette.neonYellow,
    paddingVertical: 14,
    borderRadius: 25,
    alignItems: 'center',
    shadowColor: palette.neonYellow,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  secondaryText: { color: palette.white, fontWeight: '700', fontSize: 15 },

  logoutBtn: {
    paddingVertical: 16,
    alignItems: 'center',
    backgroundColor: palette.card,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: palette.red,
    shadowColor: palette.red,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  logoutText: { color: palette.red, fontWeight: '700', fontSize: 16 },
});