# Script PowerShell para criar arquivo .env
# Execute: .\setup-env.ps1

Write-Host "===========================================" -ForegroundColor Cyan
Write-Host "  Configuração do arquivo .env" -ForegroundColor Cyan
Write-Host "===========================================" -ForegroundColor Cyan
Write-Host ""

# Verificar se .env já existe
if (Test-Path .env) {
    $overwrite = Read-Host "Arquivo .env já existe. Deseja sobrescrever? (s/n)"
    if ($overwrite -ne "s" -and $overwrite -ne "S") {
        Write-Host "Operação cancelada." -ForegroundColor Yellow
        exit
    }
}

Write-Host "Por favor, informe os dados do MySQL:" -ForegroundColor Yellow
Write-Host ""

$mysqlUser = Read-Host "Usuário MySQL (padrão: root)"
if ([string]::IsNullOrWhiteSpace($mysqlUser)) {
    $mysqlUser = "root"
}

Write-Host "Senha MySQL (deixe em branco se não tiver senha):" -ForegroundColor Yellow
$mysqlPassword = Read-Host "Senha MySQL" -AsSecureString
$mysqlPasswordPlain = ""
if ($mysqlPassword -ne $null) {
    $mysqlPasswordPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
        [Runtime.InteropServices.Marshal]::SecureStringToBSTR($mysqlPassword)
    )
}

Write-Host ""
Write-Host "Gerando NEXTAUTH_SECRET..." -ForegroundColor Green

# Gerar chave secreta
$secret = -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | ForEach-Object {[char]$_})

# Criar conteúdo do .env
# Se senha vazia, usar formato sem senha
if ([string]::IsNullOrWhiteSpace($mysqlPasswordPlain)) {
    $dbUrl = "mysql://$mysqlUser@localhost:3306/ejg_distribuidora"
} else {
    $dbUrl = "mysql://$mysqlUser`:$mysqlPasswordPlain@localhost:3306/ejg_distribuidora"
}

$envContent = @"
# ============================================
# CONFIGURAÇÃO DO BANCO DE DADOS MYSQL
# ============================================
DATABASE_URL="$dbUrl"

# ============================================
# CONFIGURAÇÃO DO NEXTAUTH
# ============================================
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="$secret"

# ============================================
# CONFIGURAÇÃO DA APLICAÇÃO
# ============================================
NEXT_PUBLIC_APP_URL="http://localhost:3000"
"@

# Escrever arquivo
$envContent | Out-File -FilePath .env -Encoding utf8

Write-Host ""
Write-Host "✅ Arquivo .env criado com sucesso!" -ForegroundColor Green
Write-Host ""
Write-Host "Próximos passos:" -ForegroundColor Cyan
Write-Host "1. Certifique-se de que o MySQL está rodando" -ForegroundColor White
Write-Host "2. Crie o banco de dados: CREATE DATABASE ejg_distribuidora;" -ForegroundColor White
Write-Host "3. Execute: npx prisma generate" -ForegroundColor White
Write-Host "4. Execute: npx prisma db push" -ForegroundColor White
Write-Host "5. Execute: npm run db:seed" -ForegroundColor White
Write-Host ""
