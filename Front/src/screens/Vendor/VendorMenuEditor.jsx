// src/screens/Vendor/VendorMenuEditor.jsx
import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  SafeAreaView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { AuthContext } from '../../contexts/AuthContext';

/**
 * VendorMenuEditor
 * - Reads menu from backend: GET /api/menu/:vendorId
 * - Adds item: POST /api/menu/:vendorId
 * - Deletes item: DELETE /api/menu/:vendorId/:itemId
 * - Imports items from a server-side CSV/file: POST /api/menu/:vendorId/import
 *
 * NOTE:
 * - BACKEND_BASE must point to your running server (LAN IP for device).
 * - AuthContext is expected to provide `user` (with id) and optionally `token`.
 * - The import button demonstrates importing using the uploaded file path:
 *     /mnt/data/Screenshot 2025-11-20 at 10.55.56 PM.png
 *   (the server import endpoint accepts `filepath` for dev use).
 */

const BACKEND_BASE = 'http://172.31.68.164:3000'; // update to your backend if needed
const DEV_IMPORT_PATH = '/mnt/data/Screenshot 2025-11-20 at 10.55.56 PM.png'; // developer-provided file path

export default function VendorMenuEditor() {
  const { user, token } = useContext(AuthContext) || {};
  const vendorId = user?.id;

  const [menu, setMenu] = useState([]);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('');
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState(null); // id of item being processed

  useEffect(() => {
    if (vendorId) fetchMenu();
  }, [vendorId]);

  async function fetchMenu() {
    setLoading(true);
    try {
      const res = await fetch(`${BACKEND_BASE}/api/menu/${vendorId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      if (!res.ok) {
        const txt = await res.text().catch(() => null);
        throw new Error(txt || 'Failed to fetch menu');
      }
      const data = await res.json();
      setMenu(Array.isArray(data) ? data : []);
    } catch (err) {
      console.warn('fetchMenu error', err);
      Alert.alert('Error', 'Could not load menu. Check backend & network.');
    } finally {
      setLoading(false);
    }
  }

  // Create a new item (optimistic UI)
  async function addItem() {
    if (!name.trim() || !price.trim()) {
      Alert.alert('Validation', 'Please enter name and price.');
      return;
    }

    const priceNum = parseFloat(price);
    if (isNaN(priceNum)) {
      Alert.alert('Validation', 'Price must be a number.');
      return;
    }

    const tempId = `tmp-${Date.now()}`;
    const newItem = {
      id: tempId,
      name: name.trim(),
      price: priceNum,
      category: category.trim() || null,
      is_available: true,
      created_at: new Date().toISOString(),
    };

    // optimistic update
    setMenu(prev => [newItem, ...prev]);
    setName(''); setPrice(''); setCategory('');

    setBusyId(tempId);
    try {
      const res = await fetch(`${BACKEND_BASE}/api/menu/${vendorId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          name: newItem.name,
          description: '',
          price: newItem.price,
          category: newItem.category,
          is_available: true,
        }),
      });

      if (!res.ok) {
        const errBody = await res.json().catch(() => null);
        throw new Error(errBody?.message || 'Failed to create item');
      }

      const created = await res.json();
      // replace temp item with created item (server id)
      setMenu(prev => prev.map(i => (i.id === tempId ? created : i)));
    } catch (err) {
      console.warn('addItem error', err);
      // rollback optimistic update
      setMenu(prev => prev.filter(i => i.id !== tempId));
      Alert.alert('Error', 'Could not add item. Try again.');
    } finally {
      setBusyId(null);
    }
  }

  // Delete item
  async function deleteItem(id) {
    Alert.alert('Confirm', 'Delete this item?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          // optimistic remove
          const prev = menu;
          setMenu(prevList => prevList.filter(i => i.id !== id));
          setBusyId(id);
          try {
            const res = await fetch(`${BACKEND_BASE}/api/menu/${vendorId}/${id}`, {
              method: 'DELETE',
              headers: token ? { Authorization: `Bearer ${token}` } : undefined,
            });
            if (!res.ok) {
              const txt = await res.text().catch(() => null);
              throw new Error(txt || 'Delete failed');
            }
            // success
          } catch (err) {
            console.warn('deleteItem error', err);
            // rollback
            setMenu(prev);
            Alert.alert('Error', 'Could not delete item.');
          } finally {
            setBusyId(null);
          }
        }
      }
    ]);
  }

  // Import items from server-side file path (development helper)
  async function importFromFile() {
    Alert.alert('Import', 'Import menu from server CSV file?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Import', onPress: async () => {
          setLoading(true);
          try {
            const res = await fetch(`${BACKEND_BASE}/api/menu/${vendorId}/import`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
              },
              body: JSON.stringify({
                // this is the developer/uploaded path from your environment
                // server must be able to read this path
                filepath: DEV_IMPORT_PATH,
              }),
            });

            if (!res.ok) {
              const err = await res.json().catch(() => null);
              throw new Error(err?.message || 'Import failed');
            }

            const payload = await res.json();
            // If API returns inserted data, you can merge; otherwise refetch
            if (payload?.data) {
              // depending on API shape
              setMenu(prev => [...payload.data, ...prev]);
            } else {
              // safer: reload from server
              await fetchMenu();
            }

            Alert.alert('Import complete', `Inserted ${payload?.inserted ?? 'many'} items`);
          } catch (err) {
            console.warn('import error', err);
            Alert.alert('Error', 'Import failed. Ensure server can access the given filepath.');
          } finally {
            setLoading(false);
          }
        }
      }
    ]);
  }

  // Render list row
  function renderItem({ item }) {
    const working = busyId === item.id;
    return (
      <View style={styles.itemRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.name}>{item.name}</Text>
          <Text style={styles.meta}>{item.category ?? '—'} • ₹{item.price}</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          {working ? (
            <ActivityIndicator size="small" />
          ) : (
            <>
              <TouchableOpacity onPress={() => deleteItem(item.id)} style={styles.actionBtn}>
                <Text style={styles.deleteText}>Delete</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.headerTitle}>Edit Menu</Text>

        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TouchableOpacity style={styles.importBtn} onPress={importFromFile}>
            <Text style={styles.importText}>Import CSV (dev)</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.refreshBtn} onPress={fetchMenu}>
            <Text style={styles.refreshText}>Refresh</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.formRow}>
        <TextInput placeholder="Item name" value={name} onChangeText={setName} style={styles.input} />
        <TextInput placeholder="Price" value={price} onChangeText={setPrice} keyboardType="numeric" style={[styles.input, { width: 100 }]} />
        <TextInput placeholder="Category" value={category} onChangeText={setCategory} style={[styles.input, { width: 120 }]} />
        <TouchableOpacity style={styles.addBtn} onPress={addItem}>
          <Text style={styles.addBtnText}>Add</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={{ padding: 24, alignItems: 'center' }}><ActivityIndicator size="large" /></View>
      ) : (
        <FlatList
          data={menu}
          keyExtractor={i => i.id}
          contentContainerStyle={{ padding: 16 }}
          renderItem={renderItem}
          ListEmptyComponent={() => (
            <View style={{ padding: 24, alignItems: 'center' }}>
              <Text style={{ color: '#6b7280' }}>No items yet — add your first dish.</Text>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7f3ec' },

  headerRow: {
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#0f1724' },

  formRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 8,
    marginRight: 8,
    flex: 1,
    borderWidth: 1,
    borderColor: '#e6e2d9',
  },
  addBtn: {
    backgroundColor: '#0f1724',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  addBtnText: { color: '#fff', fontWeight: '700' },

  importBtn: {
    backgroundColor: '#c59d5f',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginRight: 8,
  },
  importText: { color: '#0f1724', fontWeight: '700' },

  refreshBtn: {
    backgroundColor: '#fff',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e6e2d9',
  },
  refreshText: { color: '#0f1724', fontWeight: '700' },

  itemRow: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 10,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  name: { fontWeight: '700', color: '#0f1724', fontSize: 16 },
  meta: { color: '#6b7280', marginTop: 4 },

  actionBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginLeft: 8,
  },
  deleteText: { color: '#ef4444', fontWeight: '700' },
});