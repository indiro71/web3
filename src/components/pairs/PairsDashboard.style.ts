import styled, { createGlobalStyle } from 'styled-components';

export const GlobalStyle = createGlobalStyle`
  body {
    background: ${({ theme }) => theme.colors.background};
    color: ${({ theme }) => theme.colors.primaryText};
    color-scheme: ${({ theme }) => theme.mode};
  }
`;

export const Page = styled.main`
  min-height: 100vh;
  padding: 10px 14px 18px;
  background: ${({ theme }) => theme.colors.pageGradient};

  @media (max-width: 860px) {
    padding: 10px;
  }

  @media (max-width: 560px) {
    padding: 6px;
  }
`;

export const TopBar = styled.section`
  display: grid;
  grid-template-columns: minmax(220px, 360px) auto minmax(68px, max-content) minmax(360px, 1fr);
  align-items: center;
  gap: 8px;
  margin: 0 auto 8px;
  width: min(100%, 1720px);

  @media (max-width: 860px) {
    grid-template-columns: minmax(0, 1fr) max-content;
    gap: 6px;
  }
`;

export const SearchInput = styled.input`
  width: 100%;
  height: 34px;
  border: 1px solid ${({ theme }) => theme.colors.tableBorder};
  border-radius: 7px;
  background: ${({ theme }) => theme.colors.inputBackground};
  color: ${({ theme }) => theme.colors.primaryText};
  padding: 0 10px;
  outline: none;
  font-size: 0.9rem;

  &:focus {
    border-color: ${({ theme }) => theme.colors.activeBorder};
    box-shadow: ${({ theme }) => theme.colors.focusShadow};
  }

  &::placeholder {
    color: ${({ theme }) => theme.colors.mutedText};
  }

  @media (max-width: 860px) {
    height: 32px;
    padding: 0 9px;
    font-size: 0.82rem;
  }
`;

export const FilterGroup = styled.div`
  display: inline-flex;
  width: max-content;
  border: 1px solid ${({ theme }) => theme.colors.tableBorder};
  border-radius: 8px;
  background: ${({ theme }) => theme.colors.surface};
  overflow: hidden;

  @media (max-width: 860px) {
    width: auto;
    justify-self: end;
    border-radius: 7px;
  }
`;

export const FilterButton = styled.button<{ $active: boolean }>`
  min-width: 64px;
  height: 32px;
  border: 0;
  border-right: 1px solid ${({ theme }) => theme.colors.tableBorder};
  background: ${({ $active, theme }) =>
    $active ? theme.colors.activeBackground : theme.colors.surface};
  color: ${({ $active, theme }) =>
    $active ? theme.colors.activeText : theme.colors.secondaryText};
  font-weight: 800;
  cursor: pointer;

  &:last-child {
    border-right: 0;
  }

  @media (max-width: 860px) {
    min-width: 34px;
    height: 32px;
    padding: 0 9px;
    font-size: 0.78rem;
  }

  @media (max-width: 560px) {
    min-width: 31px;
    padding: 0 7px;
    font-size: 0.72rem;
  }
`;

export const FilterLabelFull = styled.span`
  @media (max-width: 860px) {
    display: none;
  }
`;

export const FilterLabelShort = styled.span`
  display: none;

  @media (max-width: 860px) {
    display: inline;
  }
`;

export const Counter = styled.div`
  justify-self: end;
  min-width: 68px;
  height: 32px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid ${({ theme }) => theme.colors.tableBorder};
  border-radius: 7px;
  background: ${({ theme }) => theme.colors.surface};
  color: ${({ theme }) => theme.colors.secondaryText};
  font-size: 0.9rem;
  font-weight: 800;

  @media (max-width: 860px) {
    display: none;
  }
`;

export const StatusStrip = styled.div`
  display: flex;
  align-items: center;
  justify-content: end;
  gap: 8px;
  min-width: 0;

  @media (max-width: 860px) {
    width: 100%;
    grid-column: 1 / -1;
    justify-content: start;
    flex-wrap: nowrap;
    gap: 5px;
  }
`;

