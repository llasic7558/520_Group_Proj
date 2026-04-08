FROM node:20-alpine

# argon2 needs build tools to compile its native module on Alpine.
# wget is included so the compose healthcheck can hit /health from inside
# the container (alpine doesn't ship curl).
RUN apk add --no-cache python3 make g++ wget

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY . .

EXPOSE 4000

CMD ["node", "src/server.js"]
