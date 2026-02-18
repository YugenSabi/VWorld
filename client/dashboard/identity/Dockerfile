FROM node:20-alpine

WORKDIR /app

COPY package.json yarn.lock ./
COPY dashboard/identity/package.json ./dashboard/identity/package.json
COPY dashboard/identity/fragments/game/package.json ./dashboard/identity/fragments/game/package.json
COPY dashboard/identity/fragments/home/package.json ./dashboard/identity/fragments/home/package.json
COPY ui/button/package.json ./ui/button/package.json
COPY ui/layout/package.json ./ui/layout/package.json
COPY ui/text/package.json ./ui/text/package.json
COPY ui/theme/package.json ./ui/theme/package.json
COPY ui/icons/package.json ./ui/icons/package.json

RUN yarn install --frozen-lockfile

COPY . .

ARG NEXT_PUBLIC_API_URL=http://localhost:8000
ARG NEXT_PUBLIC_WS_URL=ws://localhost:8000
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
ENV NEXT_PUBLIC_WS_URL=${NEXT_PUBLIC_WS_URL}
RUN yarn workspace @dashboard/identity build

EXPOSE 3000

CMD ["yarn", "workspace", "@dashboard/identity", "start"]
