// server/routes/getVendors.js
import { Router } from "express";
import supabase from "../db.js";
import supabaseAdmin from "../db_admin.js"; // Use admin client to bypass RLS and get ALL vendors

const router = Router();

// GET /api/vendors/items?owner_id=...&status=approved&search=foo
// Returns ALL vendors from database by default (real-time data)
router.get("/items", async (req, res) => {
  try {
    const { owner_id, status, search } = req.query;

    console.log("📦 GET /api/vendors/items - Fetching all vendors from database");

    // Use admin client to bypass RLS and get ALL vendors
    let query = supabaseAdmin
      .from("vendors")
      .select("*", { count: 'exact' }) // Get exact count
      .order("created_at", { ascending: false });
    
    // Set high limit to fetch all vendors (Supabase default is 1000, but we want all)
    query = query.limit(10000);

    // optional filters
    if (owner_id) query = query.eq("owner_id", owner_id);
    // Support both old (is_approved/is_active) and new (status) schema
    if (req.query.is_approved !== undefined) {
      const approvedBool = String(req.query.is_approved).toLowerCase() === "true";
      // If status field exists, use it; otherwise check is_approved
      if (approvedBool) {
        query = query.or("status.eq.approved,is_approved.eq.true");
      } else {
        query = query.or("status.neq.approved,is_approved.eq.false");
      }
    }
    if (status) {
      query = query.eq("status", status);
    }
    if (req.query.is_active !== undefined) {
      const activeBool = String(req.query.is_active).toLowerCase() === "true";
      query = query.eq("is_active", activeBool);
    }

    // basic text search on shop_name, owner_name, or email
    if (search) {
      query = query.or(`shop_name.ilike.%${search}%,owner_name.ilike.%${search}%,email.ilike.%${search}%`);
    }

    const { data, error, count } = await query;

    console.log("📦 Database query result:", {
      count: count || data?.length || 0,
      returned: data?.length || 0,
      error: error?.message || null,
      vendor_ids: data?.map(v => v.id).join(", ") || "none",
      vendor_names: data?.map(v => v.shop_name || v.owner_name || v.name || "Unknown").join(", ") || "none",
    });
    
    // Log if we're missing vendors
    if (count && count > (data?.length || 0)) {
      console.warn(`⚠️ Total vendors in DB: ${count}, but only ${data?.length || 0} returned. This shouldn't happen with admin client.`);
    }

    if (error) {
      console.error("❌ Error fetching vendors:", error);
      return res.status(500).json({ message: "Failed to fetch vendors", error: error.message });
    }

    // Normalize response - merge name and shop_name consistently
    // Priority: shop_name > name > owner_name
    const normalized = (data || []).map(v => {
      // Determine the primary name field (shop_name takes priority)
      const primaryName = v.shop_name || v.name || v.owner_name || "Unknown Vendor";
      
      return {
        id: v.id,
        name: primaryName, // Unified name field for frontend
        shop_name: v.shop_name || primaryName, // Always ensure shop_name exists
        owner_name: v.owner_name || null,
        description: v.description || "",
        email: v.email || null,
        phone: v.phone || null,
        status: v.status || (v.is_approved ? "approved" : "pending"),
        is_active: v.is_active !== undefined ? v.is_active : true,
        created_at: v.created_at,
        // Include all original fields for backward compatibility
        ...v,
        // Override with normalized values
        name: primaryName,
        shop_name: v.shop_name || primaryName,
      };
    });

    console.log("✅ Returning", normalized?.length || 0, "vendors from database");
    console.log("✅ Vendor names being returned:", normalized?.map(v => v.name).join(", ") || "none");

    return res.json({ vendors: normalized });
  } catch (err) {
    console.error("getVendors error:", err);
    return res.status(500).json({ message: "Server error fetching vendors", error: err.message });
  }
});

export default router;