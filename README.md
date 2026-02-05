# {PROJECT_NAME}

{PROJECT_DESCRIPTION}

## Getting Started

### Prerequisites

- [pnpm](https://pnpm.io/)
- Node.js (see `.node-version`)
- [Trunk](https://trunk.io/) (for linting and formatting)

### Installation

#### Install Trunk

On macOS, you can install Trunk using Homebrew:

```bash
brew install trunk-io
```

For other platforms, see the [Trunk installation guide](https://docs.trunk.io/references/cli/getting-started/install).

#### Install Dependencies

```bash
pnpm install
trunk install
```

### Development

```bash
pnpm dev
```

### Build

```bash
pnpm build
```

### Linting & Formatting

```bash
pnpm lint
pnpm format
```

## Project Structure

- `packages/`: Monorepo packages
  - `common/`: Shared utilities and types

## License

{LICENSE}
