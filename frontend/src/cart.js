// Small, pure helper functions for the shopping cart.
// The cart is a list of items: { id, name, price, quantity }.

export function addToCart(cart, flower) {
  const existing = cart.find((item) => item.id === flower.id);
  if (existing) {
    return cart.map((item) =>
      item.id === flower.id ? { ...item, quantity: item.quantity + 1 } : item
    );
  }
  return [...cart, { id: flower.id, name: flower.name, price: flower.price, quantity: 1 }];
}

export function removeFromCart(cart, id) {
  return cart
    .map((item) => (item.id === id ? { ...item, quantity: item.quantity - 1 } : item))
    .filter((item) => item.quantity > 0);
}

export function cartCount(cart) {
  return cart.reduce((sum, item) => sum + item.quantity, 0);
}

export function cartTotal(cart) {
  return cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
}

export function formatPrice(value) {
  return `$${value.toFixed(2)}`;
}
