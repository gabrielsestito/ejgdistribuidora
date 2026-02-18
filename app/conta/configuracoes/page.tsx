'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Settings, User, Lock, MapPin, Loader2 } from 'lucide-react'
import Link from 'next/link'

export default function SettingsPage() {
  const { data: session, status, update } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [userData, setUserData] = useState({
    name: session?.user?.name || '',
    email: session?.user?.email || '',
    phone: '',
  })
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [addressData, setAddressData] = useState({
    street: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: '',
    zipCode: '',
    reference: '',
  })

  useEffect(() => {
    if (session?.user) {
      setUserData({
        name: session.user.name || '',
        email: session.user.email || '',
        phone: '',
      })
    }
  }, [session])

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      })

      if (response.ok) {
        await update()
        alert('Perfil atualizado com sucesso!')
      } else {
        const error = await response.json()
        alert(error.error || 'Erro ao atualizar perfil')
      }
    } catch (error) {
      console.error('Error updating profile:', error)
      alert('Erro ao atualizar perfil')
    } finally {
      setLoading(false)
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert('As senhas não coincidem')
      return
    }

    if (passwordData.newPassword.length < 6) {
      alert('A senha deve ter pelo menos 6 caracteres')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/user/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      })

      if (response.ok) {
        alert('Senha alterada com sucesso!')
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        })
      } else {
        const error = await response.json()
        alert(error.error || 'Erro ao alterar senha')
      }
    } catch (error) {
      console.error('Error changing password:', error)
      alert('Erro ao alterar senha')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/user/address', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(addressData),
      })

      if (response.ok) {
        alert('Endereço salvo com sucesso!')
        setAddressData({
          street: '',
          number: '',
          complement: '',
          neighborhood: '',
          city: '',
          state: '',
          zipCode: '',
          reference: '',
        })
      } else {
        const error = await response.json()
        alert(error.error || 'Erro ao salvar endereço')
      }
    } catch (error) {
      console.error('Error saving address:', error)
      alert('Erro ao salvar endereço')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/conta/login')
    }
  }, [status, router])

  if (status === 'loading') {
    return (
      <>
        <Header />
        <main className="min-h-screen flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin" />
        </main>
        <Footer />
      </>
    )
  }

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50 py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="mb-8">
              <h1 className="text-3xl font-bold mb-2">Configurações</h1>
              <p className="text-gray-600">Gerencie suas informações pessoais e preferências</p>
            </div>

            <Tabs defaultValue="profile" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="profile">
                  <User className="mr-2 h-4 w-4" />
                  Perfil
                </TabsTrigger>
                <TabsTrigger value="password">
                  <Lock className="mr-2 h-4 w-4" />
                  Segurança
                </TabsTrigger>
                <TabsTrigger value="address">
                  <MapPin className="mr-2 h-4 w-4" />
                  Endereços
                </TabsTrigger>
              </TabsList>

              {/* Perfil */}
              <TabsContent value="profile" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Informações Pessoais</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleUpdateProfile} className="space-y-4">
                      <div>
                        <Label htmlFor="name">Nome Completo</Label>
                        <Input
                          id="name"
                          value={userData.name}
                          onChange={(e) => setUserData((prev) => ({ ...prev, name: e.target.value }))}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          value={userData.email}
                          onChange={(e) => setUserData((prev) => ({ ...prev, email: e.target.value }))}
                          required
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Você receberá um email de confirmação ao alterar
                        </p>
                      </div>
                      <div>
                        <Label htmlFor="phone">Telefone</Label>
                        <Input
                          id="phone"
                          value={userData.phone}
                          onChange={(e) => setUserData((prev) => ({ ...prev, phone: e.target.value }))}
                          placeholder="(00) 00000-0000"
                        />
                      </div>
                      <div className="flex justify-end gap-4 pt-4">
                        <Button type="button" variant="outline" asChild>
                          <Link href="/conta">Cancelar</Link>
                        </Button>
                        <Button type="submit" disabled={loading}>
                          {loading ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Salvando...
                            </>
                          ) : (
                            'Salvar Alterações'
                          )}
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Segurança */}
              <TabsContent value="password" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Alterar Senha</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleChangePassword} className="space-y-4">
                      <div>
                        <Label htmlFor="currentPassword">Senha Atual</Label>
                        <Input
                          id="currentPassword"
                          type="password"
                          value={passwordData.currentPassword}
                          onChange={(e) =>
                            setPasswordData((prev) => ({ ...prev, currentPassword: e.target.value }))
                          }
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="newPassword">Nova Senha</Label>
                        <Input
                          id="newPassword"
                          type="password"
                          value={passwordData.newPassword}
                          onChange={(e) =>
                            setPasswordData((prev) => ({ ...prev, newPassword: e.target.value }))
                          }
                          required
                          minLength={6}
                        />
                        <p className="text-xs text-gray-500 mt-1">Mínimo de 6 caracteres</p>
                      </div>
                      <div>
                        <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
                        <Input
                          id="confirmPassword"
                          type="password"
                          value={passwordData.confirmPassword}
                          onChange={(e) =>
                            setPasswordData((prev) => ({ ...prev, confirmPassword: e.target.value }))
                          }
                          required
                        />
                      </div>
                      <div className="flex justify-end gap-4 pt-4">
                        <Button type="button" variant="outline" asChild>
                          <Link href="/conta">Cancelar</Link>
                        </Button>
                        <Button type="submit" disabled={loading}>
                          {loading ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Alterando...
                            </>
                          ) : (
                            'Alterar Senha'
                          )}
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Endereços */}
              <TabsContent value="address" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Adicionar Endereço</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleSaveAddress} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                          <Label htmlFor="zipCode">CEP</Label>
                          <Input
                            id="zipCode"
                            value={addressData.zipCode}
                            onChange={(e) =>
                              setAddressData((prev) => ({ ...prev, zipCode: e.target.value }))
                            }
                            placeholder="00000-000"
                            required
                          />
                        </div>
                        <div className="col-span-2">
                          <Label htmlFor="street">Rua</Label>
                          <Input
                            id="street"
                            value={addressData.street}
                            onChange={(e) =>
                              setAddressData((prev) => ({ ...prev, street: e.target.value }))
                            }
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="number">Número</Label>
                          <Input
                            id="number"
                            value={addressData.number}
                            onChange={(e) =>
                              setAddressData((prev) => ({ ...prev, number: e.target.value }))
                            }
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="complement">Complemento</Label>
                          <Input
                            id="complement"
                            value={addressData.complement}
                            onChange={(e) =>
                              setAddressData((prev) => ({ ...prev, complement: e.target.value }))
                            }
                          />
                        </div>
                        <div>
                          <Label htmlFor="neighborhood">Bairro</Label>
                          <Input
                            id="neighborhood"
                            value={addressData.neighborhood}
                            onChange={(e) =>
                              setAddressData((prev) => ({ ...prev, neighborhood: e.target.value }))
                            }
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="city">Cidade</Label>
                          <Input
                            id="city"
                            value={addressData.city}
                            onChange={(e) =>
                              setAddressData((prev) => ({ ...prev, city: e.target.value }))
                            }
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="state">Estado (UF)</Label>
                          <Input
                            id="state"
                            value={addressData.state}
                            onChange={(e) =>
                              setAddressData((prev) => ({ ...prev, state: e.target.value.toUpperCase() }))
                            }
                            maxLength={2}
                            required
                          />
                        </div>
                        <div className="col-span-2">
                          <Label htmlFor="reference">Ponto de Referência</Label>
                          <Input
                            id="reference"
                            value={addressData.reference}
                            onChange={(e) =>
                              setAddressData((prev) => ({ ...prev, reference: e.target.value }))
                            }
                            placeholder="Opcional"
                          />
                        </div>
                      </div>
                      <div className="flex justify-end gap-4 pt-4">
                        <Button type="button" variant="outline" asChild>
                          <Link href="/conta">Cancelar</Link>
                        </Button>
                        <Button type="submit" disabled={loading}>
                          {loading ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Salvando...
                            </>
                          ) : (
                            'Salvar Endereço'
                          )}
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
