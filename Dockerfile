FROM node:22-slim

WORKDIR /app

RUN corepack enable

COPY pnpm-lock.yaml pnpm-workspace.yaml package.json .npmrc tsconfig.base.json tsconfig.json ./
COPY artifacts ./artifacts
COPY lib ./lib
COPY scripts ./scripts
COPY attached_assets ./attached_assets

RUN pnpm install --frozen-lockfile

ENV NODE_ENV=production
ENV PORT=8080
ENV BASE_PATH=/

RUN pnpm --filter @workspace/vigr-apparel run build

RUN mkdir -p artifacts/api-server/public \
 && cp -r artifacts/vigr-apparel/dist/public/. artifacts/api-server/public/

RUN pnpm --filter @workspace/api-server run build

EXPOSE 8080

CMD ["pnpm", "--filter", "@workspace/api-server", "run", "start"]
