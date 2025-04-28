FROM node:23.11.0-slim

# Create app directory
WORKDIR /usr/src/app

# Copy package.json and package-lock.json
COPY package*.json /usr/src/app

# Install app dependencies
COPY prisma ./prisma/
RUN npm i
RUN npm i multer

# # Install OpenSSL
RUN apt-get update -y && apt-get install -y openssl

# Bundle app source
COPY . .

# Build the TypeScript files
RUN npm run build
RUN npx prisma generate
# Expose port 8080
EXPOSE 7130

# Start the app
CMD npm run start
