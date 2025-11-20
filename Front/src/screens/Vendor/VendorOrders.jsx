// src/screens/Vendor/VendorOrders.jsx
import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';

export default function VendorOrders() {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    // TODO: load vendor orders from API
    setOrders([
      { id: 'o1', customer: 'Rahul', items: 2, total: 120, status: 'Received', placedAt: '11:20' },
      { id: 'o2', customer: 'Priya', items: 1, total: 85, status: 'Preparing', placedAt: '11:40' },
    ]);
  }, []);

  function changeStatus(id) {
    // placeholder: call API to update order status and refresh
    setOrders(o => o.map(x => (x.id === id ? { ...x, status: 'Ready' } : x)));
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f7f3ec' }}>
      <View style={{ padding: 16 }}>
        <Text style={{ fontSize: 20, fontWeight: '700', color: '#0f1724' }}>Orders</Text>
      </View>

      <FlatList
        data={orders}
        keyExtractor={i => i.id}
        contentContainerStyle={{ padding: 16 }}
        renderItem={({ item }) => (
          <View style={styles.orderCard}>
            <View style={{ flex: 1 }}>
              <Text style={styles.orderId}>Order #{item.id}</Text>
              <Text style={styles.orderMeta}>{item.customer} • {item.items} items</Text>
              <Text style={styles.orderMeta}>Placed at: {item.placedAt}</Text>
            </View>

            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.orderTotal}>₹{item.total}</Text>
              <Text style={styles.status}>{item.status}</Text>

              {item.status !== 'Ready' && (
                <TouchableOpacity style={styles.actionBtn} onPress={() => changeStatus(item.id)}>
                  <Text style={styles.actionText}>Mark Ready</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  orderCard: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 10,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 1,
  },
  orderId: { fontWeight: '700', color: '#0f1724' },
  orderMeta: { color: '#6b7280', marginTop: 4 },
  orderTotal: { fontWeight: '800', marginBottom: 6 },
  status: { color: '#c59d5f', fontWeight: '700' },

  actionBtn: {
    marginTop: 8,
    backgroundColor: '#0f1724',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
  },
  actionText: { color: '#fff', fontWeight: '700' },
});