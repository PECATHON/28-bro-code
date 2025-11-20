// App.js
import React from 'react';
import { StatusBar, LogBox } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// Context providers and navigator
import { AuthProvider } from './src/contexts/AuthContext';
import { CartProvider } from './src/contexts/CartContext';
import AppNavigator from './src/navigation/AppNavigator';

// Optional: ignore some noisy warnings while prototyping
LogBox.ignoreLogs([
  'Setting a timer', // common for async storage / long timers in dev
  'AsyncStorage has been extracted', // if some libraries warn
]);

export default function App() {
  return (
    // GestureHandlerRootView should be the root for react-native-gesture-handler
    <GestureHandlerRootView style={{ flex: 1 }}>
      {/* SafeAreaProvider makes safe area insets available through the app */}
      <SafeAreaProvider>
        {/* App-level providers */}
        <AuthProvider>
          <CartProvider>
            {/* Global status bar */}
            <StatusBar barStyle="dark-content" />
            {/* The navigation container (inside AppNavigator) */}
            <AppNavigator />
          </CartProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}