# Stage 1: Build the application
FROM node:20 AS builder

WORKDIR /app

# Copy package files and install dependencies
COPY package.json .
# Use npm ci for reproducible builds if you have a package-lock.json
RUN npm install

# Copy the rest of the application source code
COPY . .

# Generate wrangler types
RUN npx wrangler types

# Build the application
RUN npm run build

# Stage 2: Production image
FROM node:20

WORKDIR /app

# Copy built assets from the builder stage
COPY --from=builder /app/dist ./dist
COPY package.json .
COPY wrangler.jsonc .

# Install dependencies
RUN npm install

# Expose the port wrangler dev runs on
EXPOSE 8787

# Start the worker
CMD ["npx", "wrangler", "dev", "--ip", "0.0.0.0"]