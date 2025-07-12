export interface ThemeColors {
  primary: string;
  secondary: string;
  error: string;
  warning: string;
  info: string;
  success: string;
  text: {
    primary: string;
    secondary: string;
  };
}

export interface AgencySettings {
  colors: ThemeColors;
  isDarkMode: boolean;
  borderRadius: number;
  fontFamily: {
    primary: string;
    secondary: string;
  };
  favicon: string;
  logo: string;
  customDomain: string | null;
  hasUnsavedChanges: boolean;
}

export interface SettingState {
  settings: AgencySettings;
  isLoading: boolean;
  error: string | null;
} 