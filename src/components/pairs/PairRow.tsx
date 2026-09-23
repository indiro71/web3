import type { BybitMarketPositionSide } from '../../api/pairs';
import type { Pair } from '../../types/pair';
import {
  Divider,
  ExchangeMark,
  ExtraMargin,
  MarginValue,
  MetricValue,
  NameCell,
  NameContent,
  NextSignalButton,
  PairLink,
  PairValues,
  StrongValue,
} from './PairsDashboard.style';
import {
  formatDecimal,
  formatMargin,
  formatPercent,
  getExchangeUrl,
  getLiquidationTone,
  getPercentTone,
  hasProfitSignal,
  hasNextLongSignal,
  hasNextShortSignal,
} from './PairsDashboard.utils';
import { CryptoIcon, type CryptoIconStatus } from './CryptoIcon';

interface PairRowProps {
  crossAccountPairCount: number;
  isTradeButtonCoolingDown: (
    pairId: string,
    action: 'buy' | 'reopen',
    side: BybitMarketPositionSide,
  ) => boolean;
  onBuySignalClick: (pair: Pair, side: BybitMarketPositionSide) => void;
  onContextMenu: (pair: Pair, x: number, y: number) => void;
  onReopenSignalClick: (pair: Pair, side: BybitMarketPositionSide) => void;
  pair: Pair;
}

const getPairUpdateStatus = (dateUpdate?: string): CryptoIconStatus => {
  const updateTimestamp = dateUpdate ? new Date(dateUpdate).getTime() : Number.NaN;

  if (!Number.isFinite(updateTimestamp)) {
    return 'stale';
  }

  const updateAgeMs = Date.now() - updateTimestamp;

  if (updateAgeMs <= 2 * 60 * 1000) {
    return 'recent';
  }

  if (updateAgeMs <= 5 * 60 * 1000) {
    return 'warning';
  }

  return 'stale';
};

const getCrossMmTone = (pair: Pair, accountPairCount: number) => {
  const totalPnl =
    Number(pair.longUnrealisedPnl ?? 0) +
    Number(pair.longRealisedPnl ?? 0) +
    Number(pair.shortUnrealisedPnl ?? 0) +
    Number(pair.shortRealisedPnl ?? 0);

  if (totalPnl < -1000) {
    return 'negative';
  }

  if (accountPairCount <= 0) {
    return 'positive';
  }

  const allocationPercent = 100 / accountPairCount;
  const pairMmPercent =
    Number(pair.longLiquidatePercent ?? 0) + Number(pair.shortLiquidatePercent ?? 0);

  if (pairMmPercent > allocationPercent * 2) {
    return 'negative';
  }

  return pairMmPercent >= allocationPercent ? 'warning' : 'positive';
};

