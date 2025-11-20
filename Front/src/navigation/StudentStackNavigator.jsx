// src/navigation/StudentStackNavigator.jsx
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import StudentTabs from './StudentTabs';
import OrderDetail from '../screens/Student/OrderDetail';
import VendorScreen from '../screens/Student/VendorScreen';
import CheckoutScreen from '../screens/Student/CheckoutScreen';

const Stack = createNativeStackNavigator();

export default function StudentStackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="StudentTabs" component={StudentTabs} />
      <Stack.Screen name="Vendor" component={VendorScreen} />
      <Stack.Screen name="Checkout" component={CheckoutScreen} />
      <Stack.Screen name="OrderDetail" component={OrderDetail} />
    </Stack.Navigator>
  );
}