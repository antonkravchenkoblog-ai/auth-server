# Build stage
FROM node:20-alpine AS builder

RUN apk add --no-cache python3 make g++
RUN corepack enable

WORKDIR /app

# Provide a default datasource for Prisma generate; override at build/runtime as needed
ARG DATABASE_URL=postgresql://postgres:postgres@localhost:5432/postgres?schema=public
ENV DATABASE_URL=${DATABASE_URL}

COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

COPY prisma ./prisma
COPY tsconfig*.json nest-cli.json prisma.config.ts ./
COPY src ./src

RUN npx prisma generate
RUN yarn build

# Runtime stage
FROM node:20-alpine

RUN corepack enable
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=4000

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/dist ./dist

EXPOSE 4000

CMD ["node", "dist/main"]
