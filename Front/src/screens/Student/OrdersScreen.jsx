// src/screens/Student/OrdersScreen.jsx
import React, { useEffect, useState, useContext, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, SafeAreaView, ActivityIndicator, RefreshControl, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { AuthContext } from '../../contexts/AuthContext';
// DISABLED: Notification system hidden to avoid "No project id" error
// import { notifyOrderStatusChange, requestNotificationPermissions } from '../../services/notifications';

const BACKEND_BASE = 'http://172.31.68.164:3000';

export default function OrdersScreen({ navigation }) {
  const { user } = useContext(AuthContext);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [previousOrders, setPreviousOrders] = useState([]); // Track previous orders for notification detection

  // DISABLED: Notification system hidden to avoid "No project id" error
  // useEffect(() => {
  //   requestNotificationPermissions();
  // }, []);

  const fetchOrders = useCallback(async (isRefresh = false) => {
    console.log('📦 OrdersScreen - fetchOrders called', isRefresh ? '(refresh)' : '(initial)');
    console.log('📦 User:', user ? { id: user.id, email: user.email, name: user.name } : 'null');
    
    if (!user?.id) {
      console.warn('⚠️ No user.id available, cannot fetch orders');
      setLoading(false);
      setOrders([]);
      setError('No user ID available. Please log in again.');
      return;
    }

    try {
      // First, test the API connection
      const testUrl = `${BACKEND_BASE}/api/orders/test`;
      console.log('🧪 Testing orders API:', testUrl);
      
      try {
        const testRes = await fetch(testUrl, { method: 'GET', headers: { 'Content-Type': 'application/json' } });
        const testData = await testRes.json();
        console.log('🧪 Test result:', testData);
      } catch (testErr) {
        console.warn('⚠️ Test endpoint failed (non-critical):', testErr.message);
      }

      // Now fetch user orders
      const url = `${BACKEND_BASE}/api/orders?userId=${encodeURIComponent(user.id)}`;
      console.log('📦 Fetching orders from database:', url);
      console.log('📦 User ID being used:', user.id);
      
      const res = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        cache: 'no-store', // Force no cache
      });

      console.log('📦 Orders API response status:', res.status);
      console.log('📦 Orders API response headers:', res.headers);

      const responseText = await res.text();
      console.log('📦 Raw response:', responseText.substring(0, 500));

      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseErr) {
        console.error('❌ Failed to parse JSON response:', parseErr);
        setError(`Invalid response from server: ${responseText.substring(0, 100)}`);
        setOrders([]);
        setLoading(false);
        setRefreshing(false);
        return;
      }

      if (!res.ok) {
        console.error('❌ API returned error:', data);
        setError(data.message || data.error || 'Failed to fetch orders');
        setOrders([]);
        setLoading(false);
        setRefreshing(false);
        return;
      }

      console.log('📦 Parsed response:', data);
      console.log('📦 Orders array:', data.orders);
      console.log('📦 Orders count:', data.orders?.length || 0);
      
      const newOrders = Array.isArray(data.orders) ? data.orders : [];
      console.log('📦 Order IDs:', newOrders.map(o => o?.id?.substring(0, 8)).join(', ') || 'none');
      
      if (newOrders.length > 0) {
        console.log('📦 First order sample:', JSON.stringify(newOrders[0], null, 2));
      }
      
      // Check for status changes and send notifications
      setPreviousOrders(prev => {
        const previousOrderMap = new Map((prev || []).map(o => [o.id, o]));
        
        newOrders.forEach(order => {
          const prevOrder = previousOrderMap.get(order.id);
          // If order status changed, send notification
          if (prevOrder && prevOrder.status !== order.status) {
            const vendorName = order.vendor?.name || 'Vendor';
            // Map frontend status to backend status for notification
            const backendStatus = order.status === 'Preparing' ? 'preparing' :
                                 order.status === 'Ready' ? 'ready' :
                                 order.status === 'completed' ? 'completed' :
                                 order.status === 'cancelled' ? 'cancelled' :
                                 order.status;
            
            console.log('📱 Order status changed (notification disabled):', order.id, vendorName, backendStatus);
            // DISABLED: Notification system hidden to avoid "No project id" error
            // notifyOrderStatusChange(order.id, vendorName, backendStatus);
          }
        });
        
        return newOrders; // Update previous orders
      });
      
      console.log('✅ Setting orders state with', newOrders.length, 'orders');
      setOrders(newOrders);
      setError(null);
    } catch (error) {
      console.error('❌ Error fetching orders:', error);
      console.error('❌ Error details:', error.message, error.stack);
      setError(error.message || 'Network error. Check your connection.');
      setOrders([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id]);

  // Initial fetch on mount
  useEffect(() => {
    fetchOrders();
  }, [user?.id, fetchOrders]);

  // Real-time: Refresh when screen comes into focus (after payment or navigation)
  useFocusEffect(
    useCallback(() => {
      console.log('🔄 OrdersScreen focused - refreshing orders from database');
      fetchOrders(true);
    }, [fetchOrders])
  );

  // Real-time: Auto-refresh every 30 seconds when screen is active
  useEffect(() => {
    if (!user?.id) return;

    const interval = setInterval(() => {
      console.log('🔄 Auto-refreshing orders (30s interval)');
      fetchOrders(true);
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [user?.id, fetchOrders]);

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
          <ActivityIndicator size="large" color={palette.orange} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Orders {orders.length > 0 && `(${orders.length})`}</Text>
            <Text style={styles.sub}>Tap an order to see details or write a review</Text>
            {orders.length === 0 && !loading && (
              <Text style={{ color: palette.muted, fontSize: 11, marginTop: 4 }}>
                Pull down to refresh or tap 🔄
              </Text>
            )}
          </View>
          <TouchableOpacity onPress={onRefresh} style={styles.refreshBtn} disabled={refreshing}>
            <Text style={styles.refreshBtnText}>{refreshing ? '⏳' : '🔄'}</Text>
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
        renderItem={({ item }) => {
          // Ensure we have valid data
          const orderId = item.id || 'Unknown';
          const vendorName = item.vendor?.name || 'Unknown Vendor';
          const total = item.total || 0;
          const status = item.status || 'confirmed';
          const placedAt = item.placedAt || item.created_at || new Date().toISOString();
          const itemsCount = item.items?.length || 0;
          
          return (
            <TouchableOpacity style={styles.card} onPress={() => openOrder(item)}>
              <View style={{ flex: 1 }}>
                <Text style={styles.orderId}>Order #{orderId.substring(0, 8)}...</Text>
                <Text style={styles.vendor}>{vendorName}</Text>
                <Text style={styles.meta}>
                  {itemsCount} item{itemsCount !== 1 ? 's' : ''} • Placed: {new Date(placedAt).toLocaleString()}
                </Text>
              </View>

              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.total}>₹{total.toFixed(2)}</Text>
                <Text style={[
                  styles.status,
                  status === 'ready' || status === 'completed' ? styles.ready :
                  status === 'preparing' || status === 'confirmed' ? styles.preparing :
                  status === 'cancelled' ? styles.cancelled : styles.preparing
                ]}>
                  {status === 'confirmed' ? 'Confirmed' :
                   status === 'preparing' ? 'Preparing' :
                   status === 'ready' ? 'Ready' :
                   status === 'completed' ? 'Completed' :
                   status === 'cancelled' ? 'Cancelled' :
                   status}
                </Text>
                <Text style={styles.reviewed}>{item.reviewed ? 'Reviewed' : 'Not reviewed'}</Text>
              </View>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <View style={{ padding: 40, alignItems: 'center' }}>
            <Text style={{ color: palette.white, fontSize: 18, fontWeight: '600', marginBottom: 8 }}>
              {error ? 'Error Loading Orders' : 'No orders yet'}
            </Text>
            <Text style={{ color: palette.mutedLight, marginTop: 8, textAlign: 'center', paddingHorizontal: 20 }}>
              {error ? 'There was an issue fetching your orders' : 'Your orders will appear here after you place an order'}
            </Text>
            
            {error && (
              <View style={{ marginTop: 16, padding: 12, backgroundColor: palette.card, borderRadius: 12, maxWidth: '90%', borderWidth: 1, borderColor: palette.red }}>
                <Text style={{ color: palette.red, fontSize: 12, textAlign: 'center', fontWeight: '600', marginBottom: 4 }}>
                  Error Details:
                </Text>
                <Text style={{ color: palette.mutedLight, fontSize: 11, textAlign: 'center' }}>
                  {error}
                </Text>
              </View>
            )}
            
            {user?.id ? (
              <View style={{ marginTop: 16, padding: 12, backgroundColor: palette.card, borderRadius: 12, maxWidth: '90%', borderWidth: 1, borderColor: palette.cardLight }}>
                <Text style={{ color: palette.mutedLight, fontSize: 11, fontFamily: 'monospace', marginBottom: 4 }}>
                  User ID: {user.id}
                </Text>
                <Text style={{ color: palette.mutedLight, fontSize: 11, marginTop: 4 }}>
                  API Endpoint: {BACKEND_BASE}/api/orders
                </Text>
                <Text style={{ color: palette.mutedLight, fontSize: 11, marginTop: 4 }}>
                  Full URL: {BACKEND_BASE}/api/orders?userId={user.id.substring(0, 20)}...
                </Text>
              </View>
            ) : (
              <View style={{ marginTop: 16, padding: 12, backgroundColor: palette.card, borderRadius: 12, maxWidth: '90%', borderWidth: 1, borderColor: palette.red }}>
                <Text style={{ color: palette.red, fontSize: 12, fontWeight: '600', textAlign: 'center' }}>
                  ⚠️ No user ID available
                </Text>
                <Text style={{ color: palette.mutedLight, fontSize: 11, marginTop: 4, textAlign: 'center' }}>
                  Please log out and log in again
                </Text>
              </View>
            )}
            
            <View style={{ flexDirection: 'row', marginTop: 20, gap: 12 }}>
              <TouchableOpacity
                style={{ 
                  padding: 14, 
                  backgroundColor: palette.orange, 
                  borderRadius: 25, 
                  minWidth: 120,
                  borderWidth: 1,
                  borderColor: palette.neonYellow,
                  shadowColor: palette.neonYellow,
                  shadowOffset: { width: 0, height: 0 },
                  shadowOpacity: 0.3,
                  shadowRadius: 8,
                  elevation: 8,
                }}
                onPress={() => {
                  console.log('🔄 Manual retry from empty state');
                  setLoading(true);
                  fetchOrders(true);
                }}
              >
                <Text style={{ color: palette.white, fontWeight: '700', fontSize: 16, textAlign: 'center' }}>Refresh</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{ 
                  padding: 14, 
                  backgroundColor: palette.card, 
                  borderRadius: 25, 
                  minWidth: 120,
                  borderWidth: 1,
                  borderColor: palette.neonYellow,
                  shadowColor: palette.neonYellow,
                  shadowOffset: { width: 0, height: 0 },
                  shadowOpacity: 0.25,
                  shadowRadius: 8,
                  elevation: 8,
                }}
                onPress={() => navigation.navigate('StudentTabs', { screen: 'Home' })}
              >
                <Text style={{ color: palette.white, fontWeight: '700', fontSize: 16, textAlign: 'center' }}>Shop Now</Text>
              </TouchableOpacity>
            </View>
            
            <TouchableOpacity
              style={{ 
                marginTop: 12, 
                padding: 12, 
                backgroundColor: palette.card, 
                borderRadius: 12,
                borderWidth: 1,
                borderColor: palette.neonYellow,
                shadowColor: palette.neonYellow,
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.4,
                shadowRadius: 6,
                elevation: 6,
              }}
              onPress={async () => {
                // Test the API directly
                try {
                  const testUrl = `${BACKEND_BASE}/api/orders/test`;
                  const testRes = await fetch(testUrl);
                  const testData = await testRes.json();
                  Alert.alert('API Test', `Total orders in DB: ${testData.totalOrders || 0}\n\nCheck console for details.`);
                  console.log('🧪 API Test Result:', testData);
                } catch (err) {
                  Alert.alert('Test Failed', err.message);
                }
              }}
            >
             
            </TouchableOpacity>
          </View>
        }
      />
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
  green: '#16a34a',
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: palette.darkBlue },
  header: { padding: 16, paddingTop: 20 },
  title: { fontSize: 22, fontWeight: '700', color: palette.white, letterSpacing: 0.5 },
  sub: { color: palette.mutedLight, marginTop: 6, fontSize: 13 },
  refreshBtn: {
    padding: 10,
    borderRadius: 12,
    backgroundColor: palette.card,
    minWidth: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: palette.neonYellow,
    shadowColor: palette.neonYellow,
    shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  refreshBtnText: { fontSize: 18, color: palette.white },

  card: {
    backgroundColor: palette.card,
    padding: 16,
    borderRadius: 20,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: palette.neonYellow,
    shadowColor: palette.neonYellow,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  orderId: { fontWeight: '800', color: palette.white, fontSize: 16 },
  vendor: { color: palette.mutedLight, marginTop: 6, fontSize: 14 },
  meta: { color: palette.muted, marginTop: 6, fontSize: 12 },

  total: { fontWeight: '800', fontSize: 18, color: palette.orange },
  status: { marginTop: 8, fontWeight: '700', fontSize: 13 },
  ready: { color: palette.green },
  preparing: { color: palette.orange },
  cancelled: { color: palette.red },

  reviewed: { marginTop: 6, color: palette.muted, fontSize: 11 },
});
