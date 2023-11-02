FROM node:alpine AS pruner
RUN apk add --no-cache libc6-compat
RUN apk update
WORKDIR /app
RUN npm install -g pnpm
RUN npm install -g turbo
COPY . .
RUN turbo prune --scope=web --docker

FROM node:alpine AS builder
RUN apk add --no-cache libc6-compat
RUN apk update
WORKDIR /app
RUN npm install -g pnpm
RUN npm install -g turbo
# First install the dependencies (as they change less often)
COPY --from=pruner /app/out/json/ .
COPY --from=pruner /app/out/pnpm-lock.yaml ./pnpm-lock.yaml
RUN pnpm install
# Build the project
COPY --from=pruner /app/out/full/ .
COPY turbo.json turbo.json
RUN turbo run build --filter=web...

FROM node:alpine AS runner
WORKDIR /app

# Don't run production as root
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/apps/web/next.config.js .
COPY --from=builder /app/apps/web/package.json .
# Automatically leverage output traces to reduce image size
# https://webjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder  /app/apps/web/.next/standalone ./
COPY --from=builder  /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder  /app/apps/web/public ./apps/web/public
# Allow write access to .next folder
RUN chown -R nextjs:nodejs /app/apps/web/.next
USER nextjs

CMD node apps/web/server.js