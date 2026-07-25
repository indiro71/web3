import type { Pair } from '../../types/pair';
import {
  Divider,
  ExchangeMark,
  ExtraMargin,
  MarginValue,
  MetricValue,
  NameCell,
  NameContent,
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
  hasNextLongSignal,
  hasNextShortSignal,
} from './PairsDashboard.utils';
import { CryptoIcon } from './CryptoIcon';

interface PairRowProps {
  pair: Pair;
}

export function PairRow({ pair }: PairRowProps) {
  const longMargin = formatMargin(pair.longMargin, pair.longAllMargin);
  const shortMargin = formatMargin(pair.shortMargin, pair.shortAllMargin);
  const longNextSignal = hasNextLongSignal(pair);
  const shortNextSignal = hasNextShortSignal(pair);

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
          <MetricValue $tone={getPercentTone(pair.longPercent)}>
            {formatPercent(pair.longPercent)}
          </MetricValue>
          <Divider>|</Divider>
          <MetricValue $tone={getPercentTone(pair.shortPercent)}>
            {formatPercent(pair.shortPercent)}
          </MetricValue>
        </PairValues>
      </td>
      <td>
        <PairValues>
          <MetricValue $tone={longNextSignal ? 'positive' : 'negative'}>
            {formatDecimal(pair.nextBuyLongPrice)}
          </MetricValue>
          <Divider>|</Divider>
          <MetricValue $tone={shortNextSignal ? 'positive' : 'negative'}>
            {formatDecimal(pair.nextBuyShortPrice)}
          </MetricValue>
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
