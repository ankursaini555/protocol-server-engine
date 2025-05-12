# Use the Node.js 18-alpine image as the base
FROM node:18-alpine

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json for dependency installation
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Compile TypeScript code to JavaScript
RUN npm run build


# Define the command to run your service
CMD ["node", "dist/index.js"]
