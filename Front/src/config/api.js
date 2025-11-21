/**
 * API Configuration
 * 
 * IMPORTANT: For real devices, ensure:
 * 1. Your device and server are on the SAME WiFi network
 * 2. Update BACKEND_BASE to your computer's LAN IP address
 * 3. Find your IP: 
 *    - Mac/Linux: ifconfig | grep "inet " | grep -v 127.0.0.1
 *    - Windows: ipconfig | findstr IPv4
 * 
 * Common configurations:
 * - iOS Simulator: http://localhost:3000
 * - Android Emulator: http://10.0.2.2:3000
 * - Real Device (same WiFi): http://YOUR_LAN_IP:3000 (e.g., http://192.168.1.100:3000)
 * 
 * TROUBLESHOOTING:
 * - If backend doesn't work on real device:
 *   1. Verify device and computer are on same WiFi
 *   2. Check firewall allows port 3000
 *   3. Test: Open http://YOUR_IP:3000/health in device browser
 *   4. Ensure server is running and listening on 0.0.0.0 (not just localhost)
 */

import { Platform } from 'react-native';

// Get the backend URL from environment variable or use default
// You can set this via .env file or Expo config
const getBackendBase = () => {
  // Try to get from environment variable first
  if (process.env.EXPO_PUBLIC_BACKEND_BASE) {
    return process.env.EXPO_PUBLIC_BACKEND_BASE;
  }
  
  // Detect if running on simulator/emulator vs real device
  const isSimulator = Platform.OS === 'ios' && __DEV__ && !Platform.isPad;
  const isEmulator = Platform.OS === 'android' && __DEV__;
  
  // Use localhost for simulators, LAN IP for real devices
  if (isSimulator) {
    return "http://localhost:3000";
  } else if (isEmulator) {
    return "http://10.0.2.2:3000";
  } else {
    // Real device - use your computer's LAN IP
    // UPDATE THIS to your actual LAN IP address
    return "http://172.31.68.164:3000";
  }
};

export const BACKEND_BASE = getBackendBase();

// Log the backend URL in development for debugging
if (__DEV__) {
  console.log("🔗 Backend URL:", BACKEND_BASE);
  console.log("📱 Platform:", Platform.OS, "Simulator:", Platform.isPad === false);
}

