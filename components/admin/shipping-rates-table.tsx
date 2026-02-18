'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Card, CardContent } from '@/components/ui/card'
import { Plus, Edit, Trash2, Loader2, MapPin, Settings } from 'lucide-react'
import { formatPrice } from '@/lib/utils'

interface ShippingRate {
  id: string
  minDistance: number
  maxDistance: number
  price: number
  active: boolean
}

export function ShippingRatesTable() {
  const [rates, setRates] = useState<ShippingRate[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingRate, setEditingRate] = useState<ShippingRate | null>(null)
  const [formData, setFormData] = useState({
    minDistance: '',
    maxDistance: '',
    price: '',
    active: true,
  })
  const [saving, setSaving] = useState(false)
  const [configLoading, setConfigLoading] = useState(true)
  const [maxDistanceKm, setMaxDistanceKm] = useState<string>('100')
  const [savingConfig, setSavingConfig] = useState(false)
  const [globalMinOrder, setGlobalMinOrder] = useState<string>('50')
  const [freeCities, setFreeCities] = useState<Array<{ id: string; city: string; state: string; active: boolean }>>([])
  const [freeCityForm, setFreeCityForm] = useState({ city: '', state: 'SP', active: true })
  const [savingCity, setSavingCity] = useState(false)
  const [selectedUF, setSelectedUF] = useState<string>('SP')
  const [citiesList, setCitiesList] = useState<Array<{ id: number; nome: string }>>([])
  const [citiesLoading, setCitiesLoading] = useState(false)
  const [cityQuery, setCityQuery] = useState('')
  const [minOrderAmount, setMinOrderAmount] = useState<string>('0')

  useEffect(() => {
    fetchRates()
    fetchConfigAndCities()
  }, [])

  useEffect(() => {
    const loadCities = async () => {
      try {
        setCitiesLoading(true)
        const res = await fetch(
          `https://servicodados.ibge.gov.br/api/v1/localidades/estados/${selectedUF}/municipios?orderBy=nome`
        )
        const data = await res.json()
        setCitiesList(Array.isArray(data) ? data : [])
      } catch (e) {
        console.error('Erro ao buscar cidades IBGE:', e)
        setCitiesList([])
      } finally {
        setCitiesLoading(false)
      }
    }
    loadCities()
  }, [selectedUF])

  const fetchRates = async () => {
    try {
      const response = await fetch('/api/admin/shipping-rates')
      const data = await response.json()
      setRates(data)
    } catch (error) {
      console.error('Error fetching rates:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchConfigAndCities = async () => {
    try {
      setConfigLoading(true)
      const [configRes, citiesRes] = await Promise.all([
        fetch('/api/admin/shipping-config'),
        fetch('/api/admin/free-shipping-cities'),
      ])
      const config = await configRes.json()
      if (config?.maxDistanceKm !== undefined) {
        setMaxDistanceKm(String(Number(config.maxDistanceKm)))
      }
      if (config?.minOrderAmount !== undefined) {
        setGlobalMinOrder(String(Number(config.minOrderAmount)))
      }
      const cities = await citiesRes.json()
      setFreeCities(Array.isArray(cities) ? cities : [])
    } catch (error) {
      console.error('Error fetching shipping config/cities:', error)
    } finally {
      setConfigLoading(false)
    }
  }

  const handleOpenDialog = (rate?: ShippingRate) => {
    if (rate) {
      setEditingRate(rate)
      setFormData({
        minDistance: String(rate.minDistance),
        maxDistance: String(rate.maxDistance),
        price: String(rate.price),
        active: rate.active,
      })
    } else {
      setEditingRate(null)
      setFormData({
        minDistance: '',
        maxDistance: '',
        price: '',
        active: true,
      })
    }
    setDialogOpen(true)
  }

  const handleSave = async () => {
    if (!formData.minDistance || !formData.maxDistance || !formData.price) {
      alert('Preencha todos os campos')
      return
    }

    setSaving(true)
    try {
      const url = editingRate
        ? `/api/admin/shipping-rates/${editingRate.id}`
        : '/api/admin/shipping-rates'
      const method = editingRate ? 'PATCH' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          minDistance: parseFloat(formData.minDistance),
          maxDistance: parseFloat(formData.maxDistance),
          price: parseFloat(formData.price),
          active: formData.active,
        }),
      })

      if (response.ok) {
        fetchRates()
        setDialogOpen(false)
      } else {
        const error = await response.json()
        alert(error.error || 'Erro ao salvar faixa de frete')
      }
    } catch (error) {
      console.error('Error saving rate:', error)
      alert('Erro ao salvar faixa de frete')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta faixa de frete?')) return

    try {
      const response = await fetch(`/api/admin/shipping-rates/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        fetchRates()
      }
    } catch (error) {
      console.error('Error deleting rate:', error)
      alert('Erro ao excluir faixa de frete')
    }
  }

  if (loading) {
    return <div className="text-center py-12">Carregando...</div>
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-6 space-y-4">
          <div>
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Settings className="h-5 w-5 text-primary" />
              Configuração de Entrega
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Ajuste o raio máximo e cadastre cidades com frete grátis.
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="maxDistanceKm">Raio máximo (km)</Label>
              <div className="flex items-center gap-2 mt-1">
                <Input
                  id="maxDistanceKm"
                  type="number"
                  step="1"
                  min="1"
                  value={maxDistanceKm}
                  onChange={(e) => setMaxDistanceKm(e.target.value)}
                  className="max-w-xs"
                />
                <Button
                  onClick={async () => {
                    setSavingConfig(true)
                    try {
                      const res = await fetch('/api/admin/shipping-config', {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ maxDistanceKm: parseFloat(maxDistanceKm) }),
                      })
                      if (res.ok) {
                        await fetchConfigAndCities()
                      } else {
                        const err = await res.json()
                        alert(err.error || 'Erro ao salvar configuração')
                      }
                    } catch (error) {
                      console.error('Error saving config:', error)
                      alert('Erro ao salvar configuração')
                    } finally {
                      setSavingConfig(false)
                    }
                  }}
                  disabled={savingConfig}
                >
                  {savingConfig ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    'Salvar raio'
                  )}
                </Button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Valor atual aplicado no cálculo de frete.
              </p>
              <div className="mt-4">
                <Label htmlFor="globalMinOrder">Pedido mínimo (R$)</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Input
                    id="globalMinOrder"
                    type="number"
                    step="0.01"
                    min="0"
                    value={globalMinOrder}
                    onChange={(e) => setGlobalMinOrder(e.target.value)}
                    className="max-w-xs"
                  />
                  <Button
                    onClick={async () => {
                      setSavingConfig(true)
                      try {
                        const res = await fetch('/api/admin/shipping-config', {
                          method: 'PATCH',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ minOrderAmount: parseFloat(globalMinOrder || '0') }),
                        })
                        if (res.ok) {
                          await fetchConfigAndCities()
                        } else {
                          const err = await res.json()
                          alert(err.error || 'Erro ao salvar pedido mínimo')
                        }
                      } catch (error) {
                        console.error('Error saving min order:', error)
                        alert('Erro ao salvar pedido mínimo')
                      } finally {
                        setSavingConfig(false)
                      }
                    }}
                    disabled={savingConfig}
                  >
                    {savingConfig ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Salvando...
                      </>
                    ) : (
                      'Salvar mínimo'
                    )}
                  </Button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Valor mínimo exigido para finalizar o pedido.
                </p>
              </div>
            </div>
            <div>
              <Label className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" />
                Cidades com Frete Grátis
              </Label>
              <div className="mt-2 space-y-2">
                {configLoading ? (
                  <p className="text-sm text-gray-500 flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Carregando...
                  </p>
                ) : freeCities.length === 0 ? (
                  <p className="text-sm text-gray-500">Nenhuma cidade configurada.</p>
                ) : (
                  freeCities.map((c) => (
                    <div key={c.id} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                      <div className="text-sm">
                        <span className="font-medium">{c.city}</span> / {c.state}{' '}
                        <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${c.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                          {c.active ? 'Ativa' : 'Inativa'}
                        </span>
                        <span className="ml-2 text-xs text-gray-600">
                          Min: R$ {Number((c as any).minOrderAmount || 0).toFixed(2)}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={async () => {
                            const res = await fetch(`/api/admin/free-shipping-cities/${c.id}`, {
                              method: 'PATCH',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ active: !c.active }),
                            })
                            if (res.ok) {
                              fetchConfigAndCities()
                            }
                          }}
                        >
                          {c.active ? 'Desativar' : 'Ativar'}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={async () => {
                            if (!confirm('Excluir cidade?')) return
                            const res = await fetch(`/api/admin/free-shipping-cities/${c.id}`, {
                              method: 'DELETE',
                            })
                            if (res.ok) {
                              fetchConfigAndCities()
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
              <div className="mt-3 space-y-3">
                <div className="grid md:grid-cols-3 gap-2">
                  <div>
                    <Label className="text-xs">UF</Label>
                    <Select
                      value={selectedUF}
                      onValueChange={(val) => {
                        setSelectedUF(val)
                        setFreeCityForm((prev) => ({ ...prev, state: val }))
                        setCityQuery('')
                      }}
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue placeholder="Selecione UF" />
                      </SelectTrigger>
                      <SelectContent>
                        {['SP','MG','RJ','PR','RS','SC','MT','MS','GO','DF','BA','PE','CE','PA','AM','RO','RR','AC','AP','MA','PI','RN','PB','AL','SE','ES','TO'].map((uf) => (
                          <SelectItem key={uf} value={uf}>{uf}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="md:col-span-2">
                    <Label className="text-xs">Cidade</Label>
                    <div className="relative">
                      <Input
                        placeholder="Digite para pesquisar cidade"
                        value={cityQuery}
                        onChange={(e) => setCityQuery(e.target.value)}
                        className="h-9 pr-10"
                      />
                      {citiesLoading && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                        </div>
                      )}
                      {!!cityQuery && (
                        <div className="absolute z-10 mt-1 w-full max-h-48 overflow-auto rounded-md border bg-white shadow">
                          {citiesList
                            .filter((c) => c.nome.toLowerCase().includes(cityQuery.toLowerCase()))
                            .slice(0, 10)
                            .map((c) => (
                              <button
                                key={c.id}
                                type="button"
                                className="w-full text-left px-3 py-2 hover:bg-gray-100 text-sm"
                                onClick={() => {
                                  setFreeCityForm((prev) => ({ ...prev, city: c.nome }))
                                  setCityQuery(c.nome)
                                }}
                              >
                                {c.nome} / {selectedUF}
                              </button>
                            ))}
                          {citiesList.filter((c) => c.nome.toLowerCase().includes(cityQuery.toLowerCase())).length === 0 && (
                            <div className="px-3 py-2 text-sm text-gray-500">Nenhuma cidade encontrada</div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="grid md:grid-cols-3 gap-2 items-center">
                  <input
                    type="checkbox"
                    id="freeCityActive"
                    checked={freeCityForm.active}
                    onChange={(e) => setFreeCityForm((prev) => ({ ...prev, active: e.target.checked }))}
                    className="h-4 w-4"
                  />
                  <Label htmlFor="freeCityActive">Ativa</Label>
                  <div className="md:col-span-2 flex items-center gap-2">
                    <Label htmlFor="minOrder" className="text-xs">Pedido mínimo (R$)</Label>
                    <Input
                      id="minOrder"
                      type="number"
                      step="0.01"
                      min="0"
                      value={minOrderAmount}
                      onChange={(e) => setMinOrderAmount(e.target.value)}
                      className="h-9 max-w-[160px]"
                    />
                  </div>
                  <Button
                    className="ml-auto"
                    onClick={async () => {
                      if (!cityQuery || !selectedUF) {
                        alert('Informe cidade e UF')
                        return
                      }
                      setSavingCity(true)
                      try {
                        const res = await fetch('/api/admin/free-shipping-cities', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            city: cityQuery,
                            state: selectedUF,
                            active: freeCityForm.active,
                            minOrderAmount: parseFloat(minOrderAmount || '0'),
                          }),
                        })
                        if (res.ok) {
                          setFreeCityForm({ city: '', state: selectedUF, active: true })
                          fetchConfigAndCities()
                          setCityQuery('')
                          setMinOrderAmount('0')
                        } else {
                          const err = await res.json()
                          alert(err.error || 'Erro ao adicionar cidade')
                        }
                      } catch (error) {
                        console.error('Error adding city:', error)
                      } finally {
                        setSavingCity(false)
                      }
                    }}
                    disabled={savingCity}
                  >
                    {savingCity ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Adicionando...
                      </>
                    ) : (
                      'Adicionar cidade'
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-xl font-semibold">Faixas de Distância</h2>
              <p className="text-sm text-gray-600 mt-1">
                Configure as faixas de distância e valores de frete (aplicadas por distância)
              </p>
            </div>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="mr-2 h-4 w-4" />
              Nova Faixa
            </Button>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Distância Mínima (km)</TableHead>
                  <TableHead>Distância Máxima (km)</TableHead>
                  <TableHead>Valor do Frete</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rates.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-gray-500 py-8">
                      Nenhuma faixa de frete configurada. Clique em "Nova Faixa" para começar.
                    </TableCell>
                  </TableRow>
                ) : (
                  rates.map((rate) => (
                    <TableRow key={rate.id}>
                      <TableCell>{rate.minDistance} km</TableCell>
                      <TableCell>{rate.maxDistance} km</TableCell>
                      <TableCell className="font-semibold">{formatPrice(rate.price)}</TableCell>
                      <TableCell>
                        <span
                          className={`px-2 py-1 rounded-full text-xs ${
                            rate.active
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {rate.active ? 'Ativa' : 'Inativa'}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenDialog(rate)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(rate.id)}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingRate ? 'Editar Faixa de Frete' : 'Nova Faixa de Frete'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="minDistance">Distância Mínima (km) *</Label>
              <Input
                id="minDistance"
                type="number"
                step="0.1"
                min="0"
                value={formData.minDistance}
                onChange={(e) => setFormData((prev) => ({ ...prev, minDistance: e.target.value }))}
                required
              />
            </div>
            <div>
              <Label htmlFor="maxDistance">Distância Máxima (km) *</Label>
              <Input
                id="maxDistance"
                type="number"
                step="0.1"
                min="0"
                value={formData.maxDistance}
                onChange={(e) => setFormData((prev) => ({ ...prev, maxDistance: e.target.value }))}
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Máximo: 100km (raio de entrega)
              </p>
            </div>
            <div>
              <Label htmlFor="price">Valor do Frete (R$) *</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                min="0"
                value={formData.price}
                onChange={(e) => setFormData((prev) => ({ ...prev, price: e.target.value }))}
                required
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="active"
                checked={formData.active}
                onChange={(e) => setFormData((prev) => ({ ...prev, active: e.target.checked }))}
                className="h-4 w-4"
              />
              <Label htmlFor="active" className="cursor-pointer">
                Faixa ativa
              </Label>
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  'Salvar'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
