FROM node:18-alpine

WORKDIR /app

# Install dependencies required for native modules (like bcrypt)
RUN apk add --no-cache python3 make g++

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 5000

CMD ["node", "server.js"]
