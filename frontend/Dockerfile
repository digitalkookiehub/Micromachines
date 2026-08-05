# vite 8 requires Node 20.19+ / 22.12+
FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
# @tailwindcss/vite@4.2.1 declares peer vite "^5.2.0 || ^6 || ^7" but works with
# the vite 8 pinned in package-lock.json. --legacy-peer-deps skips that check
# while still installing exactly what the lockfile specifies.
RUN npm ci --legacy-peer-deps
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
