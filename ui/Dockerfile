# stage 1 - build environment
FROM node:18.12.1 as react-build
ARG REACT_APP_GRAPHQL_URI
ARG REACT_APP_AUTH_METHOD
ARG REACT_APP_ENCRYPTION_KEY
ARG REACT_APP_SEGMENT_API_KEY
ENV REACT_APP_GRAPHQL_URI=$REACT_APP_GRAPHQL_URI
ENV REACT_APP_AUTH_METHOD=$REACT_APP_AUTH_METHOD
ENV REACT_APP_ENCRYPTION_KEY=$REACT_APP_ENCRYPTION_KEY
ENV REACT_APP_SEGMENT_API_KEY=$REACT_APP_SEGMENT_API_KEY
RUN mkdir -p /app
WORKDIR /app
COPY . ./
RUN npm install --legacy-peer-deps
RUN npm run build

# stage 2 - production environment
FROM nginx:alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=react-build /app/build /usr/share/nginx/html/
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]