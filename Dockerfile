FROM node:20-alpine

# Install dependencies
RUN apk add --no-cache bash git openssh

# Add deploy key
ADD id_deploy /root/.ssh/id_rsa
RUN chmod 600 /root/.ssh/id_rsa
RUN touch /root/.ssh/known_hosts && ssh-keyscan github.com >> /root/.ssh/known_hosts

# Clone your repo
RUN git clone git@github.com:%user%/%repo%.git /app

WORKDIR /app

# Install deps + build
RUN npm install
RUN npm run build

# Install PM2 globally
RUN npm install -g pm2

# Add entrypoint
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 3000
CMD ["/bin/bash", "/entrypoint.sh"]

