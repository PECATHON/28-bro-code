// src/data/vendorImages.js
// Map vendor names to local image assets

const FALLBACK_IMAGE = require("../../assets/vendors/Juice_Bar.jpg");

// Image mapping with keywords for flexible matching
export const vendorImages = {
  "deshraj": require("../../assets/vendors/Deshraj.jpg"),
  "gyoza": require("../../assets/vendors/Gyoza.jpg"),
  "didikidukaan": require("../../assets/vendors/Juice_Bar.jpg"),
  "didi ki dukaan": require("../../assets/vendors/Juice_Bar.jpg"),
  "juice": require("../../assets/vendors/Juice_Bar.jpg"),
};

// Helper function to find matching image based on vendor name
export function getVendorImage(vendorName) {
  if (!vendorName) return FALLBACK_IMAGE;
  
  const normalizedName = vendorName.toLowerCase().trim();
  
  // Priority-based matching (most specific first)
  // Check for Deshraj
  if (normalizedName.includes("deshraj")) {
    return vendorImages["deshraj"];
  }
  
  // Check for Gyoza
  if (normalizedName.includes("gyoza")) {
    return vendorImages["gyoza"];
  }
  
  // Check for Didi Ki Dukaan or DidiKiDukaan
  if (normalizedName.includes("didi") && (normalizedName.includes("dukaan") || normalizedName.includes("ki"))) {
    return vendorImages["didikidukaan"];
  }
  
  // Check for juice bar (but only if it's Didi's, not generic)
  if (normalizedName.includes("juice") && normalizedName.includes("bar")) {
    return vendorImages["juice"];
  }
  
  return FALLBACK_IMAGE;
}

// Export fallback for use elsewhere
export { FALLBACK_IMAGE };

