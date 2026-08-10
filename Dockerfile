# syntax=docker/dockerfile:1
FROM node:20-bookworm-slim AS build
WORKDIR /app

COPY billard-web/package.json billard-web/package-lock.json ./
RUN npm ci

COPY billard-web/ ./
ARG VITE_API_URL=/api
ARG VITE_HUB_URL=/hubs/tables
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_HUB_URL=$VITE_HUB_URL
RUN npm run build

FROM nginx:1.27-alpine AS final
COPY --from=build /app/dist /usr/share/nginx/html
COPY deploy/nginx/conf.d/app.conf /etc/nginx/conf.d/default.conf
EXPOSE 80 443
