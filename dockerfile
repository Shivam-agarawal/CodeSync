# Stage 1: Build the React Frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /app/Frontend

# Install frontend dependencies
COPY Frontend/package*.json ./
RUN npm install

# Copy frontend source and build
COPY Frontend/ ./
RUN npm run build

# Stage 2: Serve using Express Backend
FROM node:20-alpine
WORKDIR /app/Backend

# Install backend dependencies
COPY Backend/package*.json ./
RUN npm install --omit=dev

# Copy backend source
COPY Backend/ ./

# Copy the built frontend site from Stage 1 into the Backend's "public" directory
COPY --from=frontend-builder /app/Frontend/dist ./public

# Expose the correct port
EXPOSE 4000

CMD ["node", "server.js"]