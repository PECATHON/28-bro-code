// src/screens/Student/OrdersScreen.jsx
import React, { useEffect, useState, useContext } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, SafeAreaView, ActivityIndicator, RefreshControl } from 'react-native';
import { AuthContext } from '../../contexts/AuthContext';

const BACKEND_BASE = 'http://172.31.68.164:3000';

export default function OrdersScreen({ navigation }) {
  const { user } = useContext(AuthContext);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const fetchOrders = async (isRefresh = false) => {
    console.log('📦 OrdersScreen - fetchOrders called', isRefresh ? '(refresh)' : '(initial)');
    console.log('📦 User:', user ? { id: user.id, email: user.email, name: user.name } : 'null');
    
    if (!user?.id) {
      console.warn('⚠️ No user.id available, cannot fetch orders');
      setLoading(false);
      setOrders([]);
      return;
    }

    try {
      const url = `${BACKEND_BASE}/api/orders?userId=${user.id}`;
      console.log('📦 Fetching orders from database (real-time):', url);
      
      const res = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        // Ensure fresh data - no cache
        cache: 'no-cache',
      });

      console.log('📦 Orders API response status:', res.status);

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: 'Failed to fetch orders' }));
        console.error('❌ Failed to fetch orders:', errorData);
        setError(errorData.message || 'Failed to fetch orders');
        setOrders([]);
        return;
      }

      const data = await res.json();
      console.log('📦 Orders received from database:', data.orders?.length || 0);
      console.log('📦 Order IDs:', data.orders?.map(o => o.id.substring(0, 8)).join(', ') || 'none');
      
      setOrders(data.orders || []);
      setError(null);
    } catch (error) {
      console.error('❌ Error fetching orders:', error);
      console.error('❌ Error details:', error.message, error.stack);
      setError(error.message || 'Network error');
      setOrders([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Initial fetch on mount
  useEffect(() => {
    fetchOrders();
  }, [user?.id]);

  // Real-time: Refresh when screen comes into focus (after payment or navigation)
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      console.log('🔄 OrdersScreen focused - refreshing orders from database');
      fetchOrders(true);
    });
    return unsubscribe;
  }, [navigation, user?.id]);

  // Real-time: Auto-refresh every 30 seconds when screen is active
  useEffect(() => {
    if (!user?.id) return;

    const interval = setInterval(() => {
      console.log('🔄 Auto-refreshing orders (30s interval)');
      fetchOrders(true);
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [user?.id]);

  const onRefresh = () => {
    console.log('🔄 Manual refresh triggered');
    setRefreshing(true);
    fetchOrders(true);
  };

  function openOrder(order) {
    navigation.navigate('OrderDetail', { order });
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <Text style={styles.title}>Orders</Text>
        </View>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#0f1724" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View>
            <Text style={styles.title}>Orders {orders.length > 0 && `(${orders.length})`}</Text>
            <Text style={styles.sub}>Tap an order to see details or write a review</Text>
          </View>
          <TouchableOpacity onPress={onRefresh} style={styles.refreshBtn}>
            <Text style={styles.refreshBtnText}>🔄</Text>
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={orders}
        keyExtractor={o => o.id}
        contentContainerStyle={{ padding: 16 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card} onPress={() => openOrder(item)}>
            <View style={{ flex: 1 }}>
              <Text style={styles.orderId}>Order #{item.id.substring(0, 8)}...</Text>
              <Text style={styles.vendor}>{item.vendor?.name || 'Unknown Vendor'}</Text>
              <Text style={styles.meta}>Placed: {new Date(item.placedAt).toLocaleString()}</Text>
            </View>

            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.total}>₹{item.total.toFixed(2)}</Text>
              <Text style={[
                styles.status,
                item.status === 'Ready' || item.status === 'completed' ? styles.ready :
                item.status === 'Preparing' || item.status === 'confirmed' ? styles.preparing :
                item.status === 'cancelled' ? styles.cancelled : styles.preparing
              ]}>
                {item.status === 'confirmed' ? 'Preparing' :
                 item.status === 'completed' ? 'Ready' :
                 item.status}
              </Text>
              <Text style={styles.reviewed}>{item.reviewed ? 'Reviewed' : 'Not reviewed'}</Text>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={{ padding: 40, alignItems: 'center' }}>
            <Text style={{ color: '#6b7280', fontSize: 16 }}>No orders yet</Text>
            <Text style={{ color: '#9aa1a9', marginTop: 8 }}>Your orders will appear here</Text>
            {error && (
              <Text style={{ color: '#ef4444', marginTop: 12, fontSize: 12, textAlign: 'center' }}>
                Error: {error}
              </Text>
            )}
            {user?.id ? (
              <Text style={{ color: '#9aa1a9', marginTop: 8, fontSize: 12 }}>
                User ID: {user.id.substring(0, 8)}...
              </Text>
            ) : (
              <Text style={{ color: '#ef4444', marginTop: 8, fontSize: 12 }}>
                No user ID available
              </Text>
            )}
            <TouchableOpacity
              style={{ marginTop: 16, padding: 10, backgroundColor: '#0f1724', borderRadius: 8 }}
              onPress={fetchOrders}
            >
              <Text style={{ color: '#fff', fontWeight: '700' }}>Retry</Text>
            </TouchableOpacity>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f7f3ec' },
  header: { padding: 16 },
  title: { fontSize: 20, fontWeight: '700', color: '#0f1724' },
  sub: { color: '#6b7280', marginTop: 6 },
  refreshBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#0f1724',
    minWidth: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  refreshBtnText: { fontSize: 18 },

  card: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 10,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 1,
  },
  orderId: { fontWeight: '800', color: '#0f1724' },
  vendor: { color: '#6b7280', marginTop: 6 },
  meta: { color: '#9aa1a9', marginTop: 6 },

  total: { fontWeight: '800', fontSize: 16 },
  status: { marginTop: 8, fontWeight: '700' },
  ready: { color: '#16a34a' },
  preparing: { color: '#f59e0b' },
  cancelled: { color: '#ef4444' },

  reviewed: { marginTop: 6, color: '#6b7280', fontSize: 12 },
});
