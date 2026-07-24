FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
COPY apps/mcp/package.json apps/mcp/package.json
COPY packages/shared/package.json packages/shared/package.json
RUN npm install
COPY . .
RUN npm run build -w @hackrails/shared && npm run build -w @hackrails/mcp
FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/apps/mcp/dist ./apps/mcp/dist
WORKDIR /app/apps/mcp
CMD ["node","dist/index.js"]
