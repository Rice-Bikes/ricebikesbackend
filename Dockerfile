FROM node:20-slim

# Accept build arguments
ARG DATABASE_URL=postgresql://localhost:5432/ricebikes
ARG CORS_ORIGIN=http://localhost:5173

# Create app directory
WORKDIR /usr/src/app

# Copy package.json and package-lock.json
COPY package*.json /usr/src/app

# Install app dependencies
COPY drizzle ./drizzle/
RUN npm ci

# Install OpenSSL
RUN apt-get update -y && apt-get install -y openssl

# Bundle app source
COPY . .

# Set environment variables
ENV DATABASE_URL=${DATABASE_URL}
ENV CORS_ORIGIN=${CORS_ORIGIN}
ENV NODE_ENV=production

# Build the TypeScript files
RUN npm run build


# Expose port
EXPOSE 7130

# Start the app
CMD ["npm", "run", "start"]
