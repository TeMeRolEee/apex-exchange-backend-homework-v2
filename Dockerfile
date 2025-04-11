FROM node:18-alpine

RUN mkdir -p "/home/node/app/node_modules"
WORKDIR /home/node/app

COPY .env /home/node/app/.env
COPY *.json ./
COPY *.js ./
COPY *.ts ./
COPY *.cjs ./
COPY src/ ./src/

RUN corepack enable && corepack prepare pnpm@latest --activate

RUN pnpm install

RUN pnpm run build

CMD ["pnpm", "dev"]
