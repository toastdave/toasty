FROM oven/bun:1 AS base
WORKDIR /app

COPY package.json bun.lock tsconfig.json ./
COPY src ./src
RUN bun install --frozen-lockfile
RUN bun run build

EXPOSE 3000
ENTRYPOINT [ "bun", "./dist/index.js" ]
