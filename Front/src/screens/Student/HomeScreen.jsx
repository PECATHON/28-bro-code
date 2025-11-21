// src/screens/Student/HomeScreen.jsx
import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  StatusBar,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

const BACKEND_BASE = "http://172.31.68.164:3000";
import { vendorImages, FALLBACK_IMAGE, getVendorImage } from "../../data/vendorImages";

function VendorCard({ vendor, onPress }) {
  return (
    <TouchableOpacity style={styles.vendorCard} onPress={onPress}>
      <Image
        source={typeof vendor.image === "string" ? { uri: vendor.image } : vendor.image}
        style={styles.vendorImage}
      />
      <View style={styles.vendorInfo}>
        <Text numberOfLines={1} style={styles.vendorName}>{vendor.name}</Text>
        <Text style={styles.vendorMeta}>{(vendor.categories || ["General"]).join(" • ")}</Text>
          <View style={styles.rowBetween}>
          <View style={styles.ratingBadge}>
            <Ionicons name="star" size={14} color={palette.white} />
            <Text style={styles.ratingText}>{(vendor.avg_rating ?? 0).toFixed(1)}</Text>
          </View>
          <Text style={styles.timeText}>{vendor.time ? `${vendor.time} mins` : "—"}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function HomeScreen({ navigation }) {
  const [vendors, setVendors] = useState([]);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const categories = ["All", "Fast Food", "Snacks", "Coffee", "Desserts", "Healthy"];

  const fetchVendors = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      
      // Fetch ALL vendors from the database (no filters - real-time data)
      const url = `${BACKEND_BASE}/api/vendors/items`;
      console.log("📦 Fetching all vendors from database:", url);
      
      const res = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        // Add cache control to ensure fresh data
        cache: 'no-cache',
      });
      
      const payload = await res.json();
      
      if (!res.ok) {
        console.error("❌ Vendor fetch error:", payload);
        Alert.alert("Fetch Error", payload?.message || "Failed to load vendors");
        return;
      }
      
      const raw = payload.vendors || [];
      console.log("📦 Vendors received from database:", raw.length);
      console.log("📦 Vendor IDs:", raw.map(v => v.id).join(", "));
      console.log("📦 Vendor names:", raw.map(v => v.name || v.shop_name || v.owner_name).join(", "));
      console.log("📦 Raw vendor data sample:", raw[0] ? {
        id: raw[0].id,
        shop_name: raw[0].shop_name,
        name: raw[0].name,
        owner_name: raw[0].owner_name,
        avg_rating: raw[0].avg_rating,
      } : "none");
      
      if (raw.length === 0) {
        console.warn("⚠️ No vendors returned from API. Check database.");
        setVendors([]);
        return;
      }
      
      // Normalize vendors - handle name/shop_name merge consistently
      // Backend already normalizes, but ensure frontend handles it too
      const normalized = raw.map((v) => {
        // Use the normalized name from backend, or merge here if needed
        const vendorName = v.name || v.shop_name || v.owner_name || "Unknown Vendor";
        const shopNameForImage = v.shop_name || v.name || v.owner_name;
        
        // Handle avg_rating - can be number or string
        let avgRating = 0;
        if (typeof v.avg_rating === "number") {
          avgRating = v.avg_rating;
        } else if (typeof v.avg_rating === "string") {
          avgRating = parseFloat(v.avg_rating) || 0;
        }
        
        return {
          id: v.id,
          name: vendorName, // Unified name field (already normalized by backend)
          description: v.description || "",
          image: getVendorImage(shopNameForImage), // Use getVendorImage function for flexible matching (already returns FALLBACK_IMAGE if no match)
          categories: ["General"],
          avg_rating: avgRating,
          time: 15,
          location: v.location ?? {},
          raw: v,
        };
      });
      
      console.log("✅ Normalized vendors:", normalized.length);
      console.log("✅ Vendor names in UI:", normalized.map(v => v.name).join(", "));
      console.log("✅ Setting vendors state with", normalized.length, "vendors");
      setVendors(normalized);
    } catch (err) {
      console.error("❌ Vendor fetch error:", err);
      const errorMsg = err.message?.includes("Network request failed") 
        ? "Unable to connect to server. Please check:\n• Backend server is running\n• Correct IP address in BACKEND_BASE\n• Device and server are on same network"
        : "Unable to fetch vendors. Please try again.";
      Alert.alert("Network Error", errorMsg);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Fetch vendors on mount
  useEffect(() => {
    fetchVendors();
  }, [fetchVendors]);

  // Refresh vendors when screen comes into focus (real-time updates)
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      console.log("🔄 HomeScreen focused - refreshing vendors from database");
      fetchVendors(true); // Refresh when screen comes into focus
    });
    return unsubscribe;
  }, [navigation, fetchVendors]);

  function filteredVendors() {
    return vendors.filter(
      (v) =>
        (category === "All" || v.categories.includes(category)) &&
        (v.name.toLowerCase().includes(query.toLowerCase()) || query.trim() === "")
    );
  }

  // Featured vendors (top 2 vendors from the list)
  const featured = vendors.slice(0, 2);

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor="#0f1724" />

      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Image source={{ uri: "https://i.pravatar.cc/150" }} style={styles.avatar} />
          <View style={{ marginLeft: 10 }}>
            <Text style={styles.greet}>Good afternoon</Text>
            <Text style={styles.location}>Campus Canteens</Text>
          </View>
        </View>

          <View style={styles.headerRight}>
          <TouchableOpacity onPress={() => navigation.navigate("StudentTabs", { screen: "Orders" })}>
            <View style={styles.ordersBtn}>
              <Ionicons name="list" size={22} color={palette.white} />
            </View>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate("Checkout")}>
            <View style={styles.cartBtn}>
              <Ionicons name="cart" size={22} color={palette.white} />
            </View>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.container}>
        <View style={styles.searchRow}>
          <View style={styles.searchBox}>
            <Ionicons name="search" size={20} color={palette.mutedLight} />
            <TextInput 
              placeholder="Search vendors" 
              placeholderTextColor={palette.muted} 
              value={query} 
              onChangeText={setQuery} 
              style={styles.searchInput} 
            />
            {query ? (
              <TouchableOpacity onPress={() => setQuery("")}>
                <Ionicons name="close-circle" size={20} color={palette.mutedLight} />
              </TouchableOpacity>
            ) : null}
          </View>
          <TouchableOpacity style={styles.filterBtn} onPress={() => fetchVendors(true)}>
            <Ionicons name="refresh" size={22} color={palette.white} />
          </TouchableOpacity>
        </View>

        <View style={styles.categoryRow}>
          <FlatList
            data={categories}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(i) => i}
            renderItem={({ item }) => (
              <TouchableOpacity style={[styles.categoryChip, category === item && styles.categoryChipActive]} onPress={() => setCategory(item)}>
                <Text style={[styles.categoryText, category === item && styles.categoryTextActive]}>{item}</Text>
              </TouchableOpacity>
            )}
          />
        </View>

        <Text style={styles.sectionTitle}>Featured</Text>

        {loading && !vendors.length ? (
          <ActivityIndicator style={{ marginVertical: 20 }} />
        ) : featured.length > 0 ? (
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={featured}
            keyExtractor={(i) => i.id}
            renderItem={({ item }) => (
              <TouchableOpacity 
                style={styles.featuredCard} 
                onPress={() => navigation.navigate("Vendor", { vendor: item })}
              >
                <Image 
                  source={typeof item.image === "string" ? { uri: item.image } : item.image} 
                  style={styles.featuredImage} 
                />
                <View style={styles.featuredMeta}>
                  <Text style={styles.featuredName}>{item.name}</Text>
                  <Text style={styles.featuredSub}>{item.categories.join(", ")} • {item.time ?? "—"} mins</Text>
                </View>
              </TouchableOpacity>
            )}
          />
        ) : (
          <Text style={{ color: palette.muted, marginTop: 8, fontSize: 14 }}>No featured vendors available</Text>
        )}

        <Text style={[styles.sectionTitle, { marginTop: 14 }]}>
          All Vendors {vendors.length > 0 && `(${vendors.length})`}
        </Text>

        {loading && !vendors.length ? (
          <View style={{ padding: 40, alignItems: 'center' }}>
            <ActivityIndicator size="large" color={palette.orange} />
            <Text style={{ color: palette.mutedLight, marginTop: 12, fontSize: 15 }}>Loading vendors...</Text>
          </View>
        ) : (
          <FlatList
            data={filteredVendors()}
            keyExtractor={(i) => i.id}
            renderItem={({ item }) => <VendorCard vendor={item} onPress={() => {
              console.log("[HomeScreen] Navigating to Vendor with:", item);
              navigation.navigate("Vendor", { vendor: item });
            }} />}
            contentContainerStyle={{ paddingBottom: 200 }} // <-- large bottom padding to keep buttons clickable
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={() => fetchVendors(true)} />
            }
            ListEmptyComponent={
              <View style={{ padding: 40, alignItems: 'center' }}>
                <Ionicons name="storefront-outline" size={64} color={palette.muted} />
                <Text style={{ color: palette.mutedLight, marginTop: 20, fontSize: 16, fontWeight: '600' }}>
                  {vendors.length === 0 ? "No vendors available" : "No vendors match your search"}
                </Text>
                {vendors.length === 0 && (
                  <>
                    <Text style={{ color: palette.muted, marginTop: 8, fontSize: 13, textAlign: 'center' }}>
                      Vendors will appear here once they register
                    </Text>
                    <TouchableOpacity 
                      style={{ marginTop: 20, paddingVertical: 14, paddingHorizontal: 24, backgroundColor: palette.orange, borderRadius: 25 }}
                      onPress={() => fetchVendors(true)}
                    >
                      <Text style={{ color: palette.white, fontWeight: '700', fontSize: 15 }}>Refresh</Text>
                    </TouchableOpacity>
                  </>
                )}
                {vendors.length > 0 && query && (
                  <TouchableOpacity 
                    style={{ marginTop: 20, paddingVertical: 14, paddingHorizontal: 24, backgroundColor: palette.card, borderRadius: 25, borderWidth: 1, borderColor: palette.cardLight }}
                    onPress={() => setQuery("")}
                  >
                    <Text style={{ color: palette.white, fontWeight: '700', fontSize: 15 }}>Clear Search</Text>
                  </TouchableOpacity>
                )}
              </View>
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const palette = { 
  darkBlue: "#0f1724", 
  darkBlueLight: "#1a2332",
  orange: "#ff6b35", 
  red: "#ef4444",
  white: "#ffffff", 
  muted: "#9aa1a9", 
  mutedLight: "#cbd5e1",
  card: "#1e293b",
  cardLight: "#2d3748",
  yellow: "#fbbf24",
  neonYellow: "#fffb00",
  neonYellowGlow: "rgba(255, 251, 0, 0.5)",
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: palette.darkBlue },
  header: { 
    backgroundColor: palette.darkBlue, 
    paddingVertical: 16, 
    paddingHorizontal: 20, 
    flexDirection: "row", 
    justifyContent: "space-between", 
    alignItems: "center",
    paddingTop: 20,
  },
  headerLeft: { flexDirection: "row", alignItems: "center" },
  headerRight: { flexDirection: "row", alignItems: "center", gap: 12 },
  avatar: { width: 46, height: 46, borderRadius: 12, borderWidth: 2, borderColor: palette.orange },
  greet: { color: palette.mutedLight, fontSize: 12, fontWeight: "500" },
  location: { color: palette.white, fontSize: 18, fontWeight: "700", marginTop: 2 },
  ordersBtn: { 
    backgroundColor: palette.orange, 
    padding: 10, 
    borderRadius: 10,
    borderWidth: 1,
    borderColor: palette.neonYellow,
    shadowColor: palette.neonYellow,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
  cartBtn: { 
    backgroundColor: palette.orange, 
    padding: 10, 
    borderRadius: 10,
    borderWidth: 1,
    borderColor: palette.neonYellow,
    shadowColor: palette.neonYellow,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
  container: { flex: 1, paddingHorizontal: 20, paddingTop: 20 },
  searchRow: { flexDirection: "row", alignItems: "center", marginBottom: 16 },
  searchBox: { 
    flex: 1, 
    backgroundColor: palette.card, 
    flexDirection: "row", 
    alignItems: "center", 
    paddingHorizontal: 16, 
    paddingVertical: 12, 
    borderRadius: 16, 
    borderWidth: 1, 
    borderColor: palette.cardLight, 
    marginRight: 12 
  },
  searchInput: { flex: 1, marginLeft: 10, height: 40, color: palette.white, fontSize: 15 },
  filterBtn: { 
    width: 50, 
    height: 50, 
    borderRadius: 16, 
    backgroundColor: palette.card, 
    alignItems: "center", 
    justifyContent: "center",
    borderWidth: 1,
    borderColor: palette.cardLight,
  },
  categoryRow: { marginBottom: 20 },
  categoryChip: { 
    backgroundColor: palette.card, 
    paddingVertical: 10, 
    paddingHorizontal: 20, 
    borderRadius: 25, 
    marginRight: 10,
    borderWidth: 1,
    borderColor: palette.cardLight,
  },
  categoryChipActive: { 
    backgroundColor: palette.orange,
    borderColor: palette.neonYellow,
    borderWidth: 1,
    shadowColor: palette.neonYellow,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
  categoryText: { color: palette.mutedLight, fontWeight: "600", fontSize: 14 },
  categoryTextActive: { color: palette.white, fontWeight: "700" },
  sectionTitle: { 
    fontSize: 22, 
    fontWeight: "700", 
    marginVertical: 12, 
    color: palette.white,
    letterSpacing: 0.5,
  },
  featuredCard: { 
    width: 280, 
    marginRight: 16, 
    borderRadius: 20, 
    overflow: "hidden", 
    backgroundColor: palette.card,
    borderWidth: 1,
    borderColor: palette.neonYellow,
    shadowColor: palette.neonYellow,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  featuredImage: { width: "100%", height: 180 },
  featuredMeta: { padding: 16 },
  featuredName: { fontWeight: "700", fontSize: 18, color: palette.white, marginBottom: 6 },
  featuredSub: { color: palette.mutedLight, fontSize: 13 },
  vendorCard: { 
    flexDirection: "row", 
    padding: 16, 
    borderRadius: 20, 
    backgroundColor: palette.card, 
    marginBottom: 16, 
    alignItems: "center",
    borderWidth: 1,
    borderColor: palette.cardLight,
    shadowColor: palette.neonYellow,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  vendorImage: { width: 100, height: 100, borderRadius: 16, marginRight: 16 },
  vendorInfo: { flex: 1 },
  vendorName: { fontSize: 18, fontWeight: "700", color: palette.white, marginBottom: 6 },
  vendorMeta: { color: palette.mutedLight, fontSize: 13, marginBottom: 8 },
  rowBetween: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 8 },
  ratingBadge: { 
    backgroundColor: palette.orange, 
    paddingHorizontal: 10, 
    paddingVertical: 6, 
    borderRadius: 20, 
    flexDirection: "row", 
    alignItems: "center",
    borderWidth: 1,
    borderColor: palette.neonYellow,
    shadowColor: palette.neonYellow,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
  ratingText: { color: palette.white, marginLeft: 6, fontWeight: "700", fontSize: 13 },
  timeText: { color: palette.mutedLight, fontSize: 13, fontWeight: "500" },
});