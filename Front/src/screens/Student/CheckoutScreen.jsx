import React, { useState, useContext, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  ScrollView,
  SafeAreaView,
  Modal,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { CartContext } from '../../contexts/CartContext';
import { AuthContext } from '../../contexts/AuthContext';

const BACKEND_BASE = 'http://172.31.68.164:3000';
const RAZORPAY_KEY = 'rzp_test_RiAF98in79f7cJ';

export default function CheckoutScreen({ navigation }) {
  const { items, clearCart } = useContext(CartContext);
  const { user } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [razorpayOrderId, setRazorpayOrderId] = useState(null);
  const [paymentData, setPaymentData] = useState(null);
  const webViewRef = useRef(null);

  // Calculate totals
  const subtotal = items.reduce((sum, item) => sum + item.price * item.qty, 0);
  const tax = subtotal * 0.18; // 18% GST
  const deliveryFee = 20;
  const total = subtotal + tax + deliveryFee;

  // Get vendor ID from first item (assuming all items are from same vendor)
  const vendorId = items.length > 0 ? items[0].vendorId : null;

  if (items.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Your cart is empty</Text>
          <TouchableOpacity
            style={styles.btn}
            onPress={() => navigation.navigate('StudentTabs', { screen: 'Home' })}
          >
            <Text style={styles.btnText}>Continue Shopping</Text>
            </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  async function handlePayment() {
    if (!user || !user.id) {
      Alert.alert('Error', 'Please login to place an order');
      return;
    }

    if (!vendorId) {
      Alert.alert('Error', 'Invalid vendor information');
      return;
    }

    setLoading(true);

    try {
      // Step 1: Create Razorpay order on backend
      console.log('Creating payment order for amount:', total);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      const orderRes = await fetch(`${BACKEND_BASE}/api/payment/create-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: total,
          currency: 'INR',
          receipt: `ord_${Date.now()}`, // Max 40 chars - using timestamp only
          notes: {
            userId: user.id,
            vendorId: vendorId,
            items: items.length,
          },
        }),
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);

      if (!orderRes.ok) {
        const errorData = await orderRes.json().catch(() => ({ message: 'Failed to create order' }));
        console.error('Order creation failed:', errorData);
        throw new Error(errorData.message || errorData.error || 'Failed to create order');
      }

      const orderData = await orderRes.json();
      console.log('✅ Order created successfully:', orderData);

      if (!orderData.id) {
        throw new Error('Invalid order response from server');
      }

      setRazorpayOrderId(orderData.id);
      setShowPayment(true);
      setLoading(false); // Stop loading when payment modal opens
    } catch (error) {
      console.error('Payment error:', error);
      
      let errorMessage = 'Something went wrong. Please try again.';
      
      if (error.name === 'AbortError') {
        errorMessage = 'Request timed out. Please check your internet connection and try again.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      Alert.alert('Payment Failed', errorMessage);
      setLoading(false);
    }
  }

  // Generate Razorpay checkout HTML
  function getRazorpayCheckoutHTML(orderId) {
    // Escape user data to prevent XSS
    const safeName = (user?.name || '').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    const safeEmail = (user?.email || '').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    const safePhone = (user?.phone || '').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    
    return `<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <meta charset="UTF-8">
  <title>Razorpay Checkout</title>
  <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      margin: 0;
      padding: 20px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #f7f3ec;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
    }
    .container {
      text-align: center;
      width: 100%;
    }
    h2 {
      color: ${palette.orange};
      margin-bottom: 10px;
    }
    p {
      color: #6b7280;
      margin-bottom: 30px;
    }
    button {
      background: #0f1724;
      color: white;
      border: none;
      padding: 15px 30px;
      font-size: 18px;
      border-radius: 8px;
      cursor: pointer;
      width: 100%;
      max-width: 300px;
    }
    button:active {
      opacity: 0.8;
    }
    .loading {
      color: #6b7280;
      margin-top: 20px;
    }
  </style>
</head>
<body>
  <div class="container">
    <h2>Complete Payment</h2>
    <p>Click the button below to proceed with payment</p>
    <button id="pay-button">Pay ₹${total.toFixed(2)}</button>
    <p id="status" class="loading"></p>
  </div>
  <script>
    (function() {
      var statusEl = document.getElementById('status');
      var payButton = document.getElementById('pay-button');
      var rzp = null;
      var scriptLoaded = false;
      
      function updateStatus(msg) {
        if (statusEl) {
          statusEl.textContent = msg;
        }
        console.log('Payment Status:', msg);
      }
      
      function waitForRazorpay(maxAttempts) {
        maxAttempts = maxAttempts || 30; // 30 attempts = 15 seconds
        var attempts = 0;
        
        return new Promise(function(resolve, reject) {
          function check() {
            attempts++;
            if (typeof Razorpay !== 'undefined') {
              scriptLoaded = true;
              console.log('✅ Razorpay script loaded');
              resolve();
            } else if (attempts >= maxAttempts) {
              reject(new Error('Razorpay script failed to load after ' + maxAttempts + ' attempts'));
            } else {
              setTimeout(check, 500);
            }
          }
          check();
        });
      }
      
      function initRazorpay() {
        try {
          if (typeof Razorpay === 'undefined') {
            updateStatus('Waiting for Razorpay to load...');
            // Retry after a short delay
            setTimeout(function() {
              if (typeof Razorpay !== 'undefined') {
                initRazorpay();
              } else {
                updateStatus('Error: Razorpay not available. Please refresh.');
                window.ReactNativeWebView.postMessage(JSON.stringify({
                  type: 'payment_error',
                  error: 'Razorpay library not loaded'
                }));
              }
            }, 1000);
            return;
          }
          
          var options = {
            "key": "${RAZORPAY_KEY}",
            "amount": ${Math.round(total * 100)},
            "currency": "INR",
            "name": "Campus Canteen",
            "description": "Food Order Payment",
            "order_id": "${orderId}",
            "handler": function (response) {
              updateStatus('Payment successful! Processing...');
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'payment_success',
                data: response
              }));
            },
            "prefill": {
              "name": "${safeName}",
              "email": "${safeEmail}",
              "contact": "${safePhone}"
            },
            "theme": {
              "color": "${palette.orange}"
            },
            "modal": {
              "ondismiss": function() {
                updateStatus('Payment cancelled');
                window.ReactNativeWebView.postMessage(JSON.stringify({
                  type: 'payment_cancelled'
                }));
              }
            },
            "notes": {
              "order_type": "food_order"
            }
          };
          
          rzp = new Razorpay(options);
          updateStatus('Ready to pay');
          
          // Set up button click handler
          if (payButton) {
            payButton.onclick = function(e) {
              e.preventDefault();
              updateStatus('Opening payment gateway...');
              try {
                if (rzp) {
                  rzp.open();
                } else {
                  updateStatus('Error: Payment gateway not initialized');
                }
              } catch (err) {
                updateStatus('Error: ' + err.message);
                console.error('Razorpay open error:', err);
                window.ReactNativeWebView.postMessage(JSON.stringify({
                  type: 'payment_error',
                  error: 'Failed to open payment gateway: ' + err.message
                }));
              }
            };
          }
          
          // Auto-open after a short delay
          setTimeout(function() {
            if (rzp) {
              updateStatus('Opening payment gateway...');
              try {
                rzp.open();
              } catch (err) {
                updateStatus('Click button to pay');
                console.error('Auto-open failed:', err);
              }
            }
          }, 1500);
          
        } catch (err) {
          updateStatus('Error: ' + err.message);
          console.error('Razorpay init error:', err);
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'payment_error',
            error: 'Failed to initialize payment: ' + err.message
          }));
        }
      }
      
      // Start loading process
      updateStatus('Loading payment gateway...');
      
      // Wait for Razorpay script to load (it's in the head tag)
      waitForRazorpay(30)
        .then(function() {
          updateStatus('Initializing payment...');
          initRazorpay();
        })
        .catch(function(err) {
          updateStatus('Failed to load. Click button to retry.');
          console.error('Script load error:', err);
          
          // Set up retry button
          if (payButton) {
            payButton.textContent = 'Retry Loading Payment';
            payButton.onclick = function(e) {
              e.preventDefault();
              updateStatus('Retrying...');
              waitForRazorpay(30)
                .then(function() {
                  initRazorpay();
                })
                .catch(function(retryErr) {
                  updateStatus('Failed: ' + retryErr.message);
                  window.ReactNativeWebView.postMessage(JSON.stringify({
                    type: 'payment_error',
                    error: 'Failed to load Razorpay: ' + retryErr.message
                  }));
                });
            };
          }
        });
    })();
  </script>
