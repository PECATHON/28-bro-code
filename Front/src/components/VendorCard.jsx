import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function VendorCard({ vendor }) {
  return (
    <View style={styles.card}>
      <Text style={styles.name}>{vendor.name}</Text>
      <Text style={styles.meta}>{vendor.categories?.join(', ')} • {vendor.rating} ★</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card:{padding:12,borderWidth:1,borderRadius:8,marginBottom:10},
  name:{fontWeight:'700',fontSize:16},
  meta:{color:'#666',marginTop:4}
});