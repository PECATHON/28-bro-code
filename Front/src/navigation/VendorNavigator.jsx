// src/navigation/VendorNavigator.jsx
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

// Vendor screens
import VendorHome from '../screens/Vendor/VendorHome';
import VendorOrders from '../screens/Vendor/VendorOrders';
import VendorMenuEditor from '../screens/Vendor/VendorMenuEditor';
import VendorProfile from '../screens/Vendor/VendorProfile';

const Tab = createBottomTabNavigator();

export default function VendorTabs() {
  return (
    <Tab.Navigator
      initialRouteName="VendorHome"
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: '#0f1724',
        tabBarInactiveTintColor: '#777',
        tabBarIcon: ({ color, size }) => {
          let icon = 'home';
          if (route.name === 'VendorHome') icon = 'home';
          else if (route.name === 'VendorOrders') icon = 'list';
          else if (route.name === 'VendorMenu') icon = 'create';
          else if (route.name === 'VendorProfile') icon = 'person';
          return <Ionicons name={icon} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="VendorHome" component={VendorHome} options={{ title: 'Dashboard' }} />
      <Tab.Screen name="VendorOrders" component={VendorOrders} options={{ title: 'Orders' }} />
      <Tab.Screen name="VendorMenu" component={VendorMenuEditor} options={{ title: 'Menu' }} />
      <Tab.Screen name="VendorProfile" component={VendorProfile} options={{ title: 'Profile' }} />
    </Tab.Navigator>
  );
}