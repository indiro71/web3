import { useEffect, useMemo, useState } from 'react';
import {
  armInsurance,
  createPair,
  deletePair as deletePairRequest,
  openBybitMarketPosition,
  previewInsurance,
  refreshInsurance,
  reopenBybitMarketPosition,
  UnauthorizedError,
  type BybitMarketPositionSide,
  type CloseBybitMarketPositionResult,
  type CreatePairInput,
  type InsuranceQuote,
} from '../../api/pairs';
import { updateAppBadge } from '../../api/push';
import { PushControls } from './PushControls';
import { usePairs } from '../../hooks/usePairs';
import type { Pair } from '../../types/pair';
import { GlobalStyle, Notice, Page, Toast } from './PairsDashboard.style';
import { BuyPositionModal } from './BuyPositionModal';
import { CreatePairModal } from './CreatePairModal';
import { PairContextMenu } from './PairContextMenu';
import { PairsTable } from './PairsTable';
import { PairsToolbar } from './PairsToolbar';
import { ReopenPositionModal } from './ReopenPositionModal';
import type { AppThemeMode } from './PairsDashboard.theme';
import {
  canOfferInsurance,
  filterPairs,
  formatDecimal,
  getActiveTradingButtonsCount,
  getDefaultReopenAmount,
  getPairPositionAmount,
  readStoredFilter,
  storeFilter,
  type PairFilters,
  type StoredFilterKey,
} from './PairsDashboard.utils';

interface PairsDashboardProps {
  authToken: string;
  themeMode: AppThemeMode;
  onLogout: () => void;
  onThemeToggle: () => void;
}

interface BuyPositionRequest {
  pair: Pair;
  side: BybitMarketPositionSide;
}

interface ReopenPositionRequest {
  pair: Pair;
  side: BybitMarketPositionSide;
  insuranceRequestId: string;
}

interface PairContextMenuState {
  pair: Pair;
  x: number;
  y: number;
}

interface DashboardToast {
  message: string;
  tone: 'success' | 'error';
}

type TradeActionKind = 'buy' | 'reopen';
type TradeCooldowns = Record<string, number>;

const tradeButtonCooldownMs = 60_000;

const getTradeCooldownKey = (
  pairId: string,
  action: TradeActionKind,
  side: BybitMarketPositionSide,
) => `${pairId}:${action}:${side}`;

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

