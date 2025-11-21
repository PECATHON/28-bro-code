// src/data/foodImages.js
// Helper function to generate food images based on item name and category

/**
 * Generates a food image URL based on item name and category
 * Uses Unsplash API for food images
 */
export function getFoodImage(itemName, category = "") {
  if (!itemName) {
    return "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=300&fit=crop";
  }
  
  const name = itemName.toLowerCase().trim();
  const cat = (category || "").toLowerCase().trim();
  
  // Food image mapping based on keywords
  const foodImageMap = {
    // Burgers
    burger: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&h=300&fit=crop",
    // Pizza
    pizza: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400&h=300&fit=crop",
    // Coffee/Drinks
    coffee: "https://images.unsplash.com/photo-1511920170033-f8396924c348?w=400&h=300&fit=crop",
    tea: "https://images.unsplash.com/photo-1556679343-c7306c1c58cf?w=400&h=300&fit=crop",
    chai: "https://images.unsplash.com/photo-1556679343-c7306c1c58cf?w=400&h=300&fit=crop",
    juice: "https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=400&h=300&fit=crop",
    // Sandwiches
    sandwich: "https://images.unsplash.com/photo-1539252554453-80ab65ce3586?w=400&h=300&fit=crop",
    // Fries/Snacks
    fries: "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=400&h=300&fit=crop",
    chips: "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=400&h=300&fit=crop",
    // Maggi/Noodles
    maggi: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=400&h=300&fit=crop",
    noodles: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=400&h=300&fit=crop",
    // Desserts
    dessert: "https://images.unsplash.com/photo-1551024506-0bccd828d307?w=400&h=300&fit=crop",
    cake: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400&h=300&fit=crop",
    ice: "https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=400&h=300&fit=crop",
    cream: "https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=400&h=300&fit=crop",
    // Indian Food
    curry: "https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400&h=300&fit=crop",
    biryani: "https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=400&h=300&fit=crop",
    paratha: "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=400&h=300&fit=crop",
    roti: "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=400&h=300&fit=crop",
    // Fast Food
    chicken: "https://images.unsplash.com/photo-1608039829577-8e72c0b89e58?w=400&h=300&fit=crop",
    momo: "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=400&h=300&fit=crop",
    momos: "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=400&h=300&fit=crop",
    // Wraps/Subs
    wrap: "https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=400&h=300&fit=crop",
    sub: "https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=400&h=300&fit=crop",
    // Pasta
    pasta: "https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=400&h=300&fit=crop",
    // Salad
    salad: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&h=300&fit=crop",
    // Soup
    soup: "https://images.unsplash.com/photo-1547592166-23ac45744acd?w=400&h=300&fit=crop",
    // Bread
    bread: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&h=300&fit=crop",
    toast: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&h=300&fit=crop",
    // Breakfast
    egg: "https://images.unsplash.com/photo-1586190848861-99aa4a171e90?w=400&h=300&fit=crop",
    omelette: "https://images.unsplash.com/photo-1586190848861-99aa4a171e90?w=400&h=300&fit=crop",
    // General food fallback
    default: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=300&fit=crop",
  };
  
  // Check for specific keywords in name or category
  for (const [key, url] of Object.entries(foodImageMap)) {
    if (name.includes(key) || cat.includes(key)) {
      return url;
    }
  }
  
  // If no match found, use Unsplash with food search based on first word of item name
  const firstWord = name.split(' ')[0];
  const searchTerm = encodeURIComponent(firstWord);
  return `https://source.unsplash.com/400x300/?food,${searchTerm}`;
}

/**
 * Fallback food image
 */
export const FALLBACK_FOOD_IMAGE = "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=300&fit=crop";

