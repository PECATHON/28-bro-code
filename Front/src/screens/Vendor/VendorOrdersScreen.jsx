// src/screens/Vendor/VendorOrdersScreen.jsx
import React, { useEffect, useState } from "react";
import { View, Text, FlatList, TouchableOpacity, Alert } from "react-native";
import supabase from "../../lib/supabaseClient";
import { getVendorOrders } from "../../api/orders";

const BACKEND_BASE = "http://172.31.68.127:3000"; // if needed

export default function VendorOrdersScreen({ route, navigation }) {
  const vendorId = route.params?.vendorId;
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let channel;
    async function init() {
      try {
        setLoading(true);
        const list = await getVendorOrders(vendorId);
        setOrders(list);
      } catch (err) {
        console.error("initial vendor orders error:", err);
      } finally {
        setLoading(false);
      }

      // subscribe to realtime events for this vendor
      channel = supabase
        .channel(`orders-vendor-${vendorId}`)
        .on("postgres_changes", { event: "INSERT", schema: "public", table: "orders", filter: `vendor_id=eq.${vendorId}` }, payload => {
          setOrders(prev => [payload.new, ...prev]);
          Alert.alert("New order", `Order ${payload.new.id} received`);
        })
        .on("postgres_changes", { event: "UPDATE", schema: "public", table: "orders", filter: `vendor_id=eq.${vendorId}` }, payload => {
          setOrders(prev => prev.map(o => (o.id === payload.new.id ? payload.new : o)));
        })
        .subscribe();
    }

    init();

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, [vendorId]);

  function renderOrder({ item }) {
    return (
      <TouchableOpacity onPress={() => navigation.navigate("VendorOrderDetails", { orderId: item.id })}>
        <View style={{ padding: 12, borderBottomWidth: 1 }}>
          <Text style={{ fontWeight: "700" }}>{item.id}</Text>
          <Text>Status: {item.status}</Text>
          <Text>Total: ₹{item.total_amount}</Text>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <FlatList data={orders} keyExtractor={i => i.id} renderItem={renderOrder} />
    </View>
  );
}