export const StatusBadge = styled.div<{ $status: string }>`
  display: inline-flex;
  align-items: center;
  gap: 7px;
  height: 32px;
  padding: 0 11px;
  border: 1px solid ${({ theme }) => theme.colors.tableBorder};
  border-radius: 999px;
  background: ${({ theme }) => theme.colors.surface};
  color: ${({ theme }) => theme.colors.secondaryText};
  font-size: 0.78rem;
  font-weight: 800;
  text-transform: capitalize;

  @media (max-width: 860px) {
    width: 28px;
    height: 28px;
    flex: 0 0 28px;
    justify-content: center;
    gap: 0;
    padding: 0;
  }
`;

export const StatusDot = styled.span<{ $status: string }>`
  width: 8px;
  height: 8px;
  flex: 0 0 8px;
  border-radius: 50%;
  background: ${({ $status }) =>
    $status === 'connected' ? '#10b981' : $status === 'connecting' ? '#f59e0b' : '#ef4444'};

  @media (max-width: 860px) {
    width: 9px;
    height: 9px;
    flex-basis: 9px;
  }
`;

export const StatusLabel = styled.span`
  @media (max-width: 860px) {
    display: none;
  }
`;

export const StatusMeta = styled.div`
  height: 32px;
  display: inline-flex;
  align-items: center;
  padding: 0 11px;
  border: 1px solid ${({ theme }) => theme.colors.tableBorder};
  border-radius: 999px;
  background: ${({ theme }) => theme.colors.surfaceTranslucent};
  color: ${({ theme }) => theme.colors.mutedText};
  font-size: 0.78rem;
  font-weight: 700;

  @media (max-width: 860px) {
    flex: 1 1 auto;
    min-width: 74px;
    height: 28px;
    justify-content: center;
    padding: 0 7px;
    font-size: 0.72rem;
  }
`;

export const StatusMetaFull = styled.span`
  @media (max-width: 860px) {
    display: none;
  }
`;

export const StatusMetaShort = styled.span`
  display: none;

  @media (max-width: 860px) {
    display: inline;
  }
`;

export const RefreshButton = styled.button`
  height: 32px;
  padding: 0 13px;
  border: 0;
  border-radius: 7px;
  background: ${({ theme }) => theme.colors.buttonDarkBackground};
  color: ${({ theme }) => theme.colors.buttonDarkText};
  font-size: 0.86rem;
  font-weight: 800;
  cursor: pointer;

  &:disabled {
    cursor: wait;
    opacity: 0.58;
  }

  @media (max-width: 860px) {
    height: 28px;
    padding: 0 9px;
    font-size: 0.72rem;
  }
`;

export const ThemeToggleButton = styled.button`
  width: 32px;
  height: 32px;
  flex: 0 0 32px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid ${({ theme }) => theme.colors.tableBorder};
  border-radius: 7px;
  background: ${({ theme }) => theme.colors.surface};
  color: ${({ theme }) => theme.colors.secondaryText};
  font-size: 0.92rem;
  font-weight: 800;
  cursor: pointer;

  &:hover {
    background: ${({ theme }) => theme.colors.hoverBackground};
    color: ${({ theme }) => theme.colors.primaryText};
  }

  @media (max-width: 860px) {
    width: 28px;
    height: 28px;
    flex-basis: 28px;
    font-size: 0.82rem;
  }
`;

export const LogoutButton = styled.button`
  height: 32px;
  padding: 0 13px;
  border: 1px solid ${({ theme }) => theme.colors.tableBorder};
  border-radius: 7px;
  background: ${({ theme }) => theme.colors.surface};
  color: ${({ theme }) => theme.colors.secondaryText};
  font-size: 0.86rem;
  font-weight: 800;
  cursor: pointer;

  &:hover {
    color: ${({ theme }) => theme.colors.dangerText};
    border-color: ${({ theme }) => theme.colors.dangerBorder};
    background: ${({ theme }) => theme.colors.dangerBackground};
  }

  @media (max-width: 860px) {
    height: 28px;
    padding: 0 9px;
    font-size: 0.72rem;
  }
`;

