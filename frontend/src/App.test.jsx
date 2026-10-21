import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App.jsx';

const flowers = [
  { id: 1, name: 'Red Rose', price: 4.5, emoji: '🌹', description: 'Love' },
  { id: 2, name: 'Sunflower', price: 3, emoji: '🌻', description: 'Sun' }
];

// Replace the real fetch() with a fake one, so tests do not need the backend.
function mockFetch(response) {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response));
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('App', () => {
  it('shows flowers loaded from the API', async () => {
    mockFetch({ ok: true, json: async () => flowers });
    render(<App />);
    expect(await screen.findByText('Red Rose')).toBeInTheDocument();
    expect(screen.getByText('Sunflower')).toBeInTheDocument();
    expect(fetch).toHaveBeenCalledWith('/api/flowers');
  });

  it('adds and removes flowers in the cart', async () => {
    mockFetch({ ok: true, json: async () => flowers });
    const user = userEvent.setup();
    render(<App />);

    await user.click(await screen.findByRole('button', { name: 'Add Red Rose to cart' }));
    await user.click(screen.getByRole('button', { name: 'Add Red Rose to cart' }));
    await user.click(screen.getByRole('button', { name: 'Add Sunflower to cart' }));

    expect(screen.getByText('Cart: 3')).toBeInTheDocument();
    expect(screen.getByText('$12.00')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Remove one Red Rose' }));
    expect(screen.getByText('Cart: 2')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Clear cart' }));
    expect(screen.getByText('Your cart is empty.')).toBeInTheDocument();
  });

  it('shows an error when the API fails', async () => {
    mockFetch({ ok: false, status: 500 });
    render(<App />);
    expect(await screen.findByRole('alert')).toHaveTextContent('Could not load flowers');
  });
});
