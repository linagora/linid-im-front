# Module Lifecycle Boot System

This directory contains the boot files that initialize core systems before the Vue application mounts.

## Overview

Boot files in Quasar run in a specific order during application startup. The module lifecycle system is implemented as a boot file to ensure proper initialization of remote modules.

## Boot Files

### `remotes.ts`

Registers Module Federation remotes from `/public/remotes.json`.

**Must run before** `module-lifecycle.ts` to ensure all remotes are available.

### `module-lifecycle.ts`

Implements the module lifecycle management system for business modules.

**Execution order:**

1. Loads module configurations from `/public/config/`
2. Loads all enabled business modules
3. Executes lifecycle phases in sequence for all modules

## Module Lifecycle System

### Purpose

The module lifecycle system provides a standardized way for business modules to:

- Validate dependencies and prerequisites
- Receive and apply host configuration
- Register routes, stores, and components
- Signal readiness
- Perform cross-module integrations

### Lifecycle Phases

```
Setup → Configure → Initialize → Ready → Post-Init
```

#### 1. Setup Phase

**Purpose:** Module validates dependencies and prepares initial state

**When to use:**

- Check if required dependencies are available
- Validate environment
- Prepare internal state

**Example:**

```typescript
async onSetup(context: ModuleLifecycleContext): Promise<ModuleLifecycleResult> {
  if (!context.app) {
    return {
      success: false,
      error: 'Vue app instance not available'
    };
  }
  return { success: true };
}
```

#### 2. Configure Phase

**Purpose:** Module receives and validates host configuration

**When to use:**

- Receive configuration from host (`module-<name>.json`)
- Validate required configuration fields
- Store configuration for later use

**Example:**

```typescript
async onConfigure(
  context: ModuleLifecycleContext,
  config: ModuleHostConfig
): Promise<ModuleLifecycleResult> {
  if (!config.id) {
    return {
      success: false,
      error: 'Missing module ID in configuration'
    };
  }

  // Store configuration
  this.config = config;

  return { success: true };
}
```

#### 3. Initialize Phase

**Purpose:** Module registers routes, stores, components, and other resources

**When to use:**

- Register global components
- Register Pinia stores
- Set up event listeners
- Initialize module-specific resources

**Example:**

```typescript
async onInitialize(
  context: ModuleLifecycleContext
): Promise<ModuleLifecycleResult> {
  // Register global component
  context.app.component('MyWidget', MyWidget);

  return {
    success: true,
    metadata: { componentsRegistered: 1 }
  };
}
```

#### 4. Ready Phase

**Purpose:** Module signals it's ready for use

**When to use:**

- Perform final checks
- Emit ready events
- Log readiness status

**Example:**

```typescript
async onReady(
  context: ModuleLifecycleContext
): Promise<ModuleLifecycleResult> {
  console.log('Module is ready!');
  return { success: true };
}
```

#### 5. Post-Init Phase

**Purpose:** Cross-module integrations and final setup

**When to use:**

- Integrate with other modules
- Set up cross-module communication
- Perform final setup that requires all modules to be ready

**Example:**

```typescript
async onPostInit(
  context: ModuleLifecycleContext
): Promise<ModuleLifecycleResult> {
  // Get other modules
  const otherModule = getRegisteredModules().get('other-module');

  if (otherModule) {
    // Set up integration
  }

  return { success: true };
}
```

### Module Lifecycle Context

The context object provided to all lifecycle hooks:

```typescript
interface ModuleLifecycleContext {
  /**
   * Vue application instance.
   * Use this to register global components, directives, or plugins.
   */
  app: App;
}
```

### Module Lifecycle Result

All lifecycle hooks must return a result:

```typescript
interface ModuleLifecycleResult {
  /**
   * Whether the phase completed successfully.
   * If false, the error is logged but the module continues through remaining phases.
   */
  success: boolean;

  /**
   * Error message if the phase failed.
   */
  error?: string;

  /**
   * Additional metadata from the phase (for debugging).
   */
  metadata?: Record<string, unknown>;
}
```

## Implementing a Business Module

### 1. Create Lifecycle File

Create `src/lifecycle.ts` in your business module:

```typescript
import type {
  RemoteModule,
  ModuleLifecycleContext,
  ModuleLifecycleResult,
  ModuleHostConfig,
} from '@linagora/linid-im-front-corelib';

const module: RemoteModule = {
  id: 'my-module',
  name: 'My Business Module',
  version: '1.0.0',
  description: 'Description of what the module does',

  async onSetup(context) {
    // Validate dependencies
    return { success: true };
  },

  async onConfigure(context, config) {
    // Apply configuration
    return { success: true };
  },

  async onInitialize(context) {
    // Register components, stores, etc.
    return { success: true };
  },

  async onReady(context) {
    // Signal readiness
    return { success: true };
  },

  async onPostInit(context) {
    // Cross-module integrations
    return { success: true };
  },
};

export default module;
```

