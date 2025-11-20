import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

export default function CheckoutScreen({ navigation }) {
    return (
        <View style={styles.container}>
            <Text style={styles.title}>Checkout</Text>
            <Text>Payment integration goes here.</Text>
            <TouchableOpacity style={styles.btn} onPress={() => {
                alert('Order Placed!');
                navigation.navigate('StudentTabs', { screen: 'Home' });
            }}>
                <Text style={styles.btnText}>Place Order</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
    title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
    btn: { backgroundColor: '#000', padding: 15, borderRadius: 8, marginTop: 20 },
    btnText: { color: '#fff', fontWeight: 'bold' }
});
