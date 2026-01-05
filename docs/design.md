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
    "q-tabs": {
      "dense": true,
      "align": "center",
      "noCaps": true
    },
    "q-table": {
      "dense": true
    }
  }
}
```

- `default`: default configuration applied globally
- Keys like `q-btn`, `q-tabs`, `q-table` correspond to **Quasar components**
- Properties inside each key define **default behavior or styling**

---

### **2. Adding New Global Defaults**

1. Add or modify properties in `public/design.json`:

```json
{
  "default": {
    "q-btn": {
      "dense": true,
      "outline": false,
      "color": "secondary",
      "noCaps": true
    },
    "q-input": {
      "dense": true,
      "filled": true
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
<q-btn label="Cancel" dense="false" color="red" />
<!-- instance-level overrides -->
```

- **Asynchronous loading** ensures the configuration can be updated dynamically without rebuilding the app
