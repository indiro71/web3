import { useEffect, useMemo, useState } from 'react';
import {
  openBybitMarketPosition,
  UnauthorizedError,
  type BybitMarketPositionSide,
} from '../../api/pairs';
import { usePairs } from '../../hooks/usePairs';
import type { Pair } from '../../types/pair';
import { GlobalStyle, Notice, Page, Toast } from './PairsDashboard.style';
import { BuyPositionModal } from './BuyPositionModal';
import { PairsTable } from './PairsTable';
import { PairsToolbar } from './PairsToolbar';
import {
  filterPairs,
  readStoredFilter,
  storeFilter,
  type PairFilters,
  type StoredFilterKey,
} from './PairsDashboard.utils';

interface PairsDashboardProps {
  authToken: string;
  onLogout: () => void;
}

interface BuyPositionRequest {
  pair: Pair;
  side: BybitMarketPositionSide;
}

interface DashboardToast {
  message: string;
  tone: 'success' | 'error';
}

export function PairsDashboard({ authToken, onLogout }: PairsDashboardProps) {
  const { pairs, loading, error, reload, socketStatus, lastUpdated } = usePairs({
    token: authToken,
    onUnauthorized: onLogout,
  });
  const [filters, setFilters] = useState<PairFilters>({
    allData: readStoredFilter('allData'),
    onlyPrice: readStoredFilter('onlyPrice'),
    onlyNext: readStoredFilter('onlyNext'),
  });
  const [searchValue, setSearchValue] = useState('');
  const [buyPositionRequest, setBuyPositionRequest] = useState<BuyPositionRequest | null>(null);
  const [buyAmount, setBuyAmount] = useState(5);
  const [buyLoading, setBuyLoading] = useState(false);
  const [toast, setToast] = useState<DashboardToast | null>(null);

  const visiblePairs = useMemo(() => {
    return filterPairs(pairs, filters, searchValue);
  }, [filters, pairs, searchValue]);

  useEffect(() => {
    if (!toast) {
      return;
    }

    const timer = window.setTimeout(() => setToast(null), 4200);

    return () => window.clearTimeout(timer);
  }, [toast]);

  const toggleFilter = (key: StoredFilterKey) => {
    setFilters((previousFilters) => {
      const nextFilters = {
        ...previousFilters,
        [key]: !previousFilters[key],
      };

      storeFilter(key, nextFilters[key]);

      return nextFilters;
    });
  };

  const handleBuySignalClick = (pair: Pair, side: BybitMarketPositionSide) => {
    setBuyAmount(5);
    setBuyPositionRequest({ pair, side });
  };

  const handleBuyAmountChange = (amount: number) => {
    setBuyAmount(amount);
  };

  const handleBuyPosition = async () => {
    if (!buyPositionRequest) {
      return;
    }

    setBuyLoading(true);

    try {
      const result = await openBybitMarketPosition({
        amount: buyAmount,
        pairId: buyPositionRequest.pair._id,
        side: buyPositionRequest.side,
        token: authToken,
      });

      setBuyPositionRequest(null);
      setToast({
        message: `Заявка ${result.side.toUpperCase()} для ${result.name} отправлена: ${result.amount} USDT -> ${result.orderValue} USDT`,
        tone: 'success',
      });
      await reload();
    } catch (requestError) {
      if (requestError instanceof UnauthorizedError) {
        onLogout();
        return;
      }

      setToast({
        message: requestError instanceof Error ? requestError.message : 'Не удалось открыть позицию',
        tone: 'error',
      });
    } finally {
      setBuyLoading(false);
    }
  };

  return (
    <>
      <GlobalStyle />
      <Page>
        <PairsToolbar
          filters={filters}
          loading={loading}
          lastUpdated={lastUpdated}
          onFilterToggle={toggleFilter}
          onRefresh={reload}
          onLogout={onLogout}
          onSearchChange={setSearchValue}
          searchValue={searchValue}
          socketStatus={socketStatus}
          totalCount={pairs.length}
          visibleCount={visiblePairs.length}
        />

        {error && (
          <Notice role="alert">
            <strong>API error</strong>
            <span>{error}</span>
          </Notice>
        )}

        <PairsTable
          loading={loading}
          onBuySignalClick={handleBuySignalClick}
          pairs={visiblePairs}
          totalPairs={pairs.length}
        />

        {buyPositionRequest && (
          <BuyPositionModal
            amount={buyAmount}
            loading={buyLoading}
            pair={buyPositionRequest.pair}
            side={buyPositionRequest.side}
            onAmountChange={handleBuyAmountChange}
            onClose={() => setBuyPositionRequest(null)}
            onConfirm={handleBuyPosition}
          />
        )}

        {toast && <Toast $tone={toast.tone}>{toast.message}</Toast>}
      </Page>
    </>
  );
}
