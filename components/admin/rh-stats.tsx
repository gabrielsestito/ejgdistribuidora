import { Users, FileText, Bell } from 'lucide-react'

interface RHStatsProps {
  totalEmployees: number
  totalDocuments: number
  totalNotices: number
}

export function RHStats({ totalEmployees, totalDocuments, totalNotices }: RHStatsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="bg-white rounded-lg border p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Funcionários</p>
            <p className="text-2xl font-bold mt-1">{totalEmployees}</p>
          </div>
          <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
            <Users className="h-6 w-6 text-blue-600" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Documentos</p>
            <p className="text-2xl font-bold mt-1">{totalDocuments}</p>
          </div>
          <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
            <FileText className="h-6 w-6 text-green-600" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Avisos Gerais</p>
            <p className="text-2xl font-bold mt-1">{totalNotices}</p>
          </div>
          <div className="h-12 w-12 bg-amber-100 rounded-full flex items-center justify-center">
            <Bell className="h-6 w-6 text-amber-600" />
          </div>
        </div>
      </div>
    </div>
  )
}