export const Notice = styled.div`
  width: min(100%, 1720px);
  margin: 0 auto 14px;
  display: flex;
  gap: 12px;
  align-items: center;
  border: 1px solid ${({ theme }) => theme.colors.dangerBorder};
  border-radius: 7px;
  background: ${({ theme }) => theme.colors.dangerBackground};
  color: ${({ theme }) => theme.colors.dangerText};
  padding: 12px 14px;

  span {
    color: ${({ theme }) => theme.colors.dangerTextStrong};
  }
`;

export const TableSurface = styled.section`
  width: min(100%, 1720px);
  margin: 0 auto;
  border: 1px solid ${({ theme }) => theme.colors.tableBorder};
  border-radius: 8px;
  background: ${({ theme }) => theme.colors.surface};
  box-shadow: ${({ theme }) => theme.colors.elevatedShadow};
  overflow: hidden;
`;

export const TableScroll = styled.div`
  overflow: auto;
  scrollbar-width: thin;
  -webkit-overflow-scrolling: touch;
`;

export const PairsTableElement = styled.table`
  width: 100%;
  min-width: 1040px;
  border-collapse: separate;
  border-spacing: 0;
  font-variant-numeric: tabular-nums;

  th,
  td {
    border-bottom: 1px solid ${({ theme }) => theme.colors.stickyBorder};
    padding: 8px 12px;
    text-align: left;
    white-space: nowrap;
  }

  th {
    position: sticky;
    top: 0;
    z-index: 1;
    background: ${({ theme }) => theme.colors.headerBackground};
    color: ${({ theme }) => theme.colors.headerText};
    font-size: 0.76rem;
    font-weight: 600;
    text-transform: uppercase;
  }

  th:first-child {
    left: 0;
    z-index: 3;
  }

  td:first-child {
    position: sticky;
    left: 0;
    z-index: 2;
    background: inherit;
    box-shadow: 1px 0 0 ${({ theme }) => theme.colors.stickyBorder};
  }

  tbody tr {
    background: ${({ theme }) => theme.colors.tableRow};
  }

  tbody tr:nth-child(even) {
    background: ${({ theme }) => theme.colors.tableEvenRow};
  }

  tbody tr:hover {
    background: ${({ theme }) => theme.colors.hoverBackground};
  }

  tbody tr:last-child td {
    border-bottom: 0;
  }

  @media (max-width: 860px) {
    min-width: 720px;
    font-size: 0.78rem;

    th,
    td {
      padding: 6px 6px;
    }

    th {
      font-size: 0.66rem;
    }
  }

  @media (max-width: 560px) {
    min-width: 650px;
    font-size: 0.7rem;

    th,
    td {
      padding: 4px 4px;
    }

    th {
      font-size: 0.6rem;
    }
  }
`;

export const NameCell = styled.td`
  min-width: 220px;
  background: inherit;

  @media (max-width: 860px) {
    min-width: 88px;
    width: 88px;
  }

  @media (max-width: 560px) {
    min-width: 78px;
    width: 78px;
  }
`;

export const NameContent = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 8px;

  @media (max-width: 860px) {
    gap: 4px;
  }

  @media (max-width: 560px) {
    gap: 3px;
  }
`;

export const CryptoLogo = styled.img`
  width: 26px;
  height: 26px;
  flex: 0 0 26px;
  border-radius: 50%;
  background: ${({ theme }) => theme.colors.surfaceSoft};
  object-fit: contain;

  @media (max-width: 860px) {
    display: none;
  }
`;

export const CryptoFallback = styled.span`
  width: 26px;
  height: 26px;
  flex: 0 0 26px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid ${({ theme }) => theme.colors.tableBorder};
  border-radius: 50%;
  background: ${({ theme }) => theme.colors.surfaceSoft};
  color: ${({ theme }) => theme.colors.secondaryText};
  font-size: 0.62rem;
  font-weight: 900;

  @media (max-width: 860px) {
    display: none;
  }
