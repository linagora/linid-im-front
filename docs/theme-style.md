# Theme Style System

The LinID project provides a **custom CSS override mechanism** to fine-tune the visual appearance beyond what `theme.json` (colors) and `design.json` (component props) offer.

---

## Overview

The theme style system works as follows:

1. A `<link>` tag in `index.html` references `/theme-style.css`
2. The browser loads it as part of the initial page load
3. Deployments can replace the file to override any CSS rule without rebuilding the app

This complements the existing theming layers:

| Layer               | File              | Purpose                                                               |
| ------------------- | ----------------- | --------------------------------------------------------------------- |
| **Colors**          | `theme.json`      | Brand colors as CSS custom properties (`--q-primary`, etc.)           |
| **Component props** | `design.json`     | Quasar component defaults (dense, outlined, flat, etc.)               |
| **CSS overrides**   | `theme-style.css` | Design tokens, fonts, typography, layout, and component CSS overrides |

---

## How It Works

### HTML Loading

The stylesheet is loaded via a `<link>` tag in `index.html`:

```html
<link
  rel="stylesheet"
  type="text/css"
  href="/theme-style.css"
/>
```

CSS rules in `theme-style.css` can reference the CSS custom properties set by `theme.json` (e.g., `var(--q-primary)`) because custom properties are resolved at computed-value time, not at parse time.

### Default File

The default file is `public/theme-style.css`. It contains only a placeholder comment, meaning no custom styles are applied out of the box.

Deployments replace this file (e.g., via Docker volume mount) to apply a complete custom stylesheet.

---

## File Structure

A `theme-style.css` file should be organized in the following sections:

### 1. Design Tokens (`:root` variables)

Define reusable values for the entire stylesheet. This avoids hardcoded values and ensures consistency.

```css
:root {
  /* Font families */
  --font-family-primary: 'CustomFont', arial, sans-serif;

  /* Font sizes */
  --font-size-sm: 0.75rem;
  --font-size-base: 0.875rem;
  --font-size-md: 1rem;
  --font-size-lg: 1.25rem;

  /* Spacing */
  --spacing-sm: 0.25rem;
  --spacing-md: 0.5rem;
  --spacing-lg: 1rem;
  --spacing-xl: 2rem;

  /* Layout */
  --layout-max-width: 1200px;

  /* Borders */
  --border-thin: 1px;
  --border-radius-sm: 4px;
  --border-accent: 3px solid var(--q-primary);
}
```

**Recommended categories:**

| Category      | Purpose                                           |
| ------------- | ------------------------------------------------- |
| Font families | Custom font stacks for the deployment             |
| Font weights  | Named weight values (light, regular, bold)        |
| Font sizes    | Consistent size scale across the application      |
| Line heights  | Base and heading line heights                     |
| Spacing       | Reusable spacing values for padding and margins   |
| Layout        | Max widths, header heights, grid breakpoints      |
| Borders       | Border widths, radii, and accent styles           |
| Effects       | Opacity levels, hover backgrounds, letter spacing |

> Design tokens can reference `--q-*` color variables from `theme.json` (e.g., `var(--q-primary)`).

### 2. Font Declarations (`@font-face`)

Load custom fonts required by the deployment. Font files are served from the `/fonts/` directory (mounted via Docker volume).

```css
@font-face {
  font-family: 'CustomFont';
  src: url('/fonts/CustomFont-Regular.woff2') format('woff2');
  font-weight: 400;
  font-style: normal;
  font-display: swap;
}
```

### 3. Base Typography

Set the global font family, size, and line height on `body`, and define heading styles (`h1`–`h6`).

```css
body {
  font-family: var(--font-family-primary);
  font-size: var(--font-size-md);
  line-height: 1.5;
  color: var(--q-text-default);
}
```

### 4. Component Overrides

Override Quasar component styles. The file can target the following areas:

| Section             | CSS targets                                            |
| ------------------- | ------------------------------------------------------ |
| **Header**          | `.q-header`, `.q-toolbar`, `.q-avatar`                 |
| **Navigation**      | `.navigation-menu`, `.q-tab`, `.q-tab__indicator`      |
| **Page content**    | `.q-page`, heading margins                             |
| **Forms**           | `.q-field`, `.q-field--outlined`, `.q-card-section`    |
| **Entity details**  | `.entity-details-card`, `.information-card`            |
| **Advanced search** | `.advanced-search-card`                                |
| **Tables**          | `.q-table thead`, `.q-table tbody`, `.q-table__bottom` |
| **Buttons**         | `.q-btn`, `.q-btn--outline`, `.q-btn--flat`            |
| **Homepage**        | `.home-page--info`                                     |

### Best Practices

- **Use design tokens** (`var(--spacing-lg)`) instead of hardcoded values
- **Reference theme colors** (`var(--q-primary)`) instead of hex values
- **Increase specificity** rather than using `!important` when possible (e.g., `.q-layout .q-header.q-header`)
- **Use `!important` only** for deeply nested Quasar internals that cannot be overridden otherwise (e.g., `.q-field--outlined .q-field__control::before`)

---

## Deployment

To override the theme style in a Docker deployment, mount a custom CSS file and optional fonts:

```yaml
volumes:
  - ./resources/theme-style.css:/usr/share/nginx/html/theme-style.css:ro
  - ./resources/CustomFont-Regular.woff2:/usr/share/nginx/html/fonts/CustomFont-Regular.woff2:ro
```

---

## Interaction with Other Theming Layers

The three theming layers work together in this order:

1. **`theme.json`** sets CSS custom properties (`--q-primary`, `--q-secondary`, etc.)
2. **`design.json`** sets Quasar component default props (e.g., `outlined`, `dense`, `flat`)
3. **`theme-style.css`** applies CSS overrides that reference both color variables and target component classes

When two CSS rules have the same specificity, the one that appears last in source order wins. For deeply nested Quasar internals with high specificity, you may need to match or exceed their selector specificity (see Best Practices above).
