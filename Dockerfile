FROM node:20-alpine
RUN apk add --no-cache python3 make g++ && corepack enable
WORKDIR /app
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile --production=false
COPY prisma ./prisma
COPY tsconfig*.json nest-cli.json prisma.config.ts ./
COPY src ./src
RUN yarn build
EXPOSE 4000
CMD ["node", "dist/src/main.js"]
