// server/routes/menu.js
// Full menu CRUD + import/export + image upload (multer -> Supabase Storage)
// Requires:
//   - server/db.js         (anon client)
//   - server/db_admin.js   (service-role client)
//   - npm install csv-parse multer

import { Router } from "express";
import supabase from "../db.js";
import supabaseAdmin from "../db_admin.js";
import fs from "fs";
import { parse } from "csv-parse/sync";
import multer from "multer";
import path from "path";
import os from "os";

const router = Router();
const upload = multer({ dest: path.join(os.tmpdir(), "uploads") });

/**
 * GET /api/menu/export/:vendorId
 * Export menu as JSON (MUST come before /:vendorId route)
 */
router.get("/export/:vendorId", async (req, res) => {
  const { vendorId } = req.params;
  try {
    const { data, error } = await supabase
      .from("menu_items")
      .select("*")
      .eq("vendor_id", vendorId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return res.json(data || []);
  } catch (err) {
    console.error("GET /api/menu/export/:vendorId error:", err);
    return res.status(500).json({ message: "Export failed", error: err.message });
  }
});

/**
 * GET /api/menu/:vendorId
 * Public read of a vendor's menu
 * NOTE: This route should NOT match "/items" - that should be handled by getMenu.js
 */
router.get("/:vendorId", async (req, res) => {
  const { vendorId } = req.params;
  console.log("[menu.js] Route /:vendorId hit with vendorId:", vendorId);
  
  // Prevent this route from matching "/items" - this should never happen if route order is correct
  // Also check for other reserved paths
  const reservedPaths = ["items", "export", "upload", "import"];
  if (reservedPaths.includes(vendorId)) {
    console.error("[menu.js] ERROR: Reserved path '", vendorId, "' was matched by /:vendorId route! Route order issue!");
    return res.status(404).json({ 
      message: `Route not found. '${vendorId}' is a reserved path.`,
      hint: vendorId === "items" ? "Use /api/menu/items?vendor_id=..." : "Check route configuration"
    });
  }
  
  // Validate vendorId is a valid UUID format before querying
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(vendorId)) {
    console.error("[menu.js] ERROR: Invalid UUID format:", vendorId);
    return res.status(400).json({ 
      message: "Invalid vendor ID format",
      error: `'${vendorId}' is not a valid UUID`
    });
  }
  
  try {
    const { data, error } = await supabase
      .from("menu_items")
      .select("*")
      .eq("vendor_id", vendorId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return res.json(data || []);
  } catch (err) {
    console.error("GET /api/menu/:vendorId error:", err);
    return res.status(500).json({ message: "Failed to fetch menu", error: err.message });
  }
});

/**
 * POST /api/menu/:vendorId/import
 * Import menu items from CSV (MUST come before POST /:vendorId route)
 */
router.post("/:vendorId/import", async (req, res) => {
  const { vendorId } = req.params;
  const { filepath, csvText } = req.body;

  try {
    let content;
    if (csvText) {
      content = csvText;
    } else if (filepath) {
      // SECURITY: only allow trusted paths in production, this is for local dev convenience
      if (!fs.existsSync(filepath)) {
        return res.status(400).json({ message: "File not found on server", filepath });
      }
      content = fs.readFileSync(filepath, "utf8");
    } else {
      return res.status(400).json({ message: "Provide filepath or csvText" });
    }

    const records = parse(content, { columns: true, skip_empty_lines: true });
    if (!Array.isArray(records) || records.length === 0) {
      return res.status(400).json({ message: "No records found in CSV" });
    }

    // normalize and map rows - use only minimal required fields
    const rows = records.map(r => ({
      vendor_id: vendorId,
      name: (r.name || "").trim(),
      price: r.price ? parseFloat(r.price) : 0,
      created_at: new Date().toISOString(),
      // Only add description if provided (might not exist in table)
      ...(r.description && r.description.trim() ? { description: r.description.trim() } : {}),
    }));

    // batch insert (watch out for large files in production!)
    const { data, error } = await supabaseAdmin
      .from("menu_items")
      .insert(rows)
      .select();

    if (error) throw error;
    return res.json({ inserted: data?.length || 0, data: data || [] });
  } catch (err) {
    console.error("POST /api/menu/:vendorId/import error:", err);
    return res.status(500).json({ message: "Import failed", error: err.message });
  }
});

/**
 * POST /api/menu/:vendorId/upload
 * Upload a file (image) via multipart form-data (MUST come before POST /:vendorId route)
 */
router.post("/:vendorId/upload", upload.single("file"), async (req, res) => {
  const { vendorId } = req.params;
  try {
    if (!req.file) return res.status(400).json({ message: "file required" });

    const localPath = req.file.path;
    const originalName = req.file.originalname || path.basename(localPath);
    const destName = `${vendorId}/${Date.now()}_${originalName}`;

    const fileBuffer = fs.readFileSync(localPath);

    // upload using admin client to bucket "menu-images"
    const { data: putData, error: putError } = await supabaseAdmin.storage
      .from("menu-images")
      .upload(destName, fileBuffer, {
        contentType: req.file.mimetype,
        upsert: false
      });

    // remove temp file
    fs.unlinkSync(localPath);

    if (putError) {
      console.error("storage.upload error:", putError);
      return res.status(500).json({ message: "Failed to upload to storage", error: putError.message });
    }

    // Get public URL (make sure bucket is public or use signed URLs)
    const { data: urlData } = supabaseAdmin.storage.from("menu-images").getPublicUrl(destName);

    return res.json({ url: urlData.publicUrl, storage: putData });
  } catch (err) {
    console.error("POST /api/menu/:vendorId/upload error:", err);
    return res.status(500).json({ message: "Upload failed", error: err.message });
  }
});

/**
 * POST /api/menu/:vendorId
 * Create an item (server-side)
 * body: { name, description, price, category, image_url, is_available }
 */
router.post("/:vendorId", async (req, res) => {
  const { vendorId } = req.params;
  const { name, description, price, category, image_url, is_available } = req.body;

  if (!name || price === undefined || price === null) {
    return res.status(400).json({ message: "name and price are required" });
  }

  try {
    // Start with absolute minimum required fields
    // Try with minimal fields first, then add optional ones if they exist
    let insertData = {
      vendor_id: vendorId,
      name: name.trim(),
      price: parseFloat(price),
      created_at: new Date().toISOString()
    };
    
    // Add description if provided (likely exists)
    if (description && description.trim()) {
      insertData.description = description.trim();
    }
    
    // Try insert with minimal fields first
    let data, error;
    let attempt = 0;
    const maxAttempts = 3;
    
    while (attempt < maxAttempts) {
      const { data: result, error: err } = await supabaseAdmin
        .from("menu_items")
        .insert([insertData])
        .select()
        .single();
      
      data = result;
      error = err;
      
      if (!error) {
        // Success!
        break;
      }
      
      // If error mentions a column that doesn't exist, remove it and retry
      const errorMsg = error.message || '';
      if (errorMsg.includes("column") || errorMsg.includes("schema cache")) {
        console.log(`⚠️ Attempt ${attempt + 1}: Column error detected, removing optional fields`);
        
        // Remove all optional fields and keep only absolute minimum
        insertData = {
          vendor_id: vendorId,
          name: name.trim(),
          price: parseFloat(price),
          created_at: new Date().toISOString()
        };
        
        attempt++;
        continue;
      } else {
        // Different error, throw it
        throw error;
      }
    }
    
    if (error) {
      throw error;
    }
    
    return res.status(201).json(data);
  } catch (err) {
    console.error("POST /api/menu/:vendorId error:", err);
    return res.status(500).json({ message: "Failed to create item", error: err.message });
  }
});

/**
 * PUT /api/menu/:vendorId/:itemId
 * Update an item
 */
router.put("/:vendorId/:itemId", async (req, res) => {
  const { vendorId, itemId } = req.params;
  const updates = { ...req.body };
  
  // Start with only absolute minimum fields that definitely exist
  const minimalUpdates = {};
  
  // Only include name and price (definitely required)
  if (updates.name !== undefined) {
    minimalUpdates.name = updates.name;
  }
  if (updates.price !== undefined) {
    minimalUpdates.price = parseFloat(updates.price);
  }
  
  // Try to add description if provided (might not exist)
  if (updates.description !== undefined && updates.description !== null) {
    minimalUpdates.description = updates.description;
  }

  try {
    let data, error;
    let attempt = 0;
    const maxAttempts = 2;
    
    while (attempt < maxAttempts) {
      const { data: result, error: err } = await supabaseAdmin
        .from("menu_items")
        .update(minimalUpdates)
        .eq("id", itemId)
        .eq("vendor_id", vendorId)
        .select()
        .single();
      
      data = result;
      error = err;
      
      if (!error) {
        break;
      }
      
      // If error mentions a column, remove description and retry
      if (error.message && (error.message.includes("column") || error.message.includes("schema cache"))) {
        console.log("⚠️ Column error in update, removing optional fields");
        delete minimalUpdates.description;
        attempt++;
        continue;
      }
      
      throw error;
    }
    
    if (error) throw error;
    return res.json(data);
  } catch (err) {
    console.error("PUT /api/menu/:vendorId/:itemId error:", err);
    return res.status(500).json({ message: "Failed to update item", error: err.message });
  }
});

/**
 * DELETE /api/menu/:vendorId/:itemId
 */
router.delete("/:vendorId/:itemId", async (req, res) => {
  const { vendorId, itemId } = req.params;
  try {
    const { error } = await supabaseAdmin
      .from("menu_items")
      .delete()
      .eq("id", itemId)
      .eq("vendor_id", vendorId);

    if (error) throw error;
    return res.json({ message: "Deleted" });
  } catch (err) {
    console.error("DELETE /api/menu/:vendorId/:itemId error:", err);
    return res.status(500).json({ message: "Failed to delete item", error: err.message });
  }
});


export default router;