export function PairsDashboard({
  authToken,
  themeMode,
  onLogout,
  onThemeToggle,
}: PairsDashboardProps) {
  const { pairs, loading, error, reload, pollingStatus, lastUpdated } = usePairs({
    token: authToken,
    onUnauthorized: onLogout,
  });
  const [filters, setFilters] = useState<PairFilters>({
    allData: readStoredFilter('allData'),
    onlyPrice: readStoredFilter('onlyPrice'),
    onlyNext: readStoredFilter('onlyNext'),
  });
  const [searchValue, setSearchValue] = useState('');
  const [createPairModalOpen, setCreatePairModalOpen] = useState(false);
  const [createPairLoading, setCreatePairLoading] = useState(false);
  const [pairContextMenu, setPairContextMenu] = useState<PairContextMenuState | null>(null);
  const [deletePairLoading, setDeletePairLoading] = useState(false);
  const [buyPositionRequest, setBuyPositionRequest] = useState<BuyPositionRequest | null>(null);
  const [buyAmount, setBuyAmount] = useState(5);
  const [buyLoading, setBuyLoading] = useState(false);
  const [reopenPositionRequest, setReopenPositionRequest] = useState<ReopenPositionRequest | null>(null);
  const [reopenAmount, setReopenAmount] = useState(20);
  const [shouldReopenAfterClose, setShouldReopenAfterClose] = useState(true);
  const [insuranceSelected, setInsuranceSelected] = useState(false);
  const [insuranceQuote, setInsuranceQuote] = useState<InsuranceQuote>();
  const [insuranceQuoteError, setInsuranceQuoteError] = useState<string>();
  const [pendingInsurance, setPendingInsurance] = useState<{
    id: string;
    pairId: string;
    side: BybitMarketPositionSide;
    action: 'arm' | 'refresh';
  } | null>(null);
  const [reopenLoading, setReopenLoading] = useState(false);
  const [tradeCooldowns, setTradeCooldowns] = useState<TradeCooldowns>({});
  const [toast, setToast] = useState<DashboardToast | null>(null);

  useEffect(() => {
    if (!insuranceSelected || !reopenPositionRequest) return;
    const { pair, side } = reopenPositionRequest;
    let cancelled = false;
    void previewInsurance({ pairId: pair._id, side, token: authToken }).then((quote) => {
      if (!cancelled) setInsuranceQuote(quote);
    }).catch((error: unknown) => {
      if (cancelled) return;
      if (error instanceof UnauthorizedError) onLogout();
      else setInsuranceQuoteError(error instanceof Error ? error.message : 'Не удалось рассчитать страховку');
    });
    return () => { cancelled = true; };
  }, [authToken, insuranceSelected, onLogout, reopenPositionRequest]);

  useEffect(() => {
    if (!pendingInsurance) return;
    const insurance = pairs.find((pair) => pair._id === pendingInsurance.pairId)
      ?.insurance?.[pendingInsurance.side];
    if (insurance?.id !== pendingInsurance.id) return;
    if (insurance.phase === 'active' && pendingInsurance.action === 'arm') {
      setToast({ message: 'Страховой ордер выставлен', tone: 'success' });
      setPendingInsurance(null);
    } else if (insurance.phase === 'finished' && insurance.result) {
      setToast({
        message: insurance.result.message,
        tone: insurance.result.success ? 'success' : 'error',
      });
      setPendingInsurance(null);
    }
  }, [pairs, pendingInsurance]);

  const visiblePairs = useMemo(() => {
    return filterPairs(pairs, filters, searchValue);
  }, [filters, pairs, searchValue]);

  const crossAccountPairCounts = useMemo(() => {
    return pairs.reduce((counts, pair) => {
      if (
        pair.isActive === false ||
        pair.exchange !== 'BYBIT'
      ) {
        return counts;
      }

      const exchangeAccount = Number(pair.exchangeAccount ?? 1);
      counts.set(exchangeAccount, (counts.get(exchangeAccount) ?? 0) + 1);

      return counts;
    }, new Map<number, number>());
  }, [pairs]);

  useEffect(() => {
    if (!toast) {
      return;
    }

    const timer = window.setTimeout(() => setToast(null), 7200);

    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      const now = Date.now();

      setTradeCooldowns((previousCooldowns) => {
        const activeCooldownEntries = Object.entries(previousCooldowns).filter(([, expiresAt]) => {
          return expiresAt > now;
        });

        if (activeCooldownEntries.length === Object.keys(previousCooldowns).length) {
          return previousCooldowns;
        }

        return Object.fromEntries(activeCooldownEntries);
      });
    }, 1000);

    return () => window.clearInterval(interval);
  }, []);

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

  const handleCreatePair = async (pair: CreatePairInput) => {
    setCreatePairLoading(true);

    try {
      const createdPair = await createPair(pair, authToken);

      setCreatePairModalOpen(false);
      setToast({
        message: `Пара ${createdPair.name} создана`,
        tone: 'success',
      });
      await reload();
    } catch (requestError) {
      if (requestError instanceof UnauthorizedError) {
        onLogout();
        return;
      }

      setToast({
        message: requestError instanceof Error ? requestError.message : 'Не удалось создать пару',
        tone: 'error',
      });
    } finally {
      setCreatePairLoading(false);
    }
  };

  const handlePairContextMenu = (pair: Pair, x: number, y: number) => {
    if (deletePairLoading) {
      return;
    }

    const menuWidth = 160;
    const menuHeight = 46;
    const viewportPadding = 8;

    setPairContextMenu({
      pair,
      x: Math.max(viewportPadding, Math.min(x, window.innerWidth - menuWidth - viewportPadding)),
      y: Math.max(viewportPadding, Math.min(y, window.innerHeight - menuHeight - viewportPadding)),
    });
  };

  const handleDeletePair = async () => {
    if (!pairContextMenu) {
      return;
    }

    const pair = pairContextMenu.pair;
    setDeletePairLoading(true);

    try {
      await deletePairRequest(pair._id, authToken);
      setPairContextMenu(null);
      setToast({
        message: `Пара ${pair.name} удалена`,
        tone: 'success',
      });
      await reload();
    } catch (requestError) {
      if (requestError instanceof UnauthorizedError) {
        onLogout();
        return;
      }

      setToast({
        message: requestError instanceof Error ? requestError.message : 'Не удалось удалить пару',
        tone: 'error',
      });
    } finally {
      setDeletePairLoading(false);
    }
  };

  const handleBuySignalClick = (pair: Pair, side: BybitMarketPositionSide) => {
    setTradeCooldowns((previousCooldowns) => ({
      ...previousCooldowns,
      [getTradeCooldownKey(pair._id, 'buy', side)]: Date.now() + tradeButtonCooldownMs,
    }));
    setReopenPositionRequest(null);
    setBuyAmount(5);
    setBuyPositionRequest({ pair, side });
  };

  const handleBuyAmountChange = (amount: number) => {
    setBuyAmount(amount);
  };

  const handleReopenSignalClick = (pair: Pair, side: BybitMarketPositionSide) => {
    const currentPositionAmount = getPairPositionAmount(pair, side);

    setTradeCooldowns((previousCooldowns) => ({
      ...previousCooldowns,
      [getTradeCooldownKey(pair._id, 'reopen', side)]: Date.now() + tradeButtonCooldownMs,
    }));
    setBuyPositionRequest(null);
    setReopenAmount(getDefaultReopenAmount(currentPositionAmount));
    setShouldReopenAfterClose(true);
    handleInsuranceChange(false);
    const requestId = Array.from(crypto.getRandomValues(new Uint8Array(16)),
      (byte) => byte.toString(16).padStart(2, '0')).join('');
    setReopenPositionRequest({ pair, side, insuranceRequestId: requestId });
  };

  const handleInsuranceChange = (enabled: boolean) => {
    setInsuranceSelected(enabled);
    setInsuranceQuote(undefined);
    setInsuranceQuoteError(undefined);
  };

  const handleReopenAmountChange = (amount: number) => {
    setShouldReopenAfterClose(true);
    setReopenAmount(amount);
  };

  const isTradeButtonCoolingDown = (
    pairId: string,
    action: TradeActionKind,
    side: BybitMarketPositionSide,
  ) => {
    return (tradeCooldowns[getTradeCooldownKey(pairId, action, side)] ?? 0) > Date.now();
  };

  useEffect(() => {
    const activeButtonsCount = getActiveTradingButtonsCount(pairs, isTradeButtonCoolingDown);

    updateAppBadge(activeButtonsCount).catch((badgeError: unknown) => {
      console.error('App badge update failed:', badgeError);
    });
  }, [pairs, tradeCooldowns]);

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
      const { pair, side, insuranceRequestId } = reopenPositionRequest;
      const insurance = pair.insurance?.[side];
      const refreshing = insurance?.phase === 'active';
      if (insuranceSelected || refreshing) {
        const params = { pairId: pair._id, side, token: authToken };
        const result = refreshing ? await refreshInsurance(params, insurance.id)
          : insuranceQuote ? await armInsurance(params, insuranceRequestId, insuranceQuote) : undefined;
        if (!result) return;
        setReopenPositionRequest(null);
        if (result.phase === 'finished' && result.result) {
          setToast({ message: result.result.message, tone: result.result.success ? 'success' : 'error' });
        } else if (!refreshing && result.phase === 'active') {
          setToast({ message: 'Страховой ордер выставлен', tone: 'success' });
        } else if (refreshing && result.phase === 'active') {
          setToast({ message: 'Bybit сверяет статус ордера. Попробуйте обновить позже.', tone: 'error' });
        } else {
          setPendingInsurance({ id: result.id, pairId: pair._id, side, action: refreshing ? 'refresh' : 'arm' });
          setToast({ message: 'Операция ожидает подтверждения Bybit', tone: 'success' });
        }
        await reload();
        return;
      }

      const result = await reopenBybitMarketPosition({
        amount: shouldReopenAfterClose ? reopenAmount : undefined,
        pairId: reopenPositionRequest.pair._id,
        reopen: shouldReopenAfterClose,
        side: reopenPositionRequest.side,
        token: authToken,
      });
      const closeSummary = getCloseSummary(result.close);

      setReopenPositionRequest(null);

      if (result.reopenSkipped) {
        setToast({
          message: `${closeSummary}. Новая позиция не открывалась.`,
          tone: 'success',
        });
        await reload();
        return;
      }

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
          onCreatePair={() => setCreatePairModalOpen(true)}
          onFilterToggle={toggleFilter}
          onRefresh={reload}
          onLogout={onLogout}
          onSearchChange={setSearchValue}
          onThemeToggle={onThemeToggle}
          searchValue={searchValue}
          pollingStatus={pollingStatus}
          themeMode={themeMode}
          totalCount={pairs.length}
          visibleCount={visiblePairs.length}
        />

        <PushControls token={authToken} onUnauthorized={onLogout} />

        {error && (
          <Notice role="alert">
            <strong>API error</strong>
            <span>{error}</span>
          </Notice>
        )}

        <PairsTable
          crossAccountPairCounts={crossAccountPairCounts}
          loading={loading}
          isTradeButtonCoolingDown={isTradeButtonCoolingDown}
          onBuySignalClick={handleBuySignalClick}
          onPairContextMenu={handlePairContextMenu}
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

        {createPairModalOpen && (
          <CreatePairModal
            loading={createPairLoading}
            onClose={() => setCreatePairModalOpen(false)}
            onConfirm={handleCreatePair}
          />
        )}

        {reopenPositionRequest && (
          <ReopenPositionModal
            amount={reopenAmount}
            canInsure={canOfferInsurance(reopenPositionRequest.pair, reopenPositionRequest.side)}
            currentPositionAmount={getPairPositionAmount(
              reopenPositionRequest.pair,
              reopenPositionRequest.side,
            )}
            loading={reopenLoading}
            insuranceQuote={insuranceQuote}
            insuranceQuoteError={insuranceQuoteError}
            insuranceSelected={insuranceSelected}
            pair={reopenPositionRequest.pair}
            refreshInsurance={reopenPositionRequest.pair.insurance?.[reopenPositionRequest.side]?.phase === 'active'}
            shouldReopen={shouldReopenAfterClose}
            side={reopenPositionRequest.side}
            onAmountChange={handleReopenAmountChange}
            onClose={() => setReopenPositionRequest(null)}
            onConfirm={handleReopenPosition}
            onInsuranceChange={handleInsuranceChange}
            onShouldReopenChange={setShouldReopenAfterClose}
          />
        )}

        {pairContextMenu && (
          <PairContextMenu
            loading={deletePairLoading}
            pair={pairContextMenu.pair}
            x={pairContextMenu.x}
            y={pairContextMenu.y}
            onClose={() => setPairContextMenu(null)}
            onDelete={handleDeletePair}
          />
        )}

        {toast && <Toast $tone={toast.tone}>{toast.message}</Toast>}
      </Page>
    </>
  );
}
