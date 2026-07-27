import type { Pair } from '../../types/pair';
import type { BybitMarketPositionSide } from '../../api/pairs';

const cryptoIconBaseUrl =
  'https://cdn.jsdelivr.net/npm/cryptocurrency-icons@0.18.1/svg/color';
const cryptoIconFallbackBaseUrl = 'https://cryptotokenimg.com/symbol';
const quoteAssets = ['USDT', 'USDC', 'BUSD', 'USD', 'BTC', 'ETH', 'EUR', 'TRY', 'BRL'];
const multiplierPrefixes = ['1000000', '100000', '10000', '1000'];

export const liquidationPercent = 97;

export type StoredFilterKey = 'allData' | 'onlyPrice' | 'onlyNext';
export type PairFilters = Record<StoredFilterKey, boolean>;
export const reopenPositionAmounts = [20, 25, 30, 35, 40, 45, 50];

export const readStoredFilter = (key: StoredFilterKey) => {
  if (typeof window === 'undefined') {
    return false;
  }

  return localStorage.getItem(key) === 'true';
};

export const storeFilter = (key: StoredFilterKey, value: boolean) => {
  if (value) {
    localStorage.setItem(key, 'true');
    return;
  }

  localStorage.removeItem(key);
};

export const getExchangeUrl = (pair: Pair) => {
  if (pair.exchange === 'MEXC') {
    return `https://futures.mexc.com/ru-RU/exchange/${pair.contract}`;
  }

  return `https://www.bybit.com/trade/usdt/${pair.symbol}`;
};

const normalizeBaseAsset = (value: string) => {
  let asset = value.toUpperCase().replace(/PERP$/i, '').replace(/[^A-Z0-9]/g, '');

  quoteAssets.some((quoteAsset) => {
    if (asset.endsWith(quoteAsset) && asset.length > quoteAsset.length) {
      asset = asset.slice(0, -quoteAsset.length);
      return true;
    }

    return false;
  });

  multiplierPrefixes.some((prefix) => {
    if (asset.startsWith(prefix) && asset.length > prefix.length + 1) {
      asset = asset.slice(prefix.length);
      return true;
    }

    return false;
  });

  return asset.toLowerCase();
};

export const getPairBaseAsset = (pair: Pair) => {
  const candidates = [pair.symbol, pair.contract, pair.name].filter(Boolean);

  for (const candidate of candidates) {
    const firstSegment = candidate.split(/[\/:_\-\s]+/).find(Boolean);
    const asset = normalizeBaseAsset(firstSegment ?? candidate);

    if (asset) {
      return asset;
    }
  }

  return 'coin';
};

export const getCryptoIconSources = (asset: string) => [
  `${cryptoIconBaseUrl}/${asset}.svg`,
  `${cryptoIconFallbackBaseUrl}/${asset}`,
];

export const formatDecimal = (value?: number, maximumFractionDigits = 8) => {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return '0';
  }

  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits,
    minimumFractionDigits: 0,
    useGrouping: false,
  }).format(value);
};

export const formatPercent = (value?: number) => {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return '0.00%';
  }

  return `${value.toFixed(2)}%`;
};

export const formatMargin = (base?: number, all?: number) => {
  const baseValue = Math.round(base ?? 0);
  const extraValue = Math.round(Math.max((all ?? 0) - (base ?? 0), 0));

  return {
    base: baseValue,
    extra: extraValue,
  };
};

export const hasNextLongSignal = (pair: Pair) => {
  return Boolean(pair.nextBuyLongPrice && pair.currentPrice < pair.nextBuyLongPrice);
};

export const hasNextShortSignal = (pair: Pair) => {
  return Boolean(pair.nextBuyShortPrice && pair.currentPrice > pair.nextBuyShortPrice);
};

