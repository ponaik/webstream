FROM nginx:latest

COPY web/dist                     /usr/share/nginx/html/dist
COPY nginx/nginx.conf             /etc/nginx/conf.d/default.conf
COPY nginx/certs                  /etc/nginx/certs
COPY hls                          /etc/nginx/media/hls

EXPOSE 443

CMD ["nginx", "-g", "daemon off;"]