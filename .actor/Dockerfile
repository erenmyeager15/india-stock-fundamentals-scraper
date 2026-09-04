FROM apify/actor-node:20

COPY --chown=myuser package*.json ./
RUN npm --quiet set progress=false && npm ci --omit=dev --omit=optional

COPY --chown=myuser src ./src

CMD ["node", "--import", "tsx", "src/main.ts"]
