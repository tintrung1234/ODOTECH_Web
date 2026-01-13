# 1 Build stage
FROM node:20 AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# 2 Serve stage
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html

# Nginx listen 80
RUN sed -i 's/listen 80;/listen 80;/' /etc/nginx/conf.d/default.conf

EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
