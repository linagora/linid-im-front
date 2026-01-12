# 🛣️ **Route Management System**

The LinID host application provides an automated route management system that dynamically loads and registers routes from remote modules.

---

## **📚 Overview**

Each remote module can export its own routes, and the host automatically:

1. Loads routes during the **Configure** lifecycle phase
2. Applies **Nunjucks templating** to route paths
3. Converts routes to Vue Router format
4. Registers them dynamically

This eliminates the need for modules to manually register routes and allows path customization per instance.

---

## **🔄 How It Works**

### **1. Module exports routes**

Each module exports a `routes` entry that returns a `LinidRoute[]`:

```typescript
// In remote module: src/routes.ts
import type { LinidRoute } from '@linagora/linid-im-front-corelib';

const routes: LinidRoute[] = [
  {
    path: '{{ config.basePath }}/dashboard',
    component: 'myModule/Dashboard',
    children: [],
  },
];

export default routes;
```

### **2. Host configuration provides variables**

The host provides a `ModuleHostConfig` for each module:

```json
{
  "instanceId": "my-module",
  "remoteName": "my-module-remote",
  "basePath": "/app"
}
```

### **3. Host applies templating and registers**

During initialization, the host:

- Renders `{{ basePath }}/dashboard` → `/app/dashboard`
- Loads the component asynchronously via `loadAsyncComponent('myModule/Dashboard')`
- Registers the route in Vue Router

---

## **📝 LinidRoute Interface**

```typescript
type LinidRoutes = LinidRoute[];

interface LinidRoute {
  /** Route path (supports Nunjucks templating) */
  path: string;

  /** Remote component identifier (e.g., "myModule/Component") */
  component: string;

  /** Optional nested routes */
  children?: LinidRoutes;
}
```

---

## **✨ Nunjucks Templating**

All route paths support **Nunjucks** template syntax with access to the entire `ModuleHostConfig`:

### **Available Variables**

Any property in `ModuleHostConfig` can be used:

```json
{
  "instanceId": "messaging",
  "remoteName": "messaging-remote",
  "basePath": "/chat",
  "apiEndpoint": "api/messages",
  "options": {
    "apiVersion": "v2",
    "theme": "dark"
  }
}
```

### **Template Examples**

```typescript
const routes: LinidRoute[] = [
  {
    path: '{{ config.basePath }}/inbox', // → /chat/inbox
    component: 'messaging/Inbox',
    children: [],
  },
  {
    path: '{{ config.basePath }}/api/{{ config.options.apiVersion }}', // → /chat/api/v2
    component: 'messaging/ApiDocs',
    children: [],
  },
];
```

### **Advanced Templating**

Nunjucks supports filters, conditionals, and loops:

```typescript
{
  path: '{{ config.basePath | lower }}/settings',  // Apply lowercase filter
  component: 'messaging/Settings',
  children: []
}
```

---

## **🧩 Nested Routes (Children)**

Routes can have nested children:

```typescript
const routes: LinidRoute[] = [
  {
    path: '{{ config.basePath }}/users',
    component: 'myModule/UserLayout',
    children: [
      {
        path: 'list', // → /app/users/list
        component: 'myModule/UserList',
      },
      {
        path: 'detail/:id', // → /app/users/detail/:id
        component: 'myModule/UserDetail',
      },
    ],
  },
];
```

---

## **⚠️ Important Notes**

### **No Automatic Prefixing**

Routes are **not** automatically prefixed by module name. This allows:

- Multi-instance deployments with custom paths
- Flexible route organization
- Avoiding conflicts in multi-tenant setups

### **No Route Names**

Routes are registered **without names**. Navigation should use paths:

```typescript
// ❌ Don't use named routes
router.push({ name: 'user-list' });

// ✅ Use paths (configurable per instance)
router.push('/app/users/list');
```

### **Path Conflicts**

If two modules define the same path, the **last registered module wins**.
Ensure unique paths through configuration.

---

## **🔧 Module Federation Setup**

Each module must expose a `routes` entry in its Module Federation configuration:

```typescript
// In remote module: vite.config.ts or quasar.config.ts
federation({
  name: 'myModule',
  filename: 'remoteEntry.js',
  exposes: {
    './lifecycle': './src/lifecycle.ts',
    './routes': './src/routes.ts', // ← Expose routes
  },
});
```

---

## **📄 Example: Complete Module Setup**

### **1. Define routes**

```typescript
// src/routes.ts
import type { LinidRoute } from '@linagora/linid-im-front-corelib';

const routes: LinidRoute[] = [
  {
    path: '{{ config.basePath }}/dashboard',
    component: 'myModule/Dashboard',
    children: [
      {
        path: 'analytics',
        component: 'myModule/Analytics',
      },
    ],
  },
  {
    path: '{{ config.basePath }}/settings',
    component: 'myModule/Settings',
    children: [],
  },
];

export default routes;
```

### **2. Module configuration**

```json
{
  "instanceId": "my-module",
  "remoteName": "my-module-remote",
  "basePath": "/my-app",
  "apiEndpoint": "/api"
}
```

### **3. Result**

Routes registered:

- `/my-app/dashboard` → `myModule/Dashboard`
  - `/my-app/dashboard/analytics` → `myModule/Analytics`
- `/my-app/settings` → `myModule/Settings`
