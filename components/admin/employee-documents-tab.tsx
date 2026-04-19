'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { FileText, AlertTriangle, Download, Trash2, Plus, Upload } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'

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

interface EmployeeDocumentsTabProps {
  employeeId: string
  initialDocuments: Document[]
}

export function EmployeeDocumentsTab({ employeeId, initialDocuments }: EmployeeDocumentsTabProps) {
  const [documents, setDocuments] = useState(initialDocuments)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [formData, setFormData] = useState({
    type: 'HOLERITE',
    title: '',
    description: '',
    file: null as File | null,
  })

  const documentTypeLabels: Record<string, string> = {
    HOLERITE: 'Holerite',
    ADVERTENCIA: 'Advertência',
    OUTRO: 'Outro',
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setFormData((prev) => ({ ...prev, file }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.file) return

    setIsUploading(true)
    try {
      // Upload do arquivo
      const uploadFormData = new FormData()
      uploadFormData.append('file', formData.file)
      uploadFormData.append('type', 'documents')

      const uploadResponse = await fetch('/api/admin/upload', {
        method: 'POST',
        body: uploadFormData,
      })

      if (!uploadResponse.ok) {
        throw new Error('Erro ao fazer upload do arquivo')
      }

      const { url } = await uploadResponse.json()

      // Criar documento
      const response = await fetch('/api/admin/rh/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId,
          type: formData.type,
          title: formData.title,
          description: formData.description || null,
          fileUrl: url,
          fileName: formData.file.name,
          fileSize: formData.file.size,
        }),
      })

      if (!response.ok) {
        throw new Error('Erro ao criar documento')
      }

      const newDocument = await response.json()
      setDocuments((prev) => [newDocument, ...prev])
      setFormData({ type: 'HOLERITE', title: '', description: '', file: null })
      setIsDialogOpen(false)
    } catch (error) {
      console.error('Error creating document:', error)
      alert('Erro ao criar documento')
    } finally {
      setIsUploading(false)
    }
  }

  const handleDelete = async (documentId: string) => {
    if (!confirm('Tem certeza que deseja excluir este documento?')) return

    try {
      const response = await fetch(`/api/admin/rh/documents/${documentId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Erro ao excluir documento')
      }

      setDocuments((prev) => prev.filter((d) => d.id !== documentId))
    } catch (error) {
      console.error('Error deleting document:', error)
      alert('Erro ao excluir documento')
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">Documentos do Funcionário</h3>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Adicionar Documento
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Adicionar Documento</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="type">Tipo de Documento</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="HOLERITE">Holerite</SelectItem>
                    <SelectItem value="ADVERTENCIA">Advertência</SelectItem>
                    <SelectItem value="OUTRO">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="title">Título *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                  required
                  placeholder="Ex: Holerite Janeiro 2024"
                />
              </div>

              <div>
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="Informações adicionais sobre o documento"
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="file">Arquivo *</Label>
                <div className="mt-2">
                  <Input
                    id="file"
                    type="file"
                    onChange={handleFileChange}
                    required
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  />
                  {formData.file && (
                    <p className="text-sm text-gray-600 mt-1">
                      Arquivo selecionado: {formData.file.name} ({(formData.file.size / 1024).toFixed(1)} KB)
                    </p>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                  disabled={isUploading}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={isUploading || !formData.file}>
                  {isUploading ? 'Enviando...' : 'Adicionar'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {documents.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <FileText className="h-12 w-12 mx-auto mb-3 text-gray-300" />
          <p className="text-gray-500">Nenhum documento cadastrado</p>
        </div>
      ) : (
        <div className="space-y-3">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-4 flex-1">
                <div
                  className={`h-12 w-12 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    doc.type === 'HOLERITE'
                      ? 'bg-green-100'
                      : doc.type === 'ADVERTENCIA'
                      ? 'bg-red-100'
                      : 'bg-blue-100'
                  }`}
                >
                  {doc.type === 'HOLERITE' ? (
                    <FileText className="h-6 w-6 text-green-600" />
                  ) : doc.type === 'ADVERTENCIA' ? (
                    <AlertTriangle className="h-6 w-6 text-red-600" />
                  ) : (
                    <FileText className="h-6 w-6 text-blue-600" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold text-gray-900">{doc.title}</h4>
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${
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
                  {doc.description && <p className="text-sm text-gray-600 mb-1">{doc.description}</p>}
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span>{formatDistanceToNow(new Date(doc.createdAt), { addSuffix: true, locale: ptBR })}</span>
                    {doc.fileSize && <span>{(doc.fileSize / 1024).toFixed(1)} KB</span>}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={doc.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Download"
                >
                  <Download className="h-5 w-5 text-gray-600" />
                </a>
                <button
                  onClick={() => handleDelete(doc.id)}
                  className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                  title="Excluir"
                >
                  <Trash2 className="h-5 w-5 text-red-600" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
