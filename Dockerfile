FROM node:20-alpine

WORKDIR /app

# install dependencies first so the layer is cached
COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 3000

CMD ["npm", "run", "docker:start"]
