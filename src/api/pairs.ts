import type { Pair } from '../types/pair';

const localApiBaseUrl = 'http://localhost:7272';
const productionApiBaseUrl = 'https://indiro.ru/api-v2';
const defaultApiBaseUrl = import.meta.env.DEV ? localApiBaseUrl : productionApiBaseUrl;
const defaultSocketPath = import.meta.env.DEV ? '/socket.io' : '/api-v2/socket.io';

const stripTrailingSlashes = (value: string) => value.replace(/\/+$/, '');
const normalizePath = (value: string) => {
  const path = value.startsWith('/') ? value : `/${value}`;
  return stripTrailingSlashes(path);
};
const getUrlOrigin = (value: string) => {
  try {
    return new URL(value).origin;
  } catch {
    return value;
  }
};

export const API_BASE_URL = stripTrailingSlashes(
  import.meta.env.VITE_API_BASE_URL || defaultApiBaseUrl,
);
export const PAIRS_SOCKET_NAMESPACE = '/scanprices/pairs';
export const SOCKET_BASE_URL = stripTrailingSlashes(
  import.meta.env.VITE_SOCKET_BASE_URL || getUrlOrigin(API_BASE_URL),
);
export const SOCKET_IO_PATH = normalizePath(
  import.meta.env.VITE_SOCKET_IO_PATH || defaultSocketPath,
);
export const PAIRS_SOCKET_URL = `${SOCKET_BASE_URL}${PAIRS_SOCKET_NAMESPACE}`;
export const PAIRS_UPDATED_EVENT = 'pairs:update';

export class UnauthorizedError extends Error {
  constructor(message = 'User not authorized') {
    super(message);
    this.name = 'UnauthorizedError';
  }
}

const sortPairs = (pairs: Pair[]) => {
  return [...pairs].sort((first, second) => (first.order ?? 0) - (second.order ?? 0));
};

const readResponseBody = async (response: Response) => {
  try {
    return await response.json();
  } catch {
    return null;
  }
};

export async function fetchPairs(token: string): Promise<Pair[]> {
  const response = await fetch(`${API_BASE_URL}/scanprices/pairs/`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  const data = await readResponseBody(response);

  if (response.status === 401) {
    throw new UnauthorizedError(data?.message);
  }

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
