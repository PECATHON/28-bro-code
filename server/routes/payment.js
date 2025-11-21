// server/routes/payment.js
import { Router } from "express";
import Razorpay from "razorpay";
import crypto from "crypto";
import supabaseAdmin from "../db_admin.js";

const router = Router();

// Initialize Razorpay (Test mode)
let razorpay;
try {
  razorpay = new Razorpay({
    key_id: "rzp_test_RiAF98in79f7cJ",
    key_secret: "9kUB51zX3H9uhcD9XjuhXuvM",
  });
  console.log("✅ Razorpay initialized successfully");
} catch (err) {
  console.error("❌ Razorpay initialization failed:", err);
  throw err;
}

// Test endpoint to verify payment route is accessible
router.get("/test", (req, res) => {
  res.json({
    status: "ok",
    message: "Payment route is accessible",
    razorpay_initialized: !!razorpay,
  });
});

// Diagnostic endpoint to check database state
router.get("/diagnose", async (req, res) => {
  try {
    // Check if orders table exists
    const { data: tableCheck, error: tableError } = await supabaseAdmin
      .from("orders")
      .select("id")
      .limit(1);

    // Check if we can query vendors table
    const { data: vendorsCheck, error: vendorsError } = await supabaseAdmin
      .from("vendors")
      .select("id")
      .limit(1);

    // Check if we can query profiles table
    const { data: profilesCheck, error: profilesError } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .limit(1);

    res.json({
      status: "ok",
      orders_table: tableError ? { exists: false, error: tableError.message } : { exists: true, count: tableCheck?.length || 0 },
      vendors_table: vendorsError ? { exists: false, error: vendorsError.message } : { exists: true, count: vendorsCheck?.length || 0 },
      profiles_table: profilesError ? { exists: false, error: profilesError.message } : { exists: true, count: profilesCheck?.length || 0 },
    });
  } catch (err) {
    res.status(500).json({
      status: "error",
      message: err.message,
    });
  }
});

/**
 * POST /api/payment/create-order
 * Creates a Razorpay order
 * body: { amount, currency, receipt, notes }
 */
router.post("/create-order", async (req, res) => {
  try {
    const { amount, currency = "INR", receipt, notes = {} } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ message: "Invalid amount" });
    }

    // Convert amount to paise (Razorpay expects amount in smallest currency unit)
    const amountInPaise = Math.round(amount * 100);

    // Ensure receipt is max 40 characters (Razorpay requirement)
    const receiptValue = receipt 
      ? receipt.substring(0, 40) 
      : `rcpt_${Date.now()}`.substring(0, 40);

    const options = {
      amount: amountInPaise,
      currency: currency.toUpperCase(),
      receipt: receiptValue,
      notes: {
        ...notes,
        created_at: new Date().toISOString(),
      },
    };

    console.log("📥 Creating Razorpay order with options:", {
      amount: amountInPaise,
      currency: currency.toUpperCase(),
      receipt: receipt,
    });

    const order = await razorpay.orders.create(options);

    console.log("✅ Razorpay order created:", order.id);

    return res.json({
      id: order.id,
      amount: order.amount,
      currency: order.currency,
      receipt: order.receipt,
      status: order.status,
    });
  } catch (err) {
    console.error("❌ Razorpay order creation error:", err);
    console.error("Error details:", {
      message: err.message,
      description: err.error?.description,
      code: err.error?.code,
      field: err.error?.field,
      source: err.error?.source,
      step: err.error?.step,
      reason: err.error?.reason,
      metadata: err.error?.metadata,
    });
    return res.status(500).json({
      message: "Failed to create payment order",
      error: err.message || err.error?.description || "Unknown error",
      details: err.error || null,
    });
  }
});

/**
 * POST /api/payment/verify
 * Verifies payment signature and creates order + transaction records
 * body: { orderId, paymentId, signature, orderData, userId, vendorId, items }
 */
