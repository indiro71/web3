import type { Pair } from '../../types/pair';
import { EmptyState, PairsTableElement, TableScroll, TableSurface } from './PairsDashboard.style';
import { PairRow } from './PairRow';

interface PairsTableProps {
  loading: boolean;
  pairs: Pair[];
  totalPairs: number;
}

export function PairsTable({ loading, pairs, totalPairs }: PairsTableProps) {
  return (
    <TableSurface>
      <TableScroll>
        <PairsTableElement>
          <thead>
            <tr>
              <th>Name</th>
              <th>L/S Percent</th>
              <th>L/S Next</th>
              <th>Price</th>
              <th>L/S Liquidation</th>
              <th>L/S Margin</th>
            </tr>
          </thead>
          <tbody>
            {pairs.map((pair) => (
              <PairRow key={pair._id} pair={pair} />
            ))}
          </tbody>
        </PairsTableElement>
      </TableScroll>

      {!loading && !pairs.length && <EmptyState>No pairs match the current view.</EmptyState>}

      {loading && !totalPairs && <EmptyState>Loading pairs...</EmptyState>}
    </TableSurface>
  );
}
