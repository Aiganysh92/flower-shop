import { formatPrice } from '../cart.js';

// Shows one flower with an "Add to cart" button.
export default function FlowerCard({ flower, onAdd }) {
  return (
    <article className="card">
      <div className="card-emoji" aria-hidden="true">{flower.emoji}</div>
      <h3>{flower.name}</h3>
      <p className="card-description">{flower.description}</p>
      <p className="card-price">{formatPrice(flower.price)}</p>
      <button type="button" onClick={() => onAdd(flower)}>
        Add {flower.name} to cart
      </button>
    </article>
  );
}
