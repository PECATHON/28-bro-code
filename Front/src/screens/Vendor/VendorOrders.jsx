// src/screens/Vendor/VendorOrders.jsx
import React, { useEffect, useState, useContext, useCallback } from 'react';
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
import { useFocusEffect } from '@react-navigation/native';
import { AuthContext } from '../../contexts/AuthContext';
// DISABLED: Notification system hidden to avoid "No project id" error
// import { notifyNewOrder, requestNotificationPermissions } from '../../services/notifications';

import { BACKEND_BASE } from '../../config/api';

export default function VendorOrders({ navigation }) {
  const { user } = useContext(AuthContext);
  const vendorId = user?.id; // Vendor's ID is the same as their user ID
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(null);
  const [previousOrderIds, setPreviousOrderIds] = useState(new Set());

  // DISABLED: Notification system hidden to avoid "No project id" error
  // useEffect(() => {
  //   requestNotificationPermissions();
  // }, []);

  const fetchOrders = useCallback(async (isRefresh = false) => {
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
        if (!isRefresh) {
          Alert.alert('Error', errorData.message || 'Failed to load orders');
        }
        setOrders([]);
        return;
      }

      const data = await res.json();
      console.log('📦 Vendor orders API response:', data);
      const fetchedOrders = data.orders || [];
      console.log('📦 Vendor orders received from database:', fetchedOrders.length);
      console.log('📦 Order IDs:', fetchedOrders.map(o => o.id?.substring(0, 8)).join(', ') || 'none');
      console.log('📦 Full orders data:', JSON.stringify(fetchedOrders, null, 2));
      
      // Check for new orders and send notifications
      const currentOrderIds = new Set(fetchedOrders.map(o => o.id));
      const newOrders = fetchedOrders.filter(o => !previousOrderIds.has(o.id));
      
              if (newOrders.length > 0) {
                console.log('🆕 New orders detected:', newOrders.length);
                // DISABLED: Notification system hidden to avoid "No project id" error
                // newOrders.forEach(order => {
                //   const customerName = order.customer || 'Customer';
                //   const total = order.total || 0;
                //   const itemsCount = order.itemsCount || order.items?.length || 0;
                //   console.log('📱 Sending new order notification to vendor:', order.id, customerName, `₹${total.toFixed(2)}`);
                //   notifyNewOrder(order.id, customerName, total);
                // });
                
                // Show alert for new orders (only if not initial load)
                newOrders.forEach(order => {
                  const customerName = order.customer || 'Customer';
                  const total = order.total || 0;
                  const itemsCount = order.itemsCount || order.items?.length || 0;
                  if (previousOrderIds.size > 0) {
                    Alert.alert(
                      'New Order! 📦',
                      `New order from ${customerName}\n${itemsCount} item(s) • ₹${total.toFixed(2)}`,
                      [{ text: 'View Orders', onPress: () => {} }]
                    );
                  }
                });
              }
      
      // Update previous order IDs
      setPreviousOrderIds(currentOrderIds);
      setOrders(fetchedOrders);
    } catch (error) {
      console.error('❌ Error fetching vendor orders:', error);
      if (!isRefresh) {
        Alert.alert('Error', 'Could not load orders. Check your connection.');
      }
      setOrders([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [vendorId, orders]);

  // Initial fetch on mount
  useEffect(() => {
    fetchOrders();
  }, [vendorId]);

  // Real-time: Refresh when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      console.log('🔄 VendorOrders focused - refreshing orders from database');
      fetchOrders(true);
    }, [fetchOrders])
  );

  // Real-time: Auto-refresh every 15 seconds when screen is active (more frequent for vendors)
  useEffect(() => {
    if (!vendorId) return;

    const interval = setInterval(() => {
      console.log('🔄 Auto-refreshing vendor orders (15s interval)');
      fetchOrders(true);
    }, 15000); // Refresh every 15 seconds for real-time updates

    return () => clearInterval(interval);
  }, [vendorId, fetchOrders]);

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
          notifyStudent: true, // Always notify student on status change
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: 'Failed to update status' }));
        throw new Error(errorData.message || 'Failed to update order status');
      }

      const result = await res.json();
      
      // Update local state
      setOrders(prevOrders =>
        prevOrders.map(order =>
          order.id === orderId ? { ...order, status: newStatus } : order
        )
      );

      // Show success message based on status
      const statusMessages = {
        'preparing': 'Order is now under process. Student has been notified.',
        'ready': 'Order is prepared and ready. Student has been notified.',
        'completed': 'Order completed! Student has been notified.',
        'cancelled': 'Order has been rejected. Student has been notified.',
      };
      
      const message = statusMessages[newStatus] || 'Order status updated. Student has been notified.';
      Alert.alert('Status Updated ✅', message, [{ text: 'OK' }]);
      
      // Refresh orders to get latest data
      setTimeout(() => fetchOrders(true), 500);
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
        return '#3b82f6'; // Blue
      case 'preparing':
        return '#f59e0b'; // Orange
      case 'ready':
        return '#10b981'; // Green
      case 'completed':
        return '#16a34a'; // Dark Green
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
        return 'Under Process';
      case 'ready':
        return 'Prepared';
      case 'completed':
        return 'Completed';
      case 'cancelled':
        return 'Rejected';
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
          <ActivityIndicator size="large" color="#ff6b35" />
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
          // Status flow: confirmed -> preparing -> ready -> completed
          // Can also reject at any time
          const canMarkPreparing = item.status === 'confirmed';
          const canMarkReady = item.status === 'preparing';
          const canMarkCompleted = item.status === 'ready';
          const canReject = item.status !== 'cancelled' && item.status !== 'completed';

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

              <View style={{ alignItems: 'flex-end', minWidth: 120 }}>
                <Text style={styles.orderTotal}>₹{item.total.toFixed(2)}</Text>
                <Text style={[styles.status, { color: getStatusColor(item.status) }]}>
                  {getStatusLabel(item.status)}
                </Text>

                {/* Status Action Buttons */}
                {canMarkPreparing && (
                  <TouchableOpacity
                    style={[styles.actionBtn, styles.actionBtnPreparing, isUpdating && styles.actionBtnDisabled]}
                    onPress={() => changeStatus(item.id, 'preparing')}
                    disabled={isUpdating}
                  >
                    {isUpdating ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Text style={styles.actionText}>Under Process</Text>
                    )}
                  </TouchableOpacity>
                )}

                {canMarkReady && (
                  <TouchableOpacity
                    style={[styles.actionBtn, styles.actionBtnReady, isUpdating && styles.actionBtnDisabled]}
                    onPress={() => changeStatus(item.id, 'ready')}
                    disabled={isUpdating}
                  >
                    {isUpdating ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Text style={styles.actionText}>Mark Prepared</Text>
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

                {canReject && (
                  <TouchableOpacity
                    style={[styles.actionBtn, styles.actionBtnReject, isUpdating && styles.actionBtnDisabled]}
                    onPress={() => {
                      Alert.alert(
                        'Reject Order',
                        'Are you sure you want to reject this order?',
                        [
                          { text: 'Cancel', style: 'cancel' },
                          {
                            text: 'Reject',
                            style: 'destructive',
                            onPress: () => changeStatus(item.id, 'cancelled')
                          }
                        ]
                      );
                    }}
                    disabled={isUpdating}
                  >
                    {isUpdating ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Text style={styles.actionText}>Reject</Text>
                    )}
                  </TouchableOpacity>
                )}
              </View>
            </View>
          );
        }}
        ListEmptyComponent={
                  <View style={{ padding: 40, alignItems: 'center' }}>
                    <Text style={{ color: '#cbd5e1', fontSize: 16, fontWeight: '600' }}>No orders yet</Text>
                    <Text style={{ color: '#9aa1a9', marginTop: 8, fontSize: 14 }}>Orders will appear here when customers place them</Text>
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
  actionBtnPreparing: {
    backgroundColor: '#f59e0b', // Orange
  },
  actionBtnReady: {
    backgroundColor: '#10b981', // Green
  },
  actionBtnComplete: {
    backgroundColor: '#16a34a', // Dark Green
  },
  actionBtnReject: {
    backgroundColor: '#ef4444', // Red
  },
  actionBtnDisabled: {
    opacity: 0.6,
  },
  actionText: { color: '#fff', fontWeight: '700', fontSize: 12 },
});
