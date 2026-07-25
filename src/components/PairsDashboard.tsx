import { useMemo, useState } from 'react';
import styled, { createGlobalStyle } from 'styled-components';
import { usePairs } from '../hooks/usePairs';
import type { Pair } from '../types/pair';

const liquidationPercent = 97;

type StoredFilterKey = 'allData' | 'onlyPrice' | 'onlyNext';

const readStoredFilter = (key: StoredFilterKey) => {
  if (typeof window === 'undefined') {
    return false;
  }

  return localStorage.getItem(key) === 'true';
};

const storeFilter = (key: StoredFilterKey, value: boolean) => {
  if (value) {
    localStorage.setItem(key, 'true');
    return;
  }

  localStorage.removeItem(key);
};

const getExchangeUrl = (pair: Pair) => {
  if (pair.exchange === 'MEXC') {
    return `https://futures.mexc.com/ru-RU/exchange/${pair.contract}`;
  }

  return `https://www.bybit.com/trade/usdt/${pair.symbol}`;
};

const formatDecimal = (value?: number, maximumFractionDigits = 8) => {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return '0';
  }

  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits,
    minimumFractionDigits: 0,
    useGrouping: false,
  }).format(value);
};

const formatPercent = (value?: number) => {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return '0.00%';
  }

  return `${value.toFixed(2)}%`;
};

const formatMargin = (base?: number, all?: number) => {
  const baseValue = Math.round(base ?? 0);
  const extraValue = Math.round(Math.max((all ?? 0) - (base ?? 0), 0));

  return {
    base: baseValue,
    extra: extraValue,
  };
};

const hasNextLongSignal = (pair: Pair) => {
  return Boolean(pair.nextBuyLongPrice && pair.currentPrice < pair.nextBuyLongPrice);
};

const hasNextShortSignal = (pair: Pair) => {
  return Boolean(pair.nextBuyShortPrice && pair.currentPrice > pair.nextBuyShortPrice);
};

