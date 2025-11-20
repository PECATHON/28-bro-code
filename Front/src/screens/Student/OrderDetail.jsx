// src/screens/Student/OrderDetail.jsx
import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  TextInput,
  Alert,
} from 'react-native';

export default function OrderDetail({ route, navigation }) {
  const { order: initialOrder } = route.params;
  // Work on a local copy so we can mark reviewed locally
  const [order, setOrder] = useState(initialOrder);
  const [rating, setRating] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  function formatDate(iso) {
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

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>Order #{order.id}</Text>
        <Text style={styles.sub}>{order.vendor?.name} • Placed: {formatDate(order.placedAt)}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Items</Text>
        <FlatList
          data={order.items}
          keyExtractor={i => i.id}
          renderItem={({ item }) => (
            <View style={styles.itemRow}>
              <Text style={{ fontWeight: '700' }}>{item.name} × {item.qty}</Text>
              <Text>₹{item.price * item.qty}</Text>
            </View>
          )}
        />
        <View style={styles.totals}>
          <Text style={{ fontWeight: '800' }}>Total</Text>
          <Text style={{ fontWeight: '800' }}>₹{order.total}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Status</Text>
        <Text style={[styles.status, order.status === 'Ready' ? styles.ready : styles.preparing]}>{order.status}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Write a review</Text>
        {order.reviewed ? (
          <Text style={{ color: '#6b7280' }}>You already reviewed this order. Thank you!</Text>
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
                      <Text style={[styles.starText, rating >= val && styles.starTextActive]}>{'★'}</Text>
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
              <Text style={styles.submitText}>{submitting ? 'Submitting...' : 'Submit Review'}</Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      <View style={{ height: 20 }} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f7f3ec' },
  header: { padding: 16 },
  title: { fontSize: 20, fontWeight: '800', color: '#0f1724' },
  sub: { color: '#6b7280', marginTop: 8 },

  section: { paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#fff', marginBottom: 12, marginHorizontal: 16, borderRadius: 10 },
  sectionTitle: { fontWeight: '700', marginBottom: 8, color: '#0f1724' },

  itemRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 },
  totals: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: 8, borderTopWidth: 1, borderTopColor: '#eee', marginTop: 8 },

  status: { fontWeight: '800', fontSize: 16 },
  ready: { color: '#16a34a' },
  preparing: { color: '#f59e0b' },

  ratingRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  ratingChoices: { flexDirection: 'row' },
  starBtn: { marginRight: 6, padding: 6, borderRadius: 6, backgroundColor: '#eee' },
  starBtnActive: { backgroundColor: '#c59d5f' },
  starText: { color: '#9aa1a9', fontSize: 16 },
  starTextActive: { color: '#0f1724', fontWeight: '800' },

  input: { borderWidth: 1, borderColor: '#eee', padding: 10, borderRadius: 8, minHeight: 80, textAlignVertical: 'top' },
  submitBtn: { marginTop: 10, backgroundColor: '#0f1724', paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  submitText: { color: '#fff', fontWeight: '800' },
});