export const hasProfitSignal = (pair: Pair, side: BybitMarketPositionSide) => {
  const currentPrice = Number(pair.currentPrice);

  if (!Number.isFinite(currentPrice) || currentPrice <= 0) {
    return false;
  }

  if (side === 'long') {
    const sellPrice = Number(pair.sellLongPrice);
    const margin = Number(pair.longMargin);

    return Number.isFinite(sellPrice) && sellPrice > 0 && margin > 0 && currentPrice > sellPrice;
  }

  const sellPrice = Number(pair.sellShortPrice);
  const margin = Number(pair.shortMargin);

  return Number.isFinite(sellPrice) && sellPrice > 0 && margin > 0 && currentPrice < sellPrice;
};

export const getPairPositionAmount = (pair: Pair, side: BybitMarketPositionSide) => {
  const baseAmount = Number(side === 'long' ? pair.longMargin : pair.shortMargin);

  return Number.isFinite(baseAmount) && baseAmount > 0 ? baseAmount : 0;
};

export const getDefaultReopenAmount = (currentPositionAmount: number) => {
  if (currentPositionAmount > 50) {
    return 50;
  }

  const roundedAmount = Math.ceil((currentPositionAmount - 5) / 5) * 5;

  return Math.max(20, Math.min(50, roundedAmount));
};

export const getActiveTradingButtonsCount = (
  pairs: Pair[],
  isCoolingDown?: (
    pairId: string,
    action: 'buy' | 'reopen',
    side: BybitMarketPositionSide,
  ) => boolean,
) => {
  return pairs.reduce((count, pair) => {
    if (pair.isActive === false || pair.exchange !== 'BYBIT') {
      return count;
    }

    let pairButtonsCount = 0;

    if (hasProfitSignal(pair, 'long') && !isCoolingDown?.(pair._id, 'reopen', 'long')) {
      pairButtonsCount += 1;
    }

    if (hasProfitSignal(pair, 'short') && !isCoolingDown?.(pair._id, 'reopen', 'short')) {
      pairButtonsCount += 1;
    }

    if (hasNextLongSignal(pair) && !isCoolingDown?.(pair._id, 'buy', 'long')) {
      pairButtonsCount += 1;
    }

    if (hasNextShortSignal(pair) && !isCoolingDown?.(pair._id, 'buy', 'short')) {
      pairButtonsCount += 1;
    }

    return count + pairButtonsCount;
  }, 0);
};

export const getPercentTone = (value?: number) => {
  if (!value) return 'muted';
  return value > 0 ? 'positive' : 'negative';
};

export const getLiquidationTone = (value?: number) => {
  return (value ?? 0) > liquidationPercent ? 'negative' : 'positive';
};

export const filterPairs = (pairs: Pair[], filters: PairFilters, searchValue: string) => {
  const normalizedSearch = searchValue.trim().toLowerCase();

  return pairs.filter((pair) => {
    const autoMargin = !pair.autoAddLongMargin || !pair.autoAddShortMargin;
    const forAllData =
      (pair.longLiquidatePercent ?? 0) > liquidationPercent ||
      (pair.shortLiquidatePercent ?? 0) > liquidationPercent;
    const forOnlyPrice = (pair.longPercent ?? 0) >= 13 || (pair.shortPercent ?? 0) >= 13;
    const forOnlyNext = hasNextLongSignal(pair) || hasNextShortSignal(pair);

    const matchesSearch =
      !normalizedSearch ||
      pair.name.toLowerCase().includes(normalizedSearch) ||
      pair.symbol.toLowerCase().includes(normalizedSearch) ||
      pair.exchange.toLowerCase().includes(normalizedSearch);

    if (!matchesSearch) {
      return false;
    }

    if (filters.allData) {
      return autoMargin || forAllData;
    }

    if (filters.onlyPrice && filters.onlyNext) {
      return autoMargin || forOnlyPrice || forOnlyNext;
    }

    if (filters.onlyPrice) {
      return autoMargin || forOnlyPrice;
    }

    if (filters.onlyNext) {
      return autoMargin || forOnlyNext;
    }

    return true;
  });
};
