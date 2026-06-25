# ---- build ----
FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# ---- runtime ----
FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=build /app/dist ./dist
COPY src/views ./src/views
COPY public ./public
COPY migrations ./migrations
COPY seeds ./seeds
COPY scripts ./scripts
RUN mkdir -p uploads/videos uploads/captions uploads/images
EXPOSE 3000
CMD ["node", "dist/server.js"]
