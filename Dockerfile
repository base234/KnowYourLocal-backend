FROM node:22.0.0

# Set working directory
WORKDIR /globehopper

# Install dependencies
COPY package*.json ./
RUN rm -rf node_modules package-lock.json && npm install && npm cache clean --force

# Copy the app code
COPY . .

# Expose the port AdonisJS runs on
EXPOSE 3333

# Command to run the app
CMD ["node", "ace", "serve", "--hmr"]
