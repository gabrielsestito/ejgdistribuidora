'use client'

import { useState, useMemo } from 'react'
import { FileText, AlertTriangle, Download, Calendar, Search, Filter, X } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'

interface Document {
  id: string
  type: string
  title: string
  description: string | null
  fileUrl: string
  fileName: string
  fileSize: number | null
  createdAt: Date
}

interface EmployeeDocumentsListProps {
  initialDocuments: Document[]
}

const documentTypeLabels: Record<string, string> = {
  HOLERITE: 'Holerite',
  ADVERTENCIA: 'Advertência',
  OUTRO: 'Outro',
}

export function EmployeeDocumentsList({ initialDocuments }: EmployeeDocumentsListProps) {
  const [documents] = useState(initialDocuments)
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState<'all' | 'HOLERITE' | 'ADVERTENCIA' | 'OUTRO'>('all')
  const [sortBy, setSortBy] = useState<'date' | 'name'>('date')

  const filteredAndSortedDocuments = useMemo(() => {
    let filtered = documents.filter((doc) => {
      const matchesSearch =
        doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (doc.description && doc.description.toLowerCase().includes(searchTerm.toLowerCase()))

      const matchesType = typeFilter === 'all' || doc.type === typeFilter

      return matchesSearch && matchesType
    })

    // Ordenação
    filtered.sort((a, b) => {
      if (sortBy === 'date') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      } else {
        return a.title.localeCompare(b.title)
      }
    })

    return filtered
  }, [documents, searchTerm, typeFilter, sortBy])

  const hasActiveFilters = searchTerm !== '' || typeFilter !== 'all'

  return (
    <>
      {/* Filtros */}
      <div className="bg-white rounded-lg border shadow-sm p-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar por título ou descrição..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <Select value={typeFilter} onValueChange={(value: any) => setTypeFilter(value)}>
            <SelectTrigger className="w-full md:w-[180px]">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="HOLERITE">Holerite</SelectItem>
              <SelectItem value="ADVERTENCIA">Advertência</SelectItem>
              <SelectItem value="OUTRO">Outro</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
            <SelectTrigger className="w-full md:w-[180px]">
              <SelectValue placeholder="Ordenar por" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date">Data (mais recente)</SelectItem>
              <SelectItem value="name">Nome (A-Z)</SelectItem>
            </SelectContent>
          </Select>

          {hasActiveFilters && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearchTerm('')
                setTypeFilter('all')
              }}
              className="whitespace-nowrap"
            >
              <X className="mr-2 h-4 w-4" />
              Limpar
            </Button>
          )}
        </div>

        {hasActiveFilters && (
          <div className="mt-3 text-sm text-gray-600">
            Mostrando {filteredAndSortedDocuments.length} de {documents.length} documentos
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg border shadow-sm">
        {filteredAndSortedDocuments.length === 0 ? (
          <div className="text-center py-16">
            <FileText className="h-16 w-16 mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-medium text-gray-500">
              {hasActiveFilters
                ? 'Nenhum documento encontrado com os filtros aplicados'
                : 'Nenhum documento disponível'}
            </p>
            <p className="text-sm text-gray-400 mt-2">
              {hasActiveFilters
                ? 'Tente ajustar os filtros de busca'
                : 'Seus documentos aparecerão aqui quando forem adicionados pelo RH'}
            </p>
            {hasActiveFilters && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchTerm('')
                  setTypeFilter('all')
                }}
                className="mt-4"
              >
                <X className="mr-2 h-4 w-4" />
                Limpar filtros
              </Button>
            )}
          </div>
        ) : (
          <div className="divide-y">
            {filteredAndSortedDocuments.map((doc) => (
              <div key={doc.id} className="p-4 sm:p-6 hover:bg-gray-50 transition-colors">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1 min-w-0">
                    <div
                      className={`h-10 w-10 sm:h-12 sm:w-12 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        doc.type === 'HOLERITE'
                          ? 'bg-green-100'
                          : doc.type === 'ADVERTENCIA'
                          ? 'bg-red-100'
                          : 'bg-blue-100'
                      }`}
                    >
                      {doc.type === 'HOLERITE' ? (
                        <FileText className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
                      ) : doc.type === 'ADVERTENCIA' ? (
                        <AlertTriangle className="h-5 w-5 sm:h-6 sm:w-6 text-red-600" />
                      ) : (
                        <FileText className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <h3 className="font-semibold text-gray-900 text-sm sm:text-base break-words">{doc.title}</h3>
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${
                            doc.type === 'HOLERITE'
                              ? 'bg-green-100 text-green-800'
                              : doc.type === 'ADVERTENCIA'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {documentTypeLabels[doc.type]}
                        </span>
                      </div>
                      {doc.description && (
                        <p className="text-sm text-gray-600 mb-2 break-words">{doc.description}</p>
                      )}
                      <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs text-gray-500">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDistanceToNow(new Date(doc.createdAt), {
                            addSuffix: true,
                            locale: ptBR,
                          })}
                        </div>
                        {doc.fileSize && <span>{(doc.fileSize / 1024).toFixed(1)} KB</span>}
                      </div>
                    </div>
                  </div>
                  <a
                    href={doc.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full sm:w-auto px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 flex-shrink-0 text-sm sm:text-base"
                  >
                    <Download className="h-4 w-4" />
                    <span>Download</span>
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