const filterPairs = (
  pairs: Pair[],
  filters: Record<StoredFilterKey, boolean>,
  searchValue: string,
) => {
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

export function PairsDashboard() {
  const { pairs, loading, error, reload, socketStatus, lastUpdated } = usePairs();
  const [filters, setFilters] = useState<Record<StoredFilterKey, boolean>>({
    allData: readStoredFilter('allData'),
    onlyPrice: readStoredFilter('onlyPrice'),
    onlyNext: readStoredFilter('onlyNext'),
  });
  const [searchValue, setSearchValue] = useState('');

  const visiblePairs = useMemo(() => {
    return filterPairs(pairs, filters, searchValue);
  }, [filters, pairs, searchValue]);

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

  return (
    <>
      <GlobalStyle />
      <Page>
        <Header>
          <TitleGroup>
            <Eyebrow>Trading monitor</Eyebrow>
            <h1>Pairs</h1>
          </TitleGroup>

          <StatusStrip aria-label="Connection status">
            <StatusBadge $status={socketStatus}>
              <span aria-hidden="true" />
              {socketStatus}
            </StatusBadge>
            <StatusMeta>
              {lastUpdated ? `Updated ${lastUpdated.toLocaleTimeString()}` : 'No updates yet'}
            </StatusMeta>
            <RefreshButton type="button" onClick={reload} disabled={loading}>
              Refresh
            </RefreshButton>
          </StatusStrip>
        </Header>

        <Toolbar aria-label="Pair filters">
          <SearchInput
            type="search"
            value={searchValue}
            onChange={(event) => setSearchValue(event.target.value)}
            placeholder="Search pair, symbol, exchange"
          />
          <FilterGroup>
            <FilterButton
              type="button"
              $active={filters.allData}
              onClick={() => toggleFilter('allData')}
            >
              Risk
            </FilterButton>
            <FilterButton
              type="button"
              $active={filters.onlyPrice}
              onClick={() => toggleFilter('onlyPrice')}
            >
              Price
            </FilterButton>
            <FilterButton
              type="button"
              $active={filters.onlyNext}
              onClick={() => toggleFilter('onlyNext')}
            >
              Next
            </FilterButton>
          </FilterGroup>
          <Counter>
            {visiblePairs.length} / {pairs.length}
          </Counter>
        </Toolbar>

        {error && (
          <Notice role="alert">
            <strong>API error</strong>
            <span>{error}</span>
          </Notice>
        )}

        <TableSurface>
          <TableScroll>
            <PairsTable>
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
                {visiblePairs.map((pair) => (
                  <PairRow key={pair._id} pair={pair} />
                ))}
              </tbody>
            </PairsTable>
          </TableScroll>

          {!loading && !visiblePairs.length && (
            <EmptyState>No pairs match the current view.</EmptyState>
          )}

          {loading && !pairs.length && <EmptyState>Loading pairs...</EmptyState>}
        </TableSurface>
      </Page>
    </>
  );
}

function PairRow({ pair }: { pair: Pair }) {
  const longMargin = formatMargin(pair.longMargin, pair.longAllMargin);
  const shortMargin = formatMargin(pair.shortMargin, pair.shortAllMargin);
  const longNextSignal = hasNextLongSignal(pair);
  const shortNextSignal = hasNextShortSignal(pair);

  return (
    <tr>
      <NameCell>
        <ExchangeMark>{pair.exchange.charAt(0)}</ExchangeMark>
        <PairLink href={getExchangeUrl(pair)} target="_blank" rel="noreferrer">
          {pair.name}
        </PairLink>
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

const getPercentTone = (value?: number) => {
  if (!value) return 'muted';
  return value > 0 ? 'positive' : 'negative';
};

const getLiquidationTone = (value?: number) => {
  return (value ?? 0) > liquidationPercent ? 'negative' : 'positive';
};

const GlobalStyle = createGlobalStyle`
  body {
    background: #eef2f5;
    color: #18202a;
  }
`;

const Page = styled.main`
  min-height: 100vh;
  padding: 28px;
  background:
    linear-gradient(180deg, #f7f9fb 0%, #edf2f6 46%, #e8eef2 100%);

  @media (max-width: 860px) {
    padding: 18px;
  }
`;

const Header = styled.header`
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 24px;
  margin: 0 auto 22px;
  width: min(100%, 1720px);

  @media (max-width: 860px) {
    align-items: start;
    flex-direction: column;
  }
`;

const TitleGroup = styled.div`
  h1 {
    margin: 0;
    color: #111827;
    font-size: 2.4rem;
    line-height: 1;
  }
`;

const Eyebrow = styled.p`
  margin: 0 0 8px;
  color: #64748b;
  font-size: 0.78rem;
  font-weight: 800;
  letter-spacing: 0;
  text-transform: uppercase;
`;

const StatusStrip = styled.div`
  display: flex;
  align-items: center;
  justify-content: end;
  gap: 10px;
  flex-wrap: wrap;
`;

const StatusBadge = styled.div<{ $status: string }>`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  height: 34px;
  padding: 0 12px;
  border: 1px solid #d7dee7;
  border-radius: 999px;
  background: #ffffff;
  color: #374151;
  font-size: 0.82rem;
  font-weight: 800;
  text-transform: capitalize;

  span {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: ${({ $status }) =>
      $status === 'connected' ? '#10b981' : $status === 'connecting' ? '#f59e0b' : '#ef4444'};
  }
`;

const StatusMeta = styled.div`
  height: 34px;
  display: inline-flex;
  align-items: center;
  padding: 0 12px;
  border: 1px solid #d7dee7;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.72);
  color: #5f6b7a;
  font-size: 0.82rem;
  font-weight: 700;
`;

const RefreshButton = styled.button`
  height: 34px;
  padding: 0 14px;
  border: 0;
  border-radius: 7px;
  background: #1f2937;
  color: #ffffff;
  font-weight: 800;
  cursor: pointer;

  &:disabled {
    cursor: wait;
    opacity: 0.58;
  }
`;

const Toolbar = styled.section`
  display: grid;
  grid-template-columns: minmax(220px, 360px) auto minmax(80px, max-content);
  align-items: center;
  gap: 12px;
  margin: 0 auto 14px;
  width: min(100%, 1720px);

  @media (max-width: 860px) {
    grid-template-columns: 1fr;
  }
`;

const SearchInput = styled.input`
  width: 100%;
  height: 40px;
  border: 1px solid #d5dde6;
  border-radius: 7px;
  background: #ffffff;
  color: #111827;
  padding: 0 12px;
  outline: none;

  &:focus {
    border-color: #2563eb;
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
  }
`;

const FilterGroup = styled.div`
  display: inline-flex;
  width: max-content;
  border: 1px solid #d5dde6;
  border-radius: 8px;
  background: #ffffff;
  overflow: hidden;

  @media (max-width: 860px) {
    width: 100%;
  }
`;

const FilterButton = styled.button<{ $active: boolean }>`
  min-width: 72px;
  height: 38px;
  border: 0;
  border-right: 1px solid #d5dde6;
  background: ${({ $active }) => ($active ? '#2563eb' : '#ffffff')};
  color: ${({ $active }) => ($active ? '#ffffff' : '#334155')};
  font-weight: 800;
  cursor: pointer;

  &:last-child {
    border-right: 0;
  }

  @media (max-width: 860px) {
    flex: 1;
  }
`;

const Counter = styled.div`
  justify-self: end;
  min-width: 80px;
  height: 38px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid #d5dde6;
  border-radius: 7px;
  background: #ffffff;
  color: #475569;
  font-weight: 800;

  @media (max-width: 860px) {
    justify-self: stretch;
    width: 100%;
  }
`;

const Notice = styled.div`
  width: min(100%, 1720px);
  margin: 0 auto 14px;
  display: flex;
  gap: 12px;
  align-items: center;
  border: 1px solid #fecaca;
  border-radius: 7px;
  background: #fff1f2;
  color: #991b1b;
  padding: 12px 14px;

  span {
    color: #b91c1c;
  }
`;

const TableSurface = styled.section`
  width: min(100%, 1720px);
  margin: 0 auto;
  border: 1px solid #d9e1e8;
  border-radius: 8px;
  background: #ffffff;
  box-shadow: 0 18px 50px rgba(30, 41, 59, 0.08);
  overflow: hidden;
`;

const TableScroll = styled.div`
  overflow: auto;
`;

const PairsTable = styled.table`
  width: 100%;
  min-width: 1040px;
  border-collapse: separate;
  border-spacing: 0;

  th,
  td {
    border-bottom: 1px solid #e5ebf0;
    padding: 14px 16px;
    text-align: left;
    white-space: nowrap;
  }

  th {
    position: sticky;
    top: 0;
    z-index: 1;
    background: #f8fafc;
    color: #7b8794;
    font-size: 0.76rem;
    font-weight: 900;
    text-transform: uppercase;
  }

  tbody tr {
    background: #ffffff;
  }

  tbody tr:nth-child(even) {
    background: #f7f9fb;
  }

  tbody tr:hover {
    background: #eef6ff;
  }

  tbody tr:last-child td {
    border-bottom: 0;
  }
`;

const NameCell = styled.td`
  min-width: 180px;
`;

const ExchangeMark = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  margin-right: 10px;
  border-radius: 50%;
  background: #e0ecff;
  color: #2563eb;
  font-size: 0.74rem;
  font-weight: 900;
`;

const PairLink = styled.a`
  color: #2563eb;
  font-weight: 900;
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }
`;

const PairValues = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-weight: 900;
`;

const Divider = styled.span`
  color: #a0a9b4;
`;

const MetricValue = styled.span<{ $tone: string }>`
  color: ${({ $tone }) => {
    if ($tone === 'positive') return '#10b981';
    if ($tone === 'negative') return '#ef4444';
    return '#64748b';
  }};
`;

const StrongValue = styled.span`
  color: #1f2937;
  font-weight: 900;
`;

const MarginValue = styled.span`
  color: #1f2937;
  font-weight: 900;
`;

const ExtraMargin = styled.span`
  margin-left: 3px;
  color: #64748b;
  font-size: 0.78rem;
`;

const EmptyState = styled.div`
  padding: 44px 20px;
  color: #64748b;
  text-align: center;
  font-weight: 800;
`;
