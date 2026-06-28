# Stage 1: Build
FROM node:20-alpine AS build
WORKDIR /app

# Install dependencies
COPY package.json package-lock.json ./
RUN npm ci

# Inject build-time env vars (ARG -> ENV so Vite picks them up from process.env)
ARG VITE_API_URL=""
ARG VITE_API_KEY=""
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_API_KEY=$VITE_API_KEY

# Copy source and build
COPY . .
RUN npm run build

# Stage 2: Serve
FROM nginx:alpine

# Copy built assets
COPY --from=build /app/dist /usr/share/nginx/html

# Copy custom nginx config
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
