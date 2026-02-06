# Theme Management System

The LinID project provides a **centralized theme system** to manage UI colors and CSS variables dynamically at runtime.

---

## Overview

The theme system works as follows:

1. Loads a global theme configuration from `public/theme.json`
2. Injects each key as a CSS custom property on the root element
3. Makes theme variables available in any component or stylesheet

This approach keeps theming flexible, avoids hard-coded colors, and lets deployments override the theme without rebuilding the app.

---

## How It Works

### 1. Theme Configuration File

The main configuration is in `public/theme.json`:

```json
{
  "primary": "#1976d2",
  "secondary": "#26a69a",
  "accent": "#9c27b0",
  "dark": "#1d1d1d",
  "positive": "#21ba45",
  "negative": "#c10015",
  "info": "#31ccec",
  "warning": "#f2c037"
}
```

Each key is converted to a CSS variable with the `--q-` prefix.

---

### 2. Boot Initialization

On app startup, the theme is loaded by the boot file:

- File: `src/boot/theme.ts`
- Fetches `/theme.json`
- Iterates over all entries and injects each as a CSS variable on `document.documentElement`

---

### 3. CSS Variable Injection

Each entry in the theme file is converted to a CSS custom property on `:root`:

```css
:root {
  --q-primary: #1976d2;
  --q-secondary: #26a69a;
  --q-accent: #9c27b0;
  /* ... */
}
```

This makes the values available anywhere in the application.

---

## Standard Keys

These keys are used by the Quasar framework and should always be present:

| Key         | Purpose                  | Default   |
| ----------- | ------------------------ | --------- |
| `primary`   | Primary brand color      | `#1976d2` |
| `secondary` | Secondary brand color    | `#26a69a` |
| `accent`    | Accent/highlight color   | `#9c27b0` |
| `dark`      | Dark color for dark mode | `#1d1d1d` |
| `positive`  | Success/positive color   | `#21ba45` |
| `negative`  | Error/negative color     | `#c10015` |
| `info`      | Information color        | `#31ccec` |
| `warning`   | Warning color            | `#f2c037` |

## Custom Keys

The boot file dynamically injects **all** keys from `theme.json`, not just the standard ones. Deployments can add custom keys to define additional CSS variables.

For example, adding these keys:

```json
{
  "primary": "#000091",
  "background-default": "#ffffff",
  "background-alt": "#f6f6f6",
  "border-default": "#e5e5e5",
  "text-default": "#161616",
  "text-title": "#161616"
}
```

Will produce:

```css
:root {
  --q-primary: #000091;
  --q-background-default: #ffffff;
  --q-background-alt: #f6f6f6;
  --q-border-default: #e5e5e5;
  --q-text-default: #161616;
  --q-text-title: #161616;
}
```

These custom variables can then be referenced in `theme-style.css` (e.g., `color: var(--q-text-default)`).

---

## Using the Theme in Vue Templates

You can use theme colors directly in Vue templates via Quasar component props:

```vue
<template>
  <q-btn
    :label="t('title')"
    color="primary"
  />
</template>
```

---

## Deployment

To override the theme in a Docker deployment, mount a custom JSON file:

```yaml
volumes:
  - ./resources/theme.json:/usr/share/nginx/html/theme.json:ro
```
