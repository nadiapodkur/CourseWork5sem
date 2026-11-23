# Build context: repository root (see docker-compose.yml)
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json* ./
COPY server/package.json server/
COPY client/package.json client/
RUN npm ci -w server --include-workspace-root
COPY tsconfig.base.json ./
COPY server server
RUN npm run build -w server

FROM node:22-alpine
ENV NODE_ENV=production
WORKDIR /app
COPY package.json package-lock.json* ./
COPY server/package.json server/
COPY client/package.json client/
RUN npm ci -w server --omit=dev
COPY --from=build /app/server/dist server/dist
COPY server/migrations server/migrations
WORKDIR /app/server
EXPOSE 4000
CMD ["sh", "-c", "node dist/db/migrate.js && node dist/index.js"]
