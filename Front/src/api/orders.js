// src/api/orders.js
const BACKEND_BASE = "http://172.31.68.127:3000";

export async function placeOrder({ user_id, vendor_id, items, delivery_info = null, pickup_info = null, notes = null }) {
  const res = await fetch(`${BACKEND_BASE}/api/orders/create`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user_id, vendor_id, items, delivery_info, pickup_info, notes }),
  });

  const payload = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(payload?.error || payload?.message || "Failed to place order");
  }
  return payload;
}

export async function getStudentOrders(user_id) {
  const res = await fetch(`${BACKEND_BASE}/api/orders/student/${user_id}`);
  const payload = await res.json();
  if (!res.ok) throw new Error(payload?.error || "Failed to fetch orders");
  return payload.orders || [];
}

export async function getVendorOrders(vendor_id, { status, limit = 50, offset = 0 } = {}) {
  const qs = new URLSearchParams();
  if (status) qs.append("status", status.join(","));
  qs.append("limit", String(limit));
  qs.append("offset", String(offset));
  const res = await fetch(`${BACKEND_BASE}/api/orders/vendor/${vendor_id}?${qs.toString()}`);
  const payload = await res.json();
  if (!res.ok) throw new Error(payload?.error || "Failed to fetch vendor orders");
  return payload.orders || [];
}

export async function updateOrderStatus({ order_id, status, estimated_pickup_time = null, pickup_info = null, payment_status = null }) {
  const res = await fetch(`${BACKEND_BASE}/api/orders/updateStatus`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ order_id, status, estimated_pickup_time, pickup_info, payment_status }),
  });
  const payload = await res.json().catch(() => null);
  if (!res.ok) throw new Error(payload?.error || "Failed to update status");
  return payload.order || payload;
}
