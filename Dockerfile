FROM node:21-alpine

WORKDIR /home/node/app

COPY --chown=node:node package.json package-lock.json ./

RUN npm ci --production && npm cache clean --force

COPY --chown=node:node . ./

EXPOSE 8080

CMD ["node", "server.js"]
