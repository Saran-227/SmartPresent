// components/manual-rfid-input.tsx
"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Scan } from "lucide-react"

interface ManualRFIDInputProps {
  onUIDSubmit: (uid: string) => void
  students: Array<{ id: string; name: string; uid?: string }>
  disabled?: boolean
}

export default function ManualRFIDInput({ 
  onUIDSubmit, 
  students, 
  disabled = false 
}: ManualRFIDInputProps) {
  const [uid, setUid] = useState("")
  const [lastScannedStudent, setLastScannedStudent] = useState<{ name: string; uid: string } | null>(null)

  const handleSubmit = () => {
    if (!uid.trim()) {
      alert("❌ Please enter a UID")
      return
    }

    // Find student by UID (case-insensitive, trim spaces)
    const student = students.find(s => 
      s.uid && s.uid.toString().trim().toUpperCase() === uid.trim().toUpperCase()
    )

    if (student) {
      onUIDSubmit(student.uid!) // Submit the original UID (not the normalized one)
      setLastScannedStudent({ name: student.name, uid: student.uid! })
      setUid("") // Clear input after successful scan
    } else {
      alert(`❌ No student found with UID: "${uid}"\n\nAvailable students with UIDs:\n${
        students.filter(s => s.uid).map(s => `• ${s.name}: ${s.uid}`).join('\n') || 'None'
      }`)
      setLastScannedStudent(null)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit()
    }
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Scan className="h-5 w-5" />
          Manual RFID Scanner
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Enter RFID UID (e.g., A1B2C3D4)"
              value={uid}
              onChange={(e) => setUid(e.target.value.toUpperCase())}
              onKeyPress={handleKeyPress}
              disabled={disabled}
              className="flex-1"
            />
            <Button 
              onClick={handleSubmit} 
              disabled={disabled}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Mark Present
            </Button>
          </div>
          
          {lastScannedStudent && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-md">
              <p className="text-green-700 font-medium">
                ✅ Successfully marked <strong>{lastScannedStudent.name}</strong> as present!
              </p>
              <p className="text-green-600 text-sm">UID: {lastScannedStudent.uid}</p>
            </div>
          )}

          <div className="text-sm text-gray-600">
            <p>💡 Enter the RFID UID to automatically mark student attendance.</p>
            <p>📝 Students with UIDs: {students.filter(s => s.uid).length}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}