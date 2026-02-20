'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { DriverLayout } from '@/components/driver/driver-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Scan, Camera, X, AlertCircle, RefreshCw } from 'lucide-react'
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
  const [cameras, setCameras] = useState<Array<{ id: string; label: string }>>([])
  const [currentCameraId, setCurrentCameraId] = useState<string | null>(null)
  const [flash, setFlash] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

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

  const loadCameras = async () => {
    try {
      // html5-qrcode expõe getCameras via Html5Qrcode
      // @ts-ignore
      const list = await Html5Qrcode.getCameras()
      const mapped = (list || []).map((c: any) => ({ id: c.id, label: c.label || `Câmera ${c.id}` }))
      setCameras(mapped)
      // Preferir câmera traseira
      const preferred =
        mapped.find((c) => /back|traseir|rear|environment/i.test(c.label))?.id ||
        mapped[0]?.id ||
        null
      setCurrentCameraId(preferred)
      return preferred
    } catch {
      setCameras([])
      setCurrentCameraId(null)
      return null
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

  const startScanning = async (cameraIdOverride?: string) => {
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

      // Aguardar o container aparecer no DOM
      let container: HTMLElement | null = null
      for (let i = 0; i < 20; i++) {
        container = document.getElementById('scanner-container')
        if (container) break
        // aguarda ~50ms por tentativa, total ~1s
        // garante render do container mesmo em dispositivos lentos
        // eslint-disable-next-line no-await-in-loop
        await new Promise(resolve => setTimeout(resolve, 50))
      }

      // Verificar se o elemento existe
      if (!container) {
        throw new Error('Erro ao inicializar o scanner. Tente recarregar a página.')
      }

      const scanner = new Html5Qrcode('scanner-container')
      scannerRef.current = scanner

      // Carregar lista de câmeras e escolher a preferida
      const preferredId = cameraIdOverride || (await loadCameras())

      let started = false
      let lastError: any = null

      // Configuração do scanner
      const config = {
        fps: 12,
        qrbox: (viewfinderWidth: number, viewfinderHeight: number) => {
          const minEdgePercentage = 0.7
          const minEdgeSize = Math.min(viewfinderWidth, viewfinderHeight)
          const qrboxSize = Math.floor(minEdgeSize * minEdgePercentage)
          return { width: qrboxSize, height: qrboxSize }
        },
        // Aspect ratio mais comum em mobile
        aspectRatio: 1.7778,
        disableFlip: false,
      } as any

      const onSuccess = (decodedText: string) => {
        if (!processingRef.current && !assigning) {
          handleScan(decodedText)
        }
      }
      const onError = (_err: string) => {
        // silencioso durante varredura
      }

      // 1) Tentar com cameraId preferido (se existir)
      if (preferredId) {
        try {
          await scanner.start(preferredId, config, onSuccess, onError)
          started = true
        } catch (e) {
          lastError = e
        }
      }

      // 2) Fallback: tentar por constraints (facingMode) se falhar
      if (!started) {
        const cameraConstraints = [
          { facingMode: { ideal: 'environment' } },
          { facingMode: { ideal: 'user' } },
          { facingMode: 'environment' },
          { facingMode: 'user' },
        ]
        for (const constraints of cameraConstraints) {
          try {
            await scanner.start(constraints as any, config, onSuccess, onError)
            started = true
            break
          } catch (e) {
            lastError = e
            continue
          }
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
      setFlash({ type: 'error', text: errorMessage })
      setTimeout(() => setFlash(null), 3000)
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

  const switchCamera = async () => {
    if (!cameras.length) return
    try {
      const idx = cameras.findIndex((c) => c.id === currentCameraId)
      const next = cameras[(idx + 1) % cameras.length]
      await stopScanning()
      setCurrentCameraId(next.id)
      await startScanning(next.id)
    } catch (e) {
      console.error('Error switching camera:', e)
      setMessage({
        success: false,
        message: 'Não foi possível alternar a câmera.',
      })
    }
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
        setFlash({ type: 'success', text: 'Atribuída ao entregador' })
        if (typeof navigator !== 'undefined' && (navigator as any).vibrate) {
          try {
            ;(navigator as any).vibrate(100)
          } catch {}
        }
        setTimeout(() => setFlash(null), 2500)
      } else {
        setMessage({
          success: false,
          message: json.error || 'Erro ao atribuir entrega',
        })
        setFlash({ type: 'error', text: json.error || 'Erro ao atribuir' })
        setTimeout(() => setFlash(null), 3000)
      }
    } catch (error) {
      setMessage({
        success: false,
        message: 'Erro ao processar QR Code',
      })
      setFlash({ type: 'error', text: 'Erro ao processar QR Code' })
      setTimeout(() => setFlash(null), 3000)
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
                    onClick={() => startScanning()}
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
            <>
              <div className="relative">
                <div
                  id="scanner-container"
                  className="w-full rounded-lg overflow-hidden bg-black"
                  style={{ minHeight: '400px' }}
                />
                {flash && (
                  <div
                    className={`absolute top-4 left-1/2 -translate-x-1/2 z-20 px-4 py-2 rounded shadow text-white ${
                      flash.type === 'success' ? 'bg-green-600' : 'bg-red-600'
                    }`}
                  >
                    {flash.text}
                  </div>
                )}
                <div className="absolute top-4 right-4 z-10 flex gap-2">
                  {cameras.length > 1 && (
                    <Button
                      variant="secondary"
                      size="icon"
                      onClick={switchCamera}
                      className="h-10 w-10"
                      title="Trocar câmera"
                    >
                      <RefreshCw className="h-5 w-5" />
                    </Button>
                  )}
                  <Button
                    variant="destructive"
                    size="icon"
                    onClick={stopScanning}
                    className="h-10 w-10"
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>
                {scannerLoading && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 text-white gap-3">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
                    <p>Iniciando câmera...</p>
                  </div>
                )}
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
