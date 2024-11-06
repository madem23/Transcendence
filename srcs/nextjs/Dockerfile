FROM node:18.17.1

RUN npm install -g npm@10.2.0

WORKDIR /app

#ENTRYPOINT ["bash", "-c", "npm ci && npm run dev" ]
ENTRYPOINT ["bash", "-c", "npm ci && npm run build && npm run start"]
