FROM node:20-alpine

WORKDIR /app

ENV PATH /app/node_modules/.bin:$PATH

COPY package.json /app/package.json
RUN npm install
RUN npm install -g @angular/cli

ENV NG_FORCE_SUBDOMAIN 1

CMD ["ng", "serve", "--host", "0.0.0.0", "--disable-host-check"]