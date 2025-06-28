FROM node:20-alpine

# Install ping utility
RUN apk add --no-cache iputils

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build

# Set environment variables
ENV NODE_ENV=production
ENV WORKER_ENABLED=true

# Start the worker
CMD ["node", "dist/server.js"] 