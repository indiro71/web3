import {
  Counter,
  FilterButton,
  FilterGroup,
  LogoutButton,
  RefreshButton,
  SearchInput,
  StatusBadge,
  StatusMeta,
  StatusStrip,
  TopBar,
} from './PairsDashboard.style';
import type { PairFilters, StoredFilterKey } from './PairsDashboard.utils';

interface PairsToolbarProps {
  filters: PairFilters;
  loading: boolean;
  lastUpdated: Date | null;
  onFilterToggle: (key: StoredFilterKey) => void;
  onLogout: () => void;
  onRefresh: () => void;
  onSearchChange: (value: string) => void;
  searchValue: string;
  socketStatus: string;
  totalCount: number;
  visibleCount: number;
}

const filterItems: Array<{ key: StoredFilterKey; label: string }> = [
  { key: 'allData', label: 'Risk' },
  { key: 'onlyPrice', label: 'Price' },
  { key: 'onlyNext', label: 'Next' },
];

export function PairsToolbar({
  filters,
  loading,
  lastUpdated,
  onFilterToggle,
  onLogout,
  onRefresh,
  onSearchChange,
  searchValue,
  socketStatus,
  totalCount,
  visibleCount,
}: PairsToolbarProps) {
  return (
    <TopBar aria-label="Pair filters">
      <SearchInput
        type="search"
        value={searchValue}
        onChange={(event) => onSearchChange(event.target.value)}
        placeholder="Search pair, symbol, exchange"
      />
      <FilterGroup>
        {filterItems.map((filterItem) => (
          <FilterButton
            key={filterItem.key}
            type="button"
            $active={filters[filterItem.key]}
            onClick={() => onFilterToggle(filterItem.key)}
          >
            {filterItem.label}
          </FilterButton>
        ))}
      </FilterGroup>
      <Counter>
        {visibleCount} / {totalCount}
      </Counter>
      <StatusStrip aria-label="Connection status">
        <StatusBadge $status={socketStatus}>
          <span aria-hidden="true" />
          {socketStatus}
        </StatusBadge>
        <StatusMeta>
          {lastUpdated ? `Updated ${lastUpdated.toLocaleTimeString()}` : 'No updates yet'}
        </StatusMeta>
        <RefreshButton type="button" onClick={onRefresh} disabled={loading}>
          Refresh
        </RefreshButton>
        <LogoutButton type="button" onClick={onLogout}>
          Logout
        </LogoutButton>
      </StatusStrip>
    </TopBar>
  );
}
