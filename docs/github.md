# Subindo o projeto para o GitHub

Este guia explica como iniciar versionamento, criar o repositório remoto e enviar o código.

## Pré-requisitos
- Conta no GitHub
- Git instalado

## 1) Iniciar o repositório local
```bash
git init
git add .
git commit -m "feat: inicializa projeto EJG Distribuidora"
```

## 2) Criar o repositório no GitHub
No GitHub, crie um repositório vazio (público ou privado). Copie a URL (ex.: `git@github.com:usuario/ejg-distribuidora.git` ou `https://github.com/usuario/ejg-distribuidora.git`).

## 3) Adicionar o remoto e enviar
```bash
git remote add origin <URL_DO_REPO>
git branch -M main
git push -u origin main
```

## 4) Branches e boas práticas
- Use `main` para produção
- Crie branches de feature: `feat/min-order-config`
- Pull Requests para revisão antes de mesclar

## 5) Ignorando arquivos sensíveis
Certifique-se de que o `.env` está no `.gitignore`:
```
.env
.env.*
```

## 6) Atualizações futuras
```bash
git add .
git commit -m "chore: descrição clara da mudança"
git push
```

## 7) Clonar em outra máquina
```bash
git clone <URL_DO_REPO>
cd ejg-distribuidora
npm install
```

