FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

EXPOSE 3000

# vite.config.js sets host: true and port: 3000, so no extra flags needed
CMD ["npm", "run", "dev"]
