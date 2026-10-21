FROM node:22.23.4-bookworm-slim AS base
ENV PUPPETEER_SKIP_DOWNLOAD=true
WORKDIR /app
RUN corepack enable

FROM base AS build
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile --non-interactive
COPY . .
RUN node ace build --production

FROM base AS dependencies
COPY package.json yarn.lock ./
RUN yarn install --production --frozen-lockfile --non-interactive && yarn cache clean

FROM base AS production
RUN apt-get update && apt-get install -y --no-install-recommends \
    chromium ffmpeg python3 cron ca-certificates fonts-liberation \
    && rm -rf /var/lib/apt/lists/*
ENV NODE_ENV=production CHROMIUM_EXECUTABLE=/usr/bin/chromium
COPY --from=build /app/build ./
COPY --from=dependencies /app/node_modules ./node_modules
COPY bin/ ./bin/
COPY config/crontab /etc/cron.d/opepen
RUN chmod 0755 /app/bin/cron /app/bin/web && chmod 0644 /etc/cron.d/opepen \
    && mkdir -p tmp/uploads app/Services/Metadata/Reveal/data app/Services/Metadata/Reveal/results
EXPOSE 3333
CMD ["/app/bin/web"]
