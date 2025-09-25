// components/add-class-dialog.tsx
"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { supabase } from "@/lib/supabaseClient"

interface Props {
  onClassAdded?: (cls: any) => void
  trigger?: React.ReactNode
}

export default function AddClassDialog({ onClassAdded, trigger }: Props) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")
  const [subject, setSubject] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleCreate(e?: React.FormEvent) {
    e?.preventDefault()
    if (!name.trim()) return alert("Enter class name")
    setLoading(true)
    const { data, error } = await supabase.from("classes").insert([{ name: name.trim(), subject: subject.trim() }]).select().single()
    setLoading(false)
    if (error) {
      console.error("class create error", error)
      alert("Failed to create class")
      return
    }
    setOpen(false); setName(""); setSubject("")
    onClassAdded?.(data)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger || <Button>Create Class</Button>}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Class</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleCreate}>
          <div className="grid gap-3 py-2">
            <div>
              <Label>Class Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div>
              <Label>Subject (optional)</Label>
              <Input value={subject} onChange={(e) => setSubject(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={loading}>{loading ? "Creating..." : "Create"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
