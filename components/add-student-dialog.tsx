"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface AddStudentDialogProps {
  onStudentAdded: (student: { name: string }) => void
  existingRollNumbers: string[]
  trigger?: React.ReactNode // ✅ allow custom trigger
}

export default function AddStudentDialog({ onStudentAdded, existingRollNumbers, trigger }: AddStudentDialogProps) {
  const [name, setName] = useState("")
  const [open, setOpen] = useState(false)

  const handleAdd = () => {
    if (!name.trim()) return
    onStudentAdded({ name })
    setName("")
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
        <div className="space-y-3">
          <Input
            placeholder="Enter student name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <Button onClick={handleAdd} className="bg-orange-500 text-white">
            Save
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
