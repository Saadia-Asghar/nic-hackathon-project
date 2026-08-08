# Hunar Naqsha — multi-stage production image
FROM node:24-bookworm-slim AS build
WORKDIR /app
COPY package.json package-lock.json* ./
COPY client/package.json client/package-lock.json* ./client/
COPY server/package.json server/package-lock.json* ./server/
RUN npm install --prefix client && npm install --prefix server && npm install
COPY client ./client
COPY server ./server
RUN npm run build --prefix client

FROM node:24-bookworm-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3001
ENV CLIENT_DIST=/app/client/dist
COPY --from=build /app/server /app/server
COPY --from=build /app/client/dist /app/client/dist
WORKDIR /app/server
EXPOSE 3001
CMD ["node", "src/index.js"]
