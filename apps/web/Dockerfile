FROM oven/bun:1.3.10 AS base
WORKDIR /app

FROM base AS install
COPY package.json bun.lock* ./
COPY apps/web/package.json apps/web/package.json
COPY packages/db/package.json packages/db/package.json
RUN bun install

FROM base AS development
COPY --from=install /app/node_modules ./node_modules
COPY . .
EXPOSE 5173
CMD ["bun", "run", "dev", "--cwd", "apps/web", "--host", "0.0.0.0", "--port", "5173"]
