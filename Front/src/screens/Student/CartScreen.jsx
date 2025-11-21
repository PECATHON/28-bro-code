import React, { useContext } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CartContext } from '../../contexts/CartContext';

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
          <Ionicons name="cart-outline" size={64} color={palette.mutedLight} />
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
                    <Ionicons name="remove" size={18} color={palette.white} />
                  </TouchableOpacity>
                  <Text style={styles.qtyText}>{item.qty}</Text>
                  <TouchableOpacity
                    style={styles.qtyBtn}
                    onPress={() => updateQuantity(item.id, item.qty + 1)}
                  >
                    <Ionicons name="add" size={18} color={palette.white} />
                  </TouchableOpacity>
                </View>
                <View style={styles.itemTotal}>
                  <Text style={styles.itemTotalText}>₹{(item.price * item.qty).toFixed(2)}</Text>
                  <TouchableOpacity onPress={() => removeFromCart(item.id)}>
                    <Ionicons name="trash-outline" size={20} color={palette.red} />
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
  safe: { flex: 1, backgroundColor: palette.darkBlue },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 20,
    backgroundColor: palette.darkBlue,
  },
  title: { fontSize: 22, fontWeight: '700', color: palette.white, letterSpacing: 0.5 },
  clearText: { color: palette.red, fontWeight: '600', fontSize: 14 },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: { fontSize: 18, color: palette.mutedLight, marginTop: 16, marginBottom: 24 },
  shopBtn: {
    backgroundColor: palette.orange,
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: palette.neonYellow,
    shadowColor: palette.neonYellow,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  shopBtnText: { color: palette.white, fontWeight: '700', fontSize: 16 },
  listContent: { padding: 20, paddingBottom: 200 },
  cartItem: {
    backgroundColor: palette.card,
    padding: 16,
    borderRadius: 20,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: palette.neonYellow,
    shadowColor: palette.neonYellow,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  itemInfo: { flex: 1 },
  itemName: { fontSize: 18, fontWeight: '700', color: palette.white, marginBottom: 4 },
  itemPrice: { fontSize: 14, color: palette.mutedLight, marginTop: 4 },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 12,
    backgroundColor: palette.cardLight,
    borderRadius: 12,
    padding: 6,
    borderWidth: 1,
    borderColor: palette.cardLight,
  },
  qtyBtn: {
    padding: 8,
    backgroundColor: palette.orange,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: palette.neonYellow,
  },
  qtyText: { marginHorizontal: 12, fontSize: 16, fontWeight: '700', color: palette.white, minWidth: 24, textAlign: 'center' },
  itemTotal: {
    alignItems: 'flex-end',
    minWidth: 80,
  },
  itemTotalText: { fontSize: 18, fontWeight: '700', color: palette.orange, marginBottom: 8 },
  footer: {
    backgroundColor: palette.card,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: palette.neonYellow,
    shadowColor: palette.neonYellow,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  summary: { marginBottom: 16 },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  summaryLabel: { color: palette.mutedLight, fontSize: 15 },
  summaryValue: { color: palette.white, fontWeight: '600', fontSize: 15 },
  totalRow: {
    borderTopWidth: 2,
    borderTopColor: palette.neonYellow,
    marginTop: 12,
    paddingTop: 12,
  },
  totalLabel: { fontSize: 20, fontWeight: '700', color: palette.white },
  totalValue: { fontSize: 24, fontWeight: '800', color: palette.orange },
  checkoutBtn: {
    backgroundColor: palette.orange,
    padding: 16,
    borderRadius: 25,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: palette.neonYellow,
    shadowColor: palette.neonYellow,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  checkoutText: { color: palette.white, fontSize: 18, fontWeight: '700' },
});