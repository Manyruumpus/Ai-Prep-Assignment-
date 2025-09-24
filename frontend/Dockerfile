# STAGE 1: Build the React/Vue/Angular app
FROM node:20-alpine AS builder

WORKDIR /usr/src/app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of the app's source code
COPY . .

# Generate the static production build
RUN npm run build

# STAGE 2: Serve the static files with Nginx
FROM nginx:stable-alpine

# Copy the build output from the 'builder' stage
COPY --from=builder /usr/src/app/build /usr/share/nginx/html

# Nginx will be configured using a file from docker-compose
# Expose port 80 for the Nginx server
EXPOSE 80

# Start Nginx when the container launches
CMD ["nginx", "-g", "daemon off;"]