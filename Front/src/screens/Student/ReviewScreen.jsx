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

          <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('ProfileEdit')}>
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
  navy: '#0f1724',
  gold: '#c59d5f',
  cream: '#f7f3ec',
  muted: '#6b7280',
  card: '#ffffff',
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: palette.cream },
  container: { flex: 1, padding: 18 },

  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 },
  title: { fontSize: 20, fontWeight: '700', color: palette.navy, marginBottom: 8 },
  subtitle: { textAlign: 'center', color: palette.muted, marginBottom: 18 },

  primaryBtn: {
    width: '100%',
    backgroundColor: palette.navy,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryText: { color: palette.cream, fontWeight: '700' },

  ghostBtn: {
    width: '100%',
    backgroundColor: '#fff',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e6e2d9',
  },
  ghostText: { color: palette.navy, fontWeight: '700' },

  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  avatar: { width: 88, height: 88, borderRadius: 14, borderWidth: 2, borderColor: palette.gold },
  name: { fontSize: 18, fontWeight: '700', color: palette.navy },
  email: { color: palette.muted, marginTop: 4 },
  role: { marginTop: 6, color: palette.muted },
  roleLabel: { color: palette.gold, fontWeight: '700' },

  section: { marginTop: 8 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: palette.navy, marginBottom: 8 },

  actionBtn: {
    backgroundColor: palette.card,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#eae6de',
  },
  actionText: { color: palette.navy, fontWeight: '700' },

  logoutBtn: {
    backgroundColor: '#fff',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#f3d7c4',
    marginBottom: 12,
  },
  logoutText: { color: '#ef4444', fontWeight: '800' },
});