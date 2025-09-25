"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import dayjs from "dayjs"
import ical from "ical-generator"

export default function SmartScheduler() {
  const [className, setClassName] = useState("AI & ML Class")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [days, setDays] = useState<string[]>([])
  const [time, setTime] = useState("10:00")
  const [reminderText, setReminderText] = useState("")
  const [schedule, setSchedule] = useState<any[]>([])

  const weekdays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

  const toggleDay = (day: string) => {
    setDays((prev) => (prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]))
  }

  const generateSchedule = () => {
    if (!startDate || !endDate || days.length === 0) {
      alert("Please fill all fields and select at least one day.")
      return
    }

    const scheduleList: any[] = []
    let current = dayjs(startDate)
    const end = dayjs(endDate)

    while (current.isBefore(end) || current.isSame(end)) {
      if (days.includes(current.format("ddd"))) {
        scheduleList.push({
          date: current.format("YYYY-MM-DD"),
          time,
          title: `${className} - Attendance Session`,
        })
      }
      current = current.add(1, "day")
    }

    setSchedule(scheduleList)
    alert("✅ Schedule generated successfully!")
  }

  const downloadICS = () => {
    const cal = ical({ name: `${className} Schedule` })

    schedule.forEach((session) => {
      cal.createEvent({
        start: dayjs(`${session.date}T${session.time}`).toDate(),
        end: dayjs(`${session.date}T${session.time}`).add(1, "hour").toDate(),
        summary: session.title,
        description: "Auto-generated schedule from Smart Scheduler",
      })
    })

    if (reminderText.trim()) {
      cal.createEvent({
        start: dayjs(endDate).add(1, "day").toDate(),
        summary: `Reminder: ${reminderText}`,
        description: "Auto reminder",
      })
    }

    const blob = new Blob([cal.toString()], { type: "text/calendar" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `${className}_Schedule.ics`
    link.click()
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>📅 Smart Scheduler</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Class Name</label>
          <input
            className="border p-2 rounded w-full"
            value={className}
            onChange={(e) => setClassName(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Start Date</label>
            <input type="date" className="border p-2 rounded w-full" onChange={(e) => setStartDate(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">End Date</label>
            <input type="date" className="border p-2 rounded w-full" onChange={(e) => setEndDate(e.target.value)} />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Select Days</label>
          <div className="flex flex-wrap gap-2">
            {weekdays.map((d) => (
              <Button
                key={d}
                variant={days.includes(d) ? "default" : "outline"}
                onClick={() => toggleDay(d)}
              >
                {d}
              </Button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Time</label>
          <input type="time" className="border p-2 rounded w-full" value={time} onChange={(e) => setTime(e.target.value)} />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Reminder (optional)</label>
          <input
            className="border p-2 rounded w-full"
            placeholder="e.g., Email parents every Friday"
            value={reminderText}
            onChange={(e) => setReminderText(e.target.value)}
          />
        </div>

        <div className="flex gap-4">
          <Button onClick={generateSchedule} className="bg-orange-500 text-white">
            📆 Generate Schedule
          </Button>
          <Button onClick={downloadICS} variant="outline">
            📤 Download Calendar
          </Button>
        </div>

        {schedule.length > 0 && (
          <div className="mt-4">
            <h4 className="font-semibold">Generated Sessions:</h4>
            <ul className="list-disc ml-5 text-sm">
              {schedule.map((s, i) => (
                <li key={i}>{s.date} at {s.time} — {s.title}</li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
