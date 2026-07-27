FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/mcp/package.json apps/mcp/package.json
COPY apps/provider/package.json apps/provider/package.json
COPY apps/web/package.json apps/web/package.json
COPY packages/shared/package.json packages/shared/package.json
RUN npm install
COPY . .
RUN npm run build -w @hackrails/shared && npm run build -w @hackrails/provider
FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/apps/provider/package.json ./apps/provider/package.json
COPY --from=build /app/apps/provider/dist ./apps/provider/dist
COPY --from=build /app/packages/shared/dist ./packages/shared/dist
COPY --from=build /app/packages/shared/package.json ./packages/shared/package.json
COPY --from=build /app/organizer-knowledge ./organizer-knowledge
WORKDIR /app/apps/provider
EXPOSE 4002
CMD ["node","dist/index.js"]
