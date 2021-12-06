FROM node:16

WORKDIR /app

ADD package.json /app/package.json
ADD yarn.lock /app/yarn.lock
RUN npm i -g --force yarn
RUN cd /app && yarn install

ADD . /app
EXPOSE 3010