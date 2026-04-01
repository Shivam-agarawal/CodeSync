# CodeSync Production Setup
FROM node:20-alpine
WORKDIR /app/Backend

# Install build tools for native modules in the backend
RUN apk add --no-cache python3 make g++
COPY Backend/package*.json ./
RUN npm install --omit=dev

# We can remove build tools after installing to keep the image lean
RUN apk del python3 make g++

# Copy backend source
COPY Backend/ ./

# Copy the PRE-BUILT frontend directly from the host machine
COPY Frontend/dist ./public

# Expose the correct port
EXPOSE 4000

CMD ["node", "server.js"]