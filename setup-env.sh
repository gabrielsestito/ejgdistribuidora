#!/bin/bash
# Script Bash para criar arquivo .env
# Execute: chmod +x setup-env.sh && ./setup-env.sh

echo "==========================================="
echo "  Configuração do arquivo .env"
echo "==========================================="
echo ""

# Verificar se .env já existe
if [ -f .env ]; then
    read -p "Arquivo .env já existe. Deseja sobrescrever? (s/n) " overwrite
    if [ "$overwrite" != "s" ] && [ "$overwrite" != "S" ]; then
        echo "Operação cancelada."
        exit
    fi
fi

echo "Por favor, informe os dados do MySQL:"
echo ""

read -p "Usuário MySQL (padrão: root): " mysql_user
mysql_user=${mysql_user:-root}

read -sp "Senha MySQL: " mysql_password
echo ""

echo ""
echo "Gerando NEXTAUTH_SECRET..."

# Gerar chave secreta
secret=$(openssl rand -base64 32 2>/dev/null || cat /dev/urandom | tr -dc 'a-zA-Z0-9' | fold -w 32 | head -n 1)

# Criar conteúdo do .env
# Se senha vazia, usar formato sem senha
if [ -z "$mysql_password" ]; then
    db_url="mysql://${mysql_user}@localhost:3306/ejg_distribuidora"
else
    db_url="mysql://${mysql_user}:${mysql_password}@localhost:3306/ejg_distribuidora"
fi

cat > .env << EOF
# ============================================
# CONFIGURAÇÃO DO BANCO DE DADOS MYSQL
# ============================================
DATABASE_URL="${db_url}"

# ============================================
# CONFIGURAÇÃO DO NEXTAUTH
# ============================================
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="${secret}"

# ============================================
# CONFIGURAÇÃO DA APLICAÇÃO
# ============================================
NEXT_PUBLIC_APP_URL="http://localhost:3000"
EOF

echo ""
echo "✅ Arquivo .env criado com sucesso!"
echo ""
echo "Próximos passos:"
echo "1. Certifique-se de que o MySQL está rodando"
echo "2. Crie o banco de dados: CREATE DATABASE ejg_distribuidora;"
echo "3. Execute: npx prisma generate"
echo "4. Execute: npx prisma db push"
echo "5. Execute: npm run db:seed"
echo ""
