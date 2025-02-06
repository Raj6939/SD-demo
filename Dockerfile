FROM node:18 AS build-stage

WORKDIR /app

COPY ./package.json .

RUN npm i

COPY . . 

RUN npm run build

FROM nginx:latest AS production-stage

COPY --from=build-stage /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]