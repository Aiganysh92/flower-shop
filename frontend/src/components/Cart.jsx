import { cartTotal, formatPrice } from '../cart.js';

// Shows the items in the cart and the total price.
export default function Cart({ items, onRemove, onClear }) {
  if (items.length === 0) {
    return (
      <aside className="cart" aria-label="Shopping cart">
        <h2>Cart</h2>
        <p>Your cart is empty.</p>
      </aside>
    );
  }

  return (
    <aside className="cart" aria-label="Shopping cart">
      <h2>Cart</h2>
      <ul>
        {items.map((item) => (
          <li key={item.id}>
            <span>
              {item.name} × {item.quantity}
            </span>
            <span>{formatPrice(item.price * item.quantity)}</span>
            <button type="button" onClick={() => onRemove(item.id)} aria-label={`Remove one ${item.name}`}>
              −
            </button>
          </li>
        ))}
      </ul>
      <p className="cart-total">
        Total: <strong>{formatPrice(cartTotal(items))}</strong>
      </p>
      <button type="button" onClick={onClear}>
        Clear cart
      </button>
    </aside>
  );
}
