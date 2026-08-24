# Discord Clone — Etapa 3: Amizades e Mensagens Diretas (DM)

Chat, servidores, canais, autenticação, chamadas de voz/vídeo/tela, **amizades e DMs**.

## Estrutura

```
discord-clone/
├── docker-compose.yml   # Postgres + Redis prontos pra rodar localmente
└── backend/             # API NestJS
    ├── prisma/schema.prisma   # modelo do banco de dados
    ├── prisma.config.ts       # configuração do Prisma 7
    └── src/
        ├── auth/         # registro, login, JWT
        ├── servers/      # servidores (guilds)
        ├── channels/     # canais de texto/voz dentro de um servidor
        ├── messages/     # histórico de mensagens (REST)
        ├── chat/         # gateway Socket.IO (tempo real)
        ├── friendships/  # sistema de amizade (pedidos, bloqueio)
        ├── dms/          # mensagens diretas (conversas 1-a-1)
        ├── voice/        # chamadas LiveKit
        ├── redis/        # presença online/offline
        └── prisma/       # conexão com o banco
```

## Como rodar (na sua máquina)

### Opção A — Com Docker (Postgres + Redis)

```bash
cd discord-clone
docker compose up -d
cd backend
cp .env.example .env   # ajuste JWT_SECRET
npm install
npx prisma migrate dev --name init
npm run start:dev
```

### Opção B — Sem Docker (SQLite + Redis in-memory)

```bash
cd discord-clone/backend
cp .env.example .env
```

Edite o `.env`:
```
DATABASE_URL="file:./dev.db"
```

Edite `prisma/schema.prisma`, troque `postgresql` por `sqlite`:
```prisma
datasource db {
  provider = "sqlite"
}
```

```bash
npm install
npx prisma generate
npx prisma migrate dev --name init
npm run start:dev
```

A API sobe em `http://localhost:3000`.

## Testando a API

### Registrar usuário
```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"joao","email":"joao@teste.com","password":"senha1234"}'
```
Isso devolve um `accessToken` — use ele no header `Authorization: Bearer <token>` nas próximas chamadas.

### Criar servidor
```bash
curl -X POST http://localhost:3000/servers \
  -H "Authorization: Bearer SEU_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Meu Servidor"}'
```

### Conectar no chat em tempo real (Socket.IO)
```js
import { io } from "socket.io-client";

const socket = io("http://localhost:3000/chat", {
  auth: { token: "SEU_TOKEN" }
});

socket.on("connect", () => {
  socket.emit("channel:join", { channelId: "ID_DO_CANAL" });
});

socket.on("message:new", (msg) => console.log("Nova mensagem:", msg));

socket.emit("message:send", { channelId: "ID_DO_CANAL", content: "Oi galera!" });
```

---

## Etapa 3: Amizades e Mensagens Diretas (DM)

### Endpoints REST — Amizades (`/friends`)

| Método | Rota | Descrição |
|--------|------|-----------|
| `POST` | `/friends/request` | Enviar pedido de amizade |
| `POST` | `/friends/:id/respond` | Aceitar/recusar pedido |
| `DELETE` | `/friends/:id` | Remover amizade |
| `POST` | `/friends/block` | Bloquear usuário |
| `DELETE` | `/friends/block/:userId` | Desbloquear usuário |
| `GET` | `/friends` | Listar amigos aceitos |
| `GET` | `/friends/pending` | Listar pedidos pendentes |
| `GET` | `/friends/blocked` | Listar bloqueados |

#### Exemplos

**Enviar pedido de amizade** (pela tag usuario#0001):
```bash
curl -X POST http://localhost:3000/friends/request \
  -H "Authorization: Bearer SEU_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"username":"maria","discriminator":"0001"}'
```

**Aceitar pedido**:
```bash
curl -X POST http://localhost:3000/friends/ID_DO_PEDIDO/respond \
  -H "Authorization: Bearer SEU_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"accept":true}'
```

**Listar amigos**:
```bash
curl http://localhost:3000/friends \
  -H "Authorization: Bearer SEU_TOKEN"
```

**Bloquear alguém**:
```bash
curl -X POST http://localhost:3000/friends/block \
  -H "Authorization: Bearer SEU_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"userId":"ID_DO_USUARIO"}'
```

### Endpoints REST — Mensagens Diretas (`/dms`)

| Método | Rota | Descrição |
|--------|------|-----------|
| `POST` | `/dms` | Criar/buscar conversa com outro usuário |
| `GET` | `/dms` | Listar todas as conversas (com última mensagem) |
| `GET` | `/dms/:conversationId/messages` | Histórico paginado (cursor-based) |

#### Exemplos

**Criar conversa DM**:
```bash
curl -X POST http://localhost:3000/dms \
  -H "Authorization: Bearer SEU_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"userId":"ID_DO_AMIGO"}'
```

**Listar conversas**:
```bash
curl http://localhost:3000/dms \
  -H "Authorization: Bearer SEU_TOKEN"
```

**Histórico de mensagens** (com paginação):
```bash
curl "http://localhost:3000/dms/ID_DA_CONVERSA/messages?cursor=ID_DA_ULTIMA_MSG" \
  -H "Authorization: Bearer SEU_TOKEN"
```

### Eventos Socket.IO — Amizades

```js
// Enviar pedido de amizade
socket.emit("friend:request", { username: "maria", discriminator: "0001" });

// Escutar pedido recebido
socket.on("friend:request:received", ({ friendshipId, from }) => {
  console.log(`Pedido de amizade de ${from.username}#${from.discriminator}`);
});

// Responder pedido
socket.emit("friend:respond", { friendshipId: "ID", accept: true });

