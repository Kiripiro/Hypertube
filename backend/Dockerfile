FROM node:20-alpine

WORKDIR /app

ENV PATH /app/node_modules/.bin:$PATH

COPY package.json /app/package.json
RUN npm install -g npm@10.2.5
RUN npm install -g nodemon

COPY . /app

CMD ["nodemon", "index.js"]