### 2. Expose Lifecycle in Module Federation

In your module's `vite.config.ts`:

```typescript
export default defineConfig({
  plugins: [
    federation({
      name: 'myBusinessModule',
      filename: 'remoteEntry.js',
      exposes: {
        './lifecycle': './src/lifecycle.ts', // Required
        './MyComponent': './src/components/MyComponent.vue',
      },
    }),
  ],
});
```

### 3. Register in Host

Add your module to the host configuration:

**`public/remotes.json`:**

```json
{
  "myBusinessModule": "http://localhost:5002/mf-manifest.json"
}
```

**`public/config/modules.json`:**

```json
{
  "modules": ["my-business"]
}
```

**`public/config/module-my-business.json`:**

```json
{
  "id": "my-business-module",
  "remoteName": "myBusinessModule",
  "enabled": true
}
```

## Public API

The module lifecycle system exports several utilities:

### `getCurrentPhase()`

Get the current lifecycle phase being executed.

```typescript
import {
  getCurrentPhase,
  ModuleLifecyclePhase,
} from 'src/boot/module-lifecycle';

if (getCurrentPhase() === ModuleLifecyclePhase.INITIALIZE) {
  // Currently in initialize phase
}
```

### `getRegisteredModules()`

Get all registered modules (read-only).

```typescript
import { getRegisteredModules } from 'src/boot/module-lifecycle';

const modules = getRegisteredModules();
const userModule = modules.get('users-module');
```

### `getModuleConfig()`

Get the host configuration for a specific module.

```typescript
import { getModuleConfig } from 'src/boot/module-lifecycle';

const config = getModuleConfig('my-module');
if (config?.enabled) {
  // Module is enabled
}
```

## Error Handling

### Module Fails to Load

If a module fails to load, an error is logged but the system continues:

```
[Module Lifecycle] Failed to load module myBusinessModule/lifecycle: <error>
```

The module is not added to the registry and does not participate in lifecycle phases.

### Phase Execution Fails

If a lifecycle phase fails for a module:

- The error is logged
- The module continues through remaining phases
- Other modules are not affected

```
[Module Lifecycle] my-module: Error in initialize phase: <error>
```

### Invalid Phase Result

If a lifecycle hook returns an invalid result:

```
[Module Lifecycle] my-module: Phase setup returned invalid result, treating as success
```

The phase is considered successful to allow the module to continue.

## Debugging

### Console Logs

The lifecycle system provides detailed logging:

```
[Module Lifecycle] Starting module lifecycle initialization
[Module Lifecycle] Loaded config for module: my-module
[Module Lifecycle] Loading module: myBusinessModule/lifecycle
[Module Lifecycle] Registered module: my-module (My Module)
[Module Lifecycle] Starting setup phase for all modules
[Module Lifecycle] my-module: Executing setup phase
[Module Lifecycle] Completed setup phase
...
[Module Lifecycle] Module lifecycle initialization complete
```

### Unimplemented Hooks

Modules don't need to implement all hooks. Unimplemented hooks are logged at debug level:

```
[Module Lifecycle] my-module: Phase ready hook not implemented, skipping
```

## Best Practices

### 1. Keep Phases Focused

Each phase should have a single responsibility:

✅ **Good:**

```typescript
async onInitialize(context) {
  context.app.component('MyComponent', MyComponent);
  return { success: true };
}
```

❌ **Bad:**

```typescript
async onInitialize(context) {
  context.app.component('MyComponent', MyComponent);
  await fetchUserData(); // Should be in onReady or onPostInit
  integrateWithOtherModule(); // Should be in onPostInit
  return { success: true };
}
```

### 2. Always Return a Valid Result

```typescript
// ✅ Good
return { success: true };

// ✅ Good
return {
  success: false,
  error: 'Missing required configuration',
};

// ❌ Bad
return; // Invalid, returns undefined
```

### 3. Use Metadata for Debugging

```typescript
return {
  success: true,
  metadata: {
    componentsRegistered: 5,
    routesRegistered: 3,
  },
};
```

### 4. Fail Fast in Setup

Validate prerequisites in the Setup phase:

```typescript
async onSetup(context) {
  if (!window.someRequiredAPI) {
    return {
      success: false,
      error: 'Required API not available'
    };
  }
  return { success: true };
}
```

### 5. Don't Throw Errors

Return failure results instead of throwing:

```typescript
// ✅ Good
if (!config.id) {
  return { success: false, error: 'Missing ID' };
}

// ❌ Bad
if (!config.id) {
  throw new Error('Missing ID');
}
```

Thrown errors are caught and converted to failure results, but explicit returns are clearer.
