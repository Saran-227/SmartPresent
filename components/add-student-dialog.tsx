// components/add-student-dialog.tsx
"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface AddStudentDialogProps {
  onStudentAdded: (student: { name: string; uid?: string }) => void
  existingRollNumbers: string[]
  trigger?: React.ReactNode
}

export default function AddStudentDialog({ onStudentAdded, existingRollNumbers, trigger }: AddStudentDialogProps) {
  const [name, setName] = useState("")
  const [uid, setUid] = useState("")
  const [open, setOpen] = useState(false)

  const handleAdd = () => {
    if (!name.trim()) {
      alert("Please enter student name")
      return
    }

    onStudentAdded({ 
      name: name.trim(), 
      uid: uid.trim() || undefined 
    })
    setName("")
    setUid("")
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" className="bg-white text-black border-orange-200 hover:bg-orange-50">
            Add Student
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Student</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Student Name *</label>
            <Input
              placeholder="Enter student name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1"
            />
          </div>
          
          <div>
            <label className="text-sm font-medium">RFID UID (Optional)</label>
            <Input
              placeholder="Enter RFID UID (e.g., A1B2C3D4)"
              value={uid}
              onChange={(e) => setUid(e.target.value.toUpperCase())}
              className="mt-1"
            />
            <p className="text-xs text-gray-500 mt-1">
              Assign a unique RFID UID to enable quick attendance marking
            </p>
          </div>

          <Button onClick={handleAdd} className="w-full bg-orange-500 hover:bg-orange-600 text-white">
            Add Student
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}