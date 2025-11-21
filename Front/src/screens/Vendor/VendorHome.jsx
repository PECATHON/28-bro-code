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
          <ActivityIndicator size="large" color="#0f1724" />
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