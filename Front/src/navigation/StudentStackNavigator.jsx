// src/navigation/StudentStackNavigator.jsx
// Reference schema image (for quick lookup if needed): /mnt/data/c7f8e7d5-f586-4f7b-ba28-bfbb856a9380.png

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import StudentTabs from './StudentTabs';
import VendorScreen from '../screens/Student/VendorScreen';
import CheckoutScreen from '../screens/Student/CheckoutScreen';
import OrderDetail from '../screens/Student/OrderDetail';
import PlaceOrderScreen from '../screens/Student/PlaceOrderScreen';
import OrderStatusScreen from '../screens/Student/OrderStatusScreen';

const Stack = createNativeStackNavigator();

export default function StudentStackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {/* Main tab navigator (Home, Orders, Profile, etc.) */}
      <Stack.Screen name="StudentTabs" component={StudentTabs} />

      {/* Vendor listing / details */}
      <Stack.Screen name="Vendor" component={VendorScreen} />

      {/* Checkout / cart flow */}
      <Stack.Screen name="Checkout" component={CheckoutScreen} />

      {/* Place an order (server call) - invoked from Checkout or Vendor screens */}
      <Stack.Screen name="PlaceOrder" component={PlaceOrderScreen} />

      {/* Order detail screen for viewing order and items */}
      <Stack.Screen name="OrderDetail" component={OrderDetail} />

      {/* Order status / tracking screen (real-time updates) */}
      <Stack.Screen name="OrderStatus" component={OrderStatusScreen} />
    </Stack.Navigator>
  );
}
