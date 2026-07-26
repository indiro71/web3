import {
  Counter,
  FilterButton,
  FilterGroup,
  FilterLabelFull,
  FilterLabelShort,
  LogoutButton,
  RefreshButton,
  SearchInput,
  StatusBadge,
  StatusDot,
  StatusLabel,
  StatusMeta,
  StatusMetaFull,
  StatusMetaShort,
  StatusStrip,
  ThemeToggleButton,
  TopBar,
} from './PairsDashboard.style';
import type { AppThemeMode } from './PairsDashboard.theme';
import type { PairFilters, StoredFilterKey } from './PairsDashboard.utils';

interface PairsToolbarProps {
  filters: PairFilters;
  loading: boolean;
  lastUpdated: Date | null;
  onFilterToggle: (key: StoredFilterKey) => void;
  onLogout: () => void;
  onRefresh: () => void;
  onSearchChange: (value: string) => void;
  onThemeToggle: () => void;
  searchValue: string;
  socketStatus: string;
  themeMode: AppThemeMode;
  totalCount: number;
  visibleCount: number;
}

const filterItems: Array<{ key: StoredFilterKey; label: string; shortLabel: string }> = [
  { key: 'allData', label: 'Risk', shortLabel: 'R' },
  { key: 'onlyPrice', label: 'Price', shortLabel: 'P' },
  { key: 'onlyNext', label: 'Next', shortLabel: 'N' },
];

export function PairsToolbar({
  filters,
  loading,
  lastUpdated,
  onFilterToggle,
  onLogout,
  onRefresh,
  onSearchChange,
  onThemeToggle,
  searchValue,
  socketStatus,
  themeMode,
  totalCount,
  visibleCount,
}: PairsToolbarProps) {
  const updatedTime = lastUpdated?.toLocaleTimeString() ?? null;

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
            <FilterLabelFull>{filterItem.label}</FilterLabelFull>
            <FilterLabelShort>{filterItem.shortLabel}</FilterLabelShort>
          </FilterButton>
        ))}
      </FilterGroup>
      <Counter>
        {visibleCount} / {totalCount}
      </Counter>
      <StatusStrip aria-label="Connection status">
        <StatusBadge $status={socketStatus}>
          <StatusDot $status={socketStatus} aria-hidden="true" />
          <StatusLabel>{socketStatus}</StatusLabel>
        </StatusBadge>
        <StatusMeta>
          <StatusMetaFull>{updatedTime ? `Updated ${updatedTime}` : 'No updates yet'}</StatusMetaFull>
          <StatusMetaShort>{updatedTime ?? 'No data'}</StatusMetaShort>
        </StatusMeta>
        <LogoutButton type="button" onClick={onLogout}>
          Logout
        </LogoutButton>
        <ThemeToggleButton
          type="button"
          aria-label={themeMode === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
          title={themeMode === 'dark' ? 'Light theme' : 'Dark theme'}
          onClick={onThemeToggle}
        >
          {themeMode === 'dark' ? '☀' : '☾'}
        </ThemeToggleButton>
        <RefreshButton type="button" onClick={onRefresh} disabled={loading}>
          Refresh
        </RefreshButton>
      </StatusStrip>
    </TopBar>
  );
}
