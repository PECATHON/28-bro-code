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
        tabBarActiveTintColor: '#fffb00',
        tabBarInactiveTintColor: '#9aa1a9',
        tabBarStyle: {
          backgroundColor: '#0f1724',
          borderTopWidth: 2,
          borderTopColor: '#fffb00',
          height: 65,
          paddingBottom: 10,
          paddingTop: 10,
          shadowColor: '#fffb00',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.25,
          shadowRadius: 8,
          elevation: 12,
        },
        tabBarIcon: ({ color, size, focused }) => {
          let iconName = 'home-outline';
          if (route.name === 'VendorHome') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'VendorOrders') {
            iconName = focused ? 'list' : 'list-outline';
          } else if (route.name === 'VendorMenu') {
            iconName = focused ? 'create' : 'create-outline';
          } else if (route.name === 'VendorProfile') {
            iconName = focused ? 'person' : 'person-outline';
          }
          
          // Ensure color is visible - use explicit color or fallback
          const iconColor = color || (focused ? '#fffb00' : '#9aa1a9');
          const iconSize = focused ? 28 : 24;
          
          return (
            <Ionicons 
              name={iconName} 
              size={iconSize} 
              color={iconColor}
              style={focused ? {
                shadowColor: '#fffb00',
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.4,
                shadowRadius: 6,
              } : {}}
            />
          );
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '700',
          marginTop: 2,
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