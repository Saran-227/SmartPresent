"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar, Clock, BookOpen, Plus } from "lucide-react"

interface AttendanceSessionFormProps {
  onCreateSession: (date: Date, topic: string) => void
  isLoading?: boolean
}

export default function AttendanceSessionForm({ onCreateSession, isLoading = false }: AttendanceSessionFormProps) {
  const [date, setDate] = useState(new Date().toISOString().split("T")[0])
  const [time, setTime] = useState(new Date().toTimeString().slice(0, 5)) // ✅ Added
  const [topic, setTopic] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!topic.trim()) return

    const dateTimeString = `${date}T${time || "00:00"}`
    const sessionDate = new Date(dateTimeString)

    onCreateSession(sessionDate, topic.trim())
    setTopic("")
  }

  return (
    <Card className="dashboard-card">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Plus className="h-5 w-5 text-primary" />
          Create New Attendance Session
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="session-date" className="flex items-center gap-2 text-sm font-medium">
                <Calendar className="h-4 w-4" />
                Date
              </Label>
              <Input
                id="session-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="bg-input border-border"
                required
              />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-sm font-medium">
                <Clock className="h-4 w-4" />
                Time
              </Label>
              <Input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="bg-input border-border"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="session-topic" className="flex items-center gap-2 text-sm font-medium">
              <BookOpen className="h-4 w-4" />
              Class Topic
            </Label>
            <Textarea
              id="session-topic"
              placeholder="Enter the topic or subject covered in this class..."
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="bg-input border-border resize-none"
              rows={3}
              required
            />
          </div>

          <Button type="submit" className="w-full professional-button" disabled={isLoading || !topic.trim()}>
            {isLoading ? "Creating Session..." : "Start Attendance Session"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
