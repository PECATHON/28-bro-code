// src/screens/Student/OrderStatusScreen.jsx
import React, { useEffect, useState } from "react";
import { View, Text, ActivityIndicator, Alert } from "react-native";
import supabase from "../../lib/supabaseClient";
import { getStudentOrders } from "../../api/orders";

export default function OrderStatusScreen({ route }) {
  const { orderId, userId } = route.params;
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  async function fetchOrder() {
    try {
      setLoading(true);
      const orders = await getStudentOrders(userId);
      const found = orders.find(o => o.id === orderId);
      setOrder(found || null);
    } catch (err) {
      console.error("fetchOrder err:", err);
      Alert.alert("Error", "Unable to fetch order status");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchOrder();

    // subscribe to realtime order updates for this order (optional)
    const channel = supabase
      .channel(`order-${orderId}`)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "orders", filter: `id=eq.${orderId}` }, payload => {
        setOrder(payload.new);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [orderId]);

  if (loading) return <ActivityIndicator style={{ marginTop: 20 }} />;

  if (!order) return <View style={{ padding: 16 }}><Text>No order found</Text></View>;

  return (
    <View style={{ padding: 16 }}>
      <Text style={{ fontWeight: "700", fontSize: 18 }}>Order {order.id}</Text>
      <Text style={{ marginTop: 8 }}>Status: {order.status}</Text>
      <Text style={{ marginTop: 8 }}>Total: ₹{order.total_amount}</Text>
      <Text style={{ marginTop: 8 }}>Placed at: {new Date(order.created_at).toLocaleString()}</Text>
      <Text style={{ marginTop: 8 }}>Estimated Pickup: {order.estimated_pickup_time ? new Date(order.estimated_pickup_time).toLocaleString() : "—"}</Text>
    </View>
  );
}
