import type { Pair } from '../types/pair';

const localApiBaseUrl = 'http://localhost:7272';
const productionApiBaseUrl = 'https://indiro.ru/api-v2';
const defaultApiBaseUrl = import.meta.env.DEV ? localApiBaseUrl : productionApiBaseUrl;
const defaultSocketPath = import.meta.env.DEV ? '/socket.io' : '/api-v2/socket.io';
const defaultRequestTimeoutMs = 10000;
const defaultTradeRequestTimeoutMs = 45000;

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

export type BybitMarketPositionSide = 'long' | 'short';

interface OpenBybitMarketPositionParams {
  amount: number;
  pairId: string;
  side: BybitMarketPositionSide;
  token: string;
}

export interface OpenBybitMarketPositionResult {
  amount: number;
  leverage: number;
  name: string;
  orderValue: number;
  pairId: string;
  price: number;
  qty: string;
  side: BybitMarketPositionSide;
  success: boolean;
  symbol: string;
}

interface ReopenBybitMarketPositionParams {
  amount?: number;
  pairId: string;
  reopen?: boolean;
  side: BybitMarketPositionSide;
  token: string;
}

export interface BybitClosedPnl {
  avgEntryPrice: string;
  avgExitPrice: string;
  closeFee: string;
  closedPnl: string;
  closedSize: string;
  cumEntryValue: string;
  cumExitValue: string;
  orderId: string;
  qty: string;
  symbol: string;
}

export interface CloseBybitMarketPositionResult {
  avgEntryPrice: string;
  closedPnl: BybitClosedPnl | null;
  orderId?: string;
  positionIdx: 1 | 2;
  positionValue: string;
  qty: string;
  side: string;
  symbol: string;
  unrealisedPnl: string;
}

export interface ReopenBybitMarketPositionResult {
  amount?: number;
  close: CloseBybitMarketPositionResult;
  name: string;
  openError?: string;
  pairId: string;
  reopen?: OpenBybitMarketPositionResult;
  reopenSkipped?: boolean;
  side: BybitMarketPositionSide;
  success: boolean;
  symbol: string;
}

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

const request = async (url: string, options: RequestInit = {}, timeoutMs = defaultRequestTimeoutMs) => {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error('Request timed out');
    }

    throw error;
  } finally {
    window.clearTimeout(timeout);
  }
};

export async function fetchPairs(token: string): Promise<Pair[]> {
  const response = await request(`${API_BASE_URL}/scanprices/pairs/`, {
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

export async function openBybitMarketPosition({
  amount,
  pairId,
  side,
  token,
}: OpenBybitMarketPositionParams): Promise<OpenBybitMarketPositionResult> {
  const response = await request(
    `${API_BASE_URL}/scanprices/pairs/${pairId}/bybit/market-position`,
    {
      body: JSON.stringify({
        amount,
        side,
      }),
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      method: 'POST',
    },
    defaultTradeRequestTimeoutMs,
  );
  const data = await readResponseBody(response);

  if (response.status === 401) {
    throw new UnauthorizedError(data?.message);
  }

  if (!response.ok) {
    throw new Error(data?.message || data?.error || 'Failed to open Bybit market position');
  }

  return data;
}

export async function reopenBybitMarketPosition({
  amount,
  pairId,
  reopen,
  side,
  token,
}: ReopenBybitMarketPositionParams): Promise<ReopenBybitMarketPositionResult> {
  const response = await request(
    `${API_BASE_URL}/scanprices/pairs/${pairId}/bybit/reopen-market-position`,
    {
      body: JSON.stringify({
        amount,
        reopen,
        side,
      }),
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      method: 'POST',
    },
    defaultTradeRequestTimeoutMs,
  );
  const data = await readResponseBody(response);

  if (response.status === 401) {
    throw new UnauthorizedError(data?.message);
  }

  if (!response.ok) {
    throw new Error(data?.message || data?.error || 'Failed to reopen Bybit market position');
  }

  return data;
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
