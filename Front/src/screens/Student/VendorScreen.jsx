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
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CartContext } from '../../contexts/CartContext';
import { vendorImages, FALLBACK_IMAGE } from '../../data/vendorImages';

const BACKEND_BASE = 'http://172.31.68.164:3000';

export default function VendorScreen({ route, navigation }) {
  const { vendor, vendorId } = route.params || {};
  const [vendorData, setVendorData] = useState(vendor || null);
  const [menu, setMenu] = useState([]);
  const [loading, setLoading] = useState(true);
  const { addToCart, items } = useContext(CartContext);

  // Get vendor ID from vendor object or direct vendorId param
  const currentVendorId = vendor?.id || vendorId || vendorData?.id;

  useEffect(() => {
    if (currentVendorId) {
      fetchVendorAndMenu();
    } else if (vendor) {
      // If vendor object passed, use it and just fetch menu
      setVendorData(vendor);
      fetchMenu(vendor.id);
    } else {
      setLoading(false);
      Alert.alert('Error', 'Vendor information not available');
    }
  }, [currentVendorId, vendor]);

  async function fetchVendorAndMenu() {
    if (!currentVendorId) return;
    
    setLoading(true);
    try {
      // Fetch vendor details
      if (!vendorData) {
        const vendorsRes = await fetch(`${BACKEND_BASE}/api/vendors/items`, {
          headers: { 'Content-Type': 'application/json' },
        });
        const vendorsData = await vendorsRes.json();
        const foundVendor = vendorsData.vendors?.find(v => v.id === currentVendorId);
        if (foundVendor) {
          setVendorData({
            id: foundVendor.id,
            name: foundVendor.shop_name || foundVendor.name || foundVendor.owner_name || 'Unknown Vendor',
            description: foundVendor.description || '',
            image: vendorImages[foundVendor.shop_name || foundVendor.name] || FALLBACK_IMAGE,
            categories: ['General'],
            avg_rating: foundVendor.avg_rating || 0,
            time: 15,
          });
        }
      }
      
      // Fetch menu
      await fetchMenu(currentVendorId);
    } catch (err) {
      console.error('Error fetching vendor/menu:', err);
      Alert.alert('Error', 'Failed to load vendor information');
    } finally {
      setLoading(false);
    }
  }

  async function fetchMenu(vId) {
    try {
      const res = await fetch(`${BACKEND_BASE}/api/menu/${vId}`, {
        headers: { 'Content-Type': 'application/json' },
      });
      
      if (!res.ok) {
        throw new Error('Failed to fetch menu');
      }
      
      const menuData = await res.json();
      // Transform menu items to match expected format
      const transformedMenu = (menuData || []).map(item => ({
        id: item.id,
        name: item.name,
        price: parseFloat(item.price) || 0,
        desc: item.description || '',
        image: item.image_url || null,
        category: item.category || 'General',
        is_available: item.is_available !== false,
      }));
      
      setMenu(transformedMenu);
    } catch (err) {
      console.error('Error fetching menu:', err);
      setMenu([]);
    }
  }

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#f7f3ec', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#0f1724" />
        <Text style={{ marginTop: 12, color: '#6b7280' }}>Loading vendor menu...</Text>
      </SafeAreaView>
    );
  }

  if (!vendorData) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#f7f3ec', justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: '#6b7280', fontSize: 16 }}>Vendor not found</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={{ color: '#fff' }}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const vendorImageSource = typeof vendorData.image === 'string' 
    ? { uri: vendorData.image } 
    : vendorData.image || FALLBACK_IMAGE;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f7f3ec' }}>
      <ScrollView>
        {/* Header */}
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>

        {/* Banner */}
        <Image source={vendorImageSource} style={styles.banner} />

        {/* Vendor Info */}
        <View style={styles.vendorInfoBox}>
          <Text style={styles.vendorName}>{vendorData.name}</Text>

          <View style={styles.row}>
            {/* Rating */}
            <View style={styles.ratingBadge}>
              <Ionicons name="star" size={14} color="#fff" />
              <Text style={styles.ratingText}>{(vendorData.avg_rating || 0).toFixed(1)}</Text>
            </View>

            {/* Separator */}
            <Text style={styles.dot}>•</Text>

            {/* Categories */}
            <Text style={styles.vendorMeta}>{(vendorData.categories || ['General']).join(', ')}</Text>

            <Text style={styles.dot}>•</Text>

            {/* Delivery Time */}
            <Text style={styles.vendorMeta}>{vendorData.time || 15} mins</Text>
          </View>
        </View>

        {/* Menu Title */}
        <Text style={styles.menuTitle}>Menu {menu.length > 0 && `(${menu.length})`}</Text>

        {/* Menu List */}
        {menu.length === 0 ? (
          <View style={{ padding: 20, alignItems: 'center' }}>
            <Text style={{ color: '#6b7280' }}>No menu items available</Text>
          </View>
        ) : (
          <FlatList
            data={menu.filter(item => item.is_available !== false)}
            renderItem={({ item }) => (
              <View style={styles.menuCard}>
                {item.image ? (
                  <Image source={{ uri: item.image }} style={styles.menuImage} />
                ) : (
                  <View style={[styles.menuImage, { backgroundColor: '#e6e2d9', justifyContent: 'center', alignItems: 'center' }]}>
                    <Ionicons name="restaurant" size={30} color="#9aa1a9" />
                  </View>
                )}
                <View style={{ flex: 1 }}>
                  <Text style={styles.menuName}>{item.name}</Text>
                  {item.desc ? <Text style={styles.menuDesc}>{item.desc}</Text> : null}
                  <Text style={styles.menuPrice}>₹{item.price.toFixed(2)}</Text>
                  <TouchableOpacity
                    style={[styles.addBtn, !item.is_available && styles.addBtnDisabled]}
                    onPress={() => {
                      if (item.is_available !== false) {
                        addToCart({ ...item, vendorId: vendorData.id });
                      }
                    }}
                    disabled={item.is_available === false}
                  >
                    <Text style={styles.addBtnText}>
                      {item.is_available === false ? 'Unavailable' : 'Add to Cart'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
            keyExtractor={(i) => i.id}
            scrollEnabled={false}
          />
        )}
      </ScrollView>

      {/* Sticky Cart Button */}
      {items.length > 0 && (
        <TouchableOpacity style={styles.cartSticky} onPress={() => navigation.navigate('StudentTabs', { screen: 'Cart' })}>
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