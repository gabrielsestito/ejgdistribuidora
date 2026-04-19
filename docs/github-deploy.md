## Publicar o projeto no GitHub

Este guia mostra como criar um repositório no GitHub e enviar este projeto para lá, usando HTTPS ou SSH.

### Pré-requisitos
- Git instalado (Windows: https://git-scm.com/download/win | Linux: `sudo apt install git`)
- Conta no GitHub
- Configurar nome e email do Git (uma vez):

```bash
git config --global user.name "Seu Nome"
git config --global user.email "seuemail@exemplo.com"
git config --global init.defaultBranch main
```

### 1) Criar repositório no GitHub
1. Acesse https://github.com/new
2. Defina o nome (ex.: `ejg-distribuidora`), visibilidade (public/private) e crie o repositório vazio
3. Copie a URL do repositório (HTTPS ou SSH)

### 2) Inicializar o repositório local
No diretório do projeto (esta pasta):

```bash
cd "c:\Users\Gabriel\Documents\EjgDistribuidora"
git init
git add .
git commit -m "Initial commit"
```

Observações:
- O arquivo `.gitignore` do projeto já ignora `node_modules`, `.env` e outros artefatos. Nunca suba o `.env`.

### 3) Adicionar o remoto e enviar

Usando HTTPS (mais simples):
```bash
git remote add origin https://github.com/SEU-USUARIO/ejg-distribuidora.git
git push -u origin main
```

Usando SSH (recomendado para quem usa chaves):
```bash
# Se ainda não tem chave SSH
ssh-keygen -t ed25519 -C "seuemail@exemplo.com"
# Copie o conteúdo de ~/.ssh/id_ed25519.pub e ad bib NBX às chaves da sua conta GitHub

git remote add origin git@github.com:SEU-USUARIO/ejg-distribuidora.git
git push -u origin main
```

Se o repositório remoto já existia com outro branch padrão, ajuste:
```bash
git branch -M main
git push -u origin main
```

### 4) Atualizações futuras
Após fazer mudanças no projeto:
```bash
git add -A
git commit -m "Descrição do que foi alterado"
git push
```

### 5) Trabalhando com branches (opcional, recomendado)
```bash
git checkout -b feature/minha-alteracao
# ... códigos ...
git add -A
git commit -m "Implementa minha alteração"
git push -u origin feature/minha-alteracao
```
Abra um Pull Request no GitHub para revisar e mesclar na `main`.

### 6) Boas práticas
- Não suba segredos (tokens, senhas) para o repositório. O `.env` já é ignorado.
- Use GitHub Secrets para CI/CD quando necessário.
- Escreva mensagens de commit descritivas.

### 7) Solução de problemas
- Autenticação HTTPS falhou: verifique login/senha e se a conta usa 2FA (use token pessoal).
- Permissão negada (SSH): confira se a chave pública está adicionada no GitHub e a URL remota está em formato `git@github.com:...`.
- Arquivo grande (LFS): para arquivos >100MB, considere Git LFS (`git lfs install`).

Pronto! O projeto estará versionado e disponível no seu GitHub.
