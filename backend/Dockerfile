# Use an official Node.js runtime as a parent image
FROM node:18-alpine

# Set the working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json to the working directory
COPY package*.json ./

# Install application dependencies
RUN npm install

# Bundle your app's source code inside the Docker image
COPY . .

# Your app binds to port 5000, so expose it
EXPOSE 5000

# Define the command to run your app
CMD [ "npm", "start" ]
