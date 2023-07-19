FROM node:13

# Create app directory
WORKDIR /usr/src/app
# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY package*.json ./
RUN npm install
# If you are building your code for production
# RUN npm ci --only=production
# Bundle app source
COPY . .
#COPY .env .
ARG envname
COPY .env.$envname ./.env
RUN rm -rf ./.env.development
RUN rm -rf ./.env.production
RUN rm -rf ./.env.test
EXPOSE 3001
CMD [ "npm", "run", "server" ]