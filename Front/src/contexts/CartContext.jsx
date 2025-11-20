import React, { createContext, useState } from 'react';

export const CartContext = createContext();

export function CartProvider({ children }) {
  const [items, setItems] = useState([]); // { id, name, price, qty, vendorId }

  function addToCart(item) {
    setItems(prev => {
      const idx = prev.findIndex(p => p.id === item.id);
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

  function clearCart() {
    setItems([]);
  }

  return (
    <CartContext.Provider value={{ items, addToCart, removeFromCart, clearCart }}>
      {children}
    </CartContext.Provider>
  );
}