`;

export const ExchangeMark = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  flex: 0 0 24px;
  border-radius: 50%;
  background: ${({ theme }) => theme.colors.surfaceSoft};
  color: ${({ theme }) => theme.colors.activeBackground};
  font-size: 0.74rem;
  font-weight: 900;

  @media (max-width: 860px) {
    width: 16px;
    height: 16px;
    flex-basis: 16px;
    font-size: 0.58rem;
  }
`;

export const PairLink = styled.a`
  color: ${({ theme }) => theme.colors.activeBackground};
  font-weight: 500;
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }

  @media (max-width: 860px) {
    display: inline-block;
    max-width: 62px;
    overflow: hidden;
    text-overflow: ellipsis;
    vertical-align: bottom;
  }

  @media (max-width: 560px) {
    max-width: 55px;
  }
`;

export const PairValues = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-weight: 500;

  @media (max-width: 860px) {
    gap: 4px;
  }

  @media (max-width: 560px) {
    gap: 3px;
  }
`;

export const Divider = styled.span`
  color: ${({ theme }) => theme.colors.divider};
`;

export const MetricValue = styled.span<{ $tone: string }>`
  color: ${({ $tone, theme }) => {
    if ($tone === 'positive') return theme.colors.positiveText;
    if ($tone === 'negative') return theme.colors.negativeText;
    return theme.colors.mutedText;
  }};
`;

export const NextSignalButton = styled.button<{ $tone: string }>`
  min-width: 76px;
  height: 26px;
  border: 1px solid ${({ $tone, theme }) =>
    $tone === 'positive' ? theme.colors.positiveBorder : theme.colors.negativeBorder};
  border-radius: 7px;
  background: ${({ $tone, theme }) =>
    $tone === 'positive' ? theme.colors.positiveBackground : theme.colors.negativeBackground};
  color: ${({ $tone, theme }) =>
    $tone === 'positive' ? theme.colors.positiveText : theme.colors.negativeText};
  font: inherit;
  font-weight: 500;
  cursor: ${({ $tone }) => ($tone === 'positive' ? 'pointer' : 'default')};

  &:hover {
    ${({ $tone, theme }) =>
      $tone === 'positive'
        ? `
          border-color: ${theme.colors.positiveText};
          background: ${theme.colors.positiveBackgroundHover};
        `
        : ''}
  }

  @media (max-width: 860px) {
    min-width: 58px;
    height: 22px;
    padding: 0 4px;
    border-radius: 6px;
  }

  @media (max-width: 560px) {
    min-width: 52px;
    height: 20px;
    padding: 0 3px;
  }
`;

export const StrongValue = styled.span`
  color: ${({ theme }) => theme.colors.primaryText};
  font-weight: 500;
`;

export const MarginValue = styled.span`
  color: ${({ theme }) => theme.colors.primaryText};
  font-weight: 500;
`;

export const ExtraMargin = styled.span`
  margin-left: 3px;
  color: ${({ theme }) => theme.colors.mutedText};
  font-size: 0.78rem;

  @media (max-width: 860px) {
    margin-left: 1px;
    font-size: 0.68rem;
  }
`;

export const HeaderFull = styled.span`
  @media (max-width: 860px) {
    display: none;
  }
`;

export const HeaderShort = styled.span`
  display: none;

  @media (max-width: 860px) {
    display: inline;
  }
`;

export const EmptyState = styled.div`
  padding: 44px 20px;
  color: ${({ theme }) => theme.colors.mutedText};
  text-align: center;
  font-weight: 800;
`;

export const ModalBackdrop = styled.div`
  position: fixed;
  inset: 0;
  z-index: 20;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 18px;
  background: rgba(2, 6, 23, 0.62);
`;

export const ModalDialog = styled.form`
  width: min(100%, 440px);
  border: 1px solid ${({ theme }) => theme.colors.tableBorder};
  border-radius: 8px;
  background: ${({ theme }) => theme.colors.surface};
  box-shadow: ${({ theme }) => theme.colors.elevatedShadow};
  padding: 20px;
