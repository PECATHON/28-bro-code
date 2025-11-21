// src/services/notifications.js
// Notification service for handling push notifications
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/**
 * Request notification permissions
 */
export async function requestNotificationPermissions() {
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      console.warn('⚠️ Notification permissions not granted');
      return false;
    }
    
    // Get push token (for future use with backend)
    // DISABLED: Hiding notification system to avoid "No project id" error
    // if (Platform.OS !== 'web') {
    //   try {
    //     const token = await Notifications.getExpoPushTokenAsync();
    //     console.log('📱 Expo Push Token:', token.data);
    //     return token.data;
    //   } catch (error) {
    //     console.warn('⚠️ Could not get push token (project ID not configured):', error.message);
    //   }
    // }
    
    return true;
  } catch (error) {
    console.error('❌ Error requesting notification permissions:', error);
    return false;
  }
}

/**
 * Schedule a local notification
 */
export async function scheduleLocalNotification(title, body, data = {}) {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
        sound: true,
      },
      trigger: null, // Show immediately
    });
    console.log('✅ Notification scheduled:', title);
  } catch (error) {
    console.error('❌ Error scheduling notification:', error);
  }
}

/**
 * Send notification to student when order status changes
 */
export async function notifyOrderStatusChange(orderId, vendorName, status) {
  let title = '';
  let body = '';
  
  switch (status) {
    case 'preparing':
      title = 'Order Under Process 🔄';
      body = `Your order from ${vendorName} is now being prepared.`;
      break;
    case 'ready':
      title = 'Order Prepared! ✅';
      body = `Your order from ${vendorName} is prepared and ready!`;
      break;
    case 'completed':
      title = 'Order Ready! 🎉';
      body = `Your order from ${vendorName} is ready for pickup!`;
      break;
    case 'cancelled':
      title = 'Order Rejected ❌';
      body = `Your order from ${vendorName} has been rejected.`;
      break;
    default:
      title = 'Order Status Updated';
      body = `Your order from ${vendorName} status has been updated.`;
  }
  
  await scheduleLocalNotification(
    title,
    body,
    { orderId, type: 'order_status_change', status }
  );
}

/**
 * Send notification to student when order is completed (backward compatibility)
 */
export async function notifyOrderCompleted(orderId, vendorName) {
  await notifyOrderStatusChange(orderId, vendorName, 'completed');
}

/**
 * Send notification when new order arrives (for vendor)
 */
export async function notifyNewOrder(orderId, customerName, total) {
  await scheduleLocalNotification(
    'New Order! 📦',
    `New order from ${customerName} - ₹${total.toFixed(2)}`,
    { orderId, type: 'new_order' }
  );
}

/**
 * Set up notification listeners
 */
export function setupNotificationListeners(navigation) {
  // Handle notification received while app is in foreground
  const notificationListener = Notifications.addNotificationReceivedListener(notification => {
    console.log('📱 Notification received:', notification);
    const data = notification.request.content.data;
    
    // Navigate based on notification type
    if ((data?.type === 'order_completed' || data?.type === 'order_status_change') && data?.orderId) {
      // Navigate to order detail
      setTimeout(() => {
        navigation?.navigate('StudentTabs', {
          screen: 'Orders',
          params: { orderId: data.orderId },
        });
      }, 1000);
    }
  });

  // Handle notification tapped/opened
  const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
    console.log('📱 Notification response:', response);
    const data = response.notification.request.content.data;
    
    if ((data?.type === 'order_completed' || data?.type === 'order_status_change') && data?.orderId) {
      navigation?.navigate('StudentTabs', {
        screen: 'Orders',
        params: { orderId: data.orderId },
      });
    }
    
    if (data?.type === 'new_order' && data?.orderId) {
      // Navigate vendor to orders screen
      navigation?.navigate('VendorOrders');
    }
  });

  return () => {
    Notifications.removeNotificationSubscription(notificationListener);
    Notifications.removeNotificationSubscription(responseListener);
  };
}

