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
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { CartContext } from '../../contexts/CartContext';
import { getVendorImage } from '../../data/vendorImages';

const BACKEND_BASE = "http://172.31.68.164:3000";

// Helper function to get food image based on item name
function getFoodImage(itemName, category = "") {
  if (!itemName) return "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=300&fit=crop";
  
  const name = itemName.toLowerCase();
  const cat = category.toLowerCase();
  
  // Food image mapping based on keywords
  const foodImages = {
    // Burgers
    burger: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&h=300&fit=crop",
    // Pizza
    pizza: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400&h=300&fit=crop",
    // Coffee/Drinks
    coffee: "https://images.unsplash.com/photo-1511920170033-f8396924c348?w=400&h=300&fit=crop",
    tea: "https://images.unsplash.com/photo-1556679343-c7306c1c58cf?w=400&h=300&fit=crop",
    juice: "https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=400&h=300&fit=crop",
    // Sandwiches
    sandwich: "https://images.unsplash.com/photo-1539252554453-80ab65ce3586?w=400&h=300&fit=crop",
    // Fries/Snacks
    fries: "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=400&h=300&fit=crop",
    // Maggi/Noodles
    maggi: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=400&h=300&fit=crop",
    noodles: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=400&h=300&fit=crop",
    // Desserts
    dessert: "https://images.unsplash.com/photo-1551024506-0bccd828d307?w=400&h=300&fit=crop",
    cake: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400&h=300&fit=crop",
    // Indian Food
    curry: "https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400&h=300&fit=crop",
    biryani: "https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=400&h=300&fit=crop",
    // Fast Food
    chicken: "https://images.unsplash.com/photo-1608039829577-8e72c0b89e58?w=400&h=300&fit=crop",
    // General food fallback
    default: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=300&fit=crop",
  };
  
  // Check for specific keywords in name
  for (const [key, url] of Object.entries(foodImages)) {
    if (name.includes(key) || cat.includes(key)) {
      return url;
    }
  }
  
  // Use Foodish API for random food images (free API)
  // Or use Unsplash with food search
  const foodKeywords = ["food", "meal", "dish", "cuisine"];
  const hasFoodKeyword = foodKeywords.some(kw => name.includes(kw) || cat.includes(kw));
  
  if (hasFoodKeyword) {
    // Use Unsplash food search with item name
    const searchTerm = encodeURIComponent(itemName.split(' ')[0]); // Use first word
    return `https://source.unsplash.com/400x300/?food,${searchTerm}`;
  }
  
  // Default food image
  return foodImages.default;
}

