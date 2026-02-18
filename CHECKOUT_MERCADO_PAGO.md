## Checkout Mercado Pago

### Visão geral
O checkout cria o pedido no backend e redireciona para o Mercado Pago. A confirmação
de pagamento chega via webhook e atualiza o pedido para **Pago** automaticamente.

### Fluxo
1. Front cria o pedido (`/api/orders`) com `paymentMethod: MERCADO_PAGO`
2. Backend cria preferência no MP (`/api/payments/mercadopago`)
3. Cliente é redirecionado para `init_point`
4. MP envia webhook para `/api/webhooks/mercadopago`
5. Pedido é marcado como **PAGO** (e email de confirmação é enviado)

### Variáveis obrigatórias
- `MERCADO_PAGO_ACCESS_TOKEN`
- `NEXT_PUBLIC_SITE_URL`

### Webhook
Configure no painel do Mercado Pago:
- URL: `https://SEU_DOMINIO.com/api/webhooks/mercadopago`
- Eventos: pagamento aprovado/rejeitado/estornado

### Observações
- O status de pagamento fica em `orders.paymentStatus`.
- Se estiver em ambiente local, use um túnel (ex: ngrok) para receber webhooks.
