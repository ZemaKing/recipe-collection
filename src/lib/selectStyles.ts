import type { StylesConfig } from 'react-select'

// Shared react-select styling so every custom select in the admin matches
// the app's CSS-variable-driven theme (dark by default, redefined for light
// mode/forced-colors in index.css) instead of react-select's own defaults.
export function createSelectStyles<Option>(hasError?: boolean): StylesConfig<Option, false> {
  return {
    control: (base, state) => ({
      ...base,
      backgroundColor: 'var(--color-surface-elevated)',
      borderColor: state.isFocused ? 'var(--color-accent)' : hasError ? 'var(--color-favorite)' : 'var(--color-border)',
      borderRadius: 'var(--radius-control)',
      borderWidth: 1,
      minHeight: '2.5rem',
      boxShadow: state.isFocused ? '0 0 0 1px var(--color-accent)' : 'none',
      opacity: state.isDisabled ? 0.5 : 1,
      cursor: state.isDisabled ? 'not-allowed' : 'default',
      transition: 'border-color 150ms, box-shadow 150ms',
      ':hover': {
        borderColor: state.isFocused ? 'var(--color-accent)' : hasError ? 'var(--color-favorite)' : 'var(--color-accent)',
      },
    }),
    valueContainer: (base) => ({ ...base, padding: '2px 10px' }),
    input: (base) => ({ ...base, color: 'var(--color-foreground)', margin: 0 }),
    placeholder: (base) => ({ ...base, color: 'var(--color-muted-foreground)', fontSize: '0.875rem' }),
    singleValue: (base) => ({ ...base, color: 'var(--color-foreground)' }),
    indicatorSeparator: () => ({ display: 'none' }),
    dropdownIndicator: (base, state) => ({
      ...base,
      color: 'var(--color-muted-foreground)',
      transform: state.selectProps.menuIsOpen ? 'rotate(180deg)' : undefined,
      transition: 'transform 150ms',
      padding: '0 8px',
    }),
    clearIndicator: (base) => ({
      ...base,
      color: 'var(--color-muted-foreground)',
      padding: '0 4px',
      ':hover': { color: 'var(--color-favorite)' },
    }),
    menu: (base) => ({
      ...base,
      backgroundColor: 'var(--color-surface-elevated)',
      border: '1px solid var(--color-border)',
      borderRadius: 'var(--radius-control)',
      boxShadow: '0 12px 32px rgba(0, 0, 0, 0.45)',
      overflow: 'hidden',
      zIndex: 30,
    }),
    menuList: (base) => ({ ...base, maxHeight: 380, padding: 4 }),
    option: (base, state) => ({
      ...base,
      backgroundColor: state.isSelected
        ? 'var(--color-accent-soft)'
        : state.isFocused
          ? 'var(--color-surface-hover)'
          : 'transparent',
      color: 'var(--color-foreground)',
      cursor: 'pointer',
      borderRadius: 'calc(var(--radius-control) - 0.25rem)',
      padding: '8px 10px',
      marginBottom: 2,
      ':active': { backgroundColor: 'var(--color-accent-soft)' },
    }),
    noOptionsMessage: (base) => ({ ...base, color: 'var(--color-muted-foreground)', fontSize: '0.875rem' }),
  }
}