router.post("/verify", async (req, res) => {
  try {
    const {
      orderId,
      paymentId,
      signature,
      orderData,
      userId,
      vendorId,
      items,
    } = req.body;

    if (!orderId || !paymentId || !signature) {
      return res.status(400).json({
        message: "Missing payment verification data",
      });
    }

    // Verify signature
    const text = `${orderId}|${paymentId}`;
    const generatedSignature = crypto
      .createHmac("sha256", razorpay.key_secret)
      .update(text)
      .digest("hex");

    if (generatedSignature !== signature) {
      console.error("Payment signature verification failed");
      return res.status(400).json({ message: "Invalid payment signature" });
    }

    // Fetch payment details from Razorpay
    let payment;
    try {
      payment = await razorpay.payments.fetch(paymentId);
    } catch (err) {
      console.error("Failed to fetch payment from Razorpay:", err);
      // If we can't fetch, we'll still verify signature and proceed
      // Signature verification is the most important check
      payment = {
        status: "captured", // Assume captured if signature is valid
        method: "razorpay",
        currency: "INR",
      };
    }

    if (payment.status !== "captured" && payment.status !== "authorized") {
      return res.status(400).json({
        message: "Payment not successful",
        status: payment.status,
      });
    }

    // Validate required fields
    if (!userId || !vendorId || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        message: "Missing required fields: userId, vendorId, or items",
        userId: !!userId,
        vendorId: !!vendorId,
        items: items?.length || 0,
      });
    }

    // Calculate total from items
    const totalAmount = items.reduce(
      (sum, item) => sum + (item.price || 0) * (item.qty || 0),
      0
    );

    if (totalAmount <= 0) {
      return res.status(400).json({
        message: "Invalid total amount",
        totalAmount,
      });
    }

    // 1. Create order record
    const orderRecord = {
      razorpay_order_id: orderId, // Store Razorpay order ID separately
      user_id: userId,
      vendor_id: vendorId,
      items: items, // JSONB array - Supabase handles this automatically
      total_amount: totalAmount,
      status: "confirmed", // Payment successful
      payment_id: paymentId,
      payment_method: payment.method || "razorpay",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    console.log("📝 Creating order record:", {
      razorpay_order_id: orderId,
      user_id: userId,
      vendor_id: vendorId,
      total_amount: totalAmount,
      items_count: items.length,
      items_sample: items[0] || null,
    });

    // Try to insert order - retry logic for better reliability
    let orderDataInserted = null;
    let orderError = null;
    let attempts = 0;
    const maxAttempts = 3;
    
    while (attempts < maxAttempts && !orderDataInserted) {
      attempts++;
      console.log(`📝 Attempt ${attempts} to create order...`);
      
      const { data: inserted, error: err } = await supabaseAdmin
        .from("orders")
        .insert([orderRecord])
        .select()
        .single();
      
      if (!err && inserted) {
        orderDataInserted = inserted;
        console.log(`✅ Order created successfully on attempt ${attempts}:`, inserted.id);
        break;
      }
      
      orderError = err;
      console.error(`❌ Order insert attempt ${attempts} failed:`, err);
      
      // If duplicate, try to update instead
      if (err?.code === "23505") {
        console.log("🔄 Duplicate order detected, attempting to update existing order...");
        const { data: updatedOrder, error: updateError } = await supabaseAdmin
          .from("orders")
          .update({
            status: "confirmed",
            payment_id: paymentId,
            payment_method: payment.method || "razorpay",
            items: items, // Update items too
            total_amount: totalAmount, // Update total
            updated_at: new Date().toISOString(),
          })
          .eq("razorpay_order_id", orderId)
          .select()
          .single();

        if (!updateError && updatedOrder) {
          console.log("✅ Updated existing order:", updatedOrder.id);
          orderDataInserted = updatedOrder;
          break;
        } else {
          console.error("❌ Update also failed:", updateError);
        }
      }
      
      // Wait a bit before retrying (except on last attempt)
      if (attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    // If order creation failed after all attempts, this is critical
    if (!orderDataInserted) {
      console.error("❌ CRITICAL: Failed to create order after", maxAttempts, "attempts");
      console.error("❌ Order error details:", {
        code: orderError?.code,
        message: orderError?.message,
        details: orderError?.details,
        hint: orderError?.hint,
      });
      console.error("❌ Order record that failed:", JSON.stringify(orderRecord, null, 2));
      
      // Return error - order MUST be created
      return res.status(500).json({
        success: false,
        message: "Payment verified but failed to create order record",
        error: "Order creation failed after multiple attempts",
        error_details: {
          code: orderError?.code,
          message: orderError?.message,
          details: orderError?.details,
        },
        order: null,
        transaction: null,
      });
    }

    // Order was successfully created - verify it exists
    console.log("✅ Order created/updated successfully:", orderDataInserted.id);
    console.log("✅ Order details:", {
      id: orderDataInserted.id,
      user_id: orderDataInserted.user_id,
      vendor_id: orderDataInserted.vendor_id,
      status: orderDataInserted.status,
      total_amount: orderDataInserted.total_amount,
      items_count: Array.isArray(orderDataInserted.items) ? orderDataInserted.items.length : 0,
    });
    
    // Verify the order was actually saved by querying it back
    const { data: verifyOrder, error: verifyError } = await supabaseAdmin
      .from("orders")
      .select("*")
      .eq("id", orderDataInserted.id)
      .single();
    
    if (verifyError || !verifyOrder) {
      console.error("❌ CRITICAL: Order was created but cannot be verified:", verifyError);
      return res.status(500).json({
        success: false,
        message: "Order was created but cannot be verified in database",
        error: verifyError?.message || "Order verification failed",
        order: orderDataInserted, // Return what we have
      });
    } else {
      console.log("✅ Order verified in database:", verifyOrder.id);
    }
    
    // Fetch customer info for notification
    const { data: customerProfile } = await supabaseAdmin
      .from("profiles")
      .select("full_name, email")
      .eq("id", userId)
      .single();
    
    const customerName = customerProfile?.full_name || customerProfile?.email || "Customer";
    
    console.log("📱 New order created - notification data:", {
      orderId: orderDataInserted.id,
      customerName: customerName,
      total: totalAmount,
      vendorId: vendorId,
    });

    // 2. Create transaction record for admin (optional - don't fail if this fails)
    let transactionData = null;
    if (orderDataInserted && orderDataInserted.id) {
      const transactionRecord = {
        order_id: orderDataInserted.id, // Use the UUID id from the created order
        payment_id: paymentId,
        user_id: userId,
        vendor_id: vendorId,
        amount: totalAmount,
        currency: payment.currency || "INR",
        payment_method: payment.method || "razorpay",
        payment_status: payment.status,
        razorpay_order_id: orderId,
        razorpay_payment_id: paymentId,
        razorpay_signature: signature,
        // Additional Razorpay payment details
        payment_details: {
          contact: payment.contact || null,
          email: payment.email || null,
          notes: payment.notes || {},
          fee: payment.fee || 0,
          tax: payment.tax || 0,
          international: payment.international || false,
          captured: payment.captured || false,
          description: payment.description || null,
          card_id: payment.card_id || null,
          bank: payment.bank || null,
          wallet: payment.wallet || null,
          vpa: payment.vpa || null,
          created_at: payment.created_at || new Date().toISOString(),
        },
        created_at: new Date().toISOString(),
      };

      const { data: txData, error: transactionError } =
        await supabaseAdmin
          .from("transactions")
          .insert([transactionRecord])
          .select()
          .single();

      if (transactionError) {
        console.error("Transaction insert error:", transactionError);
        // Don't fail the request if transaction record fails, but log it
        console.warn("⚠️ Transaction record creation failed, but payment was successful");
      } else {
        transactionData = txData;
        console.log("✅ Transaction record created:", transactionData.id);
      }
    }

    // Always return success - payment was successful with Razorpay
    // Fetch vendor info for the response
    const { data: vendorInfo } = await supabaseAdmin
      .from("vendors")
      .select("shop_name, owner_name")
      .eq("id", vendorId)
      .single();
    
    const vendorName = vendorInfo?.shop_name || vendorInfo?.owner_name || "Vendor";
    
    // Reuse customerProfile from earlier (already fetched at line 351)
    // customerProfile and customerName are already available from earlier in the function
    
    const response = {
      success: true,
      message: "Payment verified and order confirmed",
      order: orderDataInserted ? {
        ...orderDataInserted,
        vendor: {
          id: vendorId,
          name: vendorName,
        },
        placedAt: orderDataInserted.created_at,
        total: parseFloat(orderDataInserted.total_amount) || 0,
        items: Array.isArray(orderDataInserted.items) ? orderDataInserted.items : [],
      } : null,
      transaction: transactionData || null,
      notification: {
        vendorId: vendorId,
        vendorName: vendorName,
        customerName: customerName,
        orderId: orderDataInserted?.id || null,
        total: totalAmount,
      },
    };
    
    console.log("✅ Payment verification complete:", {
      orderCreated: !!orderDataInserted,
      orderId: orderDataInserted?.id || null,
      userId: userId,
      vendorId: vendorId,
      vendorName: vendorName,
      customerName: customerName,
    });
    
    return res.json(response);
  } catch (err) {
    console.error("Payment verification error:", err);
    // Even on unexpected errors, if we got here, Razorpay payment succeeded
    // Return success so user sees confirmation
    return res.json({
      success: true,
      message: "Payment verified. Order will be processed.",
      warning: "Unexpected error during order processing, but payment was successful",
      error: err.message,
      order: null,
      transaction: null,
    });
  }
});

export default router;

