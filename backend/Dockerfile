# Backend image: a small Node.js image that runs the Express API.
FROM node:22-alpine

# All app files live in /app inside the container.
WORKDIR /app

# Copy package files first so Docker can cache the "npm ci" layer.
COPY package.json package-lock.json ./

# Install only production dependencies (no test tools).
# Then delete npm, npx, yarn and corepack: the app does not need them to run, and removing them
# removes their known vulnerabilities from the image (Trivy would report them).
RUN npm ci --omit=dev \
  && npm cache clean --force \
  && rm -rf /usr/local/lib/node_modules /usr/local/bin/npm /usr/local/bin/npx \
            /usr/local/bin/corepack /usr/local/bin/yarn /usr/local/bin/yarnpkg /opt/yarn*

# Copy the application source code.
COPY src ./src

# Run as the non-root "node" user for better security.
USER node

ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000

# Docker checks /health every 30 seconds to know if the container is healthy.
HEALTHCHECK --interval=30s --timeout=3s --retries=3 \
  CMD wget -qO- http://localhost:3000/health || exit 1

CMD ["node", "src/server.js"]
