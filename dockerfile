# Build frontend assets inside the image so deployment does not depend on local dist artifacts.
FROM node:20-alpine AS frontend-builder
WORKDIR /app/Frontend
COPY Frontend/package*.json ./
RUN npm ci
COPY Frontend/ ./
RUN npm run build

FROM node:20-alpine
WORKDIR /app/Backend

ENV NODE_ENV=production

# Install build tools for native modules in the backend.
RUN apk add --no-cache python3 make g++
COPY Backend/package*.json ./
RUN npm ci --omit=dev

# Remove build tools after dependency installation to keep runtime image lean.
RUN apk del python3 make g++

# Copy backend source.
COPY Backend/ ./

# Copy built frontend assets from the frontend build stage.
COPY --from=frontend-builder /app/Frontend/dist ./public

EXPOSE 4000

CMD ["node", "server.js"]