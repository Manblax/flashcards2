FROM node:22-bookworm-slim AS dependencies

WORKDIR /app

COPY package*.json ./
RUN npm ci

FROM dependencies AS build

ARG NEXT_PUBLIC_API_URL=http://localhost:3001
ARG INTERNAL_API_URL=http://localhost:3001

ENV NEXT_TELEMETRY_DISABLED=1
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV INTERNAL_API_URL=$INTERNAL_API_URL

COPY next.config.mjs postcss.config.mjs tsconfig.json ./
COPY app ./app
COPY components ./components
COPY lib ./lib
COPY types ./types
RUN npm run build

FROM node:22-bookworm-slim AS runtime

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --from=build /app/.next ./.next
COPY next.config.mjs ./

EXPOSE 3000

CMD ["npm", "run", "start"]
