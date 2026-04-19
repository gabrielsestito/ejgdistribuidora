## Configuração de Email (SMTP)

### Variáveis obrigatórias
- `EMAIL_USER` (login do email)
- `EMAIL_PASS` (senha de app)
- `EMAIL_FROM` (remetente)
- `NEXT_PUBLIC_SITE_URL` (para links de acompanhamento)

Opcional:
- `EMAIL_SERVICE` (ex: gmail, outlook)
- `SMTP_HOST` e `SMTP_PORT` (se quiser usar SMTP direto)

### Exemplo de .env
```
EMAIL_USER=seuemail@gmail.com
EMAIL_PASS=senha-de-app
EMAIL_FROM="EJG Distribuidora <seuemail@gmail.com>"
EMAIL_SERVICE=gmail
NEXT_PUBLIC_SITE_URL=https://seusite.com
```

### O que é enviado
- Pedido criado (recebido)
- Atualização de status (admin/entrega)
- Pagamento confirmado (webhook Mercado Pago)

### Observações
- Sem as variáveis, o envio é ignorado com aviso no console.
- Se não definir `SMTP_*`, o envio usa `EMAIL_SERVICE`.