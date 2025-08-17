FROM node:22-alpine

ENV PROJECT_HOME=/usr/app/

# Install yarn globally
RUN npm install -g yarn

# RUN mkdir -p /home/node/app/node_modules && chown -R node:node /home/node/app
USER node

WORKDIR ${PROJECT_HOME}

COPY --chown=node:node package*.json ${PROJECT_HOME}

RUN yarn install --production \
    && chown -R node:node .

COPY --chown=node:node . $PROJECT_HOME

RUN yarn build

EXPOSE 8080

ENV NAME e-commerce

CMD ["yarn", "dev"]