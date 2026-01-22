# 🎨 **Design Management System**

The LinID project provides a **centralized design system** to configure global component defaults for Quasar, ensuring consistent styling and behavior across the application.

---

## **📚 Overview**

The design system works as follows:

1. Loads a global design configuration from `public/design.json`
2. Applies default properties to Quasar components (e.g., `q-btn`, `q-tabs`, `q-table`)
3. Automatically integrates with the application layout
4. Allows dynamic updates if needed

This approach simplifies styling, promotes consistency, and avoids repeating configuration in multiple components.

---

## **🔄 How It Works**

### **1. Global Design Configuration**

The main configuration is in `public/design.json`:

```json
{
  "default": {
    "q-btn": {
      "dense": true,
      "outline": true,
      "color": "primary",
      "noCaps": true
    },
    "q-input": {
      "dense": true,
      "outlined": true
    },
    "q-table": {
      "dense": true
    }
  }
}
```

- `default`: default configuration applied globally
- Keys like `q-btn`, `q-input`, `q-table` correspond to **Quasar components**
- Properties inside each key define **default behavior or styling**

---

### **2. Supported Components**

The following Quasar components are supported by the design system (via `useUiDesign()` composable from corelib):

| Component                                  | Description    |
| ------------------------------------------ | -------------- |
| `q-btn`                                    | Buttons        |
| `q-tabs`, `q-route-tab`                    | Tab navigation |
| `q-table`                                  | Data tables    |
| `q-header`, `q-toolbar`, `q-toolbar-title` | Layout header  |
| `q-badge`                                  | Badges         |
| `q-input`                                  | Text inputs    |
| `q-card`, `q-card-actions`                 | Card container |
| `q-avatar`                                 | User avatars   |
| `q-icon`                                   | Icons          |
| `q-toggle`                                 | Toggle switch  |
| `q-img`                                    | Images         |
| `q-date`                                   | Date picker    |

---

### **3. Adding New Global Defaults**

1. Add or modify properties in `public/design.json`:

```json
{
  "default": {
    "q-btn": {
      "dense": true,
      "outline": false,
      "color": "secondary",
      "noCaps": true
    }
  }
}
```

2. Restart the application; changes will be applied automatically to all components.

---

## **⚠️ Important Notes**

- **Component keys must match Quasar component names** (`q-btn`, `q-tabs`, `q-table`, etc.)
- **Properties override default Quasar behavior** but can be overridden per instance if needed:

```vue
<q-btn label="Cancel" :dense="false" color="red" />
<!-- instance-level overrides -->
```

- **Asynchronous loading** ensures the configuration can be updated dynamically without rebuilding the app
- **Type safety**: Refer to Quasar documentation for valid property values
- **Supported components**: Only components listed in `QComponentName` type from corelib are supported by `useUiDesign()`
