// src/screens/Vendor/VendorHome.jsx
import React, { useEffect, useState, useContext } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, ActivityIndicator } from 'react-native';
import { AuthContext } from '../../contexts/AuthContext';

const BACKEND_BASE = 'http://172.31.68.164:3000';

export default function VendorHome({ navigation }) {
  const { user } = useContext(AuthContext);
  const vendorId = user?.id;
  const [stats, setStats] = useState({
    todaysOrders: 0,
    pending: 0,
    revenueToday: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (vendorId) {
      fetchStats();
    }
  }, [vendorId]);

  async function fetchStats() {
    if (!vendorId) return;
    
    setLoading(true);
    try {
      // Fetch today's orders
      const ordersRes = await fetch(`${BACKEND_BASE}/api/orders/vendor/${vendorId}`, {
        headers: { 'Content-Type': 'application/json' },
      });
      
      if (ordersRes.ok) {
        const ordersData = await ordersRes.json();
        const orders = ordersData.orders || [];
        
        // Calculate stats
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const todayOrders = orders.filter(order => {
          const orderDate = new Date(order.placedAt);
          return orderDate >= today;
        });
        
        const pendingOrders = orders.filter(order => 
          order.status === 'confirmed' || order.status === 'preparing'
        );
        
        const todayRevenue = todayOrders.reduce((sum, order) => sum + (order.total || 0), 0);
        
        setStats({
          todaysOrders: todayOrders.length,
          pending: pendingOrders.length,
          revenueToday: todayRevenue,
        });
      }
    } catch (err) {
      console.error('Error fetching vendor stats:', err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>Vendor Dashboard</Text>
        <Text style={styles.sub}>Welcome back — manage your shop</Text>
      </View>

      {loading ? (
        <View style={{ padding: 40, alignItems: 'center' }}>
          <ActivityIndicator size="large" color={palette.orange} />
        </View>
      ) : (
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
            <Text style={styles.statNum}>₹{stats.revenueToday.toFixed(0)}</Text>
            <Text style={styles.statLabel}>Revenue</Text>
          </View>
        </View>
      )}

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
  header: { padding: 20, paddingTop: 20 },
  title: { fontSize: 28, fontWeight: '700', color: palette.white, letterSpacing: 0.5 },
  sub: { color: palette.mutedLight, marginTop: 8, fontSize: 15 },

  cardRow: { flexDirection: 'row', justifyContent: 'space-between', padding: 20 },
  statCard: {
    flex: 1,
    marginHorizontal: 6,
    padding: 20,
    backgroundColor: palette.card,
    borderRadius: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: palette.neonYellow,
    shadowColor: palette.neonYellow,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  statNum: { fontSize: 24, fontWeight: '800', color: palette.orange },
  statLabel: { color: palette.mutedLight, marginTop: 8, fontSize: 13 },

  actionBtn: {
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
  actionText: { color: palette.white, fontWeight: '700', fontSize: 16 },
});