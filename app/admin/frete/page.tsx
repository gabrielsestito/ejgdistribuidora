'use client'

import { AdminLayout } from '@/components/admin/admin-layout'
import { ShippingRatesTable } from '@/components/admin/shipping-rates-table'

export default function AdminShippingPage() {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Zonas de Entrega</h1>
          <p className="text-gray-600 mt-1">Gerencie as faixas de distância e valores de frete</p>
        </div>

        <ShippingRatesTable />
      </div>
    </AdminLayout>
  )
}
