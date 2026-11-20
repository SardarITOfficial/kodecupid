# KodeCupid API — production image
#
# Build from the repository root:
#   docker build -f apps/api/Dockerfile -t kodecupid-api .
#
# Requires the database to have the PostGIS extension available.

FROM node:24-slim

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

RUN corepack enable \
  && apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install with the committed lockfile only.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/shared/package.json packages/shared/
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
RUN pnpm install --frozen-lockfile

COPY . .

RUN pnpm --filter @kodecupid/shared build \
  && cd apps/api && pnpm exec prisma generate && cd ../.. \
  && pnpm --filter api build

ENV NODE_ENV=production
WORKDIR /app/apps/api

# Local-disk photo storage lives here; mount a volume in production.
ENV STORAGE_LOCAL_DIR=/app/apps/api/storage
RUN mkdir -p /app/apps/api/storage

EXPOSE 4000

HEALTHCHECK --interval=30s --timeout=5s --start-period=25s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:4000/api/v1/health').then((r)=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "dist/main.js"]
