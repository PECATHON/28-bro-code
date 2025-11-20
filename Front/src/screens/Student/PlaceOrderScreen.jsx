// src/screens/Student/PlaceOrderScreen.jsx
import React, { useState } from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { placeOrder } from "../../api/orders";

export default function PlaceOrderScreen({ navigation, route }) {
  // route.params: { vendor } and you should have a cart state from previous screens
  const vendor = route.params?.vendor;
  const [cartItems, setCartItems] = useState(route.params?.cart || [
    // Example fallback (remove in production)
    // { item_id: null, name: "Sample Burger", quantity: 1, unit_price: 60 }
  ]);
  const [placing, setPlacing] = useState(false);

  const user = route.params?.user || { id: route.params?.user_id }; // pass auth user

  function calculateTotal(items) {
    return items.reduce((s, it) => s + (Number(it.quantity || 1) * Number(it.unit_price || 0)), 0);
  }

  async function onPlaceOrder() {
    if (!user?.id) {
      Alert.alert("Not signed in", "You must be signed in to place orders");
      return;
    }
    if (!vendor?.id) {
      Alert.alert("No vendor selected");
      return;
    }
    if (!cartItems.length) {
      Alert.alert("Cart empty", "Add items to cart before placing order");
      return;
    }

    setPlacing(true);
    try {
      // Build items for server (only item_id and quantity needed if you use menu_items)
      const items = cartItems.map(i => ({ item_id: i.item_id || null, quantity: i.quantity, unit_price: i.unit_price, name: i.name }));
      const payload = await placeOrder({ user_id: user.id, vendor_id: vendor.id, items });
      const orderId = payload?.order?.id;
      Alert.alert("Order placed", `Order ID: ${orderId}`);
      navigation.replace("OrderStatus", { orderId, userId: user.id });
    } catch (err) {
      console.error("placeOrder err:", err);
      Alert.alert("Order failed", err.message || "Could not place order");
    } finally {
      setPlacing(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Placing order at {vendor?.name}</Text>

      <FlatList
        data={cartItems}
        keyExtractor={(i, idx) => i.item_id ? i.item_id : String(idx)}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <Text style={{ flex: 1 }}>{item.name}</Text>
            <Text>{item.quantity} × ₹{item.unit_price}</Text>
          </View>
        )}
        ListEmptyComponent={<Text style={{ color: "#666", marginTop: 20 }}>Cart is empty</Text>}
      />

      <View style={styles.totalRow}>
        <Text style={styles.totalText}>Total</Text>
        <Text style={styles.totalAmount}>₹{calculateTotal(cartItems)}</Text>
      </View>

      <TouchableOpacity style={styles.btn} onPress={onPlaceOrder} disabled={placing}>
        <Text style={styles.btnText}>{placing ? "Placing..." : "Place Order"}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 18, fontWeight: "700", marginBottom: 12 },
  row: { flexDirection: "row", paddingVertical: 12, borderBottomWidth: 1, borderColor: "#eee", alignItems: "center" },
  totalRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 16 },
  totalText: { fontWeight: "700" },
  totalAmount: { fontWeight: "700" },
  btn: { backgroundColor: "#0f1724", padding: 14, borderRadius: 10, alignItems: "center" },
  btnText: { color: "#fff", fontWeight: "700" },
});
