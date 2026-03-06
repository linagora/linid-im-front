# 🚀 **Module Lifecycle Boot System**

This directory contains the boot files that initialize the module lifecycle system **before** the Vue application mounts.
The lifecycle ensures that remote modules are discovered, configured, and initialized in a predictable and consistent sequence.

---

# 📚 **Overview**

Quasar executes boot files in a defined order during application startup.
The dynamic module architecture relies on two boot files:

1. **`remotes.ts`** — Registers Module Federation remotes
2. **`module-lifecycle.ts`** — Loads module configurations and executes lifecycle phases

This guarantees that remote code is available before the module initialization flow begins.

---

# ⚙️ **Boot Files**

## **`remotes.ts`**

Responsible for loading and registering remote manifests from `public/remotes.json`.

- Must run **before** the lifecycle system
- Ensures each remote module can be dynamically imported

---

## **`module-lifecycle.ts`**

Runs the complete lifecycle system:

### **Execution Flow**

1. Reads the module list from `public/modules.json`
2. Resolves the URL of each module configuration
   - If no hostname is present, the file is resolved relative to `/public/`

3. Loads and validates configuration files
4. Loads each module’s remote lifecycle entry
5. Executes all lifecycle phases across all enabled modules

Lifecycle phases:

```
Setup → Configure → Initialize → Ready → Post-Init
```

---

# 🧠 **Module Lifecycle System**

The lifecycle provides a standardized, predictable structure for module initialization.
Modules may implement any subset of lifecycle phases; unimplemented phases are skipped automatically.

---

# 🔄 **Lifecycle Phases**

```
Setup → Configure → Initialize → Ready → Post-Init
```

Each phase has a clear purpose within the global module initialization process.

---

## **1. Setup Phase**

### **Purpose**

Validate dependencies and ensure the module can run in the current environment.

### **Typical Actions**

- Check required APIs or services
- Validate external dependencies
- Prepare initial internal state

---

## **2. Configure Phase**

### **Purpose**

Receive and validate the module’s configuration loaded from its JSON file.

### **Typical Actions**

- Parse configuration options
- Check required configuration fields
- Store configuration for later phases

### **Route Loading**

During the Configure phase, the host automatically loads and registers routes from each module:

1. The host loads `${remoteName}/routes` via Module Federation
2. Applies **Nunjucks templating** to route paths using the module's `ModuleHostConfig`
3. Converts `LinidRoute[]` to Vue Router `RouteRecordRaw[]` using `loadAsyncComponent`
4. Registers the routes in the Vue Router instance

**Modules do not need to register routes manually** during the Configure phase.

For more details on route management, see the [Route Management Guide](./routes.md).

### **i18n Loading**

During the Configure phase, the host automatically loads and merges i18n messages from each module:

1. The host loads `${remoteName}/i18n` via Module Federation
2. Applies **Nunjucks templating** to all message keys using the module's `ModuleHostConfig`
3. Merges the messages into each locale of the Vue i18n instance

**Modules do not need to register translations manually.** If no i18n entry point is exposed, this step is silently skipped.

---

## **3. Initialize Phase**

### **Purpose**

Register all runtime contributions of the module.

### **Typical Actions**

- Register components or UI extensions
- Initialize services, listeners, or background processes

---

## **4. Ready Phase**

### **Purpose**

Signal that the module is fully operational.

### **Typical Actions**

- Emit readiness events
- Perform final validations
- Notify the host system of operational status

---

## **5. Post-Init Phase**

### **Purpose**

Perform cross-module setup after all modules have reached the Ready phase.

### **Typical Actions**

- Integrate with other modules
- Exchange references or services
- Finalize features that require all modules to be initialized

### **Zone Registration**

During the Post-Init phase, the host automatically registers UI zones declared in the module configuration:

1. The host reads the `zones` array from the module's `ModuleHostConfig`
2. For each zone entry, it calls `linidZoneStore.register(zoneName, { plugin, props })`
3. Registered zones become available to the host layout for dynamic rendering

A zone entry in `ModuleHostConfig` has the following shape:

```ts
{
  zone: string;       // Target zone identifier in the host layout
  plugin: string;     // Component or plugin to render in that zone
  props?: object;     // Optional props passed to the plugin
}
```

**Modules do not need to call `useLinidZoneStore` themselves.** If no `zones` are defined, this step is silently skipped.

---

# 📄 **ModuleLifecycleResult**

Every lifecycle hook returns a structured result:

```ts
interface ModuleLifecycleResult {
  success: boolean;
  error?: string;
  metadata?: Record<string, unknown>;
}
```

- A failure does **not** stop the remaining lifecycle for the module
- Errors are logged but do not affect other modules
- Invalid results are treated as successful to maintain system stability

---

# 🐞 **Error Handling**

## ** Module configuration files list fails to load**

If `modules.json` cannot be loaded, the host application will log an error and skip the module lifecycle system:

```
[Module Lifecycle] Failed to load module configurations: Failed to fetch /modules.json
```

---

## **Module configuration fails to load**

If a module’s configuration file cannot be loaded, the host will log an error and skip that module:

```
[Module Lifecycle] [Module Lifecycle] Config file not found: moduleMyModule.json
```

---

## **Module's lifecycle fails to load**

If a module’s remote lifecycle cannot be loaded, the host application will crash.

---

# 🔍 **Debugging**

The lifecycle system logs detailed information about configuration loading:

Example debug message:

```
[Module Lifecycle] Loaded config for module: public/moduleMyModule.json
```

---

# ⭐ **Best Practices**

### **1. Keep phases single-purpose**

Each lifecycle phase should focus on one clear responsibility.

### **2. Always return a valid `ModuleLifecycleResult`**

Modules must avoid returning `undefined`.

### **3. Use `metadata` for observability**

Helps with debugging and instrumentation.

### **4. Validate early**

Place dependency checks in the Setup phase.

### **5. Avoid throwing errors**

Return structured failure results for predictable behavior.