export default function VendorScreen({ route, navigation }) {
  const { vendor } = route.params || {};
  const [vendorData, setVendorData] = useState(null);
  const [menu, setMenu] = useState([]);
  const [loading, setLoading] = useState(true);
  const { addToCart, items } = useContext(CartContext);

  // Use useFocusEffect to ensure we reload when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      const currentVendor = route.params?.vendor;
      console.log("[VendorScreen] Screen focused, route params:", route.params);
      console.log("[VendorScreen] Current vendor:", currentVendor);
      
      // Reset state
      setMenu([]);
      setLoading(true);
      
      if (currentVendor && currentVendor.id) {
        console.log("[VendorScreen] Setting vendor data and fetching menu for:", currentVendor.id, currentVendor.name);
        setVendorData(currentVendor);
        fetchMenu(currentVendor.id);
      } else {
        console.error("[VendorScreen] No vendor or vendor.id found in route params");
        setLoading(false);
        setVendorData(null);
      }
    }, [route.params?.vendor?.id])
  );

  const fetchMenu = async (vendorId) => {
    try {
      setLoading(true);
      // Use the /api/menu/:vendorId route which is more reliable
      // This route filters by vendor_id and returns menu items directly
      const url = `${BACKEND_BASE}/api/menu/${vendorId}`;
      console.log("[VendorScreen] Fetching menu from:", url);
      const res = await fetch(url);
      
      if (!res.ok) {
        let errorMessage = "Failed to load menu";
        try {
          const payload = await res.json();
          errorMessage = payload?.message || errorMessage;
          console.error("[VendorScreen] Error response:", payload);
        } catch (e) {
          errorMessage = res.statusText || errorMessage;
          console.error("[VendorScreen] Error parsing response:", e);
        }
        console.error("[VendorScreen] Menu fetch failed:", errorMessage, "Status:", res.status);
        Alert.alert("Error", errorMessage);
        setMenu([]);
        return;
      }
      
      const payload = await res.json();
      console.log("[VendorScreen] Menu response:", payload);
      // /api/menu/:vendorId returns an array directly
      const menuItems = Array.isArray(payload) ? payload : (payload.items || []);
      console.log("[VendorScreen] Menu items count:", menuItems.length);
      // Normalize menu items to match expected format
      const normalized = (menuItems || []).map((item) => {
        const itemName = item.name || "Unnamed Item";
        const itemCategory = item.category || "General";
        // Use image_url if available, otherwise generate food image based on name/category
        const itemImage = item.image_url || getFoodImage(itemName, itemCategory);
        
        return {
          id: item.id,
          name: itemName,
          desc: item.description || "",
          price: typeof item.price === "number" ? item.price : parseFloat(item.price) || 0,
          image: itemImage,
          category: itemCategory,
          is_available: item.is_available !== false, // Default to true if not specified
        };
      });
      console.log("[VendorScreen] Normalized menu items:", normalized);
      setMenu(normalized);
    } catch (err) {
      console.error("[VendorScreen] Menu fetch error:", err);
      Alert.alert("Network Error", "Unable to fetch menu items. Please try again.");
      setMenu([]);
    } finally {
      setLoading(false);
    }
  };

  if (!vendorData) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#f7f3ec', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#c59d5f" />
        <Text style={{ marginTop: 10, color: '#9aa1a9' }}>Loading vendor...</Text>
      </SafeAreaView>
    );
  }

  const vendorImage = typeof vendorData.image === "string" 
    ? { uri: vendorData.image } 
    : vendorData.image || getVendorImage(vendorData.name);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f7f3ec' }}>
      <ScrollView>
        {/* Header */}
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>

        {/* Banner */}
        <Image source={vendorImage} style={styles.banner} />

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
            <Text style={styles.vendorMeta}>{(vendorData.categories || ["General"]).join(', ')}</Text>

            <Text style={styles.dot}>•</Text>

            {/* Delivery Time */}
            <Text style={styles.vendorMeta}>{vendorData.time || 15} mins</Text>
          </View>
        </View>

        {/* Menu Title */}
        <Text style={styles.menuTitle}>Menu</Text>

        {/* Loading State */}
        {loading ? (
          <View style={{ padding: 20, alignItems: 'center' }}>
            <ActivityIndicator size="large" color="#c59d5f" />
            <Text style={{ marginTop: 10, color: '#9aa1a9' }}>Loading menu...</Text>
          </View>
        ) : menu.length === 0 ? (
          <View style={{ padding: 20, alignItems: 'center' }}>
            <Text style={{ color: '#9aa1a9', fontSize: 16 }}>No menu items available</Text>
          </View>
        ) : (
          /* Menu List */
          <FlatList
            data={menu}
            renderItem={({ item }) => (
              <View style={styles.menuCard}>
                <Image 
                  source={{ uri: item.image }} 
                  style={styles.menuImage}
                />
                <View style={{ flex: 1 }}>
                  <Text style={styles.menuName}>{item.name}</Text>
                  <Text style={styles.menuDesc}>{item.desc || "No description available"}</Text>
                  <Text style={styles.menuPrice}>₹{item.price.toFixed(2)}</Text>
                  {item.is_available ? (
                    <TouchableOpacity
                      style={styles.addBtn}
                      onPress={() => addToCart({ ...item, vendorId: vendorData.id })}
                    >
                      <Text style={styles.addBtnText}>Add to Cart</Text>
                    </TouchableOpacity>
                  ) : (
                    <View style={[styles.addBtn, { backgroundColor: '#9aa1a9' }]}>
                      <Text style={styles.addBtnText}>Unavailable</Text>
                    </View>
                  )}
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