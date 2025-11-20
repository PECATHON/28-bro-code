// src/navigation/StudentTabs.jsx
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

// Student screens
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
        tabBarInactiveTintColor: '#777',
        tabBarIcon: ({ color, size }) => {
          let icon = 'home';
          if (route.name === 'Home') icon = 'home';
          else if (route.name === 'Orders') icon = 'list';
          else if (route.name === 'Cart') icon = 'cart';
          else if (route.name === 'Profile') icon = 'person';
          return <Ionicons name={icon} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ title: 'Home' }} />
      <Tab.Screen name="Orders" component={OrdersScreen} options={{ title: 'Orders' }} />
      <Tab.Screen name="Cart" component={CartScreen} options={{ title: 'Cart' }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: 'Profile' }} />
    </Tab.Navigator>
  );
}

