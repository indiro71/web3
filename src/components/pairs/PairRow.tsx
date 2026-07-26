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
import { CryptoIcon } from './CryptoIcon';

interface PairRowProps {
  isTradeButtonCoolingDown: (
    pairId: string,
    action: 'buy' | 'reopen',
    side: BybitMarketPositionSide,
  ) => boolean;
  onBuySignalClick: (pair: Pair, side: BybitMarketPositionSide) => void;
  onReopenSignalClick: (pair: Pair, side: BybitMarketPositionSide) => void;
  pair: Pair;
}

export function PairRow({
  isTradeButtonCoolingDown,
  onBuySignalClick,
  onReopenSignalClick,
  pair,
}: PairRowProps) {
  const longMargin = formatMargin(pair.longMargin, pair.longAllMargin);
  const shortMargin = formatMargin(pair.shortMargin, pair.shortAllMargin);
  const longNextSignal = hasNextLongSignal(pair);
  const shortNextSignal = hasNextShortSignal(pair);
  const longProfitSignal = hasProfitSignal(pair, 'long');
  const shortProfitSignal = hasProfitSignal(pair, 'short');
  const canReopenLong =
    pair.exchange === 'BYBIT' &&
    longProfitSignal &&
    !isTradeButtonCoolingDown(pair._id, 'reopen', 'long');
  const canReopenShort =
    pair.exchange === 'BYBIT' &&
    shortProfitSignal &&
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
    <tr>
      <NameCell>
        <NameContent>
          <CryptoIcon pair={pair} />
          <ExchangeMark>{pair.exchange.charAt(0)}</ExchangeMark>
          <PairLink href={getExchangeUrl(pair)} target="_blank" rel="noreferrer">
            {pair.name}
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
            <MetricValue $tone={getPercentTone(pair.longPercent)}>
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
            <MetricValue $tone={getPercentTone(pair.shortPercent)}>
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
          <MetricValue $tone={getLiquidationTone(pair.longLiquidatePercent)}>
            {formatDecimal(pair.longLiquidatePercent, 0)}
          </MetricValue>
          <Divider>|</Divider>
          <MetricValue $tone={getLiquidationTone(pair.shortLiquidatePercent)}>
            {formatDecimal(pair.shortLiquidatePercent, 0)}
          </MetricValue>
        </PairValues>
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
