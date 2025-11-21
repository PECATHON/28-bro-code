// src/screens/Vendor/VendorOrders.jsx
import React, { useEffect, useState, useContext } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { AuthContext } from '../../contexts/AuthContext';

const BACKEND_BASE = 'http://172.31.68.164:3000';

export default function VendorOrders({ navigation }) {
  const { user } = useContext(AuthContext);
  const vendorId = user?.id; // Vendor's ID is the same as their user ID
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(null);

  const fetchOrders = async (isRefresh = false) => {
    if (!vendorId) {
      console.warn('⚠️ No vendorId available');
      setLoading(false);
      setOrders([]);
      return;
    }

    try {
      console.log('📦 Fetching vendor orders from database (real-time):', vendorId, isRefresh ? '(refresh)' : '(initial)');
      const res = await fetch(`${BACKEND_BASE}/api/orders/vendor/${vendorId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        // Ensure fresh data - no cache
        cache: 'no-cache',
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: 'Failed to fetch orders' }));
        console.error('❌ Failed to fetch vendor orders:', errorData);
        Alert.alert('Error', errorData.message || 'Failed to load orders');
        setOrders([]);
        return;
      }

      const data = await res.json();
      console.log('📦 Vendor orders received from database:', data.orders?.length || 0);
      console.log('📦 Order IDs:', data.orders?.map(o => o.id.substring(0, 8)).join(', ') || 'none');
      setOrders(data.orders || []);
    } catch (error) {
      console.error('❌ Error fetching vendor orders:', error);
      Alert.alert('Error', 'Could not load orders. Check your connection.');
      setOrders([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Initial fetch on mount
  useEffect(() => {
    fetchOrders();
  }, [vendorId]);

  // Real-time: Refresh when screen comes into focus
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      console.log('🔄 VendorOrders focused - refreshing orders from database');
      fetchOrders(true);
    });
    return unsubscribe;
  }, [navigation, vendorId]);

  // Real-time: Auto-refresh every 30 seconds when screen is active
  useEffect(() => {
    if (!vendorId) return;

    const interval = setInterval(() => {
      console.log('🔄 Auto-refreshing vendor orders (30s interval)');
      fetchOrders(true);
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [vendorId]);

  const onRefresh = () => {
    console.log('🔄 Manual refresh triggered');
    setRefreshing(true);
    fetchOrders(true);
  };

  async function changeStatus(orderId, newStatus) {
    if (!vendorId) {
      Alert.alert('Error', 'Vendor ID not available');
      return;
    }

    setUpdatingStatus(orderId);
    try {
      const res = await fetch(`${BACKEND_BASE}/api/orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: newStatus,
          vendorId: vendorId,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: 'Failed to update status' }));
        throw new Error(errorData.message || 'Failed to update order status');
      }

      // Update local state
      setOrders(prevOrders =>
        prevOrders.map(order =>
          order.id === orderId ? { ...order, status: newStatus } : order
        )
      );

      Alert.alert('Success', 'Order status updated');
    } catch (error) {
      console.error('Error updating order status:', error);
      Alert.alert('Error', error.message || 'Could not update order status');
    } finally {
      setUpdatingStatus(null);
    }
  }

  function formatDate(iso) {
    if (!iso) return 'Unknown time';
    const d = new Date(iso);
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  }

  function getStatusColor(status) {
    switch (status) {
      case 'confirmed':
      case 'preparing':
        return '#f59e0b'; // Orange
      case 'ready':
      case 'completed':
        return '#16a34a'; // Green
      case 'cancelled':
        return '#ef4444'; // Red
      default:
        return '#6b7280'; // Gray
    }
  }

  function getStatusLabel(status) {
    switch (status) {
      case 'confirmed':
        return 'Confirmed';
      case 'preparing':
        return 'Preparing';
      case 'ready':
        return 'Ready';
      case 'completed':
        return 'Completed';
      case 'cancelled':
        return 'Cancelled';
      default:
        return status;
    }
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
            <Text style={styles.sub}>Manage incoming orders</Text>
          </View>
          <TouchableOpacity onPress={onRefresh} style={styles.refreshBtn}>
            <Text style={styles.refreshBtnText}>🔄</Text>
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={orders}
        keyExtractor={item => item.id}
        contentContainerStyle={{ padding: 16 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        renderItem={({ item }) => {
          const isUpdating = updatingStatus === item.id;
          const canMarkReady = item.status === 'confirmed' || item.status === 'preparing';
          const canMarkCompleted = item.status === 'ready';

          return (
            <View style={styles.orderCard}>
              <View style={{ flex: 1 }}>
                <Text style={styles.orderId}>Order #{item.id.substring(0, 8)}...</Text>
                <Text style={styles.orderMeta}>
                  {item.customer} • {item.itemsCount} item{item.itemsCount !== 1 ? 's' : ''}
                </Text>
                <Text style={styles.orderMeta}>Placed at: {formatDate(item.placedAt)}</Text>
                {item.items && item.items.length > 0 && (
                  <View style={styles.itemsList}>
                    {item.items.slice(0, 3).map((orderItem, idx) => (
                      <Text key={idx} style={styles.itemText}>
                        • {orderItem.name} × {orderItem.qty || 1}
                      </Text>
                    ))}
                    {item.items.length > 3 && (
                      <Text style={styles.itemText}>... and {item.items.length - 3} more</Text>
                    )}
                  </View>
                )}
              </View>

              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.orderTotal}>₹{item.total.toFixed(2)}</Text>
                <Text style={[styles.status, { color: getStatusColor(item.status) }]}>
                  {getStatusLabel(item.status)}
                </Text>

                {canMarkReady && (
                  <TouchableOpacity
                    style={[styles.actionBtn, isUpdating && styles.actionBtnDisabled]}
                    onPress={() => changeStatus(item.id, 'ready')}
                    disabled={isUpdating}
                  >
                    {isUpdating ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Text style={styles.actionText}>Mark Ready</Text>
                    )}
                  </TouchableOpacity>
                )}

                {canMarkCompleted && (
                  <TouchableOpacity
                    style={[styles.actionBtn, styles.actionBtnComplete, isUpdating && styles.actionBtnDisabled]}
                    onPress={() => changeStatus(item.id, 'completed')}
                    disabled={isUpdating}
                  >
                    {isUpdating ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Text style={styles.actionText}>Mark Completed</Text>
                    )}
                  </TouchableOpacity>
                )}
              </View>
            </View>
          );
        }}
        ListEmptyComponent={
          <View style={{ padding: 40, alignItems: 'center' }}>
            <Text style={{ color: '#6b7280', fontSize: 16 }}>No orders yet</Text>
            <Text style={{ color: '#9aa1a9', marginTop: 8 }}>Orders will appear here when customers place them</Text>
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
  refreshBtnText: { fontSize: 18, color: '#fff' },

  orderCard: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 10,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
    elevation: 1,
  },
  orderId: { fontWeight: '700', color: '#0f1724', fontSize: 16 },
  orderMeta: { color: '#6b7280', marginTop: 4, fontSize: 14 },
  orderTotal: { fontWeight: '800', marginBottom: 6, fontSize: 18 },
  status: { fontWeight: '700', marginBottom: 8, fontSize: 14 },

  itemsList: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  itemText: {
    color: '#6b7280',
    fontSize: 12,
    marginTop: 2,
  },

  actionBtn: {
    marginTop: 8,
    backgroundColor: '#0f1724',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 100,
    alignItems: 'center',
  },
  actionBtnComplete: {
    backgroundColor: '#16a34a',
  },
  actionBtnDisabled: {
    opacity: 0.6,
  },
  actionText: { color: '#fff', fontWeight: '700', fontSize: 12 },
});
