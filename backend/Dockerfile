# Keep this the same as BUN_VERSION in .github/workflows/cd.yml.
ARG BUN_VERSION=1.3.5

# Stage 1: generate the Prisma client. This needs the dev dependencies, so they
# stay in this stage and only the generated files are copied to the final image.
FROM oven/bun:${BUN_VERSION} AS build
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile
COPY . .
# prisma.config.ts needs DATABASE_URL to be set, but generate doesn't connect.
RUN DATABASE_URL=postgresql://placeholder:placeholder@localhost:5432/placeholder bun --bun run prisma generate

# Stage 2: the image that runs in production, with production dependencies only.
FROM oven/bun:${BUN_VERSION}-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production
# Lets /health report which commit is running.
ARG GIT_SHA=unknown
ENV GIT_SHA=${GIT_SHA}
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile --production
COPY . .
COPY --from=build /app/prisma/generated ./prisma/generated
# Don't run the server as root. Real secrets are set on the host at runtime.
USER bun
EXPOSE 3001
CMD ["bun", "index.ts"]
