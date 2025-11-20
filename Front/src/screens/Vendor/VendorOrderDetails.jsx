// src/screens/Vendor/VendorOrderDetails.jsx
import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, Alert } from "react-native";
import { updateOrderStatus } from "../../api/orders";
import { getVendorOrders } from "../../api/orders";

export default function VendorOrderDetails({ route, navigation }) {
  const { orderId } = route.params;
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  async function fetchOrder() {
    try {
      setLoading(true);
      // find order by fetching vendor orders (or create endpoint to fetch single order)
      // here we just fetch vendor orders and pick this id
      // replace with GET /api/orders/:order_id if you create it
      const vendorId = route.params?.vendorId;
      const orders = await getVendorOrders(vendorId || route.params?.vendorId || "");
      const found = orders.find(o => o.id === orderId);
      setOrder(found || null);
    } catch (err) {
      console.error("fetch order error:", err);
      Alert.alert("Error", "Unable to fetch order details");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchOrder(); }, []);

  async function changeStatus(newStatus) {
    try {
      const payload = await updateOrderStatus({ order_id: orderId, status: newStatus });
      setOrder(payload.order || payload);
      Alert.alert("Status updated", `Order status set to ${newStatus}`);
    } catch (err) {
      console.error("update status err:", err);
      Alert.alert("Error", err.message || "Failed to update status");
    }
  }

  if (!order) return <View style={{ padding: 16 }}><Text>Loading...</Text></View>;

  return (
    <View style={{ padding: 16 }}>
      <Text style={{ fontWeight: "700", fontSize: 18 }}>Order {order.id}</Text>
      <Text style={{ marginTop: 8 }}>Status: {order.status}</Text>
      <Text style={{ marginTop: 8 }}>Total: ₹{order.total_amount}</Text>

      <View style={{ marginTop: 20 }}>
        {order.status === "pending" && (
          <>
            <TouchableOpacity style={styles.btn} onPress={() => changeStatus("accepted")}>
              <Text style={styles.btnText}>Accept</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.btn, { backgroundColor: "#888", marginTop: 8 }]} onPress={() => changeStatus("cancelled")}>
              <Text style={styles.btnText}>Cancel</Text>
            </TouchableOpacity>
          </>
        )}

        {order.status === "accepted" && (
          <TouchableOpacity style={styles.btn} onPress={() => changeStatus("preparing")}>
            <Text style={styles.btnText}>Mark Preparing</Text>
          </TouchableOpacity>
        )}

        {order.status === "preparing" && (
          <TouchableOpacity style={styles.btn} onPress={() => changeStatus("ready")}>
            <Text style={styles.btnText}>Mark Ready</Text>
          </TouchableOpacity>
        )}

        {order.status === "ready" && (
          <TouchableOpacity style={styles.btn} onPress={() => changeStatus("completed")}>
            <Text style={styles.btnText}>Complete</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = {
  btn: { backgroundColor: "#0f1724", padding: 12, borderRadius: 8, marginBottom: 8, alignItems: "center" },
  btnText: { color: "#fff", fontWeight: "700" }
};
