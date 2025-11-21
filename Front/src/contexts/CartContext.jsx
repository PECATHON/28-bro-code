import React, { createContext, useState } from 'react';

export const CartContext = createContext();

export function CartProvider({ children }) {
  const [items, setItems] = useState([]); // { id, name, price, qty, vendorId }

  function addToCart(item) {
    setItems(prev => {
      // If cart has items from a different vendor, clear cart first (food app standard)
      // This is standard behavior - users can only order from one vendor at a time
      if (prev.length > 0 && prev[0].vendorId !== item.vendorId) {
        // Return new array with just this item (replaces previous cart)
        return [{ ...item, qty: 1 }];
      }
      
      // Check if item already exists in cart (same id and same vendor)
      const idx = prev.findIndex(p => p.id === item.id && p.vendorId === item.vendorId);
      if (idx >= 0) {
        const next = [...prev];
        next[idx].qty += 1;
        return next;
      }
      return [{ ...item, qty: 1 }, ...prev];
    });
  }

  function removeFromCart(id) {
    setItems(prev => prev.filter(x => x.id !== id));
  }

  function updateQuantity(id, newQty) {
    if (newQty <= 0) {
      removeFromCart(id);
      return;
    }
    setItems(prev => prev.map(item => 
      item.id === id ? { ...item, qty: newQty } : item
    ));
  }

  function clearCart() {
    setItems([]);
  }

  return (
    <CartContext.Provider value={{ items, addToCart, removeFromCart, updateQuantity, clearCart }}>
      {children}
    </CartContext.Provider>
  );
}