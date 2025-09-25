// components/csv-upload.tsx
"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Upload, Download, Users } from "lucide-react"

interface CSVUploadProps {
  onDataProcessed: (data: any[]) => void
  onAddSampleData: () => void
  students: any[]
}

interface CSVRow {
  UID: string
  FirstName: string
  LastName: string
  Class: string
  INTime: string
  OUTTime: string
}

export default function CSVUpload({ onDataProcessed, onAddSampleData, students }: CSVUploadProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsLoading(true)
    
    try {
      const text = await file.text()
      const rows = text.split('\n').filter(row => row.trim())
      
      if (rows.length < 2) {
        alert("CSV file is empty or has only headers")
        return
      }

      // Parse headers
      const headers = rows[0].split(',').map(h => h.trim())
      
      // Parse data rows
      const data: CSVRow[] = []
      for (let i = 1; i < rows.length; i++) {
        const values = rows[i].split(',').map(v => v.trim())
        const rowData: any = {}
        
        headers.forEach((header, index) => {
          rowData[header] = values[index] || ''
        })
        
        if (rowData.UID && rowData.FirstName) {
          data.push(rowData)
        }
      }

      console.log("📊 Parsed CSV data:", data)
      onDataProcessed(data)
      alert(`✅ Successfully imported ${data.length} students from CSV`)
      
    } catch (error) {
      console.error("Error processing CSV:", error)
      alert("❌ Error processing CSV file. Please check the format.")
    } finally {
      setIsLoading(false)
      // Reset file input
      event.target.value = ''
    }
  }

  const downloadTemplate = () => {
    const headers = ["UID", "FirstName", "LastName", "Class", "INTime", "OUTTime"]
    const sampleData = [
      ["89C39994", "Kanwar", "Aaryaman", "CSE-AI", "2025-09-25 23:40:56", "2025-09-25 23:43:23"],
      ["99AC9B94", "Sameer", "Kumar", "CSE-AI", "2025-09-25 23:43:55", "2025-09-25 23:44:05"]
    ]
    
    const csvContent = [headers, ...sampleData].map(row => row.join(",")).join("\n")
    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = "student_rfid_template.csv"
    link.click()
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Import RFID Data
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* CSV Upload */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Upload CSV File</label>
            <div className="flex gap-2">
              <input 
                type="file" 
                accept=".csv" 
                onChange={handleFileUpload}
                disabled={isLoading}
                className="flex-1 border rounded p-2"
              />
              <Button onClick={downloadTemplate} variant="outline" size="sm">
                <Download className="h-4 w-4 mr-1" />
                Template
              </Button>
            </div>
            <p className="text-xs text-gray-500">
              Upload CSV with columns: UID, FirstName, LastName, Class, INTime, OUTTime
            </p>
          </div>

          {/* Sample Data */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Quick Import</label>
            <Button onClick={onAddSampleData} variant="outline" className="w-full">
              <Users className="h-4 w-4 mr-2" />
              Add Sample RFID Data (CSE-AI Students)
            </Button>
            <p className="text-xs text-gray-500">
              Add Kanwar, Sameer, and Saranjeet with their RFID UIDs
            </p>
          </div>

          {/* Stats */}
          <div className="p-3 bg-gray-50 rounded">
            <p className="text-sm">
              📊 <strong>{students.filter(s => s.uid).length}</strong> students have RFID UIDs assigned
            </p>
          </div>

          {isLoading && (
            <div className="p-2 bg-blue-50 text-blue-700 rounded text-sm">
              ⏳ Processing CSV file...
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}