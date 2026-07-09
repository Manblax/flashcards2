FROM node:22-bookworm-slim AS dependencies

WORKDIR /app

COPY package*.json ./
RUN npm ci

FROM dependencies AS build

COPY nest-cli.json tsconfig*.json ./
COPY src ./src
RUN npm run build

FROM node:22-bookworm-slim AS runtime

ENV NODE_ENV=production
ENV PORT=4000

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --from=build /app/dist ./dist

EXPOSE 4000

CMD ["npm", "run", "start:prod"]
