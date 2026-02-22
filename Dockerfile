# Use a single stage with Yarn; keep dev deps for build
FROM node:20-alpine

RUN apk add --no-cache python3 make g++ && corepack enable

WORKDIR /app

# Install dependencies (dev deps needed for Nest build)
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile --production=false

# Copy sources and config
COPY prisma ./prisma
COPY tsconfig*.json nest-cli.json prisma.config.ts ./
COPY src ./src

# Build (runs prisma generate via package script)
RUN yarn build

ENV NODE_ENV=production
ENV PORT=4000
EXPOSE 4000

CMD ["node", "dist/src/main.js"]
