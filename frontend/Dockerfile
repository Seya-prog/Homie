FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Set environment variable for Tailwind CSS
ENV NODE_ENV=development

# Expose port
EXPOSE 3000

# Start the application in development mode for hot reloading
CMD ["npm", "run", "dev"]