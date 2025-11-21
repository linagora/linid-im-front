# **📦 Module Configuration (modules.json)**

The host application supports **dynamic module loading**, allowing each feature module to declare its own configuration file that the host reads at startup.

This mechanism makes module registration **declarative**, **scalable**, and **environment-independent**.

---

## **📁 modules.json — List of Module Configurations**

The file `public/modules.json` contains the list of all module configuration files the host must load.

### **Example**

```json
[
  "module-a.json",
  "module-b.json"
]
```

Each entry corresponds to a configuration file located in the same directory (`public/`).

---

## **📄 Individual Module Configuration Files**

For each module listed in `modules.json`, the host will load a corresponding JSON file:

```
public/module-a.json
public/module-b.json
```

---

## **📘 Module Configuration Structure**

The format of each module configuration file will be documented in a dedicated guide.

👉 **Coming soon…**
A complete specification of module configuration will be added later.

---

## **🔄 How the Host Loads Modules**

At startup:

1. The host reads `public/modules.json`
2. It loads each module JSON file listed
3. It merges all declared routes, plugin zones, and settings
4. Modules become available dynamically without rebuild

This flow allows you to:

✔ Add or remove modules by editing simple JSON files
✔ Deploy modules independently
✔ Keep the host project lightweight and extensible

---

## **📝 Notes**

* All module configuration files must be valid JSON
* The host does **not** require a rebuild after modifying these files
* Modules can be enabled/disabled by simply editing `modules.json`
