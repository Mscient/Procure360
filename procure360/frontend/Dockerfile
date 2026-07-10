# Stage 1: Build the React application
FROM node:18-alpine AS build

WORKDIR /app

# Install dependencies first for better caching
COPY package.json package-lock.json* ./
RUN npm install

# Copy the rest of the code and build
COPY . .
# Tell Vite to point API requests to the relative /api path (which nginx proxies)
ENV VITE_API_URL=/api
RUN npm run build

# Stage 2: Serve with Nginx
FROM nginx:alpine

# Copy our custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy the built assets from Stage 1
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
