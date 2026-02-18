'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { DriverLayout } from '@/components/driver/driver-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Scan, Camera, X, AlertCircle } from 'lucide-react'
// @ts-ignore - html5-qrcode não tem tipos TypeScript oficiais
import { Html5Qrcode } from 'html5-qrcode'

export default function ScannerPage() {
  const router = useRouter()
  const [scanning, setScanning] = useState(false)
  const [manualCode, setManualCode] = useState('')
  const [scannerLoading, setScannerLoading] = useState(false)
  const [assigning, setAssigning] = useState(false)
  const [message, setMessage] = useState<{ success: boolean; message: string } | null>(null)
  const scannerRef = useRef<any>(null)
  const processingRef = useRef(false)
  const recentScansRef = useRef<Record<string, number>>({})

  useEffect(() => {
    // Cleanup ao desmontar
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {})
        scannerRef.current.clear()
      }
    }
  }, [])

  const checkCameraSupport = async (): Promise<boolean> => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices()
      return devices.some(device => device.kind === 'videoinput')
    } catch {
      return false
    }
  }

  const checkHTTPS = (): boolean => {
    if (typeof window === 'undefined') return true
    const isLocalhost = window.location.hostname === 'localhost' || 
                       window.location.hostname === '127.0.0.1' ||
                       window.location.hostname === '[::1]'
    const isHTTPS = window.location.protocol === 'https:'
    return isLocalhost || isHTTPS
  }

  const startScanning = async () => {
    try {
      setScannerLoading(true)
      setScanning(true)
      setMessage(null)

      // Verificar HTTPS/localhost
      if (!checkHTTPS()) {
        throw new Error('A câmera só funciona em HTTPS ou localhost. Você está usando HTTP. Por favor, use HTTPS ou acesse via localhost.')
      }

      // Verificar suporte de câmera
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Seu navegador não suporta acesso à câmera. Use um navegador moderno (Chrome, Firefox, Safari, Edge) ou digite o código manualmente.')
      }

      // Verificar se há câmeras disponíveis
      const hasCamera = await checkCameraSupport()
      if (!hasCamera) {
        throw new Error('Nenhuma câmera encontrada no dispositivo.')
      }

      // Aguardar um pouco para garantir que o DOM está pronto
      await new Promise(resolve => setTimeout(resolve, 100))

      // Verificar se o elemento existe
      const container = document.getElementById('scanner-container')
      if (!container) {
        throw new Error('Erro ao inicializar o scanner. Tente recarregar a página.')
      }

      const scanner = new Html5Qrcode('scanner-container')
      scannerRef.current = scanner

      // Tentar diferentes configurações de câmera
      const cameraConfigs = [
        { facingMode: 'environment' }, // Câmera traseira (preferida)
        { facingMode: 'user' }, // Câmera frontal
        { video: { facingMode: 'environment' } }, // Alternativa
      ]

      let started = false
      let lastError: any = null

      for (const config of cameraConfigs) {
        try {
          await scanner.start(
            config,
            {
              fps: 10,
              qrbox: (viewfinderWidth, viewfinderHeight) => {
                const minEdgePercentage = 0.7
                const minEdgeSize = Math.min(viewfinderWidth, viewfinderHeight)
                const qrboxSize = Math.floor(minEdgeSize * minEdgePercentage)
                return {
                  width: qrboxSize,
                  height: qrboxSize,
                }
              },
              aspectRatio: 1.0,
              disableFlip: false,
            },
            (decodedText) => {
              // QR Code detectado
              if (!processingRef.current && !assigning) {
                handleScan(decodedText)
              }
            },
            (errorMessage) => {
              // Ignorar erros de leitura (normal durante a varredura)
            }
          )
          started = true
          break
        } catch (error: any) {
          lastError = error
          // Tentar próxima configuração
          continue
        }
      }

      if (!started) {
        throw lastError || new Error('Não foi possível acessar a câmera. Verifique as permissões do navegador.')
      }

      setScannerLoading(false)
    } catch (error: any) {
      console.error('Error starting scanner:', error)
      
      let errorMessage = 'Erro ao iniciar a câmera.'
      
      if (error.name === 'NotAllowedError' || error.message?.includes('permission')) {
        errorMessage = 'Permissão de câmera negada. Por favor, permita o acesso à câmera nas configurações do navegador e tente novamente.'
      } else if (error.name === 'NotFoundError' || error.message?.includes('camera')) {
        errorMessage = 'Nenhuma câmera encontrada. Verifique se seu dispositivo tem uma câmera disponível.'
      } else if (error.name === 'NotReadableError' || error.message?.includes('readable')) {
        errorMessage = 'A câmera está sendo usada por outro aplicativo. Feche outros aplicativos que possam estar usando a câmera.'
      } else if (error.message) {
        errorMessage = error.message
      }

      setMessage({
        success: false,
        message: errorMessage,
      })
      setScanning(false)
      setScannerLoading(false)
    }
  }

  const stopScanning = async () => {
    try {
      if (scannerRef.current) {
        await scannerRef.current.stop()
        scannerRef.current.clear()
        scannerRef.current = null
      }
    } catch (error) {
      console.error('Error stopping scanner:', error)
    }
    setScanning(false)
    setScannerLoading(false)
  }

  const handleScan = async (data: string) => {
    if (!data || processingRef.current) return
    const now = Date.now()
    if (recentScansRef.current[data] && now - recentScansRef.current[data] < 5000) {
      return
    }
    processingRef.current = true
    recentScansRef.current[data] = now
    setAssigning(true)
    setMessage(null)

    try {
      // Parse QR Code data
      const [orderId, orderCode] = data.split('|')

      if (!orderId || !orderCode) {
        setMessage({
          success: false,
          message: 'QR Code inválido. O formato esperado é: orderId|orderCode',
        })
        return
      }

      // Atribuir entrega
      const response = await fetch(`/api/driver/assign-delivery`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, orderCode }),
      })

      const json = await response.json()

      if (response.ok) {
        const assignment = json.assignment
        setMessage({
          success: true,
          message: `Entrega atribuída com sucesso! Pedido: ${orderCode}`,
        })
      } else {
        setMessage({
          success: false,
          message: json.error || 'Erro ao atribuir entrega',
        })
      }
    } catch (error) {
      setMessage({
        success: false,
        message: 'Erro ao processar QR Code',
      })
    } finally {
      setAssigning(false)
      processingRef.current = false
    }
  }

  const handleManualCode = async (code: string) => {
    if (!code.trim()) return
    
    setAssigning(true)
    try {
      // Buscar pedido pelo código
      const response = await fetch(`/api/orders/${code}`)
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Pedido não encontrado')
      }
      
      const order = await response.json()
      
      if (order && order.id) {
        await handleScan(`${order.id}|${code}`)
      } else {
        setMessage({
          success: false,
          message: 'Pedido não encontrado',
        })
      }
    } catch (error: any) {
      setMessage({
        success: false,
        message: error.message || 'Erro ao buscar pedido',
      })
    } finally {
      setAssigning(false)
    }
  }

  return (
    <DriverLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">Escanear QR Code</h1>
          <p className="text-gray-600">Escaneie vários pedidos e monte a rota automaticamente</p>
        </div>

        <Card className="border-gray-200">
          <CardHeader className="border-b border-gray-100">
            <CardTitle className="text-lg font-semibold">Scanner de Pedidos</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            {!scanning && (
              <div className="text-center py-12">
                <Scan className="h-24 w-24 text-primary mx-auto mb-6" />
                <p className="text-gray-600 mb-6">
                  Digite o código do pedido ou escaneie o QR Code
                </p>
                <div className="max-w-md mx-auto space-y-4">
                  <div className="space-y-2">
                    <Input
                      type="text"
                      placeholder="Código do pedido (ex: EJG123ABC)"
                      value={manualCode}
                      onChange={(e) => setManualCode(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && !assigning) {
                          handleManualCode(manualCode)
                        }
                      }}
                      className="w-full h-11"
                      disabled={assigning}
                    />
                    <Button
                      onClick={() => handleManualCode(manualCode)}
                      disabled={!manualCode.trim() || assigning}
                      className="w-full h-11"
                    >
                      {assigning ? 'Buscando...' : 'Buscar por Código'}
                    </Button>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-gray-300" />
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="bg-white px-2 text-gray-500">ou</span>
                    </div>
                  </div>
                  <Button
                    size="lg"
                    onClick={startScanning}
                    className="w-full h-12 gap-2"
                    disabled={scannerLoading}
                  >
                    <Camera className="h-5 w-5" />
                    Usar Scanner de Câmera
                  </Button>
                </div>
              </div>
            )}

            {scanning && (
              <div className="space-y-4">
                {scannerLoading && (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-gray-600">Iniciando câmera...</p>
                  </div>
                )}
                {!scannerLoading && (
                  <>
                    <div className="relative">
                      <div
                        id="scanner-container"
                        className="w-full rounded-lg overflow-hidden bg-black"
                        style={{ minHeight: '400px' }}
                      />
                      <div className="absolute top-4 right-4 z-10">
                        <Button
                          variant="destructive"
                          size="icon"
                          onClick={stopScanning}
                          className="h-10 w-10"
                        >
                          <X className="h-5 w-5" />
                        </Button>
                      </div>
                    </div>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <p className="text-sm text-blue-800 text-center">
                        Posicione o QR Code dentro da área de leitura
                      </p>
                    </div>
                    <div className="max-w-md mx-auto space-y-2">
                      <Input
                        type="text"
                        placeholder="Ou digite o código manualmente"
                        value={manualCode}
                        onChange={(e) => setManualCode(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter' && !assigning) {
                            stopScanning()
                            handleManualCode(manualCode)
                          }
                        }}
                        className="w-full h-11"
                        disabled={assigning}
                      />
                      <Button
                        variant="outline"
                        className="w-full h-11"
                        onClick={stopScanning}
                        disabled={assigning}
                      >
                        Cancelar Scanner
                      </Button>
                    </div>
                  </>
                )}
              </div>
            )}
            {message && (
              <div
                className={`mt-6 rounded-lg border p-4 text-sm ${
                  message.success
                    ? 'border-green-200 bg-green-50 text-green-800'
                    : 'border-red-200 bg-red-50 text-red-800'
                }`}
              >
                {message.message}
              </div>
            )}
            {!scannerLoading && !scanning && (
              <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                  <div className="text-left text-sm text-yellow-800">
                    <p className="font-semibold mb-2">Dicas para o scanner:</p>
                    <ul className="list-disc list-inside space-y-1.5">
                      <li><strong>Permissões:</strong> permita o acesso à câmera</li>
                      <li><strong>HTTPS/Localhost:</strong> {checkHTTPS() ? '✓ ok' : '⚠ precisa HTTPS ou localhost'}</li>
                      <li><strong>Câmera em uso:</strong> feche outros apps usando a câmera</li>
                      <li><strong>Alternativa:</strong> use a opção de digitar o código</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

      </div>
    </DriverLayout>
  )
}
