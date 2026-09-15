# Static template registry — nginx serves only registry/*.json5 over HTTP
FROM nginx:alpine

COPY docker/registry/nginx.conf /etc/nginx/conf.d/default.conf
COPY registry /usr/share/nginx/html

EXPOSE 3017