`;

export const ModalTitle = styled.h2`
  margin: 0 0 12px;
  color: ${({ theme }) => theme.colors.primaryText};
  font-size: 1.08rem;
  line-height: 1.25;
`;

export const ModalText = styled.p`
  margin: 0 0 16px;
  color: ${({ theme }) => theme.colors.secondaryText};
  font-size: 0.94rem;
  line-height: 1.5;
`;

export const AmountField = styled.div`
  display: grid;
  gap: 7px;
  margin-bottom: 18px;
  color: ${({ theme }) => theme.colors.secondaryText};
  font-size: 0.82rem;
  font-weight: 800;
`;

export const AmountOptions = styled.div<{ $dense?: boolean }>`
  display: grid;
  grid-template-columns: ${({ $dense }) =>
    $dense ? 'repeat(4, minmax(0, 1fr))' : 'repeat(2, minmax(0, 1fr))'};
  gap: 8px;

  @media (max-width: 560px) {
    grid-template-columns: ${({ $dense }) =>
      $dense ? 'repeat(3, minmax(0, 1fr))' : 'repeat(2, minmax(0, 1fr))'};
  }
`;

export const AmountOptionButton = styled.button<{ $active: boolean; $dense?: boolean }>`
  height: ${({ $dense }) => ($dense ? '38px' : '44px')};
  border: 1px solid ${({ theme }) => theme.colors.tableBorder};
  border-color: ${({ $active, theme }) =>
    $active ? theme.colors.amountActiveBorder : theme.colors.tableBorder};
  border-radius: 8px;
  background: ${({ $active, theme }) =>
    $active ? theme.colors.amountActiveBackground : theme.colors.surface};
  color: ${({ $active, theme }) =>
    $active ? theme.colors.amountActiveText : theme.colors.primaryText};
  font-size: ${({ $dense }) => ($dense ? '0.88rem' : '0.94rem')};
  font-weight: 700;
  cursor: pointer;

  &:hover {
    border-color: ${({ $active, theme }) =>
      $active ? theme.colors.amountActiveBorder : theme.colors.mutedText};
  }

  &:focus-visible {
    outline: none;
    border-color: ${({ theme }) => theme.colors.activeBorder};
    box-shadow: ${({ theme }) => theme.colors.focusShadow};
  }

  &:disabled {
    cursor: wait;
    opacity: 0.62;
  }
`;

export const ModalActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 8px;
`;

export const SecondaryButton = styled.button`
  height: 36px;
  border: 1px solid ${({ theme }) => theme.colors.tableBorder};
  border-radius: 7px;
  background: ${({ theme }) => theme.colors.surface};
  color: ${({ theme }) => theme.colors.secondaryText};
  padding: 0 14px;
  font-weight: 800;
  cursor: pointer;

  &:disabled {
    cursor: wait;
    opacity: 0.6;
  }
`;

export const PrimaryButton = styled.button`
  height: 36px;
  border: 0;
  border-radius: 7px;
  background: ${({ theme }) => theme.colors.amountActiveBorder};
  color: ${({ theme }) => theme.colors.activeText};
  padding: 0 14px;
  font-weight: 900;
  cursor: pointer;

  &:disabled {
    cursor: wait;
    opacity: 0.6;
  }
`;

export const Toast = styled.div<{ $tone: 'success' | 'error' }>`
  position: fixed;
  right: 18px;
  bottom: 18px;
  z-index: 30;
  max-width: min(420px, calc(100vw - 36px));
  border: 1px solid ${({ $tone, theme }) =>
    $tone === 'success' ? theme.colors.positiveBorder : theme.colors.dangerBorder};
  border-radius: 8px;
  background: ${({ $tone, theme }) =>
    $tone === 'success' ? theme.colors.positiveBackground : theme.colors.dangerBackground};
  color: ${({ $tone, theme }) =>
    $tone === 'success' ? theme.colors.amountActiveText : theme.colors.dangerText};
  padding: 12px 14px;
  box-shadow: ${({ theme }) => theme.colors.elevatedShadow};
  font-size: 0.9rem;
  font-weight: 800;
`;
