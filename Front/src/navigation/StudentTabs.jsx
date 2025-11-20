// src/navigation/StudentTabs.jsx
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import HomeScreen from '../screens/Student/HomeScreen';
import OrdersScreen from '../screens/Student/OrdersScreen';
import CartScreen from '../screens/Student/CartScreen';
import ProfileScreen from '../screens/Student/ProfileScreen';

const Tab = createBottomTabNavigator();

export default function StudentTabs() {
  return (
    <Tab.Navigator
      initialRouteName="Home"
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: '#0f1724',
        tabBarInactiveTintColor: '#9aa1a9',

        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopColor: '#eee',

          height: 90,          // 🔥 FIX: Bigger, safe area friendly
          paddingBottom: 24,   // 🔥 Lifts icons UP
          paddingTop: 14,      // 🔥 Expands tap area
        },

        tabBarItemStyle: {
          height: 70,
          justifyContent: 'center',
          alignItems: 'center',
        },

        tabBarIcon: ({ color, size }) => {
          let icon = 'home-outline';
          if (route.name === 'Home') icon = 'home-outline';
          else if (route.name === 'Orders') icon = 'receipt-outline';
          else if (route.name === 'Cart') icon = 'cart-outline';
          else if (route.name === 'Profile') icon = 'person-outline';
          return <Ionicons name={icon} size={26} color={color} />;
        }
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Orders" component={OrdersScreen} />
      <Tab.Screen name="Cart" component={CartScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}
