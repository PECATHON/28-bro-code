// src/navigation/AppNavigator.jsx
import React, { useContext } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Context
import { AuthContext } from '../contexts/AuthContext';
import StudentStackNavigator from './StudentStackNavigator';

// Auth screens
import LoginScreen from '../screens/Auth/LoginScreen';
import RegisterScreen from '../screens/Auth/RegisterScreen';

// Vendor navigator
import VendorTabs from './VendorNavigator';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  const { user } = useContext(AuthContext);

  /*
    Routing logic:
      1) if not logged in -> Auth stack
      2) if role === 'vendor' -> Vendor flow
      3) otherwise -> Student flow (DEFAULT)
  */
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!user ? (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
          </>
        ) : user.role === 'vendor' ? (
          <Stack.Screen name="VendorApp" component={VendorTabs} />
        ) : (
          <Stack.Screen name="StudentApp" component={StudentStackNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}