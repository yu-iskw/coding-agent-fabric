FROM node:24-slim

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends git make ca-certificates tree && rm -rf /var/lib/apt/lists/*

# Install pnpm
RUN npm install -g pnpm@10.28.1

WORKDIR /app

# Configure pnpm global bin directory
RUN pnpm config set global-bin-dir /usr/local/bin

# Copy workspace config and package files
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json tsconfig.base.json ./
COPY packages/ packages/
COPY integration_tests/ integration_tests/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Build the project
RUN pnpm build

# Link the CLI globally
WORKDIR /app/packages/cli
RUN pnpm link --global

# Prepare a clean workspace for integration tests
WORKDIR /test-workspace
ENV HOME=/home/node

# Make runner and scenarios executable
RUN chmod +x /app/integration_tests/scripts/runner.sh

# Use non-root user
RUN chown -R node:node /test-workspace /app
USER node

# Verify installation
RUN caf --version

# Satisfy trivy/DS026
HEALTHCHECK NONE

ENTRYPOINT ["/app/integration_tests/scripts/runner.sh"]
