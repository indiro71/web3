import 'styled-components';

export type AppThemeMode = 'light' | 'dark';

interface ThemeColors {
  activeBackground: string;
  activeBorder: string;
  activeText: string;
  amountActiveBackground: string;
  amountActiveBorder: string;
  amountActiveText: string;
  background: string;
  buttonDarkBackground: string;
  buttonDarkText: string;
  dangerBackground: string;
  dangerBorder: string;
  dangerText: string;
  dangerTextStrong: string;
  divider: string;
  elevatedShadow: string;
  focusShadow: string;
  headerBackground: string;
  headerText: string;
  hoverBackground: string;
  inputBackground: string;
  mutedText: string;
  negativeBackground: string;
  negativeBorder: string;
  negativeText: string;
  pageGradient: string;
  positiveBackground: string;
  positiveBackgroundHover: string;
  positiveBorder: string;
  positiveText: string;
  primaryText: string;
  secondaryText: string;
  stickyBorder: string;
  surface: string;
  surfaceAlt: string;
  surfaceSoft: string;
  surfaceTranslucent: string;
  tableBorder: string;
  tableEvenRow: string;
  tableRow: string;
}

export interface AppTheme {
  colors: ThemeColors;
  mode: AppThemeMode;
}

export const lightTheme: AppTheme = {
  mode: 'light',
  colors: {
    activeBackground: '#2563eb',
    activeBorder: '#2563eb',
    activeText: '#ffffff',
    amountActiveBackground: '#ecfdf5',
    amountActiveBorder: '#0f766e',
    amountActiveText: '#0f766e',
    background: '#eef2f5',
    buttonDarkBackground: '#1f2937',
    buttonDarkText: '#ffffff',
    dangerBackground: '#fff1f2',
    dangerBorder: '#fecaca',
    dangerText: '#991b1b',
    dangerTextStrong: '#b91c1c',
    divider: '#a0a9b4',
    elevatedShadow: '0 24px 70px rgba(15, 23, 42, 0.24)',
    focusShadow: '0 0 0 3px rgba(37, 99, 235, 0.12)',
    headerBackground: '#f8fafc',
    headerText: '#7b8794',
    hoverBackground: '#eef6ff',
    inputBackground: '#ffffff',
    mutedText: '#64748b',
    negativeBackground: '#fff1f2',
    negativeBorder: '#fecaca',
    negativeText: '#ef4444',
    pageGradient: 'linear-gradient(180deg, #f7f9fb 0%, #edf2f6 46%, #e8eef2 100%)',
    positiveBackground: '#ecfdf5',
    positiveBackgroundHover: '#d1fae5',
    positiveBorder: '#8ee6c4',
    positiveText: '#059669',
    primaryText: '#111827',
    secondaryText: '#475569',
    stickyBorder: '#e5ebf0',
    surface: '#ffffff',
    surfaceAlt: '#f7f9fb',
    surfaceSoft: '#f8fafc',
    surfaceTranslucent: 'rgba(255, 255, 255, 0.72)',
    tableBorder: '#d9e1e8',
    tableEvenRow: '#f7f9fb',
    tableRow: '#ffffff',
  },
};

export const darkTheme: AppTheme = {
  mode: 'dark',
  colors: {
    activeBackground: '#3b82f6',
    activeBorder: '#3b82f6',
    activeText: '#eff6ff',
    amountActiveBackground: '#0f2f2c',
    amountActiveBorder: '#2dd4bf',
    amountActiveText: '#7dd3fc',
    background: '#0f172a',
    buttonDarkBackground: '#e5edf7',
    buttonDarkText: '#0f172a',
    dangerBackground: '#3a1620',
    dangerBorder: '#7f1d1d',
    dangerText: '#fecdd3',
    dangerTextStrong: '#fda4af',
    divider: '#64748b',
    elevatedShadow: '0 24px 70px rgba(0, 0, 0, 0.48)',
    focusShadow: '0 0 0 3px rgba(96, 165, 250, 0.22)',
    headerBackground: '#121c2e',
    headerText: '#94a3b8',
    hoverBackground: '#172845',
    inputBackground: '#111827',
    mutedText: '#94a3b8',
    negativeBackground: '#331922',
    negativeBorder: '#7f1d1d',
    negativeText: '#fb7185',
    pageGradient: 'linear-gradient(180deg, #0b1220 0%, #101827 52%, #0f172a 100%)',
    positiveBackground: '#0e2d28',
    positiveBackgroundHover: '#12443b',
    positiveBorder: '#176b5d',
    positiveText: '#34d399',
    primaryText: '#e5edf7',
    secondaryText: '#cbd5e1',
    stickyBorder: '#233044',
    surface: '#111827',
    surfaceAlt: '#0f172a',
    surfaceSoft: '#152033',
    surfaceTranslucent: 'rgba(17, 24, 39, 0.78)',
    tableBorder: '#273449',
    tableEvenRow: '#131d30',
    tableRow: '#111827',
  },
};

export const themeStorageKey = 'pairsDashboardTheme';

export const getStoredThemeMode = (): AppThemeMode => {
  if (typeof window === 'undefined') {
    return 'light';
  }

  return localStorage.getItem(themeStorageKey) === 'dark' ? 'dark' : 'light';
};

export const storeThemeMode = (mode: AppThemeMode) => {
  localStorage.setItem(themeStorageKey, mode);
};

export const getThemeByMode = (mode: AppThemeMode) => {
  return mode === 'dark' ? darkTheme : lightTheme;
};

declare module 'styled-components' {
  export interface DefaultTheme extends AppTheme {}
}
