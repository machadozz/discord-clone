FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# Build do React (Vite)
RUN npm run build

# Stage de Produção
FROM nginx:alpine

# Copiar os arquivos gerados no dist
COPY --from=builder /app/dist /usr/share/nginx/html

# Copiar a configuração do nginx para fallback (React Router)
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
