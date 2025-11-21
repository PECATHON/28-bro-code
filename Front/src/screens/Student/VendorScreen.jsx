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
import { getFoodImage, FALLBACK_FOOD_IMAGE } from '../../data/foodImages';

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
      const transformedMenu = (menuData || []).map(item => {
        const itemName = item.name || "Unnamed Item";
        const itemCategory = item.category || "General";
        
        // Use image_url if available, otherwise generate food image based on name/category
        const itemImage = item.image_url || getFoodImage(itemName, itemCategory);
        
        return {
          id: item.id,
          name: itemName,
          price: parseFloat(item.price) || 0,
          desc: item.description || '',
          image: itemImage,
          category: itemCategory,
          is_available: item.is_available !== false,
        };
      });
      
      setMenu(transformedMenu);
    } catch (err) {
      console.error('Error fetching menu:', err);
      setMenu([]);
    }
  }

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: palette.darkBlue, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={palette.orange} />
        <Text style={{ marginTop: 12, color: palette.mutedLight }}>Loading vendor menu...</Text>
      </SafeAreaView>
    );
  }

  if (!vendorData) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: palette.darkBlue, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: palette.mutedLight, fontSize: 16 }}>Vendor not found</Text>
        <TouchableOpacity style={{ marginTop: 20, paddingVertical: 14, paddingHorizontal: 24, backgroundColor: palette.orange, borderRadius: 25 }} onPress={() => navigation.goBack()}>
          <Text style={{ color: palette.white, fontWeight: '700' }}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const vendorImageSource = typeof vendorData.image === 'string' 
    ? { uri: vendorData.image } 
    : vendorData.image || FALLBACK_IMAGE;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: palette.darkBlue }}>
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
            <Text style={{ color: palette.mutedLight }}>No menu items available</Text>
          </View>
        ) : (
          <FlatList
            data={menu.filter(item => item.is_available !== false)}
            renderItem={({ item }) => {
              // Ensure we always have a valid image URL
              const imageUri = item.image || FALLBACK_FOOD_IMAGE;
              
              return (
                <View style={styles.menuCard}>
                  <Image 
                    source={{ uri: imageUri }} 
                    style={styles.menuImage}
                    defaultSource={{ uri: FALLBACK_FOOD_IMAGE }}
                    onError={() => {
                      // Image failed to load - already using fallback in source
                      console.warn('Failed to load menu item image:', item.name, imageUri);
                    }}
                  />
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
              );
            }}
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

const styles = StyleSheet.create({
  backBtn: {
    position: 'absolute',
    zIndex: 10,
    top: 50,
    left: 16,
    padding: 12,
    backgroundColor: palette.card,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: palette.cardLight,
  },

  banner: {
    width: '100%',
    height: 220,
  },

  vendorInfoBox: {
    backgroundColor: palette.card,
    padding: 20,
    borderBottomWidth: 1,
    borderColor: palette.cardLight,
  },

  vendorName: {
    fontSize: 28,
    fontWeight: '700',
    color: palette.white,
    marginBottom: 8,
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },

  ratingBadge: {
    flexDirection: 'row',
    backgroundColor: palette.orange,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 20,
    alignItems: 'center',
  },

  ratingText: {
    color: palette.white,
    fontWeight: '700',
    marginLeft: 6,
    fontSize: 13,
  },

  vendorMeta: {
    color: palette.mutedLight,
    fontSize: 13,
  },

  dot: {
    marginHorizontal: 6,
    color: palette.muted,
  },

  menuTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: palette.white,
    marginTop: 20,
    marginLeft: 20,
    letterSpacing: 0.5,
  },

  menuCard: {
    flexDirection: 'row',
    backgroundColor: palette.card,
    margin: 16,
    marginBottom: 12,
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: palette.neonYellow,
    shadowColor: palette.neonYellow,
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
    elevation: 8,
  },

  menuImage: {
    width: 100,
    height: 100,
    borderRadius: 16,
    marginRight: 16,
  },

  menuName: {
    fontSize: 18,
    fontWeight: '700',
    color: palette.white,
    marginBottom: 4,
  },

  menuDesc: {
    color: palette.mutedLight,
    fontSize: 13,
    marginTop: 4,
    marginBottom: 8,
  },

  menuPrice: {
    marginTop: 6,
    fontWeight: '700',
    color: palette.orange,
    fontSize: 18,
  },

  addBtn: {
    marginTop: 8,
    backgroundColor: palette.orange,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 25,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: palette.neonYellow,
    shadowColor: palette.neonYellow,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },

  addBtnText: {
    color: palette.white,
    fontWeight: '700',
    fontSize: 14,
  },

  cartSticky: {
    backgroundColor: palette.orange,
    padding: 18,
    alignItems: 'center',
    borderTopWidth: 2,
    borderTopColor: palette.neonYellow,
    shadowColor: palette.neonYellow,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },

  cartStickyText: {
    fontWeight: '700',
    color: palette.white,
    fontSize: 16,
  },
});