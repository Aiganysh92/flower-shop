import { describe, it, expect } from 'vitest';
import { addToCart, removeFromCart, cartCount, cartTotal, formatPrice } from './cart.js';

const rose = { id: 1, name: 'Red Rose', price: 4.5 };
const tulip = { id: 3, name: 'Tulip', price: 2.5 };

describe('cart helpers', () => {
  it('adds a new flower with quantity 1', () => {
    expect(addToCart([], rose)).toEqual([{ id: 1, name: 'Red Rose', price: 4.5, quantity: 1 }]);
  });

  it('increases quantity when the same flower is added again', () => {
    const cart = addToCart(addToCart([], rose), rose);
    expect(cart[0].quantity).toBe(2);
  });

  it('removes one item and drops it when quantity reaches 0', () => {
    let cart = addToCart(addToCart([], rose), rose);
    cart = removeFromCart(cart, 1);
    expect(cart[0].quantity).toBe(1);
    cart = removeFromCart(cart, 1);
    expect(cart).toEqual([]);
  });

  it('counts items and sums the total', () => {
    const cart = addToCart(addToCart(addToCart([], rose), rose), tulip);
    expect(cartCount(cart)).toBe(3);
    expect(cartTotal(cart)).toBe(11.5);
  });

  it('formats prices with two decimals', () => {
    expect(formatPrice(3)).toBe('$3.00');
  });
});
