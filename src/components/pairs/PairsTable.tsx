import type { BybitMarketPositionSide } from '../../api/pairs';
import type { Pair } from '../../types/pair';
import {
  EmptyState,
  HeaderFull,
  HeaderShort,
  PairsTableElement,
  TableScroll,
  TableSurface,
} from './PairsDashboard.style';
import { PairRow } from './PairRow';

interface PairsTableProps {
  isTradeButtonCoolingDown: (
    pairId: string,
    action: 'buy' | 'reopen',
    side: BybitMarketPositionSide,
  ) => boolean;
  loading: boolean;
  onBuySignalClick: (pair: Pair, side: BybitMarketPositionSide) => void;
  onReopenSignalClick: (pair: Pair, side: BybitMarketPositionSide) => void;
  pairs: Pair[];
  totalPairs: number;
}

export function PairsTable({
  isTradeButtonCoolingDown,
  loading,
  onBuySignalClick,
  onReopenSignalClick,
  pairs,
  totalPairs,
}: PairsTableProps) {
  return (
    <TableSurface>
      <TableScroll>
        <PairsTableElement>
          <thead>
            <tr>
              <th>Name</th>
              <th>
                <HeaderFull>L/S Percent</HeaderFull>
                <HeaderShort>L/S %</HeaderShort>
              </th>
              <th>
                <HeaderFull>L/S Next</HeaderFull>
                <HeaderShort>Next</HeaderShort>
              </th>
              <th>Price</th>
              <th>
                <HeaderFull>L/S Liquidation</HeaderFull>
                <HeaderShort>Liq</HeaderShort>
              </th>
              <th>
                <HeaderFull>L/S Margin</HeaderFull>
                <HeaderShort>Margin</HeaderShort>
              </th>
            </tr>
          </thead>
          <tbody>
            {pairs.map((pair) => (
              <PairRow
                key={pair._id}
                isTradeButtonCoolingDown={isTradeButtonCoolingDown}
                onBuySignalClick={onBuySignalClick}
                onReopenSignalClick={onReopenSignalClick}
                pair={pair}
              />
            ))}
          </tbody>
        </PairsTableElement>
      </TableScroll>

      {!loading && !pairs.length && <EmptyState>No pairs match the current view.</EmptyState>}

      {loading && !totalPairs && <EmptyState>Loading pairs...</EmptyState>}
    </TableSurface>
  );
}
