# **CONTRIBUTING 🤝**

Thank you for contributing to **linid-im-front**, the front-end of the LinID Identity Manager platform.
This document explains the conventions, workflows, and best practices to follow when contributing.

---

# **📌 Git Conventions**

## **🌿 Branch Naming**

All branches must follow one of the following naming patterns:

| Type            | Pattern                           | Example                           |
| --------------- | --------------------------------- | --------------------------------- |
| **Main**        | `main` or `dev`                   | `main`                            |
| **Feature**     | `feature/<short-description>`     | `feature/plugin-zone-support`     |
| **Bugfix**      | `bugfix/<short-description>`      | `bugfix/fix-null-validation`      |
| **Improvement** | `improvement/<short-description>` | `improvement/refactor-core-types` |
| **Release**     | `release/<version>`               | `release/1.2.0`                   |
| **Hotfix**      | `hotfix/<short-description>`      | `hotfix/fix-critical-crash`       |

### **Rules**

✔ Allowed characters: lowercase letters, numbers, dashes (`-`), underscores (`_`), and dots (`.`)
✔ Names must be concise and descriptive
✔ Use English keywords and descriptions

---

## **📝 Commit Message Format (Conventional Commits)**

We follow the **Conventional Commits** specification:

```
<type>(<scope>): <short summary>
```

### **Accepted types**

* `feat` – A new feature
* `fix` – A bug fix
* `docs` – Documentation updates only
* `style` – Code style changes (formatting, missing semicolons…)
* `refactor` – Code refactoring without behavioral change
* `perf` – Performance improvements
* `test` – Test-related changes
* `security` – Security improvements or vulnerability fixes
* `deprecated` – Deprecation of APIs or components
* `chore` – Maintenance, tooling, CI, dependencies…

### **Examples**

```
feat(core): add identity validation helpers
fix(plugins): prevent crash on remote loading
docs(contributing): add commit format rules
```

---

## **🔏 Commit Signing (GPG)**

All commits **must be GPG-signed**:

```bash
git commit -S -m "feat(core): add new service"
```

Unsigned commits will be rejected.
If you need help setting up GPG signing, refer to your Git hosting provider’s documentation.

---

# **📚 Documentation Guidelines**

## **📁 Documentation Directory**

All functional or technical documentation must be placed inside:

```
/docs
```

Please keep this folder organized and up to date.

---

## **📊 Diagrams with Mermaid**

We use **Mermaid** for architecture diagrams, flowcharts, sequence diagrams, etc.

* Source files must be `.md` or `.mmd`
* They must be stored in the `docs` directory
* Generated images must be committed together with source files

### **Install Mermaid CLI**

```bash
npm install -g @mermaid-js/mermaid-cli
```

### **Generate a PNG**

```bash
mmdc -i docs/diagram.mmd -o docs/diagram.png
```

💡 Any modification to a Mermaid diagram **must include** regeneration of the corresponding PNG.

---

# **🚀 Development**

This project uses **pnpm** as the preferred package manager.
Node.js **22.19+** is recommended.

## **📦 Installation**

### ⭐ Quick Start

```sh
corepack enable
pnpm install
```

### Using pnpm (recommended)

```sh
pnpm install
```

### Using npm (legacy support)

```sh
npm install
```

---

## **🛠️ Build the Library**

```sh
pnpm build
# or
npm run build
```

---

## **🔧 Development Mode**

```sh
pnpm dev
# or
npm run dev
```

---

## **🧪 Run Tests**

```sh
pnpm test
# or
npm run test
```

---

# **🧼 Code Quality**

We use **ESLint**, **Prettier**, and **TypeScript** to enforce consistent code style and reliability.

## **🔍 Lint**

```sh
pnpm lint
pnpm lint:fix
```

## **🎨 Format**

```sh
pnpm format
pnpm format:check
```

## **📘 Type Checking**

```sh
pnpm type-check
```

## **✔ Full Validation**

```sh
pnpm validate
```

---

# **🧪 E2E & Integration Testing**

Full E2E testing documentation is **Coming soon… ⏳**
This library will later integrate with the LinID front-end test runner.

---

# **🚀 Releases (Semantic Release)**

Releases are fully automated using **Semantic Release**.

When a merge is performed into `main`:

* The version bump is automatically calculated from commit messages
* `package.json` is updated
* A changelog entry is generated
* A Git tag is created

⚠ No manual intervention is needed.

---

# **📜 License**

This project is licensed under the **GNU Affero General Public License v3**.
See: [`LICENSE.md`](LICENSE.md)
