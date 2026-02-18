# Deploy na VPS Hostinger (Ubuntu) para ejgcestas.com

Este guia cobre a configuração de uma VPS Ubuntu na Hostinger para hospedar a aplicação em `ejgcestas.com` (IP 72.60.1.94) com Node.js, PM2 e Nginx + HTTPS.

## 1) Preparar a VPS
Conecte na VPS via SSH:
```bash
ssh root@72.60.1.94
```
Atualize pacotes e instale dependências básicas:
```bash
apt update && apt upgrade -y
apt install -y git nginx ufw curl
```

## 2) Instalar Node.js (LTS) e PM2
Use NVM para instalar o Node LTS:
```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
source ~/.bashrc
nvm install --lts
npm i -g pm2
```

## 3) Configurar firewall
```bash
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw enable
```

## 4) Clonar o projeto
```bash
cd /var/www
git clone <URL_DO_REPO> ejg-distribuidora
cd ejg-distribuidora
npm install
```

## 5) .env de produção
Crie o arquivo `.env` com as variáveis necessárias (exemplo mínimo):
```
DATABASE_URL="mysql://USER:PASS@HOST:3306/DB_NAME"
NEXT_PUBLIC_SITE_URL="https://ejgcestas.com"
NEXTAUTH_SECRET="chave-secreta-segura"
MERCADO_PAGO_ACCESS_TOKEN="APP_USR-xxxx"
EMAIL_USER="seuemail@gmail.com"
EMAIL_PASS="senha-de-app"
EMAIL_FROM="EJG Distribuidora <seuemail@gmail.com>"
EMAIL_SERVICE="gmail"
```

Gere o cliente Prisma e aplique migrações/tabelas:
```bash
npx prisma generate
npx prisma migrate deploy
# ou, em cenários sem migrações versionadas:
# npx prisma db push
```

## 6) Build e execução com PM2
```bash
npm run build
pm2 start npm --name "ejg-distribuidora" -- start
pm2 save
pm2 startup
```

Para logs:
```bash
pm2 logs ejg-distribuidora
```

## 7) Nginx como reverse proxy
Crie a config:
```bash
cat >/etc/nginx/sites-available/ejgcestas.com <<'EOF'
server {
  server_name ejgcestas.com www.ejgcestas.com;

  location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
  }

  client_max_body_size 20M;
}
EOF
ln -s /etc/nginx/sites-available/ejgcestas.com /etc/nginx/sites-enabled/ejgcestas.com
nginx -t && systemctl reload nginx
```

## 8) DNS do domínio
- Aponte o A record de `ejgcestas.com` para `72.60.1.94`
- Aguarde a propagação (normalmente minutos até 24h)

## 9) HTTPS com Let’s Encrypt
```bash
apt install -y certbot python3-certbot-nginx
certbot --nginx -d ejgcestas.com -d www.ejgcestas.com
```
Certificados renovam automaticamente via timer do Certbot.

## 10) Atualizações de versão
No servidor:
```bash
cd /var/www/ejg-distribuidora
git pull
npm install
npx prisma migrate deploy   # ou db push, conforme seu fluxo
npm run build
pm2 restart ejg-distribuidora
```

## 11) Backup do banco
- Configure backups do MySQL (mysqldump ou provedor)
- Exemplo:
```bash
mysqldump -h HOST -u USER -p DB_NAME > /root/db-backup-$(date +%F).sql
```

## 12) Verificações
- Acesso: https://ejgcestas.com
- Webhook Mercado Pago: precisa de URL pública (usa `NEXT_PUBLIC_SITE_URL`)
- Admin: https://ejgcestas.com/admin (usuário com role ADMIN)

