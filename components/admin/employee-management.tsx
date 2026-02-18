'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { FileText, Bell, Clock, Plus, Trash2, Download, Upload } from 'lucide-react'
import { EmployeeDocumentsTab } from './employee-documents-tab'
import { EmployeeNoticesTab } from './employee-notices-tab'
import { EmployeeSchedulesTab } from './employee-schedules-tab'

interface Employee {
  id: string
  name: string
  email: string
  employeeDocuments: Array<{
    id: string
    type: string
    title: string
    description: string | null
    fileUrl: string
    fileName: string
    fileSize: number | null
    createdAt: Date
  }>
  employeeNotices: Array<{
    id: string
    title: string
    message: string
    isGeneral: boolean
    read: boolean
    createdAt: Date
  }>
  employeeSchedules: Array<{
    id: string
    dayOfWeek: number
    startTime: string
    endTime: string
    breakStart: string | null
    breakEnd: string | null
    notes: string | null
  }>
}

interface EmployeeManagementProps {
  employee: Employee
}

export function EmployeeManagement({ employee }: EmployeeManagementProps) {
  const [activeTab, setActiveTab] = useState('documents')

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900">{employee.name}</h2>
            <p className="text-sm text-gray-600">{employee.email}</p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="documents" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Documentos ({employee.employeeDocuments.length})
            </TabsTrigger>
            <TabsTrigger value="notices" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Avisos ({employee.employeeNotices.length})
            </TabsTrigger>
            <TabsTrigger value="schedules" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Horários ({employee.employeeSchedules.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="documents" className="mt-6">
            <EmployeeDocumentsTab employeeId={employee.id} initialDocuments={employee.employeeDocuments} />
          </TabsContent>

          <TabsContent value="notices" className="mt-6">
            <EmployeeNoticesTab employeeId={employee.id} initialNotices={employee.employeeNotices} />
          </TabsContent>

          <TabsContent value="schedules" className="mt-6">
            <EmployeeSchedulesTab employeeId={employee.id} initialSchedules={employee.employeeSchedules} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
