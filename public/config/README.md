# Module Configuration

This directory contains configuration files for **business modules** (micro-frontends) loaded via Module Federation.

## Overview

Each business module that should be loaded by the host application must:

1. Be listed in `modules.json`
2. Have a corresponding `module-<name>.json` configuration file

## Module Registry (`modules.json`)

The `modules.json` file contains the list of all modules to load:

```json
{
  "modules": []
}
```

When modules are developed, add them to this array:

```json
{
  "modules": ["my-module", "another-module"]
}
```

**Benefits:**

- ✅ Single source of truth for enabled modules
- ✅ Easy to enable/disable modules (add/remove from array)
- ✅ Faster boot time (only listed modules are checked)

## File Naming Convention

Configuration files follow this naming pattern:

```
module-<module-name>.json
```

Where `<module-name>` must match:

1. An entry in `modules.json`
2. The base name used in `remotes.json` (without "Module" suffix)

**Example:**

```
modules.json: "my-module"
→ module-my-module.json
→ remotes.json: "myModuleModule"
→ Module ID: "my-module"
```

## Configuration File Format

Each configuration file must follow the `ModuleHostConfig` interface:

```typescript
interface ModuleHostConfig {
  id: string; // Unique module identifier (kebab-case)
  remoteName: string; // Module Federation remote name (must match remotes.json)
  enabled: boolean; // Enable/disable the module
}
```

### Example Configuration

**`modules.json`:**

```json
{
  "modules": ["my-module"]
}
```

**`module-my-module.json`:**

```json
{
  "id": "my-module",
  "remoteName": "myModuleModule",
  "enabled": true
}
```

## Module Lifecycle

When the host application boots, it follows this lifecycle for modules listed in `modules.json`:

1. **Discovery**: Reads `/config/modules.json` to get list of modules
2. **Configuration Loading**: For each module name, loads `/config/module-<name>.json`
   - If `enabled: true`: Module goes through lifecycle
   - If `enabled: false`: Module is skipped
3. **Module Loading**: Loads the remote's `./lifecycle` module
4. **Phase Execution**: Executes lifecycle phases in order:
   - **Setup**: Module validates dependencies
   - **Configure**: Module receives `ModuleHostConfig`
   - **Initialize**: Module registers routes, stores, components
   - **Ready**: Module signals it's ready
   - **Post-Init**: Cross-module integrations

## Disabling a Module

### Option 1: Remove from modules.json (Recommended)

```json
{
  "modules": ["my-module"]
  // "another-module" removed - will not be loaded at all
}
```

### Option 2: Set enabled to false

```json
{
  "id": "another-module",
  "remoteName": "anotherModuleModule",
  "enabled": false
}
```

**Difference:**

- **Removed from modules.json**: Config file is not fetched (faster)
- **enabled: false**: Config file is fetched but module is not loaded

## Current State

**Status**: No modules configured yet (empty array)

```json
{
  "modules": []
}
```

When you start developing business modules, add them to this array and create their corresponding configuration files.

## Troubleshooting

### No Modules Found

```
[Module Lifecycle] No enabled modules found
```

**Expected**: This is normal when `modules.json` has an empty array. The lifecycle system is ready but no modules are loaded yet.

### Config File Not Found

```
[Module Lifecycle] Config file not found: /config/module-my-module.json
```

**Solution**: Create `module-<name>.json` file or remove from `modules.json`

### Module Disabled

```
[Module Lifecycle] Module my-module is disabled, skipping
```

**Solution**: Set `"enabled": true` in config file

### Remote Name Mismatch

```
[Module Lifecycle] Module ID mismatch: expected "my-module", got "mymodule"
```

**Solution**: Ensure `id` in config matches module's exported `id`
