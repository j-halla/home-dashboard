# ===== Development Stage =====
FROM node:14 AS dev

WORKDIR /app

COPY package*.json ./

RUN npm install

# Install nodemon for hot reload
RUN npm install --save-dev nodemon

COPY . .

EXPOSE 3000

# Nodemon for development
CMD ["npx", "nodemon", "src/app.js"]


# ===== Production Stage =====
FROM node:14 AS prod
WORKDIR /app

COPY package*.json ./
RUN npm install --only=production

COPY . .

EXPOSE 3000

# Start normally in production
CMD ["node", "src/app.js"]