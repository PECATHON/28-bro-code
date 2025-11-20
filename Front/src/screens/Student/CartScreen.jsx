import React, { useContext } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { CartContext } from '../../contexts/CartContext';

export default function CartScreen({ navigation }) {
  const { items, removeFromCart, clearCart } = useContext(CartContext);
  const total = items.reduce((s, i) => s + i.price * i.qty, 0);

  return (
    <View style={{flex:1,padding:12}}>
      <Text style={{fontSize:20,fontWeight:'700'}}>Cart</Text>
      <FlatList data={items} keyExtractor={i=>i.id} renderItem={({item}) => (
        <View style={styles.row}>
          <View>
            <Text style={{fontWeight:'600'}}>{item.name} x{item.qty}</Text>
            <Text>₹{item.price * item.qty}</Text>
          </View>
          <TouchableOpacity onPress={() => removeFromCart(item.id)}><Text style={{color:'red'}}>Remove</Text></TouchableOpacity>
        </View>
      )}/>
      <View style={{marginTop:12}}>
        <Text style={{fontSize:18}}>Total: ₹{total}</Text>
        <TouchableOpacity style={styles.checkout} onPress={() => navigation.navigate('Checkout')}>
          <Text style={{color:'#fff'}}>Proceed to Checkout</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row:{flexDirection:'row',justifyContent:'space-between',padding:12,borderWidth:1,borderRadius:8,marginBottom:8,alignItems:'center'},
  checkout:{backgroundColor:'#111',padding:12,alignItems:'center',borderRadius:8,marginTop:12}
});