'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import dynamic from 'next/dynamic'
import { formatPrice } from '@/lib/utils'

const QRCodeSVG = dynamic(() => import('qrcode.react').then((mod) => mod.QRCodeSVG), {
  ssr: false,
})

export default function PrintOrderPage() {
  const params = useParams()
  const [order, setOrder] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const paymentMethodLabels: Record<string, string> = {
    MERCADO_PAGO: 'Mercado Pago',
    PIX: 'Pix',
    CARTAO_CREDITO: 'Cartão de crédito',
    CARTAO_DEBITO: 'Cartão de débito',
    DINHEIRO: 'Dinheiro',
    BOLETO: 'Boleto',
    OUTRO: 'Outro',
  }

  useEffect(() => {
    fetch(`/api/admin/orders/${params.id}`)
      .then((res) => res.json())
      .then((data) => {
        setOrder(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [params.id])

  if (loading) {
    return <div className="p-8">Carregando...</div>
  }

  if (!order) {
    return <div className="p-8">Pedido não encontrado</div>
  }

  return (
    <>
      <style jsx global>{`
        @media print {
          @page {
            size: A4;
            margin: 0.5cm;
          }

          html {
            font-size: 18px;
            line-height: 1.4;
          }
          
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          
          body {
            margin: 0 !important;
            padding: 0 !important;
          }
          
          /* Remover cabeçalhos e rodapés do navegador */
          @page {
            margin: 0.5cm;
            margin-header: 0;
            margin-footer: 0;
          }
          
          /* Ocultar elementos não necessários */
          .no-print,
          header,
          nav,
          footer,
          .print\\:hidden {
            display: none !important;
          }
          
          /* Garantir que o conteúdo ocupe toda a página */
          html, body {
            width: 100%;
            height: 100%;
            overflow: visible;
          }
        }
      `}</style>
      
      <div className="p-4 max-w-[21cm] mx-auto print:p-0 print:max-w-full">
        <div className="bg-white p-6 print:p-4 border border-gray-300 rounded-xl print:rounded-none print:border-0 shadow-sm print:shadow-none">
          {/* Header com logo e informações da empresa */}
          <div className="flex items-start justify-between gap-4 mb-4 pb-4 border-b">
            <div className="flex items-start gap-4">
              {/* Logo da empresa */}
              <div className="w-20 h-20 flex-shrink-0 print:w-16 print:h-16">
                <div className="relative w-full h-full bg-gray-100 rounded-lg border border-gray-200 flex items-center justify-center overflow-hidden">
                  <img
                    src="/logo.png"
                    alt="EJG Produtos Alimenticios LTDA"
                    className="w-full h-full object-contain p-2"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement
                      target.style.display = 'none'
                      const parent = target.parentElement
                      if (parent) {
                        const fallback = document.createElement('div')
                        fallback.className = 'text-[10px] font-bold text-center p-2 text-gray-700 leading-tight'
                        fallback.innerHTML = 'EJG<br/>PRODUTOS'
                        parent.appendChild(fallback)
                      }
                    }}
                  />
                </div>
              </div>

              {/* Informações da empresa */}
              <div className="flex-1">
                <h1 className="text-xl print:text-lg font-bold mb-1">EJG Produtos Alimenticios LTDA</h1>
                <p className="text-xs print:text-[10px] text-gray-600">
                  (16) 99202-5527
                </p>
                <p className="text-xs print:text-[10px] text-gray-600">
                  Rua Ribeirão Preto, Nº 2239
                </p>
                <p className="text-xs print:text-[10px] text-gray-600">
                  14075800 - Ribeirão Preto, SP
                </p>
                <p className="text-xs print:text-[10px] text-gray-600">
                  CNPJ: 47.068.185/0001-30 · IE: 797.931.720.113
                </p>
              </div>
            </div>

            {/* Título do documento */}
            <div className="text-right">
              <div className="inline-flex items-center rounded-full border border-gray-300 px-3 py-1 text-xs font-semibold uppercase tracking-wide">
                Pedido de Compra
              </div>
              <p className="text-[10px] print:text-[9px] text-gray-500 mt-1">
                Nº {order.code}
              </p>
            </div>
          </div>

          {/* Order Info - Layout compacto */}
          <div className="grid grid-cols-2 gap-4 mb-4 print:gap-2">
            <div className="border border-gray-200 rounded-lg p-3">
              <h2 className="font-semibold mb-2 text-xs print:text-[10px] uppercase text-gray-700">Informações do Pedido</h2>
              <div className="space-y-1 text-xs print:text-[10px]">
                <p><strong>Código:</strong> {order.code}</p>
                <p><strong>Data:</strong> {new Date(order.createdAt).toLocaleDateString('pt-BR', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}</p>
                <p><strong>Status:</strong> {order.status}</p>
                <p><strong>Pagamento:</strong> {order.paymentStatus || 'PENDENTE'}</p>
                <p><strong>Forma de pagamento:</strong> {order.paymentMethodDetail || paymentMethodLabels[order.paymentMethod] || order.paymentMethod || 'Não informado'}</p>
              </div>
            </div>
            <div className="border border-gray-200 rounded-lg p-3">
              <h2 className="font-semibold mb-2 text-xs print:text-[10px] uppercase text-gray-700">Cliente</h2>
              <div className="space-y-1 text-xs print:text-[10px]">
                <p><strong>Nome:</strong> {order.user.name}</p>
                <p><strong>Email:</strong> {order.user.email}</p>
                {order.user.phone && <p><strong>Telefone:</strong> {order.user.phone}</p>}
              </div>
            </div>
          </div>

          {/* Address - Compacto */}
          <div className="mb-4 border border-gray-200 rounded-lg p-3">
            <h2 className="font-semibold mb-2 text-xs print:text-[10px] uppercase text-gray-700">Endereço de Entrega</h2>
            <div className="text-xs print:text-[10px] space-y-1">
              <p>
                {order.address.street}, {order.address.number}
                {order.address.complement && ` - ${order.address.complement}`}
              </p>
              <p>
                {order.address.neighborhood} - {order.address.city}/{order.address.state}
              </p>
              <p>CEP: {order.address.zipCode}</p>
              {order.address.reference && (
                <p className="text-gray-600 italic">Referência: {order.address.reference}</p>
              )}
            </div>
          </div>

          {/* Items - Tabela compacta */}
          <div className="mb-4">
            <h2 className="font-semibold mb-2 text-xs print:text-[10px] uppercase text-gray-700">Itens do Pedido</h2>
            <table className="w-full border-collapse border border-gray-300 text-xs print:text-[9px] rounded-lg overflow-hidden">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 px-2 py-1 text-left">Produto</th>
                  <th className="border border-gray-300 px-2 py-1 text-center w-16">Qtd</th>
                  <th className="border border-gray-300 px-2 py-1 text-right w-20">Unit.</th>
                  <th className="border border-gray-300 px-2 py-1 text-right w-20">Total</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((item: any, index: number) => (
                  <tr key={item.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="border border-gray-300 px-2 py-1">
                      <div>
                        <p className="font-medium">{item.product?.name || 'Produto removido'}</p>
                        {item.product?.productType === 'KIT' && item.product?.kitItems && (
                          <div className="mt-1 pl-2 border-l-2 border-gray-300 text-[10px] print:text-[8px] text-gray-600">
                            {item.product.kitItems.map((kitItem: any, idx: number) => (
                              <p key={idx} className="mb-0.5">
                                • {kitItem.quantity} {kitItem.unit || 'un'} - {kitItem.product.name}
                                {kitItem.brand && ` (${kitItem.brand})`}
                                {kitItem.notes && ` - ${kitItem.notes}`}
                              </p>
                            ))}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="border border-gray-300 px-2 py-1 text-center">
                      {item.quantity}
                    </td>
                    <td className="border border-gray-300 px-2 py-1 text-right">
                      {formatPrice(Number(item.price))}
                    </td>
                    <td className="border border-gray-300 px-2 py-1 text-right">
                      {formatPrice(Number(item.price) * item.quantity)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Observações */}
          {order.notes && (
            <div className="mb-3">
              <h2 className="font-semibold mb-1 text-xs print:text-[10px] uppercase">Observações</h2>
              <div className="text-xs print:text-[10px] p-2 bg-gray-50 border border-gray-300 rounded">
                <p className="whitespace-pre-wrap">{order.notes}</p>
              </div>
            </div>
          )}

          {/* Totals e QR Code lado a lado */}
          <div className="grid grid-cols-2 gap-4 mb-3 print:gap-2">
            {/* QR Code */}
            {order.qrCode && (
              <div className="text-center">
                <h3 className="font-semibold mb-2 text-xs print:text-[10px] uppercase">QR Code</h3>
                <div className="flex justify-center">
                  <div className="p-2 bg-white border-2 border-gray-300 inline-block">
                    <QRCodeSVG value={order.qrCode} size={120} />
                  </div>
                </div>
                <p className="text-[10px] print:text-[8px] text-gray-600 mt-1">
                  Escaneie para atribuir entrega
                </p>
              </div>
            )}

            {/* Totals */}
            <div className="text-right">
              <div className="inline-block text-xs print:text-[10px] space-y-1 border border-gray-200 rounded-lg p-3 bg-gray-50 min-w-[200px]">
                <div className="flex items-center justify-between gap-6">
                  <span className="text-gray-600">Subtotal</span>
                  <strong>{formatPrice(Number(order.subtotal))}</strong>
                </div>
                <div className="flex items-center justify-between gap-6">
                  <span className="text-gray-600">Frete</span>
                  <strong>{formatPrice(Number(order.shipping))}</strong>
                </div>
                <div className="flex items-center justify-between gap-6 border-t border-gray-300 pt-1 mt-1 text-sm print:text-[11px] font-bold">
                  <span>Total</span>
                  <span>{formatPrice(Number(order.total))}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Footer compacto */}
          <div className="mt-4 pt-2 border-t text-center text-[10px] print:text-[8px] text-gray-500">
            <p>Documento gerado automaticamente pelo sistema EJG Distribuidora</p>
            <p className="mt-0.5">Data de impressão: {new Date().toLocaleString('pt-BR')}</p>
          </div>

          {/* Print Button */}
          <div className="mt-6 text-center print:hidden no-print">
            <button
              onClick={() => window.print()}
              className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90"
            >
              Imprimir Pedido
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