// Escutar quando alguém aceita seu pedido
socket.on("friend:accepted", ({ friendshipId, user }) => {
  console.log(`${user.username} aceitou seu pedido!`);
});

// Remover amizade
socket.emit("friend:remove", { friendshipId: "ID" });

// Escutar quando alguém te remove
socket.on("friend:removed", ({ friendshipId, removedBy }) => {
  console.log(`Amizade removida por ${removedBy}`);
});
```

### Eventos Socket.IO — Mensagens Diretas

```js
// Enviar mensagem direta
socket.emit("dm:send", { conversationId: "ID_DA_CONVERSA", content: "E aí!" });

// Escutar nova mensagem
socket.on("dm:new", ({ conversationId, message }) => {
  console.log(`DM de ${message.sender.username}: ${message.content}`);
});

// Indicador "digitando..."
socket.emit("dm:typing:start", { conversationId: "ID" });
socket.emit("dm:typing:stop", { conversationId: "ID" });

socket.on("dm:typing:update", ({ conversationId, username, typing }) => {
  if (typing) console.log(`${username} está digitando...`);
});
```

---

## Etapa 2: Chamadas via LiveKit (voz, vídeo e compartilhamento de tela)

### Opção A — LiveKit Cloud (mais fácil pra começar)
1. Crie uma conta grátis em https://cloud.livekit.io
2. Crie um projeto e copie a **URL do servidor**, a **API Key** e o **API Secret**
3. Cole essas 3 informações no seu `.env`:
   ```
   LIVEKIT_URL="wss://seu-projeto.livekit.cloud"
   LIVEKIT_API_KEY="..."
   LIVEKIT_API_SECRET="..."
   ```

### Opção B — Rodar o LiveKit você mesmo (self-hosted, via Docker)
Adicione ao `docker-compose.yml`:
```yaml
  livekit:
    image: livekit/livekit-server:latest
    command: --dev --node-ip=127.0.0.1
    ports:
      - "7880:7880"
      - "7881:7881"
      - "50000-50100:50000-50100/udp"
```

### Testando manualmente
```bash
curl -X POST http://localhost:3000/channels/ID_DO_CANAL_DE_VOZ/voice/token \
  -H "Authorization: Bearer SEU_TOKEN"
```

### Eventos de socket pra presença em voz
```js
socket.emit("voice:join", { channelId: "ID_DO_CANAL" });
socket.emit("voice:leave", { channelId: "ID_DO_CANAL" });
socket.on("voice:update", ({ channelId, members }) => {
  console.log(`Canal ${channelId} tem`, members, "conectados");
});
```

---

## O que já funciona

- ✅ Registro/login com JWT
- ✅ Criar servidor (gera automaticamente role Admin/Membro + canal de texto e voz padrão)
- ✅ Entrar em servidor via código de convite
- ✅ Criar/deletar canais (com checagem de permissão)
- ✅ Chat em tempo real via Socket.IO (mensagens, histórico, "digitando...")
- ✅ Presença online/offline via Redis
- ✅ Chamadas de voz/vídeo/tela via LiveKit (token + presença de quem está na call)
- ✅ **Sistema de amizade** (enviar/aceitar/recusar/remover pedido + bloquear/desbloquear)
- ✅ **Mensagens diretas (DM)** com histórico paginado e tempo real
- ✅ **Notificações em tempo real** de pedidos de amizade e DMs via Socket.IO

## Etapa 4: Frontend (React + Vite + Tailwind)

O frontend foi construído com Vite, React, TypeScript, TailwindCSS v4 e Zustand.

### Como rodar o frontend

1. Abra um **novo terminal** e vá para a pasta do frontend:
```bash
cd discord-clone/frontend
```

2. Instale as dependências:
```bash
npm install
```

3. Inicie o servidor de desenvolvimento:
```bash
npm run dev
```

4. Acesse no seu navegador: `http://localhost:5173`

## Etapa 5: Voz e Vídeo via LiveKit no Frontend

A integração de WebRTC no cliente React utiliza os pacotes oficiais `@livekit/components-react` e `@livekit/components-styles`.

### Recursos do LiveKit Integrados:
- **Salas de Voz e Vídeo**: o componente `<VideoConference />` trata a montagem do grid responsivo automaticamente.
- **Controles Universais**: microfone (mute/unmute), câmera (on/off) e compartilhamento de tela já funcionam "out-of-the-box".
- **Presença em Tempo Real**: o Socket.IO continua transmitindo os eventos `voice:join` e `voice:leave`, que alimentam os indicadores visuais de quem está conectado em cada canal de voz na barra lateral.

Para testar, selecione um Canal de Voz na interface do clone e clique em **Join Voice Call**. Certifique-se de preencher `LIVEKIT_URL`, `LIVEKIT_API_KEY` e `LIVEKIT_API_SECRET` no backend.

## Etapa 6: Deploy e Recursos Finais

O projeto agora possui infraestrutura pronta para produção:
- **Uploads de Avatar**: os usuários podem alterar o avatar (armazenado localmente no backend).
- **Moderação Avançada**: o dono do servidor pode kickar ou banir usuários permanentemente.
- **Notificações Real-Time**: uso do `react-hot-toast` para avisar sobre pedidos de amizade e quando o usuário é mencionado com `@username` no chat.
- **Docker Ready**: inclui `Dockerfile` otimizado para o backend (Alpine + NestJS build), frontend (Nginx estático) e um `docker-compose.prod.yml` empacotando Postgres, Redis e os serviços.

### Subindo em Produção:
```bash
docker-compose -f docker-compose.prod.yml up -d --build
```
> Obs: o LiveKit deve rodar numa instância na nuvem (LiveKit Cloud) ou configurado em host mode no seu VPS para que o WebRTC trafegue o UDP corretamente.
