# Stage 1: Build the application
FROM node:20 AS builder

WORKDIR /app

# Copy package files and install dependencies
COPY package.json .
# Use npm ci for reproducible builds if you have a package-lock.json
RUN npm install

# Copy the rest of the application source code
COPY . .

# Build the application
RUN npm run build

# Stage 2: Production image
FROM node:20

WORKDIR /app

# Copy built assets from the builder stage
COPY --from=builder /app/dist ./dist
COPY package.json .

# Install dependencies
RUN npm install

# Expose the port vite runs on
EXPOSE 3000

# Start the dev server
CMD ["npx", "vite", "dev", "--host", "0.0.0.0", "--port", "3000"]