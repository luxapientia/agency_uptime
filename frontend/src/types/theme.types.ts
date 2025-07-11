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

export interface ThemeSettings {
  colors: ThemeColors;
  isDarkMode: boolean;
  borderRadius: number;
  fontFamily: {
    primary: string;
    secondary: string;
  };
  favicon: string;
  logo: string;
}

export interface ThemeState {
  settings: ThemeSettings;
  isLoading: boolean;
  error: string | null;
} 