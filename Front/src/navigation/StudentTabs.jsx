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
          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Orders') {
            iconName = focused ? 'list' : 'list-outline';
          } else if (route.name === 'Cart') {
            iconName = focused ? 'cart' : 'cart-outline';
          } else if (route.name === 'Profile') {
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
      <Tab.Screen name="Home" component={HomeScreen} options={{ title: 'Home' }} />
      <Tab.Screen name="Orders" component={OrdersScreen} options={{ title: 'Orders' }} />
      <Tab.Screen name="Cart" component={CartScreen} options={{ title: 'Cart' }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: 'Profile' }} />
    </Tab.Navigator>
  );
}

