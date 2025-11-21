// src/screens/Student/OrderDetail.jsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  TextInput,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../../contexts/AuthContext';

import { BACKEND_BASE } from '../../config/api';

export default function OrderDetail({ route, navigation }) {
  const { order: initialOrder, orderId } = route.params || {};
  const { user } = React.useContext(AuthContext);
  const [order, setOrder] = useState(initialOrder);
  const [loading, setLoading] = useState(!initialOrder);
  const [rating, setRating] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Fetch order if only orderId was passed
  useEffect(() => {
    if (!order && orderId && user?.id) {
      fetchOrder();
    }
  }, [orderId, user?.id]);

  async function fetchOrder() {
    setLoading(true);
    try {
      const res = await fetch(`${BACKEND_BASE}/api/orders/${orderId}?userId=${user.id}`, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!res.ok) {
        throw new Error('Failed to fetch order');
      }

      const orderData = await res.json();
      setOrder(orderData);
    } catch (error) {
      console.error('Error fetching order:', error);
      Alert.alert('Error', 'Could not load order details');
    } finally {
      setLoading(false);
    }
  }

  function formatDate(iso) {
    if (!iso) return 'Unknown date';
    const d = new Date(iso);
    return d.toLocaleString();
  }

  async function submitReview() {
    if (order.reviewed) {
      Alert.alert('Already Reviewed', 'You have already reviewed this order.');
      return;
    }
    if (!reviewText.trim()) {
      Alert.alert('Empty review', 'Please write a short review before submitting.');
      return;
    }

    setSubmitting(true);
    try {
      // TODO: replace with actual API request:
      // await api.post(`/orders/${order.id}/review`, { rating, text: reviewText });

      // Simulate success
      setTimeout(() => {
        setOrder({ ...order, reviewed: true });
        setRating(5);
        setReviewText('');
        setSubmitting(false);
        Alert.alert('Thank you!', 'Your review has been submitted.');
      }, 700);
    } catch (e) {
      setSubmitting(false);
      Alert.alert('Error', 'Could not submit review. Try again.');
    }
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#0f1724" />
        </View>
      </SafeAreaView>
    );
  }

  if (!order) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <Text style={{ color: palette.mutedLight, fontSize: 16 }}>Order not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Ensure items is an array
  const orderItems = Array.isArray(order.items) ? order.items : [];

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color={palette.white} />
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={() => navigation.navigate('StudentTabs', { screen: 'Home' })} 
              style={styles.homeButton}
            >
              <Ionicons name="home" size={24} color={palette.white} />
            </TouchableOpacity>
          </View>
          <Text style={styles.title}>Order #{order.id?.substring(0, 8) || 'N/A'}...</Text>
          <Text style={styles.sub}>
            {order.vendor?.name || 'Unknown Vendor'} • Placed: {formatDate(order.placedAt)}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Items</Text>
          {orderItems.length === 0 ? (
            <Text style={{ color: palette.mutedLight, paddingVertical: 12 }}>No items in this order</Text>
          ) : (
            <>
              <FlatList
                data={orderItems}
                keyExtractor={(item, index) => item.id || `item-${index}`}
                scrollEnabled={false}
                renderItem={({ item }) => (
                  <View style={styles.itemRow}>
                    <Text style={{ fontWeight: '700' }}>
                      {item.name || 'Unknown Item'} × {item.qty || 1}
                    </Text>
                    <Text>₹{((item.price || 0) * (item.qty || 1)).toFixed(2)}</Text>
                  </View>
                )}
              />
              <View style={styles.totals}>
                <Text style={{ fontWeight: '800' }}>Total</Text>
                <Text style={{ fontWeight: '800' }}>₹{order.total?.toFixed(2) || '0.00'}</Text>
              </View>
            </>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Status</Text>
          <Text
            style={[
              styles.status,
              order.status === 'Ready' || order.status === 'completed'
                ? styles.ready
                : styles.preparing,
            ]}
          >
            {order.status || 'Unknown'}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment</Text>
          <Text style={{ color: palette.mutedLight, marginTop: 4 }}>
            Payment ID: {order.payment_id || order.razorpay_order_id || 'N/A'}
          </Text>
          <Text style={{ color: palette.mutedLight, marginTop: 4 }}>
            Method: {order.payment_method || 'Razorpay'}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Write a review</Text>
          {order.reviewed ? (
            <Text style={{ color: palette.mutedLight }}>You already reviewed this order. Thank you!</Text>
          ) : (
            <>
              <View style={styles.ratingRow}>
                <Text style={{ marginRight: 8 }}>Rating:</Text>
                <View style={styles.ratingChoices}>
                  {Array.from({ length: 5 }).map((_, i) => {
                    const val = i + 1;
                    return (
                      <TouchableOpacity
                        key={val}
                        onPress={() => setRating(val)}
                        style={[styles.starBtn, rating >= val && styles.starBtnActive]}
                      >
                        <Text style={[styles.starText, rating >= val && styles.starTextActive]}>
                          {'★'}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              <TextInput
                placeholder="Write a quick review..."
                value={reviewText}
                onChangeText={setReviewText}
                style={styles.input}
                multiline
              />

              <TouchableOpacity
                style={[styles.submitBtn, order.reviewed && { opacity: 0.6 }]}
                onPress={submitReview}
                disabled={submitting || order.reviewed}
              >
                <Text style={styles.submitText}>
                  {submitting ? 'Submitting...' : 'Submit Review'}
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>
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
  scrollView: { flex: 1 },
  content: { paddingBottom: 20 },
  header: { padding: 20, paddingTop: 20 },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  backButton: {
    padding: 12,
    backgroundColor: palette.card,
    borderRadius: 25,
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: palette.neonYellow,
    shadowColor: palette.neonYellow,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  homeButton: {
    padding: 12,
    backgroundColor: palette.orange,
    borderRadius: 25,
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: palette.neonYellow,
    shadowColor: palette.neonYellow,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  title: { fontSize: 28, fontWeight: '800', color: palette.white, letterSpacing: 0.5 },
  sub: { color: palette.mutedLight, marginTop: 8, fontSize: 15 },

  section: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: palette.card,
    marginBottom: 16,
    marginHorizontal: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: palette.neonYellow,
    shadowColor: palette.neonYellow,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
  },
  sectionTitle: { fontWeight: '700', marginBottom: 12, color: palette.white, fontSize: 18, letterSpacing: 0.5 },

  itemRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12 },
  totals: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 2,
    borderTopColor: palette.neonYellow,
    marginTop: 12,
  },

  status: { fontWeight: '800', fontSize: 18 },
  ready: { color: palette.green },
  preparing: { color: palette.orange },

  ratingRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  ratingChoices: { flexDirection: 'row' },
  starBtn: { 
    marginRight: 8, 
    padding: 10, 
    borderRadius: 12, 
    backgroundColor: palette.cardLight,
    borderWidth: 1,
    borderColor: palette.cardLight,
  },
  starBtnActive: { 
    backgroundColor: palette.orange,
    borderColor: palette.neonYellow,
    shadowColor: palette.neonYellow,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  starText: { color: palette.muted, fontSize: 20 },
  starTextActive: { color: palette.white, fontWeight: '800' },

  input: {
    borderWidth: 1,
    borderColor: palette.neonYellow,
    padding: 14,
    borderRadius: 16,
    minHeight: 100,
    textAlignVertical: 'top',
    backgroundColor: palette.darkBlue,
    color: palette.white,
    fontSize: 15,
    shadowColor: palette.neonYellow,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  submitBtn: {
    marginTop: 16,
    backgroundColor: palette.orange,
    paddingVertical: 16,
    borderRadius: 25,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: palette.neonYellow,
    shadowColor: palette.neonYellow,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  submitText: { color: palette.white, fontWeight: '800', fontSize: 16 },
});
