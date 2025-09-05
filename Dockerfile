# Use the official Node.js 18 LTS Alpine image for smaller size and better security
FROM node:18-alpine

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json (if available) for better Docker layer caching
COPY package*.json ./

# Install dependencies
# Using npm ci for faster, reliable, reproducible builds in production
RUN npm ci --only=production && npm cache clean --force

# Copy the rest of the application code
COPY . .

# Create a non-root user for better security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S fitstat -u 1001

# Change ownership of the app directory to the nodejs user
RUN chown -R fitstat:nodejs /app
USER fitstat

# Expose the port that the app runs on
EXPOSE 4000

# Start the application
CMD ["npm", "start"]
