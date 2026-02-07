# --------- Stage 1: Build ---------
FROM node:20-alpine AS build

WORKDIR /app

# Dependency caching
COPY package*.json ./
RUN npm ci

# Copy source
COPY . .

# Build TypeScript
RUN npm run build

# --------- Stage 2: Production ---------
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install only production deps
RUN npm ci --omit=dev

# Copy build output
COPY --from=build /app/dist ./dist

# dotenv-safe only needs example
COPY .env.example .env.example

EXPOSE 8000

CMD ["node", "dist/server.js"]