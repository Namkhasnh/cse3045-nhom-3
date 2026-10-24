# Off-host candidate preparation only. No secrets, retained data or migrations at build time.
FROM node:24.22.0-bookworm-slim AS toolchain
RUN npm install --global npm@11.19.1

FROM toolchain AS backend-build
WORKDIR /app/backend
COPY backend/package.json backend/package-lock.json ./
RUN npm ci --ignore-scripts
COPY backend/tsconfig.json backend/tsconfig.build.json backend/nest-cli.json backend/prisma7.config.ts ./
COPY backend/prisma/schema.prisma ./prisma/schema.prisma
COPY backend/src ./src
RUN DATABASE_URL=mysql://build_only:unused@127.0.0.1:1/test_build npm run build

FROM backend-build AS backend-dependencies
RUN npm prune --omit=dev --ignore-scripts

# One-shot migration tooling; never used as the application runtime.
FROM backend-build AS schema-operator
USER root
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates && rm -rf /var/lib/apt/lists/*
RUN npm rebuild @prisma/engines && node node_modules/prisma/build/index.js -v
COPY backend/prisma/migrations ./prisma/migrations

FROM toolchain AS backend-runtime
ENV NODE_ENV=production
WORKDIR /app/backend
COPY --from=backend-dependencies /app/backend/node_modules ./node_modules
COPY --from=backend-build /app/backend/dist ./dist
COPY backend/package.json ./package.json
USER node
EXPOSE 3000
CMD ["node", "dist/main.js"]

FROM toolchain AS frontend-build
WORKDIR /app/frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci --ignore-scripts
COPY frontend/tsconfig.json frontend/tsconfig.app.json frontend/tsconfig.node.json frontend/vite.config.ts frontend/index.html ./
COPY frontend/src ./src
COPY frontend/public ./public
RUN npm run build

FROM scratch AS frontend-artifact
COPY --from=frontend-build /app/frontend/dist /

# Private SSH-tunnel entry; Linux host network, loopback-only listener.
# TLS files are supplied at runtime, never included in this image.
FROM toolchain AS private-web
WORKDIR /app
COPY --from=frontend-build /app/frontend/dist ./public
COPY ops/staging/private-web.mjs ./private-web.mjs
ENV STAGING_WEB_ROOT=/app/public NODE_OPTIONS=--max-old-space-size=32
USER node
CMD ["node", "private-web.mjs"]
