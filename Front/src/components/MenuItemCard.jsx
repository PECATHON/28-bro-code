import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

export default function MenuItemCard({ item, onAdd }) {
  return (
    <View style={styles.card}>
      <View>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.meta}>{item.category} • ₹{item.price}</Text>
      </View>
      <TouchableOpacity style={styles.addBtn} onPress={onAdd}>
        <Text style={styles.addText}>Add</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',padding:12,borderWidth:1,borderRadius:8,marginBottom:8},
  name:{fontWeight:'600'},
  meta:{color:'#666',marginTop:4},
  addBtn:{backgroundColor:'#222',paddingVertical:6,paddingHorizontal:12,borderRadius:6},
  addText:{color:'#fff'}
});