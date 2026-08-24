FROM node:18-alpine AS builder

WORKDIR /app

# Instalar dependências
COPY package*.json ./
RUN npm ci

# Copiar código fonte
COPY . .

# Gerar Prisma client e buildar o projeto
RUN npx prisma generate
RUN npm run build

# Stage de Produção
FROM node:18-alpine

WORKDIR /app

# Copiar apenas os artefatos necessários
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY package*.json ./

# Criar pastas de uploads
RUN mkdir -p uploads/avatars uploads/icons

ENV NODE_ENV=production

EXPOSE 3000

# Executar as migrações antes de iniciar o servidor (em prod real, use um init container ou script)
CMD npx prisma migrate deploy && npm run start:prod
