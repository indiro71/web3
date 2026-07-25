import { useMemo, useState } from 'react';
import { usePairs } from '../hooks/usePairs';
import { GlobalStyle, Notice, Page } from './PairsDashboard.style';
import { PairsTable } from './PairsTable';
import { PairsToolbar } from './PairsToolbar';
import {
  filterPairs,
  readStoredFilter,
  storeFilter,
  type PairFilters,
  type StoredFilterKey,
} from './PairsDashboard.utils';

export function PairsDashboard() {
  const { pairs, loading, error, reload, socketStatus, lastUpdated } = usePairs();
  const [filters, setFilters] = useState<PairFilters>({
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
        <PairsToolbar
          filters={filters}
          loading={loading}
          lastUpdated={lastUpdated}
          onFilterToggle={toggleFilter}
          onRefresh={reload}
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

        <PairsTable loading={loading} pairs={visiblePairs} totalPairs={pairs.length} />
      </Page>
    </>
  );
}
