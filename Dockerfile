# Simple single-stage build
FROM node:20-alpine

RUN apk add --no-cache python3 make g++ && corepack enable

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=4000

# Install deps
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

# Copy sources
COPY prisma ./prisma
COPY tsconfig*.json nest-cli.json prisma.config.ts ./
COPY src ./src

# Build and ensure Prisma client is available at runtime
RUN npx prisma generate \
 && yarn build \
 && mkdir -p dist/prisma/generated \
 && cp -r node_modules/.prisma/client dist/prisma/generated/

EXPOSE 4000
CMD ["node", "dist/src/main.js"]
