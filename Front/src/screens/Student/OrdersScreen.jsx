// src/screens/Student/OrdersScreen.jsx
import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';

export default function OrdersScreen({ navigation }) {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    // TODO: replace with API call to fetch user's orders
    setOrders([
      {
        id: 'o1',
        status: 'Preparing',
        total: 120,
        placedAt: '2025-11-20T12:05:00',
        vendor: { id: 'v1', name: 'Canteen A' },
        items: [
          { id: 'm1', name: 'Veg Burger', qty: 1, price: 55 },
          { id: 'm2', name: 'Fries', qty: 1, price: 40 },
        ],
        reviewed: false,
      },
      {
        id: 'o2',
        status: 'Ready',
        total: 85,
        placedAt: '2025-11-18T13:00:00',
        vendor: { id: 'v2', name: 'Cafe B' },
        items: [{ id: 'm3', name: 'Cold Coffee', qty: 1, price: 85 }],
        reviewed: true,
      },
    ]);
  }, []);

  function openOrder(order) {
    navigation.navigate('OrderDetail', { order });
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>Orders</Text>
        <Text style={styles.sub}>Tap an order to see details or write a review</Text>
      </View>

      <FlatList
        data={orders}
        keyExtractor={o => o.id}
        contentContainerStyle={{ padding: 16 }}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card} onPress={() => openOrder(item)}>
            <View style={{ flex: 1 }}>
              <Text style={styles.orderId}>Order #{item.id}</Text>
              <Text style={styles.vendor}>{item.vendor.name}</Text>
              <Text style={styles.meta}>Placed: {new Date(item.placedAt).toLocaleString()}</Text>
            </View>

            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.total}>₹{item.total}</Text>
              <Text style={[styles.status, item.status === 'Ready' ? styles.ready : styles.preparing]}>{item.status}</Text>
              <Text style={styles.reviewed}>{item.reviewed ? 'Reviewed' : 'Not reviewed'}</Text>
            </View>
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f7f3ec' },
  header: { padding: 16 },
  title: { fontSize: 20, fontWeight: '700', color: '#0f1724' },
  sub: { color: '#6b7280', marginTop: 6 },

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

  reviewed: { marginTop: 6, color: '#6b7280', fontSize: 12 },
});