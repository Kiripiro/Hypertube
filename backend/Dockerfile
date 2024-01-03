FROM node:21-alpine

WORKDIR /app

ENV PATH /app/node_modules/.bin:$PATH

COPY package.json /app/package.json
RUN npm install -g nodemon && \
    npm install

COPY . /app

CMD ["nodemon", "index.js"]