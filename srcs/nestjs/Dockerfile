FROM node:18.17.1

RUN npm install -g npm@10.2.0 && npm install -g @nestjs/cli@10.1.16

WORKDIR /app

#ENTRYPOINT ["bash", "-c", "npm ci && npm run start:dev " ]
ENTRYPOINT ["bash", "-c", "npm ci && npm run build && npm run  start:prod" ]
