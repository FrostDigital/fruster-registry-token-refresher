FROM mhart/alpine-node:14

RUN apk add --update bash && rm -rf /var/cache/apk/*
WORKDIR /app
ADD . .

RUN npm install

CMD ["node", "index.js"]
