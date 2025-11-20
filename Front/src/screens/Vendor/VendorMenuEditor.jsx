// src/screens/Vendor/VendorMenuEditor.jsx
import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, TextInput, StyleSheet, SafeAreaView } from 'react-native';

export default function VendorMenuEditor() {
  const [menu, setMenu] = useState([]);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');

  useEffect(() => {
    // TODO: fetch existing menu from API
    setMenu([
      { id: 'm1', name: 'Veg Burger', price: 55 },
      { id: 'm2', name: 'Fries', price: 40 },
    ]);
  }, []);

  function addItem() {
    if (!name.trim() || !price.trim()) return;
    const newItem = { id: Date.now().toString(), name: name.trim(), price: Number(price) };
    setMenu([newItem, ...menu]);
    setName(''); setPrice('');
    // TODO: POST to API
  }

  function deleteItem(id) {
    setMenu(menu.filter(m => m.id !== id));
    // TODO: DELETE to API
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f7f3ec' }}>
      <View style={{ padding: 16 }}>
        <Text style={{ fontSize: 20, fontWeight: '700', color: '#0f1724' }}>Edit Menu</Text>

        <View style={styles.row}>
          <TextInput placeholder="Item name" value={name} onChangeText={setName} style={styles.input} />
          <TextInput placeholder="Price" value={price} onChangeText={setPrice} keyboardType="numeric" style={[styles.input, { width: 100 }]} />
          <TouchableOpacity style={styles.addBtn} onPress={addItem}>
            <Text style={{ color: '#fff', fontWeight: '700' }}>Add</Text>
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={menu}
        keyExtractor={i => i.id}
        contentContainerStyle={{ padding: 16 }}
        renderItem={({ item }) => (
          <View style={styles.itemRow}>
            <View>
              <Text style={{ fontWeight: '700', color: '#0f1724' }}>{item.name}</Text>
              <Text style={{ color: '#6b7280' }}>₹{item.price}</Text>
            </View>
            <TouchableOpacity onPress={() => deleteItem(item.id)}>
              <Text style={{ color: '#ef4444', fontWeight: '700' }}>Delete</Text>
            </TouchableOpacity>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', marginTop: 12 },
  input: { backgroundColor: '#fff', padding: 10, borderRadius: 8, flex: 1, marginRight: 8 },
  addBtn: { backgroundColor: '#0f1724', paddingVertical: 12, paddingHorizontal: 14, borderRadius: 10 },
  itemRow: { backgroundColor: '#fff', padding: 12, borderRadius: 10, marginBottom: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
});

