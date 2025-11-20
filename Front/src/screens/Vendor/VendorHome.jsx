// src/screens/Vendor/VendorHome.jsx
import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';

export default function VendorHome({ navigation }) {
  const [stats, setStats] = useState({
    todaysOrders: 4,
    pending: 2,
    revenueToday: 820,
  });

  useEffect(() => {
    // TODO: fetch vendor dashboard stats from API
  }, []);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>Vendor Dashboard</Text>
        <Text style={styles.sub}>Welcome back — manage your shop</Text>
      </View>

      <View style={styles.cardRow}>
        <View style={styles.statCard}>
          <Text style={styles.statNum}>{stats.todaysOrders}</Text>
          <Text style={styles.statLabel}>Today's Orders</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNum}>{stats.pending}</Text>
          <Text style={styles.statLabel}>Pending</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNum}>₹{stats.revenueToday}</Text>
          <Text style={styles.statLabel}>Revenue</Text>
        </View>
      </View>

      <View style={{ padding: 16 }}>
        <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('VendorOrders')}>
          <Text style={styles.actionText}>Go to Orders</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.actionBtn, { marginTop: 12 }]} onPress={() => navigation.navigate('VendorMenu')}>
          <Text style={styles.actionText}>Edit Menu</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f7f3ec' },
  header: { padding: 18 },
  title: { fontSize: 24, fontWeight: '700', color: '#0f1724' },
  sub: { color: '#6b7280', marginTop: 6 },

  cardRow: { flexDirection: 'row', justifyContent: 'space-between', padding: 16 },
  statCard: {
    flex: 1,
    marginHorizontal: 6,
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    alignItems: 'center',
    elevation: 2,
  },
  statNum: { fontSize: 20, fontWeight: '800', color: '#0f1724' },
  statLabel: { color: '#6b7280', marginTop: 6 },

  actionBtn: {
    backgroundColor: '#0f1724',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  actionText: { color: '#f7f3ec', fontWeight: '700' },
});