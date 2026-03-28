# ── Stage 1: Build frontend ──────────────────────
FROM node:20-slim AS frontend-build
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY tsconfig*.json vite.config.ts index.html ./
COPY src/ src/
COPY public/ public/
RUN npm run build

# ── Stage 2: Build & run backend ─────────────────
FROM node:20-slim AS production
WORKDIR /app

# Install FFmpeg for video processing
RUN apt-get update && apt-get install -y --no-install-recommends ffmpeg && \
    rm -rf /var/lib/apt/lists/*

# Copy server source & install deps
COPY server/package*.json ./server/
WORKDIR /app/server
RUN npm ci --omit=dev

COPY server/tsconfig.json ./
COPY server/src/ src/

# Copy built frontend into server's static directory
COPY --from=frontend-build /app/dist /app/client-dist

# Create uploads directory for video processing
RUN mkdir -p /app/server/uploads

# Expose port 3000
EXPOSE 3000

# Environment vars (will be overridden by nexlayer.yaml)
ENV NODE_ENV=production
ENV PORT=3000

# Start the server
CMD ["npx", "ts-node", "src/index.ts"]
