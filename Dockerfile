# syntax=docker/dockerfile:1

# Set the Node.js version to use
ARG NODE_VERSION=20.12.2
FROM node:${NODE_VERSION}-slim as base

# Set working directory
WORKDIR /app

# Create a non-privileged user to run the app
ARG UID=10001
RUN adduser \
    --disabled-password \
    --gecos "" \
    --home "/nonexistent" \
    --shell "/sbin/nologin" \
    --no-create-home \
    --uid "${UID}" \
    appuser

# Install TypeScript
RUN npm install -g typescript

# Copying the package.json and package-lock.json (if available)
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY package*.json ./

# Leverage a cache mount to /root/.npm to speed up subsequent builds
RUN --mount=type=cache,target=/root/.npm \
    npm install

# Copy the rest of the application code
COPY . .

# Compile TypeScript to JavaScript
RUN tsc

# Expose the port the app runs on
EXPOSE 8081

# Use the non-privileged user to run the application
USER appuser

# Command to run the application, assuming the entry point is compiled to 'dist/app.js'
CMD ["node", "dist/app.js"]
