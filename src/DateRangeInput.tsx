import {
  memo,
  useCallback,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import {
  Animated,
  Modal,
  StyleProp,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native";

import DateTimePicker, { useDefaultStyles } from "react-native-ui-datepicker";
import type { DateType } from "react-native-ui-datepicker";

import dayjs from "dayjs";

import { mergeTheme, type DateRangeInputTheme } from "./theme";

/** `'single'` shows one calendar and returns `value.date`; `'range'` returns `value.startDate`/`value.endDate`. */
export type DatePickerMode = "single" | "range";

export interface DatePickerValue {
  /** Selected date — read/written when `mode === 'single'` */
  date?: DateType;
  /** Range start — read/written when `mode === 'range'` */
  startDate?: DateType;
  /** Range end — read/written when `mode === 'range'` */
  endDate?: DateType;
}

/** Alias of {@link DatePickerValue}, kept for call sites that only ever use `mode="range"`. */
export type DateRangeValue = DatePickerValue;

export interface DatePickerInputLabels {
  /** Shown in the closed input when nothing is selected (default: "Select date" / "Select date range") */
  placeholder?: string;
  /** Label of the "clear selection" button (default: "Clear") */
  clear?: string;
  /** Label of the "apply selection" button (default: "Apply") */
  apply?: string;
}

export type DateRangeInputLabels = DatePickerInputLabels;

export interface DatePickerInputIcons {
  /** Leading icon in the closed input row (default: a plain calendar glyph) */
  calendar?: ReactNode;
  /** Trailing chevron in the closed input row (default: a plain chevron glyph) */
  chevronDown?: ReactNode;
}

export type DateRangeInputIcons = DatePickerInputIcons;

export interface DatePickerInputProps {
  /** `'single'` for one date, `'range'` for a start/end pair (default: `'range'`) */
  mode?: DatePickerMode;
  /** Overrides `labels.placeholder` for the closed input when nothing is selected */
  label?: string;
  /** `{ date }` in single mode, `{ startDate, endDate }` in range mode (dayjs-compatible values) */
  value?: DatePickerValue;
  /** Callback fired with the new value when "Apply" or "Clear" is pressed */
  onChange?: (value: DatePickerValue) => void;
  /** dayjs format for the display text (default: "DD MMM YYYY") */
  displayFormat?: string;
  /** Min selectable date */
  minDate?: DateType;
  /** Max selectable date */
  maxDate?: DateType;
  /** Disables the input */
  disabled?: boolean;
  /**
   * dayjs locale name used to format the display text (default: "en"). If you pass a
   * non-English locale, import its dayjs locale file yourself before using it, e.g.
   * `import 'dayjs/locale/fr'`.
   */
  locale?: string;
  /** Overrides the built-in English button/placeholder text */
  labels?: DatePickerInputLabels;
  /** Overrides the built-in plain-glyph icons with your own icon components */
  icons?: DatePickerInputIcons;
  /** Overrides the default color/font theme (deep-merged with the defaults) */
  theme?: Partial<DateRangeInputTheme>;
  /** Outer container style override */
  containerStyle?: StyleProp<ViewStyle>;
  /** Input row style override */
  inputStyle?: StyleProp<ViewStyle>;
}

/** Alias of {@link DatePickerInputProps}, kept for call sites that only ever use `mode="range"`. */
export type DateRangeInputProps = DatePickerInputProps;

/**
 * DatePickerInput / DateRangeInput
 *
 * A themeable date input that opens a modal calendar for selecting either a
 * single date (`mode="single"`) or a start/end range (`mode="range"`,
 * the default). Ships with plain-text defaults for labels and icons so it
 * has no dependency on any icon font or i18n library — pass
 * `labels`/`icons`/`theme` to match your app.
 *
 * @example
 * // Range (default)
 * <DateRangeInput value={range} onChange={setRange} />
 *
 * @example
 * // Single date
 * <DatePickerInput mode="single" value={date} onChange={setDate} />
 */
const DatePickerInput = ({
  mode = "range",
  label,
  value,
  onChange,
  displayFormat = "DD MMM YYYY",
  minDate,
  maxDate,
  disabled = false,
  locale = "en",
  labels,
  icons,
  theme,
  containerStyle,
  inputStyle,
}: DatePickerInputProps) => {
  const resolvedTheme = useMemo(() => mergeTheme(theme), [theme]);
  const { colors, fonts } = resolvedTheme;

  const placeholder =
    label ??
    labels?.placeholder ??
    (mode === "single" ? "Select date" : "Select date range");
  const clearLabel = labels?.clear ?? "Clear";
  const applyLabel = labels?.apply ?? "Apply";

  const defaultCalStyles = useDefaultStyles();

  const [visible, setVisible] = useState(false);

  // Local draft so we can "Apply" or "Cancel" without affecting parent state
  const [draft, setDraft] = useState<DatePickerValue>({
    date: undefined,
    startDate: undefined,
    endDate: undefined,
  });

  const scaleAnim = useRef(new Animated.Value(0.92)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  // --- Animations ----------------------------------------------------------

  const animateIn = useCallback(() => {
    Animated.parallel([
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 7,
        tension: 80,
        useNativeDriver: true,
      }),
    ]).start();
  }, [opacityAnim, scaleAnim]);

  const animateOut = useCallback(
    (cb?: () => void) => {
      Animated.parallel([
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.92,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start(cb);
    },
    [opacityAnim, scaleAnim],
  );

  // --- Open / Close --------------------------------------------------------

  const openModal = useCallback(() => {
    if (disabled) return;
    // Seed the draft from the current parent value
    setDraft(
      mode === "single"
        ? { date: value?.date ?? undefined }
        : {
            startDate: value?.startDate ?? undefined,
            endDate: value?.endDate ?? undefined,
          },
    );
    setVisible(true);
    animateIn();
  }, [disabled, value, mode, animateIn]);

  const closeModal = useCallback(() => {
    animateOut(() => setVisible(false));
  }, [animateOut]);

  // --- Actions -------------------------------------------------------------

  const handleApply = useCallback(() => {
    onChange?.(
      mode === "single"
        ? { date: draft.date }
        : { startDate: draft.startDate, endDate: draft.endDate },
    );
    animateOut(() => setVisible(false));
  }, [draft, onChange, animateOut, mode]);

  const handleClear = useCallback(() => {
    const cleared: DatePickerValue =
      mode === "single"
        ? { date: undefined }
        : { startDate: undefined, endDate: undefined };
    setDraft(cleared);
    onChange?.(cleared);
    animateOut(() => setVisible(false));
  }, [onChange, animateOut, mode]);

  // --- Calendar change handlers (kept separate so each matches the picker's exact signature) ---

  const handleSingleChange = useCallback(({ date }: { date: DateType }) => {
    setDraft((prev) => ({ ...prev, date }));
  }, []);

  const handleRangeChange = useCallback(
    ({ startDate, endDate }: { startDate: DateType; endDate: DateType }) => {
      setDraft((prev) => ({ ...prev, startDate, endDate }));
    },
    [],
  );

  // --- Display text --------------------------------------------------------

  const displayText = useMemo(() => {
    if (mode === "single") {
      const date = value?.date;
      return date ? dayjs(date).locale(locale).format(displayFormat) : "";
    }
    const start = value?.startDate;
    const end = value?.endDate;
    if (!start && !end) return "";
    const startText = start
      ? dayjs(start).locale(locale).format(displayFormat)
      : "…";
    const endText = end ? dayjs(end).locale(locale).format(displayFormat) : "…";
    return `${startText}  →  ${endText}`;
  }, [value, displayFormat, locale, mode]);

  // --- Calendar styles (merged with theme) ---------------------------------

  const calendarStyles = useMemo(
    () => ({
      ...defaultCalStyles,
      // Header
      header: {
        ...defaultCalStyles.header,
        paddingHorizontal: 4,
      },
      month_selector_label: {
        ...defaultCalStyles.month_selector_label,
        color: colors.primaryText,
        fontFamily: fonts.semibold,
        fontSize: 16,
      },
      year_selector_label: {
        ...defaultCalStyles.year_selector_label,
        color: colors.primaryText,
        fontFamily: fonts.semibold,
        fontSize: 16,
      },
      // Weekday header
      weekday_label: {
        ...defaultCalStyles.weekday_label,
        color: colors.mutedText,
        fontFamily: fonts.medium,
        fontSize: 13,
      },
      // Day label
      day_label: {
        ...defaultCalStyles.day_label,
        fontFamily: fonts.regular,
        fontSize: 15,
        color: colors.primaryText,
      },
      // Today ring
      today: {
        ...defaultCalStyles.today,
        borderColor: colors.accent,
        borderWidth: 1.5,
        borderRadius: 22,
      },
      today_label: {
        ...defaultCalStyles.today_label,
        color: colors.accent,
        fontFamily: fonts.semibold,
      },
      // Selected (single date, or single tap before a range completes)
      selected: {
        ...defaultCalStyles.selected,
        backgroundColor: colors.accent,
        borderRadius: 22,
      },
      selected_label: {
        ...defaultCalStyles.selected_label,
        color: colors.white,
        fontFamily: fonts.semibold,
      },
      // Range fill (the background band between start & end)
      range_fill: {
        ...defaultCalStyles.range_fill,
        backgroundColor: colors.accent + "22", // 13% opacity
      },
      // Range start
      range_start: {
        ...defaultCalStyles.range_start,
        backgroundColor: colors.accent,
        borderRadius: 22,
      },
      range_start_label: {
        ...defaultCalStyles.range_start_label,
        color: colors.white,
        fontFamily: fonts.semibold,
      },
      // Range end
      range_end: {
        ...defaultCalStyles.range_end,
        backgroundColor: colors.accent,
        borderRadius: 22,
      },
      range_end_label: {
        ...defaultCalStyles.range_end_label,
        color: colors.white,
        fontFamily: fonts.semibold,
      },
      // Range middle (between start & end)
      range_middle: {
        ...defaultCalStyles.range_middle,
        backgroundColor: "transparent",
      },
      range_middle_label: {
        ...defaultCalStyles.range_middle_label,
        color: colors.primaryText,
      },
      // Outside days
      outside_label: {
        ...defaultCalStyles.outside_label,
        color: colors.disabledText,
      },
      // Disabled
      disabled_label: {
        ...defaultCalStyles.disabled_label,
        color: colors.disabledText,
      },
    }),
    [defaultCalStyles, colors, fonts],
  );

  const iconColor = colors.mutedText;

  // --- Render --------------------------------------------------------------

  return (
    <>
      {/* -------- Touchable Input -------- */}
      <View style={[styles.container, containerStyle]}>
        <TouchableOpacity
          style={[
            styles.inputRow,
            {
              borderColor: colors.border,
              backgroundColor: colors.inputBackground,
            },
            disabled && {
              backgroundColor: colors.disabledBackground,
              opacity: 0.6,
            },
            inputStyle,
          ]}
          onPress={openModal}
          activeOpacity={0.7}
          disabled={disabled}
        >
          <View style={styles.inputIcon}>
            {icons?.calendar ?? (
              <Text style={{ color: iconColor, fontSize: 16 }}>📅</Text>
            )}
          </View>
          <Text
            style={[
              styles.inputText,
              {
                color: displayText ? colors.primaryText : colors.mutedText,
                fontFamily: fonts.regular,
              },
            ]}
            numberOfLines={1}
          >
            {displayText || placeholder}
          </Text>
          {icons?.chevronDown ?? (
            <Text style={{ color: colors.mutedText, fontSize: 14 }}>⌄</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* -------- Modal -------- */}
      <Modal transparent visible={visible} statusBarTranslucent>
        <TouchableOpacity
          style={[styles.overlay, { backgroundColor: colors.scrim }]}
          activeOpacity={1}
          onPress={closeModal}
        >
          <Animated.View
            onStartShouldSetResponder={() => true}
            style={[
              styles.modalCard,
              { backgroundColor: colors.surface },
              {
                opacity: opacityAnim,
                transform: [{ scale: scaleAnim }],
              },
            ]}
          >
            {/* Calendar */}
            {mode === "single" ? (
              <DateTimePicker
                mode="single"
                date={draft.date}
                onChange={handleSingleChange}
                minDate={minDate}
                maxDate={maxDate}
                showOutsideDays
                locale={locale}
                styles={calendarStyles}
              />
            ) : (
              <DateTimePicker
                mode="range"
                startDate={draft.startDate}
                endDate={draft.endDate}
                onChange={handleRangeChange}
                minDate={minDate}
                maxDate={maxDate}
                showOutsideDays
                locale={locale}
                styles={calendarStyles}
              />
            )}

            {/* Action buttons */}
            <View style={styles.actionsRow}>
              <TouchableOpacity
                style={[styles.btnOutline, { borderColor: colors.border }]}
                onPress={handleClear}
              >
                <Text
                  style={[
                    styles.btnText,
                    { color: colors.secondaryText, fontFamily: fonts.semibold },
                  ]}
                >
                  {clearLabel}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.btnPrimary, { backgroundColor: colors.primary }]}
                onPress={handleApply}
              >
                <Text
                  style={[
                    styles.btnText,
                    { color: colors.white, fontFamily: fonts.semibold },
                  ]}
                >
                  {applyLabel}
                </Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </TouchableOpacity>
      </Modal>
    </>
  );
};

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  /* ---------- Input ---------- */
  container: {
    width: "100%",
  },

  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    height: 48,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 14,
  },

  inputIcon: {
    marginRight: 10,
  },

  inputText: {
    flex: 1,
    fontSize: 14,
  },

  /* ---------- Modal ---------- */
  overlay: {
    flex: 1,
    justifyContent: "center",
    padding: 16,
  },

  modalCard: {
    borderRadius: 20,
    paddingTop: 20,
    paddingHorizontal: 16,
    paddingBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 12,
  },

  /* ---------- Buttons ---------- */
  actionsRow: {
    flexDirection: "row",
    gap: 10,
  },

  btnOutline: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  btnPrimary: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },

  btnText: {
    fontSize: 15,
  },
});

export default memo(DatePickerInput);
