FROM apify/actor-node:20

COPY --chown=myuser package*.json ./
RUN npm --quiet set progress=false && npm ci --omit=dev --omit=optional

COPY --chown=myuser dist ./dist

CMD ["node", "dist/main.js"]
