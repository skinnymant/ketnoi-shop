# ===== Build stage =====
FROM node:20-slim AS builder
WORKDIR /app

# Prisma cần openssl
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm ci

COPY . .
RUN npx prisma generate && npm run build

# ===== Run stage =====
FROM node:20-slim AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

# Copy toàn bộ app đã build (kèm node_modules + prisma client đã generate)
COPY --from=builder /app ./

EXPOSE 4000

# Chạy migration rồi khởi động server
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main"]
