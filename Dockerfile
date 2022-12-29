FROM node:19.3.0-alpine AS builder

RUN npm i -g pnpm@7.21.0
RUN apk update

WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .

RUN pnpm prisma generate
RUN pnpm typecheck
RUN pnpm build
RUN pnpm prune --prod

# FROM node:19.3.0-alpine AS runner

# RUN npm i -g pnpm@7.21.0
# RUN apk update

# WORKDIR /app

# RUN addgroup --system --gid 1001 tellchima
# RUN adduser --system --uid 1001 tellchima
# USER tellchima

# COPY --from=builder --chown=tellchima:tellchima /app .

CMD ["pnpm", "start:prod"]
