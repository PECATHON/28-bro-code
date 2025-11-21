// App.js
import React, { useEffect, useRef } from 'react';
import { StatusBar, LogBox } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
// DISABLED: Notification system hidden to avoid "No project id" error
// import * as Notifications from 'expo-notifications';

// Context providers and navigator
import { AuthProvider } from './src/contexts/AuthContext';
import { CartProvider } from './src/contexts/CartContext';
import AppNavigator from './src/navigation/AppNavigator';
// DISABLED: Notification system hidden to avoid "No project id" error
// import { requestNotificationPermissions, setupNotificationListeners } from './src/services/notifications';

// Optional: ignore some noisy warnings while prototyping
LogBox.ignoreLogs([
  'Setting a timer', // common for async storage / long timers in dev
  'AsyncStorage has been extracted', // if some libraries warn
]);

export default function App() {
  const notificationListener = useRef(null);
  const responseListener = useRef(null);

  useEffect(() => {
    // DISABLED: Notification system hidden to avoid "No project id" error
    // requestNotificationPermissions();
    // notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
    //   console.log('📱 Notification received in App:', notification);
    // });
    // responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
    //   console.log('📱 Notification response in App:', response);
    // });
    // return () => {
    //   if (notificationListener.current) {
    //     Notifications.removeNotificationSubscription(notificationListener.current);
    //   }
    //   if (responseListener.current) {
    //     Notifications.removeNotificationSubscription(responseListener.current);
    //   }
    // };
  }, []);

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