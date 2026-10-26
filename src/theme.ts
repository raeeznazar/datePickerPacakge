export interface DateRangeInputColors {
  /** Background of the "Apply" button */
  primary: string;
  /** Selected day / range highlight color */
  accent: string;
  /** Modal card background */
  surface: string;
  /** Closed input row background */
  inputBackground: string;
  /** Hairline borders (input row, "Clear" button) */
  border: string;
  primaryText: string;
  secondaryText: string;
  mutedText: string;
  disabledText: string;
  disabledBackground: string;
  /** Modal backdrop */
  scrim: string;
  white: string;
}

export interface DateRangeInputFonts {
  regular?: string;
  medium?: string;
  semibold?: string;
}

export interface DateRangeInputTheme {
  colors: DateRangeInputColors;
  fonts: DateRangeInputFonts;
}

export const defaultTheme: DateRangeInputTheme = {
  colors: {
    primary: "#1F2937",
    accent: "#2563EB",
    surface: "#FFFFFF",
    inputBackground: "#FFFFFF",
    border: "#E5E7EB",
    primaryText: "#111827",
    secondaryText: "#4B5563",
    mutedText: "#9CA3AF",
    disabledText: "#D1D5DB",
    disabledBackground: "#F3F4F6",
    scrim: "rgba(0, 0, 0, 0.4)",
    white: "#FFFFFF",
  },
  fonts: {},
};

export function mergeTheme(
  theme?: Partial<DateRangeInputTheme>,
): DateRangeInputTheme {
  return {
    colors: { ...defaultTheme.colors, ...theme?.colors },
    fonts: { ...defaultTheme.fonts, ...theme?.fonts },
  };
}