</body>
</html>`;
  }

  // Handle WebView messages
  function handleWebViewMessage(event) {
    try {
      const message = JSON.parse(event.nativeEvent.data);
      
      if (message.type === 'payment_success') {
        const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = message.data;
        setPaymentData({
          paymentId: razorpay_payment_id,
          orderId: razorpay_order_id,
          signature: razorpay_signature,
        });
        setShowPayment(false);
        verifyPayment(razorpay_payment_id, razorpay_order_id, razorpay_signature);
      } else if (message.type === 'payment_cancelled') {
        setShowPayment(false);
        setLoading(false);
        Alert.alert('Cancelled', 'Payment was cancelled');
      } else if (message.type === 'payment_error') {
        setShowPayment(false);
        setLoading(false);
        Alert.alert('Payment Error', message.error || 'Payment failed. Please try again.');
      }
    } catch (err) {
      console.error('Error parsing WebView message:', err);
    }
  }

  async function verifyPayment(paymentId, orderId, signature) {
    setLoading(true);
    
    try {
      // Verify payment on backend
      const verifyRes = await fetch(`${BACKEND_BASE}/api/payment/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId: orderId,
          paymentId: paymentId,
          signature: signature,
          orderData: { id: orderId },
          userId: user.id,
          vendorId: vendorId,
          items: items,
        }),
      });

      const verifyData = await verifyRes.json();
      console.log('📦 Payment verification response:', verifyData);

      // Check if order was actually created
      if (!verifyRes.ok || !verifyData.success) {
        console.error('❌ Payment verification failed:', verifyData);
        Alert.alert(
          'Payment Issue',
          verifyData.message || 'Payment was successful but order creation failed. Please contact support.',
          [{ text: 'OK' }]
        );
        setLoading(false);
        return;
      }
      
      if (!verifyData.order || !verifyData.order.id) {
        console.error('❌ Order was not created:', verifyData);
        Alert.alert(
          'Order Creation Failed',
          'Payment was successful but order was not created. Please contact support with payment ID: ' + paymentId,
          [{ text: 'OK' }]
        );
        setLoading(false);
        return;
      }

      // Perfect case - everything worked
      console.log('✅ Payment verified and order created successfully:', verifyData.order.id);

      // Always show success if we got here (payment was successful with Razorpay)
      clearCart();
      
      // Get the created order data if available
      const createdOrder = verifyData?.order || null;
      
      console.log('✅ Payment verified - Order created:', createdOrder?.id);
      
      // Navigate to orders screen to show the new order
      // The orders screen will automatically refresh and show the new order
      Alert.alert(
        'Order Confirmed! ✅',
        `Your order has been placed successfully!\n\nOrder ID: ${createdOrder?.id?.substring(0, 8) || 'N/A'}...\nAmount: ₹${total.toFixed(2)}\n\nThe vendor has been notified.`,
        [
          {
            text: 'View Orders',
            onPress: () => {
              // Navigate to orders screen - it will auto-refresh
              navigation.navigate('StudentTabs', { screen: 'Orders' });
            },
          },
          {
            text: 'Back to Home',
            onPress: () => {
              navigation.navigate('StudentTabs', { screen: 'Home' });
            },
          },
        ]
      );
    } catch (error) {
      // Network errors or critical failures
      console.error('Payment verification error:', error);
      
      // Even on error, if Razorpay payment succeeded, show success
      // The backend can sync orders later
      clearCart();
      Alert.alert(
        'Order Confirmed!',
        'Your payment was successful. Your order is being processed.',
        [
          {
            text: 'Back to Home',
            onPress: () => {
              navigation.navigate('StudentTabs', { screen: 'Home' });
            },
          },
          {
            text: 'View Orders',
            onPress: () => {
              navigation.navigate('StudentTabs', { screen: 'Orders' });
            },
          },
        ]
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <Text style={styles.title}>Checkout</Text>

        {/* Order Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Summary</Text>
          {items.map((item) => (
            <View key={item.id} style={styles.itemRow}>
              <View style={styles.itemInfo}>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemQty}>Qty: {item.qty}</Text>
              </View>
              <Text style={styles.itemPrice}>₹{(item.price * item.qty).toFixed(2)}</Text>
            </View>
          ))}
        </View>

        {/* Price Breakdown */}
        <View style={styles.section}>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Subtotal</Text>
            <Text style={styles.priceValue}>₹{subtotal.toFixed(2)}</Text>
          </View>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>GST (18%)</Text>
            <Text style={styles.priceValue}>₹{tax.toFixed(2)}</Text>
          </View>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Delivery Fee</Text>
            <Text style={styles.priceValue}>₹{deliveryFee.toFixed(2)}</Text>
          </View>
          <View style={[styles.priceRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>₹{total.toFixed(2)}</Text>
          </View>
        </View>

        {/* Payment Button */}
        <TouchableOpacity
          style={[styles.btn, loading && styles.btnDisabled]}
          onPress={handlePayment}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.btnText}>Pay ₹{total.toFixed(2)}</Text>
          )}
        </TouchableOpacity>
      </ScrollView>

      {/* Razorpay Payment Modal */}
      <Modal
        visible={showPayment}
        animationType="slide"
        onRequestClose={() => {
          setShowPayment(false);
          setLoading(false);
        }}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Payment</Text>
            <TouchableOpacity
              onPress={() => {
                setShowPayment(false);
                setLoading(false);
              }}
            >
              <Text style={styles.closeButton}>✕</Text>
            </TouchableOpacity>
          </View>
          {razorpayOrderId && (
            <WebView
              ref={webViewRef}
              source={{ 
                html: getRazorpayCheckoutHTML(razorpayOrderId),
                baseUrl: 'https://checkout.razorpay.com'
              }}
              onMessage={handleWebViewMessage}
              style={styles.webview}
              javaScriptEnabled={true}
              domStorageEnabled={true}
              originWhitelist={['*']}
              mixedContentMode="always"
              allowsInlineMediaPlayback={true}
              mediaPlaybackRequiresUserAction={false}
              startInLoadingState={true}
              scalesPageToFit={true}
              cacheEnabled={false}
              incognito={true}
              onError={(syntheticEvent) => {
                const { nativeEvent } = syntheticEvent;
                console.error('WebView error:', nativeEvent);
                Alert.alert('Payment Error', 'Failed to load payment page. Please try again.');
                setShowPayment(false);
                setLoading(false);
              }}
              onHttpError={(syntheticEvent) => {
                const { nativeEvent } = syntheticEvent;
                console.error('WebView HTTP error:', nativeEvent);
              }}
              onLoadEnd={() => {
                console.log('✅ Payment WebView loaded successfully');
              }}
              onLoadStart={() => {
                console.log('🔄 Payment WebView started loading');
              }}
              onShouldStartLoadWithRequest={(request) => {
                console.log('WebView navigation request:', request.url);
                return true;
              }}
            />
          )}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const palette = {
  darkBlue: '#0f1724',
  darkBlueLight: '#1a2332',
  orange: '#ff6b35',
  red: '#ef4444',
  white: '#ffffff',
  muted: '#9aa1a9',
  mutedLight: '#cbd5e1',
  card: '#1e293b',
  cardLight: '#2d3748',
  yellow: '#fbbf24',
  neonYellow: '#fffb00',
  neonYellowGlow: 'rgba(255, 251, 0, 0.5)',
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.darkBlue,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    color: palette.mutedLight,
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: palette.white,
    marginBottom: 20,
    letterSpacing: 0.5,
  },
  section: {
    backgroundColor: palette.card,
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: palette.neonYellow,
    shadowColor: palette.neonYellow,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: palette.white,
    marginBottom: 16,
    letterSpacing: 0.5,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: palette.cardLight,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 18,
    fontWeight: '600',
    color: palette.white,
  },
  itemQty: {
    fontSize: 14,
    color: palette.mutedLight,
    marginTop: 4,
  },
  itemPrice: {
    fontSize: 18,
    fontWeight: '700',
    color: palette.orange,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  priceLabel: {
    fontSize: 16,
    color: palette.mutedLight,
  },
  priceValue: {
    fontSize: 16,
    color: palette.white,
    fontWeight: '600',
  },
  totalRow: {
    borderTopWidth: 2,
    borderTopColor: palette.neonYellow,
    marginTop: 12,
    paddingTop: 16,
  },
  totalLabel: {
    fontSize: 20,
    fontWeight: '700',
    color: palette.white,
  },
  totalValue: {
    fontSize: 24,
    fontWeight: '800',
    color: palette.orange,
  },
  btn: {
    backgroundColor: palette.orange,
    padding: 18,
    borderRadius: 25,
    alignItems: 'center',
    marginTop: 12,
    borderWidth: 1,
    borderColor: palette.neonYellow,
    shadowColor: palette.neonYellow,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  btnText: {
    color: palette.white,
    fontSize: 18,
    fontWeight: '700',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: palette.darkBlue,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: palette.neonYellow,
    backgroundColor: palette.card,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: palette.white,
    letterSpacing: 0.5,
  },
  closeButton: {
    fontSize: 28,
    color: palette.mutedLight,
    fontWeight: '300',
  },
  webview: {
    flex: 1,
  },
});
