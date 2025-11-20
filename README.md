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

## Architecture Overview

This project uses **Module Federation** to implement a **micro-frontend architecture** with two types of remotes:

### 1. Business Modules (Micro-Frontends)

Full-featured modules that implement business logic and features.

- Implement the **module lifecycle** system
- Manage their own state (Pinia stores)
- Register in `/public/config/` with configuration files

**See:** [Module Lifecycle Documentation](src/boot/README.md)

### 2. UI Component Library

**catalogUI**: A shared component library providing generic, reusable UI components.

- Does NOT implement the module lifecycle
- Does NOT require configuration files
- Components can be used directly via `loadRemote()`

## Configuration

### Module Federation Remotes (`/public/remotes.json`)

Lists all Module Federation remotes (both business modules and component library).

### Business Module Configuration (`/public/config/`)

Only business modules need configuration files.

**See:** [Configuration Documentation](public/config/README.md)

## Using Components

Components from remotes can be loaded using Module Federation:

```typescript
import { loadRemote } from '@module-federation/enhanced/runtime';
import { type Component, defineAsyncComponent } from 'vue';

const MyComponent = defineAsyncComponent({
  loader: () =>
    loadRemote<{ default: Component }>('catalogUI/SearchBar').then((mod) => {
      if (!mod?.default) {
        throw new Error('Failed to load component');
      }
      return mod.default;
    }),
});
```

## Adding New Remotes

### Adding a Business Module

1. Add remote to `/public/remotes.json`
2. Add module to `/public/config/modules.json`
3. Create module configuration file
4. Implement module lifecycle

**See:** [Module Lifecycle Documentation](src/boot/README.md) for implementation details.

### Adding UI Components (like catalogUI)

1. Add remote to `/public/remotes.json`
2. Use components via `loadRemote()`

No configuration or lifecycle implementation needed.

## Troubleshooting

### Module Not Loading

See [Module Lifecycle Documentation](src/boot/README.md#error-handling) for detailed troubleshooting.

### Component Not Loading

1. Verify remote is registered in `/public/remotes.json`
2. Check component is exposed in Module Federation config
3. Verify remote application is running (in development)
4. Check browser console for errors

## License

This project is licensed under the GNU Affero General Public License version 3 - see [LICENSE](LICENSE.md) for details.
