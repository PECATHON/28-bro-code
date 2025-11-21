import React, { useContext } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CartContext } from '../../contexts/CartContext';

const palette = {
  navy: '#0f1724',
  gold: '#c59d5f',
  cream: '#f7f3ec',
  muted: '#9aa1a9',
  card: '#ffffff',
};

export default function CartScreen({ navigation }) {
  const { items, removeFromCart, updateQuantity, clearCart } = useContext(CartContext);
  const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);
  const tax = subtotal * 0.18; // 18% GST
  const deliveryFee = 20;
  const total = subtotal + tax + deliveryFee;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>Cart {items.length > 0 && `(${items.length})`}</Text>
        {items.length > 0 && (
          <TouchableOpacity onPress={clearCart}>
            <Text style={styles.clearText}>Clear All</Text>
          </TouchableOpacity>
        )}
      </View>

      {items.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="cart-outline" size={64} color={palette.muted} />
          <Text style={styles.emptyText}>Your cart is empty</Text>
          <TouchableOpacity
            style={styles.shopBtn}
            onPress={() => navigation.navigate('StudentTabs', { screen: 'Home' })}
          >
            <Text style={styles.shopBtnText}>Continue Shopping</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <FlatList
            data={items}
            keyExtractor={i => i.id}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => (
              <View style={styles.cartItem}>
                <View style={styles.itemInfo}>
                  <Text style={styles.itemName}>{item.name}</Text>
                  <Text style={styles.itemPrice}>₹{item.price.toFixed(2)} each</Text>
                </View>
                <View style={styles.quantityControls}>
                  <TouchableOpacity
                    style={styles.qtyBtn}
                    onPress={() => updateQuantity(item.id, item.qty - 1)}
                  >
                    <Ionicons name="remove" size={18} color={palette.navy} />
                  </TouchableOpacity>
                  <Text style={styles.qtyText}>{item.qty}</Text>
                  <TouchableOpacity
                    style={styles.qtyBtn}
                    onPress={() => updateQuantity(item.id, item.qty + 1)}
                  >
                    <Ionicons name="add" size={18} color={palette.navy} />
                  </TouchableOpacity>
                </View>
                <View style={styles.itemTotal}>
                  <Text style={styles.itemTotalText}>₹{(item.price * item.qty).toFixed(2)}</Text>
                  <TouchableOpacity onPress={() => removeFromCart(item.id)}>
                    <Ionicons name="trash-outline" size={20} color="#ef4444" />
                  </TouchableOpacity>
                </View>
              </View>
            )}
          />

          <View style={styles.footer}>
            <View style={styles.summary}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Subtotal</Text>
                <Text style={styles.summaryValue}>₹{subtotal.toFixed(2)}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>GST (18%)</Text>
                <Text style={styles.summaryValue}>₹{tax.toFixed(2)}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Delivery Fee</Text>
                <Text style={styles.summaryValue}>₹{deliveryFee.toFixed(2)}</Text>
              </View>
              <View style={[styles.summaryRow, styles.totalRow]}>
                <Text style={styles.totalLabel}>Total</Text>
                <Text style={styles.totalValue}>₹{total.toFixed(2)}</Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.checkoutBtn}
              onPress={() => navigation.navigate('Checkout')}
            >
              <Text style={styles.checkoutText}>Proceed to Checkout</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: palette.cream },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: palette.navy,
  },
  title: { fontSize: 20, fontWeight: '700', color: palette.cream },
  clearText: { color: '#ef4444', fontWeight: '600' },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: { fontSize: 18, color: palette.muted, marginTop: 16, marginBottom: 24 },
  shopBtn: {
    backgroundColor: palette.navy,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
  },
  shopBtnText: { color: palette.cream, fontWeight: '700', fontSize: 16 },
  listContent: { padding: 16, paddingBottom: 200 },
  cartItem: {
    backgroundColor: palette.card,
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 1,
  },
  itemInfo: { flex: 1 },
  itemName: { fontSize: 16, fontWeight: '700', color: palette.navy },
  itemPrice: { fontSize: 14, color: palette.muted, marginTop: 4 },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 12,
    backgroundColor: palette.cream,
    borderRadius: 8,
    padding: 4,
  },
  qtyBtn: {
    padding: 6,
    backgroundColor: palette.card,
    borderRadius: 6,
  },
  qtyText: { marginHorizontal: 12, fontSize: 16, fontWeight: '700', color: palette.navy, minWidth: 24, textAlign: 'center' },
  itemTotal: {
    alignItems: 'flex-end',
    minWidth: 80,
  },
  itemTotalText: { fontSize: 16, fontWeight: '700', color: palette.navy, marginBottom: 4 },
  footer: {
    backgroundColor: palette.card,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e6e2d9',
  },
  summary: { marginBottom: 16 },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  summaryLabel: { color: palette.muted },
  summaryValue: { color: palette.navy, fontWeight: '600' },
  totalRow: {
    borderTopWidth: 2,
    borderTopColor: '#e6e2d9',
    marginTop: 8,
    paddingTop: 12,
  },
  totalLabel: { fontSize: 18, fontWeight: '700', color: palette.navy },
  totalValue: { fontSize: 20, fontWeight: '800', color: palette.navy },
  checkoutBtn: {
    backgroundColor: palette.navy,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  checkoutText: { color: palette.cream, fontSize: 18, fontWeight: '700' },
});