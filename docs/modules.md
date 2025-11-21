# 📦 **Module Configuration (modules.json)**

The host application supports a **dynamic module loading system** (micro-frontends), allowing each business module to provide its own configuration file.
These configurations are loaded at startup and automatically register the module’s routes, plugins, components, or features.

This mechanism makes module registration **declarative**, **scalable**, and **independent of the application build**.

---

# 📁 **modules.json — List of Modules**

The `public/modules.json` file contains the list of modules that the host should load.

Each entry in the array represents the **URL of a module configuration file**.
A module entry can be:

* a **relative path** → resolved from the project’s `public/` folder
* an **absolute URL** → pointing to a remote module configuration file

This allows modules to be served locally or remotely.

### Example

```json
{
  "modules": [
    "module-a.json",
    "https://cdn.example.com/modules/module-b.json"
  ]
}
```

### Resolution Rules

* If the value **does not contain a hostname** (e.g., `module-a.json`, `configs/module-c.json`):
  👉 the host automatically resolves it relative to the project’s **`public/` directory**.
  Example:
  `module-a.json` → `public/module-a.json`

* If the value **is a full URL**:
  👉 the host loads the configuration directly from that URL.

---

# 📄 **Module Configuration Files**

For every module listed in `modules.json`, the host loads a corresponding JSON configuration file.

The exact filename or path is **flexible**, as long as it matches what’s declared in `modules.json`.
A common pattern is:

```
public/module-a.json
public/module-b.json
```

The only requirement is that the host can resolve the file associated with the module identifier.

---

# 📘 **Module Configuration Structure**

Each module provides a minimal configuration structure that allows the host to initialize it correctly.
Even though the file name is not restricted, the configuration must include at least:

```json
{
  "id": "module-a",
  "remoteName": "moduleA"
}
```

### Common Fields

| Field                          | Purpose                                            |
| ------------------------------ | -------------------------------------------------- |
| **id**                         | Unique module identifier (kebab-case recommended). |
| **remoteName**                 | Name used by Module Federation to load the remote. |
| *(optional)* additional fields | Routes, plugins, injection zones, module options…  |

A complete specification of the module schema will be provided later.

---

# 🔄 **Module Loading Lifecycle**

When the host application starts, it follows several steps:

### 1. **Discovery**

The host reads `public/modules.json` to retrieve the list of enabled modules.

### 2. **Configuration Loading**

For each module, the host loads its corresponding configuration JSON file.

### 3. **Remote Loading**

The host dynamically loads the module’s Module Federation remote using the provided `remoteName`.

### 4. **Module Lifecycle Phases**

Each module exposes a `./lifecycle` entry which is executed through multiple phases:

* **Setup** — The module validates required dependencies
* **Configure** — The module receives its configuration object
* **Initialize** — The module registers routes, state stores, components, or extensions
* **Ready** — The module signals that it is fully initialized
* **Post-Init** — Optional cross-module integrations

### 5. **Activation**

The module’s contributions are merged into the host: routes, plugin zones, stores, behaviors, etc.

This workflow enables:

✔ Adding or removing modules without rebuild
✔ Dynamic loading of module code via Module Federation
✔ A modular and extensible host architecture

---

# 📴 **Disabling a Module**

To disable a module:

👉 Simply remove it from the `modules` array in `modules.json`.

```json
{
  "modules": ["module-a"]
}
```

Any module not listed will be completely ignored by the host.

---

# 🛠 **Troubleshooting**

### **1. No Modules Found**

```
[Module Lifecycle] No enabled modules found
```

This is expected when `modules.json` is empty.

---

### **2. Configuration File Not Found**

```
[Module Lifecycle] Config file not found: module-x.json
```

➡ Ensure the file exists and matches the name declared in `modules.json`.

---

### **3. Module ID Mismatch**

```
[Module Lifecycle] Module ID mismatch
```

➡ Ensure the `id` in the configuration file matches the entry in `modules.json`.

---

# 📝 **Important Notes**

* All configuration files must contain **valid JSON**.
* The host application does **not** require a rebuild to detect changes in module configuration.
* File naming is flexible as long as the host can resolve the file for each module.
* Modules are independent: their remotes are loaded dynamically.
* Modules can be added, updated, or removed at runtime.
