// components/student-card.tsx
"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

interface StudentCardProps {
  student: {
    id: string
    name: string
    rollNumber: string
    uid?: string // Add uid here
  }
  isPresent: boolean
  onAttendanceChange: (studentId: string, isPresent: boolean) => void
  onDelete: (studentId: string) => void
  disabled?: boolean
}

export default function StudentCard({
  student,
  isPresent,
  onAttendanceChange,
  onDelete,
  disabled = false,
}: StudentCardProps) {
  return (
    <Card className="p-4 flex flex-col gap-2">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-medium">{student.name}</h3>
          <p className="text-sm text-gray-600">Roll: {student.rollNumber}</p>
          {student.uid && (
            <p className="text-xs text-blue-600 font-mono">UID: {student.uid}</p>
          )}
        </div>
        <Button
          variant="destructive"
          size="sm"
          onClick={() => onDelete(student.id)}
        >
          Delete
        </Button>
      </div>
      
      <div className="flex gap-2 mt-2">
        <Button
          variant={isPresent ? "default" : "outline"}
          disabled={disabled}
          onClick={() => onAttendanceChange(student.id, true)}
          className="flex-1"
        >
          Present
        </Button>
        <Button
          variant={!isPresent ? "default" : "outline"}
          disabled={disabled}
          onClick={() => onAttendanceChange(student.id, false)}
          className="flex-1"
        >
          Absent
        </Button>
      </div>
    </Card>
  )
}