FROM node:22.14.0-alpine
WORKDIR /app
RUN apk add --no-cache git ca-certificates
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY packages/contracts packages/contracts
COPY packages/core packages/core
COPY infra/updater infra/updater
RUN corepack enable && pnpm install --filter "@sentrabot/updater..."
RUN --mount=type=cache,target=/root/.local/share/pnpm/store/v3 \
    pnpm --filter "@sentrabot/updater..." build
