# react-native-date-range-input

A themeable React Native date input. Renders a closed, single-line input that, on press, opens an
animated modal calendar (powered by
[`react-native-ui-datepicker`](https://github.com/farhoudshapouran/react-native-ui-datepicker)) for
picking either a single date or a start/end range, with explicit "Clear" / "Apply" actions.

Changes are staged locally inside the modal and only committed to your state via `onChange` when the
user presses **Apply** (or **Clear**) — closing the modal by tapping outside discards the in-progress
selection, so a parent component never sees a half-picked range.

- **Both single-date and range picking** from the same component (`mode="single"` / `mode="range"`).
- **No forced dependency on an icon font or i18n library** — default labels are plain English strings
  and default icons are plain Unicode glyphs rendered in `<Text>`, both fully overridable via props.
- **Fully themeable** — colors and font families are a deep-mergeable `theme` prop, not hard-coded.
- Built on `dayjs`, so `value` accepts anything `dayjs()` accepts (ISO strings, `Date`, `dayjs` instances,
  epoch numbers, `null`/`undefined`).
- Ships as TypeScript source compiled to CommonJS + `.d.ts` — fully typed, no `@types/*` package needed.

## Table of contents

- [Install](#install)
- [Quick start](#quick-start)
  - [Date range (default)](#date-range-default)
  - [Single date](#single-date)
- [How it works](#how-it-works)
- [Props](#props)
- [Types](#types)
  - [`DatePickerMode`](#datepickermode)
  - [`DatePickerValue`](#datepickervalue)
  - [`DatePickerInputLabels`](#datepickerinputlabels)
  - [`DatePickerInputIcons`](#datepickerinputicons)
- [Theming](#theming)
  - [`DateRangeInputTheme` reference](#daterangeinputtheme-reference)
  - [Per-call-site overrides](#per-call-site-overrides)
  - [App-wide default theme](#app-wide-default-theme)
- [Labels and i18n](#labels-and-i18n)
- [Locale-aware formatting](#locale-aware-formatting)
- [Custom icons](#custom-icons)
- [Min/max date constraints](#minmax-date-constraints)
- [Disabled state](#disabled-state)
- [Styling the container/input row](#styling-the-containerinput-row)
- [Both exported names — which to use](#both-exported-names--which-to-use)
- [Development](#development)
- [Troubleshooting](#troubleshooting)

## Install

This package isn't published to the npm registry — install it straight from GitHub:

```bash
npm install github:raeeznazar/datePickerPacakge react-native-ui-datepicker dayjs
```

Equivalent, if you prefer an explicit git URL (e.g. to pin a branch, tag, or commit with `#ref`):

```bash
npm install git+https://github.com/raeeznazar/datePickerPacakge.git react-native-ui-datepicker dayjs
```

Yarn / pnpm work the same way:

```bash
yarn add react-native-date-range-input@github:raeeznazar/datePickerPacakge react-native-ui-datepicker dayjs
pnpm add github:raeeznazar/datePickerPacakge react-native-ui-datepicker dayjs
```

The package builds itself on install via its `prepare` script (`tsc -p tsconfig.json -> dist/`), so no
manual build step is needed.

| Peer dependency              | Version    |
| ---------------------------- | ---------- |
| `react`                      | `>=18.0.0` |
| `react-native`               | `>=0.73.0` |
| `react-native-ui-datepicker` | `>=2.0.0`  |
| `dayjs`                      | `>=1.11.0` |

No native linking step is required — everything here is pure JS/TS views (`View`, `Text`, `Modal`,
`TouchableOpacity`, `Animated`), so it works the same under Expo Go, `expo run:ios`/`expo run:android`,
and bare React Native.

## Quick start

### Date range (default)

```tsx
import { useState } from "react";
import {
  DateRangeInput,
  type DateRangeValue,
} from "react-native-date-range-input";

function ExpenseFilters() {
  const [range, setRange] = useState<DateRangeValue>({});

  return <DateRangeInput value={range} onChange={setRange} />;
}
```

- Before anything is picked, the closed input shows the placeholder text ("Select date range" by
  default).
- Opening the modal seeds the calendar from the current `value`, so reopening it resumes the existing
  selection instead of starting over.
- Once both a start and end date are picked and the user presses **Apply**, `onChange` fires with
  `{ startDate, endDate }` and the input shows `"<start>  →  <end>"` formatted with `displayFormat`.
- **Clear** resets the value to `{ startDate: undefined, endDate: undefined }` and closes the modal.

### Single date

```tsx
import { useState } from "react";
import {
  DatePickerInput,
  type DatePickerValue,
} from "react-native-date-range-input";

function BirthDateField() {
  const [value, setValue] = useState<DatePickerValue>({});

  return <DatePickerInput mode="single" value={value} onChange={setValue} />;
}
```

In `mode="single"`, the component renders one calendar instead of a range calendar, reads/writes
`value.date` instead of `value.startDate`/`value.endDate`, and the default placeholder changes to
"Select date". Everything else (theming, labels, icons, min/max, locale) works identically in both
modes.

## How it works

1. The closed state is a single `TouchableOpacity` row showing a calendar icon, the formatted value (or
   a placeholder), and a chevron.
2. Pressing it opens a `Modal` with a spring/fade-in animated card containing the calendar
   (`react-native-ui-datepicker`'s `<DateTimePicker mode="single" | "range" />`) plus a "Clear" /
   "Apply" button row.
3. Picking dates in the calendar only updates an internal draft — your `value`/`onChange` are untouched
   until the user presses a button.
4. **Apply** calls `onChange` with the draft and closes the modal. **Clear** calls `onChange` with an
   empty value and closes the modal. Tapping the dimmed backdrop closes the modal **without** calling
   `onChange`, discarding the draft.

## Props

| Prop             | Type                               | Default                                                                                 | Description                                                                                                |
| ---------------- | ---------------------------------- | --------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `mode`           | `'single' \| 'range'`              | `'range'`                                                                               | Whether the modal shows one calendar for a single date or a range calendar for a start/end pair.           |
| `value`          | `DatePickerValue`                  | `undefined`                                                                             | `{ date }` when `mode="single"`, `{ startDate, endDate }` when `mode="range"`. Dayjs-compatible.           |
| `onChange`       | `(value: DatePickerValue) => void` | `undefined`                                                                             | Fired with the new value when **Apply** or **Clear** is pressed. Not fired on backdrop dismiss.            |
| `label`          | `string`                           | —                                                                                       | Shorthand for `labels.placeholder`. If both are set, `label` wins.                                         |
| `labels`         | `DatePickerInputLabels`            | `{ placeholder: 'Select date' \| 'Select date range', clear: 'Clear', apply: 'Apply' }` | English defaults for the placeholder and the two button labels — override for i18n.                        |
| `icons`          | `DatePickerInputIcons`             | plain-glyph defaults (📅 / ⌄)                                                           | Replace the built-in leading calendar glyph and trailing chevron with your own `ReactNode`s.               |
| `theme`          | `Partial<DateRangeInputTheme>`     | `defaultTheme`                                                                          | Deep-merged (per top-level key: `colors`, `fonts`) with the package's default theme.                       |
| `displayFormat`  | `string`                           | `'DD MMM YYYY'`                                                                         | A [dayjs format string](https://day.js.org/docs/en/display/format) for the text shown in the closed input. |
| `locale`         | `string`                           | `'en'`                                                                                  | dayjs locale name used both for formatting the display text and passed through to the calendar.            |
| `minDate`        | `DateType`                         | —                                                                                       | Earliest selectable date, passed straight through to `react-native-ui-datepicker`.                         |
| `maxDate`        | `DateType`                         | —                                                                                       | Latest selectable date, passed straight through to `react-native-ui-datepicker`.                           |
| `disabled`       | `boolean`                          | `false`                                                                                 | Prevents the input from opening the modal and applies the `disabledBackground` theme color.                |
| `containerStyle` | `StyleProp<ViewStyle>`             | —                                                                                       | Style override merged onto the outermost `View` (width `100%` by default).                                 |
| `inputStyle`     | `StyleProp<ViewStyle>`             | —                                                                                       | Style override merged onto the closed input row (the `TouchableOpacity`).                                  |

`DateType` (re-exported by `react-native-ui-datepicker`) is
`string | number | Dayjs | Date | null | undefined` — i.e. anything `dayjs()` can parse.

## Types

All of these are exported from the package root.

### `DatePickerMode`

```ts
type DatePickerMode = "single" | "range";
```

### `DatePickerValue`

```ts
interface DatePickerValue {
  /** Selected date — read/written when mode === 'single' */
  date?: DateType;
  /** Range start — read/written when mode === 'range' */
  startDate?: DateType;
  /** Range end — read/written when mode === 'range' */
  endDate?: DateType;
}
```

The same shape is used for both modes (unused fields are simply left `undefined`) so you can keep one
value type in your form state even if you later switch a field between single/range mode.

`DateRangeValue` is exported as an alias of `DatePickerValue`, kept for call sites that only ever use
`mode="range"` and prefer that name.

### `DatePickerInputLabels`

```ts
interface DatePickerInputLabels {
  placeholder?: string;
  clear?: string;
  apply?: string;
}
```

### `DatePickerInputIcons`

```ts
interface DatePickerInputIcons {
  calendar?: ReactNode;
  chevronDown?: ReactNode;
}
```

`DateRangeInputLabels` / `DateRangeInputIcons` / `DateRangeInputProps` are exported as aliases of the
`DatePickerInput*` names above, again purely for naming preference at the call site — they're the exact
same types.

## Theming

### `DateRangeInputTheme` reference

```ts
interface DateRangeInputTheme {
  colors: {
    primary: string; // "Apply" button background
    accent: string; // selected day / range highlight
    surface: string; // modal card background
    inputBackground: string; // closed input row background
    border: string; // hairline borders (input row, "Clear" button)
    primaryText: string;
    secondaryText: string; // "Clear" button label
    mutedText: string; // placeholder text, icons, weekday/outside-day labels
    disabledText: string; // outside-month / disabled day labels
    disabledBackground: string; // closed input row background when disabled
    scrim: string; // modal backdrop
    white: string; // text on top of `accent`/`primary` (e.g. selected day label)
  };
  fonts: {
    regular?: string;
    medium?: string;
    semibold?: string;
  };
}
```

Default values (see `src/theme.ts`):

```ts
{
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
  fonts: {}, // undefined -> system default font
}
```

`fonts` entries left `undefined` fall back to the platform's default font — pass only the ones your app
actually has loaded.

### Per-call-site overrides

The `theme` prop is merged one level deep per top-level key (`colors`, `fonts`), so you only need to
specify the values you want to change:

```tsx
<DateRangeInput
  value={range}
  onChange={setRange}
  theme={{
    colors: { primary: "#0F1B2D", accent: "#1F5FD1" },
    fonts: {
      regular: "Inter-Regular",
      medium: "Inter-Medium",
      semibold: "Inter-SemiBold",
    },
  }}
/>
```

### App-wide default theme

If every usage in your app should share one theme, wrap the component once instead of repeating the
`theme` prop everywhere:

```tsx
// components/AppDateRangeInput.tsx
import {
  DateRangeInput,
  type DateRangeInputProps,
} from "react-native-date-range-input";

const appTheme = {
  colors: { primary: "#0F1B2D", accent: "#1F5FD1" },
  fonts: { regular: "Inter-Regular", semibold: "Inter-SemiBold" },
};

export function AppDateRangeInput(props: DateRangeInputProps) {
  return <DateRangeInput theme={appTheme} {...props} />;
}
```

## Labels and i18n

The package has no i18n dependency of its own — pass translated strings through `labels`:

```tsx
<DateRangeInput
  value={range}
  onChange={setRange}
  labels={{
    placeholder: "Choisir une période",
    clear: "Effacer",
    apply: "Appliquer",
  }}
  locale="fr"
/>
```

If you're wiring this up against an existing i18n setup (e.g. `i18next`, `react-intl`, a custom `t()`),
just pass the translated strings through at the call site, or build a small wrapper like the
`AppDateRangeInput` example above that reads from your i18n hook and forwards `labels`/`locale`.

## Locale-aware formatting

`locale` is a plain dayjs locale name (default `'en'`), used both to format the closed-input display
text and passed straight through as the calendar's `locale` prop. dayjs does **not** bundle non-English
locales by default — import the ones you need once, anywhere early in your app's startup (this package
does not do it for you, to avoid bloating your bundle with locales you don't use):

```ts
import "dayjs/locale/fr";
import "dayjs/locale/es";
```

## Custom icons

By default the leading/trailing icons are plain `<Text>` glyphs (📅 and ⌄) so the package has zero
dependency on an icon font. Swap in your own icon library via the `icons` prop:

```tsx
import { Ionicons } from "@expo/vector-icons";

<DateRangeInput
  value={range}
  onChange={setRange}
  icons={{
    calendar: <Ionicons name="calendar-outline" size={20} color="#9CA3AF" />,
    chevronDown: <Ionicons name="chevron-down" size={16} color="#9CA3AF" />,
  }}
/>;
```

Each icon is rendered as-is (no implicit sizing/coloring wrapper), so size and color are entirely up to
what you pass in.

## Min/max date constraints

```tsx
import dayjs from "dayjs";

<DateRangeInput
  value={range}
  onChange={setRange}
  minDate={dayjs().subtract(1, "year")}
  maxDate={dayjs()} // no future dates
/>;
```

`minDate`/`maxDate` are forwarded as-is to `react-native-ui-datepicker` and accept the same `DateType`
values as `value`.

## Disabled state

```tsx
<DateRangeInput value={range} onChange={setRange} disabled={!canFilterByDate} />
```

When `disabled` is `true`, the input row switches to `theme.colors.disabledBackground`, dims to 60%
opacity, and no longer opens the modal on press.

## Styling the container/input row

```tsx
<DateRangeInput
  value={range}
  onChange={setRange}
  containerStyle={{ marginBottom: 12 }}
  inputStyle={{ height: 44, borderRadius: 12 }}
/>
```

`containerStyle` targets the outermost wrapping `View`; `inputStyle` targets the closed, touchable input
row itself. Both are merged after the component's own styles, so they can override anything (height,
radius, border, background, margins, etc).

## Both exported names — which to use

`DateRangeInput` and `DatePickerInput` are **the exact same component** (and `DateRangeValue`/
`DatePickerValue`, `DateRangeInputProps`/`DatePickerInputProps`, etc. are the exact same types) —
exported under two names purely so the import reads naturally at the call site:

```tsx
// Reads naturally for a range-only call site:
import { DateRangeInput } from "react-native-date-range-input";

// Reads naturally when you're using mode="single" (or switching between both):
import { DatePickerInput } from "react-native-date-range-input";
```

Pick whichever name matches how the field is used; there's no behavioral or bundle-size difference.

## Development

```bash
npm install
npm run build   # tsc -p tsconfig.json -> dist/ (also runs automatically via the "prepare" script)
```

There's no test suite or lint script in this package yet — type-checking via `tsc` (above) is the only
current CI-equivalent gate.

### Project layout

```
src/
  DateRangeInput.tsx   # component, props, and value/label/icon types
  theme.ts             # DateRangeInputTheme type, defaultTheme, mergeTheme()
  index.ts             # public barrel — the only module consumers import from
```

## Troubleshooting

**The calendar renders in the wrong language / weekday names are in English despite `locale="fr"`.**
Make sure you've imported that dayjs locale file (`import 'dayjs/locale/fr'`) somewhere that runs before
the component renders — see [Locale-aware formatting](#locale-aware-formatting).

**`onChange` isn't firing when I pick dates.** This is expected — picking dates only updates an internal
draft. `onChange` fires only on **Apply** or **Clear**; tapping the backdrop discards the draft (see
[How it works](#how-it-works)).

**TypeScript complains that `value.date` (or `.startDate`/`.endDate`) doesn't exist.** `DatePickerValue`
intentionally has all three fields optional regardless of `mode`, so this shouldn't happen from the
package's own types — double check you haven't narrowed your own local type to only one field.

**I need `mode="multiple"` (pick several, non-contiguous dates).** Not currently exposed — this package
only surfaces `single`/`range` from the underlying `react-native-ui-datepicker`, which does support a
third `multiple` mode. Open an issue/PR if you need it; the plumbing in `DateRangeInput.tsx` (see the
`mode === 'single' ? ... : ...` branches) is written to make adding a third branch straightforward.
