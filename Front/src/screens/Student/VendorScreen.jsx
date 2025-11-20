// src/screens/Student/VendorScreen.jsx
import React, { useEffect, useState, useContext } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Image,
  SafeAreaView,
  ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CartContext } from '../../contexts/CartContext';

export default function VendorScreen({ route, navigation }) {
  const { vendorId } = route.params || {};
  const [vendor, setVendor] = useState(null);
  const [menu, setMenu] = useState([]);
  const { addToCart, items } = useContext(CartContext);

  useEffect(() => {
    // Dummy data – replace with API later
    setVendor({
      id: vendorId || 'v1',
      name: 'Canteen A',
      rating: 4.3,
      categories: ['Fast Food', 'Snacks'],
      deliveryTime: 18,
      image: 'https://placekitten.com/500/300',
    });

    setMenu([
      { id: 'm1', name: 'Veg Burger', price: 55, desc: 'Fresh bun, crispy patty', image: 'https://placekitten.com/400/280' },
      { id: 'm2', name: 'Fries', price: 40, desc: 'Golden & crispy', image: 'https://placekitten.com/401/280' },
      { id: 'm3', name: 'Cold Coffee', price: 60, desc: 'Chilled & creamy', image: 'https://placekitten.com/402/280' },
    ]);
  }, [vendorId]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f7f3ec' }}>
      <ScrollView>
        {/* Header */}
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>

        {/* Banner */}
        <Image source={{ uri: vendor?.image }} style={styles.banner} />

        {/* Vendor Info */}
        <View style={styles.vendorInfoBox}>
          <Text style={styles.vendorName}>{vendor?.name}</Text>

          <View style={styles.row}>
            {/* Rating */}
            <View style={styles.ratingBadge}>
              <Ionicons name="star" size={14} color="#fff" />
              <Text style={styles.ratingText}>{vendor?.rating}</Text>
            </View>

            {/* Separator */}
            <Text style={styles.dot}>•</Text>

            {/* Categories */}
            <Text style={styles.vendorMeta}>{vendor?.categories?.join(', ')}</Text>

            <Text style={styles.dot}>•</Text>

            {/* Delivery Time */}
            <Text style={styles.vendorMeta}>{vendor?.deliveryTime} mins</Text>
          </View>
        </View>

        {/* Menu Title */}
        <Text style={styles.menuTitle}>Menu</Text>

        {/* Menu List */}
        <FlatList
          data={menu}
          renderItem={({ item }) => (
            <View style={styles.menuCard}>
              <Image source={{ uri: item.image }} style={styles.menuImage} />
              <View style={{ flex: 1 }}>
                <Text style={styles.menuName}>{item.name}</Text>
                <Text style={styles.menuDesc}>{item.desc}</Text>
                <Text style={styles.menuPrice}>₹{item.price}</Text>
                <TouchableOpacity
                  style={styles.addBtn}
                  onPress={() => addToCart({ ...item, vendorId: vendor.id })}
                >
                  <Text style={styles.addBtnText}>Add to Cart</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
          keyExtractor={(i) => i.id}
          scrollEnabled={false}
        />
      </ScrollView>

      {/* Sticky Cart Button */}
      {items.length > 0 && (
        <TouchableOpacity style={styles.cartSticky} onPress={() => navigation.navigate('Cart')}>
          <Text style={styles.cartStickyText}>{items.length} item(s) in cart • View Cart</Text>
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
}

const palette = {
  navy: '#0f1724',
  gold: '#c59d5f',
  cream: '#f7f3ec',
  muted: '#9aa1a9',
  card: '#ffffff',
};

const styles = StyleSheet.create({
  backBtn: {
    position: 'absolute',
    zIndex: 10,
    top: 14,
    left: 14,
    padding: 8,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
  },

  banner: {
    width: '100%',
    height: 220,
  },

  vendorInfoBox: {
    backgroundColor: palette.cream,
    padding: 16,
    borderBottomWidth: 1,
    borderColor: '#e8e2d8',
  },

  vendorName: {
    fontSize: 24,
    fontWeight: '700',
    color: palette.navy,
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },

  ratingBadge: {
    flexDirection: 'row',
    backgroundColor: palette.gold,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
    alignItems: 'center',
  },

  ratingText: {
    color: palette.navy,
    fontWeight: '700',
    marginLeft: 5,
  },

  vendorMeta: {
    color: palette.muted,
  },

  dot: {
    marginHorizontal: 6,
    color: palette.muted,
  },

  menuTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: palette.navy,
    marginTop: 16,
    marginLeft: 16,
  },

  menuCard: {
    flexDirection: 'row',
    backgroundColor: palette.card,
    margin: 16,
    marginBottom: 10,
    padding: 12,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },

  menuImage: {
    width: 90,
    height: 90,
    borderRadius: 10,
    marginRight: 12,
  },

  menuName: {
    fontSize: 16,
    fontWeight: '700',
    color: palette.navy,
  },

  menuDesc: {
    color: palette.muted,
    fontSize: 13,
    marginTop: 3,
  },

  menuPrice: {
    marginTop: 6,
    fontWeight: '700',
    color: palette.navy,
  },

  addBtn: {
    marginTop: 8,
    backgroundColor: palette.navy,
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },

  addBtnText: {
    color: palette.cream,
    fontWeight: '700',
  },

  cartSticky: {
    backgroundColor: palette.gold,
    padding: 14,
    alignItems: 'center',
  },

  cartStickyText: {
    fontWeight: '700',
    color: palette.navy,
    fontSize: 16,
  },
});