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
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

const BACKEND_BASE = "http://172.31.68.127:3000";
import { vendorImages } from "../../data/vendorImages";
const FALLBACK_IMAGE = require("../../../assets/vendors/Juice_Bar.jpeg");

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
            <Ionicons name="star" size={14} color="#fff" />
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

  const categories = ["All", "Fast Food", "Snacks", "Coffee", "Desserts", "Healthy"];

  const fetchVendors = useCallback(async () => {
    try {
      setLoading(true);
      const url = `${BACKEND_BASE}/api/vendors/items?is_active=true&is_approved=true`;
      const res = await fetch(url);
      const payload = await res.json();
      if (!res.ok) {
        Alert.alert("Fetch Error", payload?.message || "Failed to load vendors");
        return;
      }
      const raw = payload.vendors || [];
      const normalized = raw.map((v) => ({
        id: v.id,
        name: v.name,
        description: v.description || "",
        image: vendorImages[v.name] || FALLBACK_IMAGE,
        categories: ["General"],
        avg_rating: typeof v.avg_rating === "number" ? v.avg_rating : 0,
        time: 15,
        location: v.location ?? {},
        raw: v,
      }));
      setVendors(normalized);
    } catch (err) {
      console.error("Vendor fetch error:", err);
      Alert.alert("Network Error", "Unable to fetch vendors. Check your backend.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchVendors(); }, [fetchVendors]);

  function filteredVendors() {
    return vendors.filter(
      (v) =>
        (category === "All" || v.categories.includes(category)) &&
        (v.name.toLowerCase().includes(query.toLowerCase()) || query.trim() === "")
    );
  }

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

        <TouchableOpacity onPress={() => navigation.navigate("Checkout")}>
          <View style={styles.cartBtn}>
            <Ionicons name="cart" size={20} color="#0f1724" />
          </View>
        </TouchableOpacity>
      </View>

      <View style={styles.container}>
        <View style={styles.searchRow}>
          <View style={styles.searchBox}>
            <Ionicons name="search" size={18} color="#9aa1a9" />
            <TextInput placeholder="Search vendors" placeholderTextColor="#9aa1a9" value={query} onChangeText={setQuery} style={styles.searchInput} />
            {query ? <TouchableOpacity onPress={() => setQuery("")}><Ionicons name="close-circle" size={18} color="#9aa1a9" /></TouchableOpacity> : null}
          </View>
          <TouchableOpacity style={styles.filterBtn} onPress={fetchVendors}><Ionicons name="options" size={20} color="#0f1724" /></TouchableOpacity>
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
        ) : (
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={featured}
            keyExtractor={(i) => i.id}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.featuredCard} onPress={() => navigation.navigate("Vendor", { vendor: item })}>
                <Image source={ typeof item.image === "string" ? { uri: item.image } : item.image } style={styles.featuredImage} />
                <View style={styles.featuredMeta}>
                  <Text style={styles.featuredName}>{item.name}</Text>
                  <Text style={styles.featuredSub}>{item.categories.join(", ")} • {item.time ?? "—"} mins</Text>
                </View>
              </TouchableOpacity>
            )}
          />
        )}

        <Text style={[styles.sectionTitle, { marginTop: 14 }]}>All Vendors</Text>

        {loading && vendors.length ? (
          <ActivityIndicator style={{ marginVertical: 10 }} />
        ) : (
          <FlatList
            data={filteredVendors()}
            keyExtractor={(i) => i.id}
            renderItem={({ item }) => <VendorCard vendor={item} onPress={() => navigation.navigate("Vendor", { vendor: item })} />}
            contentContainerStyle={{ paddingBottom: 200 }} // <-- large bottom padding to keep buttons clickable
            ListEmptyComponent={<Text style={{ color: "#9aa1a9", marginTop: 20 }}>No vendors found</Text>}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const palette = { navy: "#0f1724", gold: "#c59d5f", cream: "#f7f3ec", muted: "#9aa1a9", card: "#ffffff" };

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: palette.cream },
  header: { backgroundColor: palette.navy, paddingVertical: 14, paddingHorizontal: 16, flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderBottomLeftRadius: 18, borderBottomRightRadius: 18 },
  headerLeft: { flexDirection: "row", alignItems: "center" },
  avatar: { width: 46, height: 46, borderRadius: 12, borderWidth: 2, borderColor: palette.gold },
  greet: { color: palette.cream, fontSize: 12 },
  location: { color: palette.cream, fontSize: 16, fontWeight: "700" },
  cartBtn: { backgroundColor: palette.gold, padding: 10, borderRadius: 10 },
  container: { flex: 1, paddingHorizontal: 16, paddingTop: 12 },
  searchRow: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  searchBox: { flex: 1, backgroundColor: palette.card, flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, borderWidth: 1, borderColor: "#e6e2d9", marginRight: 8 },
  searchInput: { flex: 1, marginLeft: 8, height: 36, color: "#111" },
  filterBtn: { width: 46, height: 46, borderRadius: 12, backgroundColor: palette.gold, alignItems: "center", justifyContent: "center" },
  categoryRow: { marginBottom: 8 },
  categoryChip: { backgroundColor: "transparent", paddingVertical: 8, paddingHorizontal: 12, borderRadius: 20, marginRight: 8 },
  categoryChipActive: { backgroundColor: palette.navy },
  categoryText: { color: palette.navy },
  categoryTextActive: { color: palette.cream, fontWeight: "700" },
  sectionTitle: { fontSize: 18, fontWeight: "700", marginVertical: 8, color: palette.navy },
  featuredCard: { width: 240, marginRight: 12, borderRadius: 12, overflow: "hidden", backgroundColor: palette.card },
  featuredImage: { width: "100%", height: 120 },
  featuredMeta: { padding: 10 },
  featuredName: { fontWeight: "700", fontSize: 16, color: palette.navy },
  featuredSub: { color: palette.muted, marginTop: 4 },
  vendorCard: { flexDirection: "row", padding: 12, borderRadius: 12, backgroundColor: palette.card, marginBottom: 10, alignItems: "center" },
  vendorImage: { width: 86, height: 72, borderRadius: 10, marginRight: 12 },
  vendorInfo: { flex: 1 },
  vendorName: { fontSize: 16, fontWeight: "700", color: palette.navy },
  vendorMeta: { color: palette.muted, marginTop: 4 },
  rowBetween: { flexDirection: "row", justifyContent: "space-between", marginTop: 10 },
  ratingBadge: { backgroundColor: palette.gold, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 14, flexDirection: "row", alignItems: "center" },
  ratingText: { color: palette.navy, marginLeft: 6, fontWeight: "700" },
  timeText: { color: palette.muted },
});
