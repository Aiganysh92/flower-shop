import { useEffect, useState } from 'react';
import { fetchFlowers } from './api.js';
import { addToCart, removeFromCart, cartCount } from './cart.js';
import FlowerCard from './components/FlowerCard.jsx';
import Cart from './components/Cart.jsx';

export default function App() {
  const [flowers, setFlowers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cart, setCart] = useState([]);

  // Load the catalog from the backend once, when the page opens.
  useEffect(() => {
    fetchFlowers()
      .then(setFlowers)
      .catch(() => setError('Could not load flowers. Is the backend running?'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="page">
      <header className="header">
        <h1>🌷 Flower Shop</h1>
        <span className="cart-badge">Cart: {cartCount(cart)}</span>
      </header>

      <main className="layout">
        <section aria-label="Flower catalog">
          <h2>Our flowers</h2>
          {loading && <p>Loading flowers…</p>}
          {error && <p role="alert">{error}</p>}
          <div className="grid">
            {flowers.map((flower) => (
              <FlowerCard
                key={flower.id}
                flower={flower}
                onAdd={(f) => setCart((current) => addToCart(current, f))}
              />
            ))}
          </div>
        </section>

        <Cart
          items={cart}
          onRemove={(id) => setCart((current) => removeFromCart(current, id))}
          onClear={() => setCart([])}
        />
      </main>
    </div>
  );
}
