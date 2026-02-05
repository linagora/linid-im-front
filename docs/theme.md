# 🎨 **Theme Management System**

The LinID project provides a **centralized theme system** to manage UI colors and CSS variables dynamically at runtime.

---

## **📚 Overview**

The theme system works as follows:

1. Loads a global theme configuration from `public/theme.json`
2. Injects each key as a CSS custom property on the root element
3. Makes theme variables available in any component or stylesheet

This approach keeps theming flexible, avoids hard‑coded colors, and lets deployments override the theme without rebuilding the app.

---

## **🔄 How It Works**

### **1. Theme Configuration File**

The main configuration is in `public/theme.json`:

```json
{
  "primary": "#1976d2",
  "secondary": "#26a69a",
  "accent": "#9c27b0",
  "dark": "#1d1d1d",
  "dark-page": "#121212",
  "positive": "#21ba45",
  "negative": "#c10015",
  "info": "#31ccec",
  "warning": "#f2c037"
}
```

Each key corresponds to a CSS variable.

---

### **2. Boot Initialization**

On app startup, the theme is loaded by the boot file:

- File: `src/boot/theme.ts`
- Fetches `/theme.json`
- Injects CSS variables into `document.documentElement`

---

### **3. CSS Variable Injection**

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

### **Using the Theme in Vue Templates**

You can use theme colors directly in Vue templates via Quasar component props, for example:

```vue
<template>
  <q-btn
    :label="t('title')"
    color="primary"
  />
</template>
```
