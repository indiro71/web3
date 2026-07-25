import type { Pair } from '../types/pair';

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:7272';
export const PAIRS_SOCKET_NAMESPACE = '/scanprices/pairs';
export const PAIRS_UPDATED_EVENT = 'pairs:update';

const sortPairs = (pairs: Pair[]) => {
  return [...pairs].sort((first, second) => (first.order ?? 0) - (second.order ?? 0));
};

export async function fetchPairs(): Promise<Pair[]> {
  const response = await fetch(`${API_BASE_URL}/scanprices/pairs/`);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.message || data?.error || 'Failed to load pairs');
  }

  return sortPairs(data);
}

export function mergePairUpdates(currentPairs: Pair[], updatedPairs: Pair[]): Pair[] {
  if (!updatedPairs?.length) {
    return currentPairs;
  }

  const pairsById = new Map(currentPairs.map((pair) => [pair._id, pair]));

  updatedPairs.forEach((pair) => {
    pairsById.set(pair._id, pair);
  });

  return sortPairs(Array.from(pairsById.values()));
}
