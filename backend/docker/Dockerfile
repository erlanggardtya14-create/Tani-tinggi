# ══════════════════════════════════════════════════════════════════
# EcoTrace Backend — Multi-stage Docker Build
# ══════════════════════════════════════════════════════════════════

# Stage 1: Builder
# Install all dependencies and compile TypeScript
FROM node:20-slim AS builder

WORKDIR /app

# Install OpenSSL for Prisma
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

# Copy package files first for layer caching
COPY package.json package-lock.json* ./
COPY prisma ./prisma/

# Install ALL dependencies (including devDependencies for build)
RUN npm ci

# Generate Prisma client
RUN npx prisma generate

# Copy source code
COPY tsconfig.json ./
COPY src ./src/

# Build TypeScript
RUN npm run build

# ──────────────────────────────────────────────────────────────────
# Stage 2: Runner (production)
# Only copy built files and production dependencies
FROM node:20-slim AS runner

WORKDIR /app

# Install OpenSSL (Prisma), PM2, and curl (health checks)
RUN apt-get update -y && \
    apt-get install -y openssl curl && \
    npm install -g pm2 && \
    rm -rf /var/lib/apt/lists/*

# Create non-root user for security
RUN groupadd --gid 1001 ecotrace && \
    useradd --uid 1001 --gid ecotrace --shell /bin/bash --create-home ecotrace

# Copy package files and install production deps only
COPY package.json package-lock.json* ./
COPY prisma ./prisma/
RUN npm ci --omit=dev && npx prisma generate

# Copy built files from builder stage
COPY --from=builder /app/dist ./dist/

# Copy PM2 ecosystem config
COPY ecosystem.config.js ./

# Copy keys directory (if exists; mounted as volume in production)
COPY keys* ./keys/

# Set ownership
RUN chown -R ecotrace:ecotrace /app

# Switch to non-root user
USER ecotrace

# Expose API port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD curl -f http://localhost:3000/api/v1/health || exit 1

# Start with PM2 runtime
CMD ["pm2-runtime", "ecosystem.config.js", "--only", "ecotrace-api"]
