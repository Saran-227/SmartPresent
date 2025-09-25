"use client"

import { useEffect, useState } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { GoogleGenerativeAI } from "@google/generative-ai"
import { PieChart, Pie, Cell, Tooltip, BarChart, Bar, XAxis, YAxis, Legend, ResponsiveContainer } from "recharts"
import type { AttendanceSession, Student } from "@/lib/types"

interface Props {
  classId: string
  sessions: AttendanceSession[]
  students: Student[]
}

export default function AIAnalyticsDashboard({ classId, sessions, students }: Props) {
  const [insights, setInsights] = useState<string>("Generating insights...")
  const [barData, setBarData] = useState<any[]>([])

  // Gemini setup
  const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY || "")

  useEffect(() => {
    if (!sessions.length) return

    // Prepare attendance summary
    const studentStats: Record<string, { name: string; present: number; total: number }> = {}
    students.forEach((s) => {
      studentStats[s.id] = { name: s.name, present: 0, total: 0 }
    })

    sessions.forEach((session) => {
      session.attendance_records?.forEach((r) => {
        if (studentStats[r.student_id]) {
          studentStats[r.student_id].total += 1
          if (r.status === "present") studentStats[r.student_id].present += 1
        }
      })
    })

    const barDataArray = Object.values(studentStats).map((s) => ({
      name: s.name,
      present: s.present,
      absent: s.total - s.present,
    }))

    setBarData(barDataArray)

    // AI Prompt
    const prompt = `
    Analyze this class attendance data:
    ${JSON.stringify(barDataArray)}

    Provide:
    - Students who may need reminders (attendance < 70%)
    - Students with excellent attendance (>90%)
    - Overall class performance insights
    - Any unique patterns you detect
    Keep it concise and helpful for a teacher.
    `

    async function fetchInsights() {
      try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" })
        const result = await model.generateContent(prompt)
        const text = result.response.text()
        setInsights(text)
      } catch (err) {
        console.error("Gemini error:", err)
        setInsights("⚠️ Failed to generate AI insights.")
      }
    }

    fetchInsights()
  }, [sessions, students])

  // Pie chart (Present vs Absent total)
  const totalPresent = barData.reduce((acc, s) => acc + s.present, 0)
  const totalAbsent = barData.reduce((acc, s) => acc + s.absent, 0)

  const pieData = [
    { name: "Present", value: totalPresent },
    { name: "Absent", value: totalAbsent },
  ]
  const COLORS = ["#4CAF50", "#F44336"]

  return (
    <div className="space-y-6">
      {/* AI Insights */}
      <Card>
        <CardHeader>
          <CardTitle>AI Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="whitespace-pre-line text-gray-700">{insights}</p>
        </CardContent>
      </Card>

      {/* Pie Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Overall Attendance Distribution</CardTitle>
        </CardHeader>
        <CardContent className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={pieData} dataKey="value" outerRadius={80} label>
                {pieData.map((entry, index) => (
                  <Cell key={index} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Bar Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Student Attendance Breakdown</CardTitle>
        </CardHeader>
        <CardContent className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barData}>
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="present" stackId="a" fill="#4CAF50" />
              <Bar dataKey="absent" stackId="a" fill="#F44336" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}