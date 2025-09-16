FROM docker.io/node:22.17-alpine AS base
WORKDIR /app

RUN apk update && \
    apk add \
    bash \
    curl \
    && \
    rm -rf /var/cache/apk/* 

FROM base AS deps
WORKDIR /deps
ENV NODE_ENV=production

COPY .npmrc tsconfig.json ./package.json ./package-lock.json ./build-env.js /deps/

COPY ./src/ /deps/src/

RUN npm ci && \
    npm dedupe && \
    npm prune && \
    npx --yes modclean --run

FROM base AS build
WORKDIR /build
ENV NODE_ENV=production
COPY --from=deps /deps/ /build/

RUN npm run build

FROM base AS run
WORKDIR /app
ENV NODE_ENV=production

COPY --from=build /build/node_modules/ /app/node_modules/
COPY --from=build /build/build/ /app/build/
COPY --from=build /build/dist/ /app/dist/
COPY ./package.json /app/
COPY ./assets/ /app/assets/

COPY ./docker-entrypoint /docker-entrypoint/
COPY ./docker-entrypoint.sh /docker-entrypoint/
RUN chmod +x /docker-entrypoint/docker-entrypoint.sh

ENTRYPOINT ["/docker-entrypoint/docker-entrypoint.sh"]

ENV PAYLOAD_CONFIG_PATH=dist/mzinga.config.js \
    NODE_ENV=production 

CMD ["node", "--require", "./dist/tracing.js", "dist/server.js"]