export function PairRow({
  crossAccountPairCount,
  isTradeButtonCoolingDown,
  onBuySignalClick,
  onContextMenu,
  onReopenSignalClick,
  pair,
}: PairRowProps) {
  const longMargin = formatMargin(pair.longMargin, pair.longAllMargin);
  const shortMargin = formatMargin(pair.shortMargin, pair.shortAllMargin);
  const longPnl = Number(pair.longUnrealisedPnl ?? 0) + Number(pair.longRealisedPnl ?? 0);
  const shortPnl = Number(pair.shortUnrealisedPnl ?? 0) + Number(pair.shortRealisedPnl ?? 0);
  const longCumulativePnl = Number(pair.longCumulativeRealisedPnl ?? 0);
  const shortCumulativePnl = Number(pair.shortCumulativeRealisedPnl ?? 0);
  const totalCumulativePnl = longCumulativePnl + shortCumulativePnl;
  const longNextSignal = hasNextLongSignal(pair);
  const shortNextSignal = hasNextShortSignal(pair);
  const longProfitSignal = hasProfitSignal(pair, 'long');
  const shortProfitSignal = hasProfitSignal(pair, 'short');
  const updateStatus = getPairUpdateStatus(pair.dateUpdate);
  const isCrossMargin = pair.exchange === 'BYBIT' && pair.marginMode === 'CROSS';
  const crossMmTone = getCrossMmTone(pair, crossAccountPairCount);
  const canReopenLong =
    pair.exchange === 'BYBIT' &&
    longProfitSignal &&
    !isTradeButtonCoolingDown(pair._id, 'reopen', 'long');
  const canReopenShort =
    pair.exchange === 'BYBIT' &&
    shortProfitSignal &&
    !isTradeButtonCoolingDown(pair._id, 'reopen', 'short');
  const canManuallyReopenLong =
    pair.exchange === 'BYBIT' &&
    Number(pair.longPercent) > 0 &&
    Number(pair.longMargin) > 0 &&
    !isTradeButtonCoolingDown(pair._id, 'reopen', 'long');
  const canManuallyReopenShort =
    pair.exchange === 'BYBIT' &&
    Number(pair.shortPercent) > 0 &&
    Number(pair.shortMargin) > 0 &&
    !isTradeButtonCoolingDown(pair._id, 'reopen', 'short');
  const canBuyLong =
    pair.exchange === 'BYBIT' &&
    longNextSignal &&
    !isTradeButtonCoolingDown(pair._id, 'buy', 'long');
  const canBuyShort =
    pair.exchange === 'BYBIT' &&
    shortNextSignal &&
    !isTradeButtonCoolingDown(pair._id, 'buy', 'short');

  return (
    <tr
      onContextMenu={(event) => {
        event.preventDefault();
        onContextMenu(pair, event.clientX, event.clientY);
      }}
    >
      <NameCell>
        <NameContent>
          <CryptoIcon pair={pair} updateStatus={updateStatus} />
          <ExchangeMark>{pair.exchange.charAt(0)}</ExchangeMark>
          <PairLink href={getExchangeUrl(pair)} target="_blank" rel="noreferrer">
            {pair.name} ({pair.exchangeAccount ?? 1})
          </PairLink>
        </NameContent>
      </NameCell>
      <td>
        <PairValues>
          {canReopenLong ? (
            <NextSignalButton
              $tone="positive"
              type="button"
              onClick={() => onReopenSignalClick(pair, 'long')}
            >
              {formatPercent(pair.longPercent)}
            </NextSignalButton>
          ) : (
            <MetricValue
              $tone={getPercentTone(pair.longPercent)}
              onDoubleClick={canManuallyReopenLong
                ? () => onReopenSignalClick(pair, 'long')
                : undefined}
            >
              {formatPercent(pair.longPercent)}
            </MetricValue>
          )}
          <Divider>|</Divider>
          {canReopenShort ? (
            <NextSignalButton
              $tone="positive"
              type="button"
              onClick={() => onReopenSignalClick(pair, 'short')}
            >
              {formatPercent(pair.shortPercent)}
            </NextSignalButton>
          ) : (
            <MetricValue
              $tone={getPercentTone(pair.shortPercent)}
              onDoubleClick={canManuallyReopenShort
                ? () => onReopenSignalClick(pair, 'short')
                : undefined}
            >
              {formatPercent(pair.shortPercent)}
            </MetricValue>
          )}
        </PairValues>
      </td>
      <td>
        <PairValues>
          {canBuyLong ? (
            <NextSignalButton
              $tone="positive"
              type="button"
              onClick={() => onBuySignalClick(pair, 'long')}
            >
              {formatDecimal(pair.nextBuyLongPrice)}
            </NextSignalButton>
          ) : (
            <MetricValue $tone={longNextSignal ? 'positive' : 'negative'}>
              {formatDecimal(pair.nextBuyLongPrice)}
            </MetricValue>
          )}
          <Divider>|</Divider>
          {canBuyShort ? (
            <NextSignalButton
              $tone="positive"
              type="button"
              onClick={() => onBuySignalClick(pair, 'short')}
            >
              {formatDecimal(pair.nextBuyShortPrice)}
            </NextSignalButton>
          ) : (
            <MetricValue $tone={shortNextSignal ? 'positive' : 'negative'}>
              {formatDecimal(pair.nextBuyShortPrice)}
            </MetricValue>
          )}
        </PairValues>
      </td>
      <td>
        <StrongValue>{formatDecimal(pair.currentPrice)}</StrongValue>
      </td>
      <td>
        <PairValues>
          <MetricValue
            $tone={isCrossMargin ? crossMmTone : getLiquidationTone(pair.longLiquidatePercent)}
          >
            {formatDecimal(pair.longLiquidatePercent, isCrossMargin ? 2 : 0)}{isCrossMargin && '%'}
            {isCrossMargin && ` (${Math.round(longPnl)})`}
          </MetricValue>
          <Divider>|</Divider>
          <MetricValue
            $tone={isCrossMargin ? crossMmTone : getLiquidationTone(pair.shortLiquidatePercent)}
          >
            {formatDecimal(pair.shortLiquidatePercent, isCrossMargin ? 2 : 0)}{isCrossMargin && '%'}
            {isCrossMargin && ` (${Math.round(shortPnl)})`}
          </MetricValue>
        </PairValues>
      </td>
      <td>
        {pair.exchange === 'BYBIT' ? (
          <PairValues>
            <MetricValue $tone={getPercentTone(longCumulativePnl)}>
              {Math.round(longCumulativePnl)}
            </MetricValue>
            <Divider>|</Divider>
            <MetricValue $tone={getPercentTone(shortCumulativePnl)}>
              {Math.round(shortCumulativePnl)}
            </MetricValue>
            <MetricValue $tone={getPercentTone(totalCumulativePnl)}>
              ({Math.round(totalCumulativePnl)})
            </MetricValue>
          </PairValues>
        ) : (
          <MetricValue $tone="muted">—</MetricValue>
        )}
      </td>
      <td>
        <PairValues>
          <MarginValue>
            {longMargin.base}
            {longMargin.extra > 0 && <ExtraMargin>({longMargin.extra})</ExtraMargin>}
          </MarginValue>
          <Divider>|</Divider>
          <MarginValue>
            {shortMargin.base}
            {shortMargin.extra > 0 && <ExtraMargin>({shortMargin.extra})</ExtraMargin>}
          </MarginValue>
        </PairValues>
      </td>
    </tr>
  );
}
