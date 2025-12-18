# **linid-im-front**

## **🧩 Overview**

`linid-im-front` is the **host application** of the LinID Identity Manager front-end ecosystem.
It is responsible for:

- Loading **remote modules** dynamically using **Module Federation**
- Integrating **community plugins** and **core components**
- Providing the main application shell (routing, layout, authentication context…)
- Exposing shared resources used across all modules

This project acts as the central entrypoint of the LinID front-end architecture and orchestrates how remote modules are loaded and connected together.

---

## **✨ Features**

- Hosts all **remote modules** (users, groups, organizations, workflow UI, catalog UI…)
- Dynamically loads **community plugins**
- Provides global router, layout container, and shared store
- Integrates with **Quasar UI** + **Vue 3 Composition API**

---

## **🛠️ Tech Stack**

| Area            | Technology               |
| --------------- | ------------------------ |
| Language        | TypeScript               |
| Framework       | Vue.js (Composition API) |
| UI Toolkit      | Quasar Framework         |
| Module System   | Module Federation        |
| Package Manager | pnpm / Corepack          |

---

## **📋 Requirements**

- **Node.js 20+**
- **pnpm 10.20.0** (managed via Corepack)
- A browser supporting dynamic module loading
- Recommended: Linux/macOS or WSL2 on Windows

---

# **📚 Documentation**

All documentation is available inside the `docs/` folder.

Below is the list of available guides:

---

### 🔗 **Configuring Remotes (Module Federation)**

How to register remote modules, set remote URLs, and configure dynamic loading.
→ [`remotes.md`](docs/remotes.md)

---

### 🧩 **Module Lifecycle Guide**

Explains how the module lifecycle system initializes, manages, and executes all lifecycle phases for business modules in the host application.
→ [`module-lifecycle.md`](docs/module-lifecycle.md)

---

### 🧩 **Modules Configuration Guide**

Explains how feature modules are declared, activated, organized, and displayed in the host.
→ [`modules.md`](docs/modules.md)

---

### 🛣️ **Route Management Guide**

Explains how the host automatically loads and registers routes from remote modules with Nunjucks templating support.
→ [`routes.md`](docs/routes.md)

---

> More documentation will be added as the host evolves.

---

## **📜 License**

This project is licensed under the **GNU Affero General Public License v3**.
See [`LICENSE`](LICENSE).

---

## **🤝 Contributing**

We welcome contributions to improve and extend linid-im-front.
Please refer to the **[CONTRIBUTING.md](CONTRIBUTING.md)** file in the repository for:

- Development workflow
- Code guidelines
- Commit conventions
- Pull request rules

---

# linid-im-front

A Vue 3 + Quasar web application for identity management, serving as the host application for LinID's modular identity platform.

## Getting Started

### Prerequisites

- Node.js >= 20 (supports ^20 || ^22 || ^24 || ^26 || ^28)
- pnpm 10.20.0 (managed via Corepack)

### Installation

```bash
# Clone the repo
git clone https://github.com/linagora/linid-im-front.git
cd linid-im-front

# Enable pnpm with corepack (included with Node.js 16.9+)
npm install --global corepack@latest
corepack enable pnpm

# Install dependencies (Corepack will use pnpm@10.20.0 automatically)
pnpm install
```

**Note:** The `packageManager` field in `package.json` ensures everyone uses the same pnpm version (10.20.0).

### Running Locally

```bash
# Development server
pnpm dev

# Build for production
pnpm build

# Lint code
pnpm lint

# Auto-fix ESLint issues
pnpm lint:fix

# Format code
pnpm format

# Check formatting without modifying files
pnpm format:check

# Run tests
pnpm test

# Run TypeScript type check
pnpm type-check

# Run all checks (type-check, lint, format, test)
pnpm validate
```

---

## **🐳 Docker**

You can build and run `linid-im-front` using Docker. The Docker setup uses a **multi-stage build**:

1. Build the application using Node + pnpm
2. Serve the built static files with Nginx

### **Build Docker Image**

```bash
docker build -f docker/Dockerfile -t linid-im-front .
```

### **Run Docker Container**

```bash
docker run -p 9000:80 linid-im-front
```

- The application will be accessible at `http://localhost:9000`
- The container serves the production build of the SPA from `/usr/share/nginx/html`

### **Notes**

- The Dockerfile uses **pnpm** to install dependencies and build the project.
- Make sure your `pnpm-lock.yaml` is included in the repository for deterministic builds.
- You can customize the Nginx configuration if needed by modifying `/etc/nginx/conf.d/default.conf` inside the container or providing a custom `nginx.conf` in the Docker build.

---

## Module Federation & Remote Configuration

This project uses Module Federation to load remote modules dynamically at runtime.

### Remote Configuration

Remote modules are configured in `public/remotes.json`. This file is loaded automatically at application startup.

**Structure:**

```json
{
  "remoteName": "https://remote-host/mf-manifest.json"
}
```

**Example (Development):**

```json
{
  "catalogUI": "http://localhost:5001/mf-manifest.json"
}
```

**Example (Production):**

```json
{
  "catalogUI": "https://catalog-ui.example.com/mf-manifest.json"
}
```

**Important:** In development, use URLs `http://` for remote controls to avoid having to manage SSL certificates. In production, use URLs `https://` with valid certificates.

### Adding or Modifying Remotes

1. Edit `public/remotes.json`
2. Add or modify remote entries with their manifest URLs
3. Restart the development server (no rebuild required)

**Note:** In development, ensure remote applications are running and accessible at the specified URLs (typically `http://localhost:PORT`).

### Using Remote Components

Remote components can be loaded dynamically using `loadRemote` from `@module-federation/enhanced/runtime`:

```typescript
import { loadRemote } from '@module-federation/enhanced/runtime';
import { type Component, defineAsyncComponent } from 'vue';

const RemoteComponent = defineAsyncComponent({
  // eslint-disable-next-line jsdoc/require-jsdoc
  loader: () =>
    // eslint-disable-next-line jsdoc/require-jsdoc
    loadRemote<{ default: Component }>('remoteName/ComponentName').then(
      (mod) => {
        if (!mod?.default) {
          throw new Error('Failed to load ComponentName component');
        }
        return mod.default;
      }
    ),
  errorComponent: {
    template: '<div>Failed to load ComponentName component</div>',
  },
});
```

The remote configuration is loaded automatically by the `remotes` boot file at application startup.

## License

This project is licensed under the GNU Affero General Public License version 3 - see [LICENSE](LICENSE.md) for details.
