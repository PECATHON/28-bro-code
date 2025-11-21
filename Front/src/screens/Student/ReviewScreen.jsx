// src/screens/Student/ReviewScreen.jsx
import React, { useContext } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
  SafeAreaView,
} from 'react-native';
import { AuthContext } from '../../contexts/AuthContext';

// Role labels for display
const ROLE_LABELS = {
  student: 'Student',
  vendor: 'Vendor',
};

export default function ReviewScreen({ navigation }) {
  const { user, logout } = useContext(AuthContext);

  async function handleLogout() {
    try {
      await logout();
      // After logout, send user to Login screen
      navigation.navigate('Login');
    } catch (e) {
      console.warn('Logout failed', e);
      Alert.alert('Error', 'Could not log out. Try again.');
    }
  }

  function goToRoleHome() {
    if (!user?.role) {
      Alert.alert('Role not set', 'Please choose a role from Profile to continue.');
      return;
    }
    if (user.role === 'student') navigation.navigate('StudentApp');
    else if (user.role === 'vendor') navigation.navigate('VendorApp');
  }

  if (!user) {
    // Not signed in UI
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <Text style={styles.title}>You are not signed in</Text>
          <Text style={styles.subtitle}>Sign up or log in to order food, leave reviews, and manage your vendor profile.</Text>

          <TouchableOpacity style={styles.primaryBtn} onPress={() => navigation.navigate('Login')}>
            <Text style={styles.primaryText}>Log in</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.ghostBtn} onPress={() => navigation.navigate('Register')}>
            <Text style={styles.ghostText}>Create account</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Signed-in UI: show account details
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Image
            source={
              user.avatar
                ? { uri: user.avatar }
                : { uri: 'https://placekitten.com/200/200' } // placeholder avatar
            }
            style={styles.avatar}
          />
          <View style={{ marginLeft: 12 }}>
            <Text style={styles.name}>{user.name || 'No name'}</Text>
            <Text style={styles.email}>{user.email || 'No email set'}</Text>
            <Text style={styles.role}>
              Role:{' '}
              <Text style={styles.roleLabel}>{ROLE_LABELS[user.role] ?? 'Not chosen'}</Text>
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account Actions</Text>

          <TouchableOpacity style={styles.actionBtn} onPress={() => Alert.alert('Edit Profile', 'Profile editing feature coming soon!')}>
            <Text style={styles.actionText}>Edit profile</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionBtn} onPress={goToRoleHome}>
            <Text style={styles.actionText}>Go to role home</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: '#fff', borderWidth: 1, borderColor: '#e6e2d9' }]}
            onPress={() => Alert.alert('Reset password', 'Password reset flow goes here (backend required).')}
          >
            <Text style={[styles.actionText, { color: '#0f1724' }]}>Reset password</Text>
          </TouchableOpacity>
        </View>

        <View style={{ flex: 1 }} />

        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutText}>Log out</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
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
  safe: { flex: 1, backgroundColor: palette.darkBlue },
  container: { flex: 1, padding: 20 },

  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 },
  title: { fontSize: 24, fontWeight: '700', color: palette.white, marginBottom: 12, letterSpacing: 0.5 },
  subtitle: { textAlign: 'center', color: palette.mutedLight, marginBottom: 24, fontSize: 15 },

  primaryBtn: {
    width: '100%',
    backgroundColor: palette.orange,
    paddingVertical: 16,
    borderRadius: 25,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: palette.neonYellow,
    shadowColor: palette.neonYellow,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  primaryText: { color: palette.white, fontWeight: '700', fontSize: 16 },

  ghostBtn: {
    width: '100%',
    backgroundColor: palette.card,
    paddingVertical: 14,
    borderRadius: 25,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: palette.neonYellow,
    shadowColor: palette.neonYellow,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  ghostText: { color: palette.white, fontWeight: '700', fontSize: 15 },

  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
  avatar: { 
    width: 88, 
    height: 88, 
    borderRadius: 20, 
    borderWidth: 2, 
    borderColor: palette.neonYellow,
    shadowColor: palette.neonYellow,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
  },
  name: { fontSize: 20, fontWeight: '700', color: palette.white, marginLeft: 16 },
  email: { color: palette.mutedLight, marginTop: 4, marginLeft: 16 },
  role: { marginTop: 6, color: palette.muted, marginLeft: 16 },
  roleLabel: { color: palette.orange, fontWeight: '700' },

  section: { marginTop: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: palette.white, marginBottom: 12, letterSpacing: 0.5 },

  actionBtn: {
    backgroundColor: palette.card,
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: palette.neonYellow,
    shadowColor: palette.neonYellow,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  actionText: { color: palette.white, fontWeight: '700', fontSize: 15 },

  logoutBtn: {
    backgroundColor: palette.card,
    paddingVertical: 16,
    borderRadius: 25,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: palette.red,
    marginBottom: 16,
    shadowColor: palette.red,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  logoutText: { color: palette.red, fontWeight: '800', fontSize: 16 },
});