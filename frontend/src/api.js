// Load the flower catalog from the backend.
// The URL is relative: Vite (in development) or nginx (in Docker) forwards /api to the backend.
export async function fetchFlowers() {
  const res = await fetch('/api/flowers');
  if (!res.ok) {
    throw new Error(`Request failed with status ${res.status}`);
  }
  return res.json();
}
