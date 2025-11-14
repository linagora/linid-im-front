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

# Format code
pnpm format

# Run tests
pnpm test
```

## License

This project is licensed under the GNU Affero General Public License version 3 - see [LICENSE](LICENSE.md) for details.
