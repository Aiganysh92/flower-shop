# Frontend image, built in two stages.

# Stage 1 ("build"): use Node.js to build the React app into static files (dist/).
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: serve the static files with nginx. Node.js is not included in the final image,
# so the image is small. The "unprivileged" nginx image runs as a non-root user.
FROM nginxinc/nginx-unprivileged:stable-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 5173
CMD ["nginx", "-g", "daemon off;"]
