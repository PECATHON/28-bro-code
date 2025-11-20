// src/screens/Student/HomeScreen.jsx
import React, { useEffect, useState } from 'react';
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Simple vendor card component (internal)
function VendorCard({ vendor, onPress }) {
  return (
    <TouchableOpacity style={styles.vendorCard} onPress={onPress}>
      <Image source={{ uri: vendor.image }} style={styles.vendorImage} />
      <View style={styles.vendorInfo}>
        <Text numberOfLines={1} style={styles.vendorName}>{vendor.name}</Text>
        <Text style={styles.vendorMeta}>{vendor.categories.join(' • ')}</Text>
        <View style={styles.rowBetween}>
          <View style={styles.ratingBadge}>
            <Ionicons name="star" size={14} color="#fff" />
            <Text style={styles.ratingText}>{vendor.rating.toFixed(1)}</Text>
          </View>
          <Text style={styles.timeText}>{vendor.time} mins</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function HomeScreen({ navigation }) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All');
  const [vendors, setVendors] = useState([]);
  const categories = ['All','Fast Food','Snacks','Coffee','Desserts','Healthy'];

  useEffect(() => {
    // sample data (replace with API)
    setVendors([
      { id: 'v1', name: 'Canteen A', rating: 4.2, categories: ['Fast Food'], time: 20, image: 'https://placekitten.com/400/300' },
      { id: 'v2', name: 'Cafe B', rating: 4.6, categories: ['Coffee','Snacks'], time: 15, image: 'https://placekitten.com/401/300' },
      { id: 'v3', name: 'Green Bowl', rating: 4.4, categories: ['Healthy'], time: 18, image: 'https://placekitten.com/402/300' },
      { id: 'v4', name: 'Sweet Tooth', rating: 4.7, categories: ['Desserts'], time: 12, image: 'https://placekitten.com/403/300' },
    ]);
  }, []);

  const featured = vendors.slice(0,2);

  function filteredVendors() {
    return vendors.filter(v => (category === 'All' || v.categories.includes(category)) &&
      (v.name.toLowerCase().includes(query.toLowerCase()) || query.trim() === '')
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={styles.$navy.backgroundColor}/>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Image source={{ uri: 'https://placekitten.com/80/80' }} style={styles.avatar} />
          <View style={{marginLeft:10}}>
            <Text style={styles.greet}>Good afternoon</Text>
            <Text style={styles.location}>Campus Canteens</Text>
          </View>
        </View>
        <TouchableOpacity onPress={() => navigation.navigate('Cart')}>
          <View style={styles.cartBtn}>
            <Ionicons name="cart" size={20} color={styles.$navy.backgroundColor} />
          </View>
        </TouchableOpacity>
      </View>

      <View style={styles.container}>
        <View style={styles.searchRow}>
          <View style={styles.searchBox}>
            <Ionicons name="search" size={18} color={styles.$muted.color} />
            <TextInput
              placeholder="Search for dishes, vendors or cuisines"
              placeholderTextColor={styles.$muted.color}
              value={query}
              onChangeText={setQuery}
              style={styles.searchInput}
            />
            {query ? (
              <TouchableOpacity onPress={() => setQuery('')}>
                <Ionicons name="close-circle" size={18} color={styles.$muted.color} />
              </TouchableOpacity>
            ) : null}
          </View>

          <TouchableOpacity style={styles.filterBtn}>
            <Ionicons name="options" size={20} color={styles.$navy.backgroundColor} />
          </TouchableOpacity>
        </View>

        <View style={styles.categoryRow}>
          <FlatList
            data={categories}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={i => i}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.categoryChip, category === item && styles.categoryChipActive]}
                onPress={() => setCategory(item)}
              >
                <Text style={[styles.categoryText, category === item && styles.categoryTextActive]}>{item}</Text>
              </TouchableOpacity>
            )}
          />
        </View>

        <Text style={styles.sectionTitle}>Featured</Text>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={featured}
          keyExtractor={i => i.id}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.featuredCard} onPress={() => navigation.navigate('Vendor', { vendorId: item.id })}>
              <Image source={{ uri: item.image }} style={styles.featuredImage} />
              <View style={styles.featuredMeta}>
                <Text style={styles.featuredName}>{item.name}</Text>
                <Text style={styles.featuredSub}>{item.categories.join(', ')} • {item.time} mins</Text>
              </View>
            </TouchableOpacity>
          )}
        />

        <Text style={[styles.sectionTitle, {marginTop:14}]}>All Vendors</Text>
        <FlatList
          data={filteredVendors()}
          keyExtractor={i => i.id}
          renderItem={({ item }) => (
            <VendorCard vendor={item} onPress={() => navigation.navigate('Vendor', { vendorId: item.id })} />
          )}
          contentContainerStyle={{ paddingBottom: 120 }}
        />
      </View>
    </SafeAreaView>
  );
}

const palette = {
  navy: '#0f1724',    // deep navy
  gold: '#c59d5f',    // classy gold
  cream: '#f7f3ec',   // light cream background
  muted: '#9aa1a9',   // muted grey for placeholders
  card: '#ffffff'
};

const styles = StyleSheet.create({
  $navy: { backgroundColor: palette.navy },
  $gold: { backgroundColor: palette.gold },
  $cream: { backgroundColor: palette.cream },
  $muted: { color: palette.muted },

  safe: { flex: 1, backgroundColor: palette.cream },
  header: {
    backgroundColor: palette.navy,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 46, height: 46, borderRadius: 12, borderWidth: 2, borderColor: palette.gold },
  greet: { color: palette.cream, fontSize: 12, opacity: 0.9 },
  location: { color: palette.cream, fontSize: 16, fontWeight: '700' },
  cartBtn: {
    backgroundColor: palette.gold,
    padding: 10,
    borderRadius: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 6,
  },

  container: { flex: 1, paddingHorizontal: 16, paddingTop: 12 },

  searchRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  searchBox: {
    flex: 1,
    backgroundColor: palette.card,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e6e2d9',
    marginRight: 8,
  },
  searchInput: { flex: 1, marginLeft: 8, height: 36, color: '#111' },
  filterBtn: {
    width: 46,
    height: 46,
    borderRadius: 12,
    backgroundColor: palette.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },

  categoryRow: { marginBottom: 8 },
  categoryChip: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'transparent',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    marginRight: 8,
  },
  categoryChipActive: {
    backgroundColor: palette.navy,
    borderWidth: 0,
  },
  categoryText: { color: palette.navy },
  categoryTextActive: { color: palette.cream, fontWeight: '700' },

  sectionTitle: { fontSize: 18, fontWeight: '700', marginVertical: 8, color: palette.navy },

  featuredCard: {
    width: 240,
    marginRight: 12,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: palette.card,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  featuredImage: { width: '100%', height: 120 },
  featuredMeta: { padding: 10 },
  featuredName: { fontWeight: '700', fontSize: 16, color: palette.navy },
  featuredSub: { color: palette.muted, marginTop: 4 },

  vendorCard: {
    flexDirection: 'row',
    padding: 12,
    borderRadius: 12,
    backgroundColor: palette.card,
    marginBottom: 10,
    alignItems: 'center',
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
  },
  vendorImage: { width: 86, height: 72, borderRadius: 10, marginRight: 12 },
  vendorInfo: { flex: 1 },
  vendorName: { fontSize: 16, fontWeight: '700', color: palette.navy },
  vendorMeta: { color: palette.muted, marginTop: 4 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
  ratingBadge: {
    backgroundColor: palette.gold,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: { color: palette.navy, marginLeft: 6, fontWeight: '700' },
  timeText: { color: palette.muted },
});