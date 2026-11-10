import type { BybitMarketPositionSide } from '../../api/pairs';
import type { Pair, PositionInsurance } from '../../types/pair';
import {
  Divider,
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
  getCrossMmTone,
  getNextBuyPrice,
  getPercentTone,
  hasReopenAction,
  canRefreshInsurance,
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

function InsuranceMark({ insurance }: { insurance?: PositionInsurance }) {
  if (!insurance) return null;
  if (insurance.phase === 'active' || insurance.phase === 'cancelling') {
    return <span title={`Застраховано · уровень ${insurance.triggerPrice}`}>©</span>;
  }
  if (insurance.blocking) return <span title="Сверяем операцию с Bybit">…</span>;
  if (insurance.result && !insurance.result.success) {
    return <span title={insurance.result.message} aria-label={insurance.result.message}>⚠</span>;
  }
  return null;
}

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
  const updateStatus = getPairUpdateStatus(pair.dateUpdate);
  const crossMmTone = getCrossMmTone(pair, crossAccountPairCount);
  const canReopenLong =
    pair.exchange === 'BYBIT' &&
    hasReopenAction(pair, 'long') &&
    !isTradeButtonCoolingDown(pair._id, 'reopen', 'long');
  const canReopenShort =
    pair.exchange === 'BYBIT' &&
    hasReopenAction(pair, 'short') &&
    !isTradeButtonCoolingDown(pair._id, 'reopen', 'short');
  const canManuallyReopenLong =
    pair.exchange === 'BYBIT' &&
    !pair.insurance?.long?.blocking &&
    Number(pair.longPercent) > 0 &&
    Number(pair.longMargin) > 0 &&
    !isTradeButtonCoolingDown(pair._id, 'reopen', 'long');
  const canManuallyReopenShort =
    pair.exchange === 'BYBIT' &&
    !pair.insurance?.short?.blocking &&
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
              title={canRefreshInsurance(pair, 'long') ? 'Обновить страховку Long' : undefined}
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
          <InsuranceMark insurance={pair.insurance?.long} />
          <Divider>|</Divider>
          {canReopenShort ? (
            <NextSignalButton
              $tone="positive"
              type="button"
              title={canRefreshInsurance(pair, 'short') ? 'Обновить страховку Short' : undefined}
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
          <InsuranceMark insurance={pair.insurance?.short} />
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
              {formatDecimal(getNextBuyPrice(pair, 'long'))}
            </NextSignalButton>
          ) : (
            <MetricValue $tone={longNextSignal ? 'positive' : 'negative'}>
              {formatDecimal(getNextBuyPrice(pair, 'long'))}
            </MetricValue>
          )}
          <Divider>|</Divider>
          {canBuyShort ? (
            <NextSignalButton
              $tone="positive"
              type="button"
              onClick={() => onBuySignalClick(pair, 'short')}
            >
              {formatDecimal(getNextBuyPrice(pair, 'short'))}
            </NextSignalButton>
          ) : (
            <MetricValue $tone={shortNextSignal ? 'positive' : 'negative'}>
              {formatDecimal(getNextBuyPrice(pair, 'short'))}
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
            $tone={crossMmTone}
          >
            {formatDecimal(pair.longLiquidatePercent, 2)}%
            {` (${Math.round(longPnl)})`}
          </MetricValue>
          <Divider>|</Divider>
          <MetricValue
            $tone={crossMmTone}
          >
            {formatDecimal(pair.shortLiquidatePercent, 2)}%
            {` (${Math.round(shortPnl)})`}
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
          </MarginValue>
          <Divider>|</Divider>
          <MarginValue>
            {shortMargin.base}
          </MarginValue>
        </PairValues>
      </td>
    </tr>
  );
}
