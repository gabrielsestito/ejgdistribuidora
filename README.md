## EJG Distribuidora

Loja com painel admin, checkout, pedidos, entregas, e integração com Mercado Pago.

### Principais recursos
- Catálogo de produtos, kits e cestas
- Carrinho e checkout
- Painel admin (produtos, categorias, pedidos, estoque, frete)
- Configurações de entrega (raio máximo, cidades com frete grátis, pedido mínimo)
- Impressão de pedido
- Integração Mercado Pago (checkout + webhook)
- E-mails automáticos por status

### Requisitos
- Node.js 18+
- MySQL

### Instalação rápida
1. `npm install`
2. Configure o `.env` (veja abaixo)
3. `npx prisma db push`
4. `npm run dev`

### Scripts úteis
- `npm run dev`
- `npm run build`
- `npm run start`
- `npm run lint`
- `npx prisma db push`
- `npx prisma db studio`

### Variáveis de ambiente
Geral:
- `DATABASE_URL`
- `NEXT_PUBLIC_SITE_URL` (URL pública do site; usada em pagamentos e webhooks)
- `NEXT_PUBLIC_APP_URL` (opção local, ex: http://localhost:3000)
- `NEXTAUTH_SECRET` (obrigatório para sessões seguras)

Mercado Pago:
- `MERCADO_PAGO_ACCESS_TOKEN`

Email:
- `EMAIL_USER`
- `EMAIL_PASS`
- `EMAIL_FROM`
- `EMAIL_SERVICE` (opcional)
- `SMTP_HOST` e `SMTP_PORT` (opcionais se não usar `EMAIL_SERVICE`)

### Exemplo de .env
```
DATABASE_URL="mysql://USER:PASS@HOST:3306/DB_NAME"
NEXT_PUBLIC_SITE_URL="https://ejgcestas.com"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXTAUTH_SECRET="chave-secreta-segura"

MERCADO_PAGO_ACCESS_TOKEN="APP_USR-xxxx"

EMAIL_USER="seuemail@gmail.com"
EMAIL_PASS="senha-de-app"
EMAIL_FROM="EJG Distribuidora <seuemail@gmail.com>"
EMAIL_SERVICE="gmail"
```

### Admin
O admin fica em `/admin`. É necessário um usuário com role `ADMIN`.

### Banco de dados (Prisma)
- Primeira sincronização (dev): `npx prisma db push`
- Gerar cliente: `npx prisma generate`
- Abrir Studio: `npx prisma studio`
- Popular dados (opcional): `npm run db:seed`

#### Quando atualizar o schema
- Ambiente de desenvolvimento:
  - Ajuste `prisma/schema.prisma`
  - Rode: `npx prisma db push`
  - Opcional: `npx prisma generate`
- Produção (recomendado com migrações):
  - Gere uma migração: `npx prisma migrate dev -n "descricao"`
  - Faça deploy das migrações no servidor: `npx prisma migrate deploy`
  - Alternativa rápida (sem versionar migrações): `npx prisma db push` (use com cautela)

Para popular dados básicos:
- `npm run db:seed`

### Configurações de Entrega
- Raio máximo (km) aplicado no cálculo de frete
- Cidades com frete grátis (com pedido mínimo por cidade)
- Pedido mínimo global (R$) aplicado no carrinho e checkout
Gerencie em: `Admin > Frete`

### Checkout e pagamento
O checkout cria um pedido e redireciona o cliente para o Mercado Pago. O webhook
confirma o pagamento automaticamente.

Veja detalhes em:
- `CHECKOUT_MERCADO_PAGO.md`

### Email
As notificações são enviadas via SMTP quando:
- Pedido é criado
- Status do pedido muda
- Pagamento é confirmado

Veja detalhes em:
- `EMAIL_SETUP.md`

### Estrutura (atalhos úteis)
- `app/` páginas e rotas API
- `components/` componentes UI e layout
- `lib/` helpers (auth, email, utils)
- `prisma/` schema e seed

### Solução de problemas
- Webhook não chega: use URL pública (ex: ngrok) e confira `NEXT_PUBLIC_SITE_URL`.
- E-mail não envia: valide `SMTP_*` e `EMAIL_FROM`.
- Erro no Prisma: rode `npx prisma db push` novamente.

### Deploy na VPS Hostinger (ejgcestas.com)

Pré-requisitos:
- VPS com Ubuntu 22.04/24.04 e IP público
- Acesso SSH (root) e um usuário sudo sem senha
- Banco MySQL disponível (na VPS ou serviço externo)
- DNS do domínio apontando para a VPS

DNS:
- Crie os registros A em seu provedor de DNS:
  - ejgcestas.com -> IP_da_VPS
  - www.ejgcestas.com -> IP_da_VPS

Conectar e preparar servidor:

```bash
ssh root@IP_DA_VPS
# opcional: criar usuário
adduser ejg && usermod -aG sudo ejg
su - ejg

# atualizações
sudo apt update && sudo apt -y upgrade

# utilitários
sudo apt -y install curl git ufw

# firewall básico
sudo ufw allow OpenSSH
sudo ufw allow 80
sudo ufw allow 443
sudo ufw --force enable
```

Instalar Node.js 18 LTS e PM2:

```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt -y install nodejs build-essential
sudo npm i -g pm2
```

Instalar Nginx e Certbot:

```bash
sudo apt -y install nginx
sudo apt -y install certbot python3-certbot-nginx
```

Configurar MySQL (se for na mesma VPS):

```bash
sudo apt -y install mysql-server
sudo mysql_secure_installation

sudo mysql
CREATE DATABASE ejg_distribuidora CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'ejg'@'%' IDENTIFIED BY 'SENHA_FORTE';
GRANT ALL PRIVILEGES ON ejg_distribuidora.* TO 'ejg'@'%';
FLUSH PRIVILEGES;
EXIT;
```

Obter código do projeto:
- Opção Git:
```bash
cd ~
git clone <URL_DO_REPO> app
cd app
```
- Opção ZIP/SFTP:
  - Envie os arquivos para `~/app` e extraia.

Variáveis de ambiente (.env de produção):

```bash
cd ~/app
cp .env .env.example || true
nano .env
```

Conteúdo mínimo recomendado:
```
DATABASE_URL="mysql://USUARIO:SENHA@HOST:3306/ejg_distribuidora"
NEXTAUTH_SECRET="chave-muito-segura"
NEXTAUTH_URL="https://ejgcestas.com"
NEXT_PUBLIC_SITE_URL="https://ejgcestas.com"
NEXT_PUBLIC_APP_URL="https://ejgcestas.com"

# Mercado Pago
MERCADO_PAGO_ACCESS_TOKEN="APP_USR-xxxx"

# E-mail (SMTP)
EMAIL_USER="seuemail@provedor.com"
EMAIL_PASS="senha-ou-token"
EMAIL_FROM="EJG Distribuidora <seuemail@provedor.com>"
# Use EMAIL_SERVICE="gmail" ou configure SMTP_HOST/SMTP_PORT
```

Build e banco:

```bash
cd ~/app
npm ci
npx prisma generate
npx prisma db push
npm run build
```

Executar com PM2:

```bash
cd ~/app
PORT=3000 pm2 start npm --name "ejg-app" -- start
pm2 save
pm2 startup  # copie e execute o comando sugerido
```

Configurar Nginx (proxy reverso):

```bash
sudo bash -c 'cat > /etc/nginx/sites-available/ejgcestas.com <<EOF
server {
    server_name ejgcestas.com www.ejgcestas.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_read_timeout 60s;
    }

    client_max_body_size 20m;
}
EOF'

sudo ln -s /etc/nginx/sites-available/ejgcestas.com /etc/nginx/sites-enabled/ejgcestas.com
sudo nginx -t
sudo systemctl reload nginx
```

SSL (Let's Encrypt):

```bash
sudo certbot --nginx -d ejgcestas.com -d www.ejgcestas.com --redirect -m seu-email@dominio.com --agree-tos -n
sudo systemctl restart nginx
```

Atualizações (deploy contínuo):

```bash
cd ~/app
git pull
npm ci
npx prisma db push    # ou npx prisma migrate deploy, se usar migrações versionadas
npm run build
pm2 restart ejg-app
```

Logs e diagnóstico:

```bash
pm2 logs ejg-app
pm2 status
sudo journalctl -u nginx -f
```

Checklist final:
- DNS aponta para a VPS (A: ejgcestas.com e www)
- Certificado SSL ativo e redirecionamento para HTTPS
- `NEXTAUTH_URL` e `NEXT_PUBLIC_SITE_URL` definidos para `https://ejgcestas.com`
- Banco MySQL acessível e sincronizado (`prisma db push`)
- Processo `ejg-app` rodando no PM2 e reinicia no boot
