import { useEffect, useMemo, useState } from 'react';
import {
  openBybitMarketPosition,
  reopenBybitMarketPosition,
  UnauthorizedError,
  type BybitMarketPositionSide,
  type CloseBybitMarketPositionResult,
} from '../../api/pairs';
import { usePairs } from '../../hooks/usePairs';
import type { Pair } from '../../types/pair';
import { GlobalStyle, Notice, Page, Toast } from './PairsDashboard.style';
import { BuyPositionModal } from './BuyPositionModal';
import { PairsTable } from './PairsTable';
import { PairsToolbar } from './PairsToolbar';
import { ReopenPositionModal } from './ReopenPositionModal';
import {
  filterPairs,
  formatDecimal,
  getDefaultReopenAmount,
  getPairPositionAmount,
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

interface ReopenPositionRequest {
  pair: Pair;
  side: BybitMarketPositionSide;
}

interface DashboardToast {
  message: string;
  tone: 'success' | 'error';
}

const formatTradeValue = (value?: number | string | null, maximumFractionDigits = 8) => {
  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) {
    return '0';
  }

  return formatDecimal(numericValue, maximumFractionDigits);
};

const getCloseSummary = (close: CloseBybitMarketPositionResult) => {
  const closedSize = close.closedPnl?.closedSize ?? close.qty;
  const closedValue = close.closedPnl?.cumExitValue ?? close.positionValue;
  const closedPnl = close.closedPnl?.closedPnl;
  const pnlText = closedPnl === undefined || closedPnl === null
    ? 'PnL пока не вернулся'
    : `${formatTradeValue(closedPnl, 4)} USDT`;
  const valueText = Number.isFinite(Number(closedValue))
    ? ` (${formatTradeValue(closedValue, 2)} USDT)`
    : '';

  return `Продано ${formatTradeValue(closedSize)} ${close.symbol}${valueText}, выгода: ${pnlText}`;
};

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
  const [reopenPositionRequest, setReopenPositionRequest] = useState<ReopenPositionRequest | null>(null);
  const [reopenAmount, setReopenAmount] = useState(20);
  const [reopenLoading, setReopenLoading] = useState(false);
  const [toast, setToast] = useState<DashboardToast | null>(null);

  const visiblePairs = useMemo(() => {
    return filterPairs(pairs, filters, searchValue);
  }, [filters, pairs, searchValue]);

  useEffect(() => {
    if (!toast) {
      return;
    }

    const timer = window.setTimeout(() => setToast(null), 7200);

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
    setReopenPositionRequest(null);
    setBuyAmount(5);
    setBuyPositionRequest({ pair, side });
  };

  const handleBuyAmountChange = (amount: number) => {
    setBuyAmount(amount);
  };

  const handleReopenSignalClick = (pair: Pair, side: BybitMarketPositionSide) => {
    const currentPositionAmount = getPairPositionAmount(pair, side);

    setBuyPositionRequest(null);
    setReopenAmount(getDefaultReopenAmount(currentPositionAmount));
    setReopenPositionRequest({ pair, side });
  };

  const handleReopenAmountChange = (amount: number) => {
    setReopenAmount(amount);
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

  const handleReopenPosition = async () => {
    if (!reopenPositionRequest) {
      return;
    }

    setReopenLoading(true);

    try {
      const result = await reopenBybitMarketPosition({
        amount: reopenAmount,
        pairId: reopenPositionRequest.pair._id,
        side: reopenPositionRequest.side,
        token: authToken,
      });
      const closeSummary = getCloseSummary(result.close);

      setReopenPositionRequest(null);

      if (!result.success || !result.reopen) {
        setToast({
          message: `${closeSummary}. Новая позиция не открыта: ${result.openError || 'ошибка Bybit'}`,
          tone: 'error',
        });
        await reload();
        return;
      }

      setToast({
        message: `${closeSummary}. Новая ${result.side.toUpperCase()} открыта: ${result.reopen.amount} USDT -> ${result.reopen.orderValue} USDT`,
        tone: 'success',
      });
      await reload();
    } catch (requestError) {
      if (requestError instanceof UnauthorizedError) {
        onLogout();
        return;
      }

      setToast({
        message: requestError instanceof Error ? requestError.message : 'Не удалось переоткрыть позицию',
        tone: 'error',
      });
    } finally {
      setReopenLoading(false);
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
          onReopenSignalClick={handleReopenSignalClick}
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

        {reopenPositionRequest && (
          <ReopenPositionModal
            amount={reopenAmount}
            currentPositionAmount={getPairPositionAmount(
              reopenPositionRequest.pair,
              reopenPositionRequest.side,
            )}
            loading={reopenLoading}
            pair={reopenPositionRequest.pair}
            side={reopenPositionRequest.side}
            onAmountChange={handleReopenAmountChange}
            onClose={() => setReopenPositionRequest(null)}
            onConfirm={handleReopenPosition}
          />
        )}

        {toast && <Toast $tone={toast.tone}>{toast.message}</Toast>}
      </Page>
    </>
  );
}
