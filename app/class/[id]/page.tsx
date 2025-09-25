"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { supabase } from "@/lib/supabaseClient"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { TeacherProfile } from "@/components/teacher-profile"
import StudentCard from "@/components/student-card"
import AttendanceSessionForm from "@/components/attendance-session-form"
import SessionHistory from "@/components/session-history"
import AIAnalyticsDashboard from "@/components/ai-analytics-dashboard"
import AddStudentDialog from "@/components/add-student-dialog"
import SmartBot from "@/components/smartbot"
import SmartScheduler from "@/components/smart-scheduler"
import MidDayMealDashboard from "@/components/midday-meal"



import {
  ArrowLeft,
  Users,
  Calendar,
  GraduationCap,
  XCircle,
  BarChart3,
  Brain,
  Trash2,
  Download,
} from "lucide-react"

import type { Class, Student, AttendanceSession } from "@/lib/types"

type TempSession = {
  session_date: Date
  topic: string
}

export default function ClassDashboard() {
  const router = useRouter()
  const params = useParams() as { id?: string }
  const classId = params.id ?? ""

  const [classData, setClassData] = useState<Class | null>(null)
  const [students, setStudents] = useState<Student[]>([])
  const [sessions, setSessions] = useState<AttendanceSession[]>([]) // ✅ for analytics
  const [currentSession, setCurrentSession] = useState<TempSession | null>(null)
  const [attendance, setAttendance] = useState<Record<string, boolean>>({})
  const [searchTerm, setSearchTerm] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [activeView, setActiveView] = useState<
    "attendance" | "history" | "analytics" | "smartbot" | "scheduler" | "midday-meal"
  >("attendance")




  // Fetch class + students
  useEffect(() => {
    async function fetchClassAndStudents() {
      setIsLoading(true)

      const { data: classRow } = await supabase.from("classes").select("*").eq("id", classId).single()
      setClassData(classRow || null)

      const { data: enrollmentRows } = await supabase
        .from("enrollments")
        .select("roll_number, student:students(id, name)")
        .eq("class_id", classId);

      const studentList =
        enrollmentRows?.map((row: any) => ({
          id: row.student.id,
          name: row.student.name,
          rollNumber: row.roll_number,
        })) || [];


      setStudents(studentList)

      const initialAttendance: Record<string, boolean> = {}
      studentList.forEach((s: any) => (initialAttendance[s.id] = false))
      setAttendance(initialAttendance)

      setIsLoading(false)
    }

    if (classId) fetchClassAndStudents()
  }, [classId])

  // ✅ Fetch sessions for history + analytics
  useEffect(() => {
    if (!classId) return
    supabase
      .from("attendance_sessions")
      .select("*, attendance_records(*)")
      .eq("class_id", classId)
      .order("session_date", { ascending: false })
      .then(({ data }) => setSessions(data || []))
  }, [classId, currentSession])

  // --- Create Session ---
  const handleCreateSession = (date: Date, topic: string) => {
    setCurrentSession({ session_date: date, topic })
  }

  // --- Attendance Change ---
  const handleAttendanceChange = (studentId: string, isPresent: boolean) => {
    setAttendance((prev) => ({ ...prev, [studentId]: isPresent }))
  }

  // --- Save Session ---
  const handleSaveSession = async () => {
    if (!currentSession || !classData) return

    try {
      const { data: insertedSession, error: sessionError } = await supabase
        .from("attendance_sessions")
        .insert([
          {
            class_id: classData.id,
            session_date:
              currentSession.session_date instanceof Date
                ? currentSession.session_date.toISOString()
                : currentSession.session_date,
            topic: currentSession.topic,
            created_by: classData.teacher_id || null,
          },
        ])
        .select()
        .single()

      if (sessionError || !insertedSession) {
        console.error("session insert error", sessionError)
        alert("Failed to save session.")
        return
      }

      const sessionId = insertedSession.id

      const recordsToInsert = Object.entries(attendance).map(([studentId, present]) => ({
        session_id: sessionId,
        student_id: studentId,
        status: present ? "present" : "absent",
        method: "manual",
      }))

      const { error: recError } = await supabase.from("attendance_records").insert(recordsToInsert)

      if (recError) {
        console.error("attendance records insert error", recError)
        alert("Attendance saved partially (records failed).")
        return
      }

      // reset state
      setCurrentSession(null)
      const reset: Record<string, boolean> = {}
      students.forEach((s) => (reset[s.id] = false))
      setAttendance(reset)

      alert("Session saved successfully!")

      // 🔥 Trigger refresh in SessionHistory
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("refresh-sessions"))
      }
    } catch (err) {
      console.error("Unexpected error saving session:", err)
      alert("An unexpected error occurred.")
    }
  }


  // --- Add Student ---
  // --- Add Student ---
  // --- Add Student ---
  const handleAddStudent = async (newStudent: { name: string }) => {
    if (!classId) {
      alert("Class ID missing. Please reload the page.");
      return;
    }

    try {
      // Generate random 5-digit roll number
      const randomRoll = Math.floor(10000 + Math.random() * 90000).toString();

      // Insert student (only name now, no roll/email)
      const { data: student, error: studentError } = await supabase
        .from("students")
        .insert([{ name: newStudent.name }])
        .select()
        .single();

      if (studentError) throw studentError;

      // Link student to class with roll_number
      const { error: enrollmentError } = await supabase
        .from("enrollments")
        .insert([{ class_id: classId, student_id: student.id, roll_number: randomRoll }]);

      if (enrollmentError) throw enrollmentError;

      // Update local state
      setStudents((prev) => [
        ...prev,
        { id: student.id, name: student.name, rollNumber: randomRoll }, // 👈 from enrollments
      ]);
      setAttendance((prev) => ({ ...prev, [student.id]: false }));
    } catch (err: any) {
      console.error("Error adding student:", err.message || err);
      alert("Failed to add student.");
    }
  };

  // --- Delete Class ---
  const handleDeleteClass = async () => {
    if (!classData) return
    await supabase.from("classes").delete().eq("id", classId)
    router.push("/")
  }

  // --- Export Data ---
  const handleExportData = async () => {
    const { data: sessions } = await supabase
      .from("attendance_sessions")
      .select("*, attendance_records(*)")
      .eq("class_id", classId)

    const headers = ["Date", "Topic", "Student", "Status", "Method", "Session ID"]
    const rows =
      sessions?.flatMap((s: any) =>
        s.attendance_records.map((r: any) => {
          const student = students.find((st) => st.id === r.student_id)
          return [s.session_date, s.topic, student?.name || "-", r.status, r.method, s.id]
        })
      ) || []

    const csv = [headers, ...rows].map((row) => row.join(",")).join("\n")
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `${classData?.name}_attendance.csv`
    link.click()
  }

  // --- UI ---
  if (isLoading)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading class dashboard...</p>
      </div>
    )

  if (!classData)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card>
          <CardContent>
            <XCircle className="h-12 w-12 text-red-500 mx-auto" />
            <CardTitle>Class not found</CardTitle>
            <Button onClick={() => router.push("/")}>
              <ArrowLeft className="mr-2" /> Back
            </Button>
          </CardContent>
        </Card>
      </div>
    )

  const presentCount = Object.values(attendance).filter(Boolean).length
  const attendanceRate = students.length > 0 ? Math.round((presentCount / students.length) * 100) : 0

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b p-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <GraduationCap className="h-6 w-6 text-orange-500" />
          <div>
            <h1 className="text-xl font-bold">{classData.name}</h1>
            <p className="text-gray-600">{classData.subject}</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Button onClick={handleDeleteClass} variant="outline" className="text-red-600 border-red-300">
            <Trash2 className="mr-2 h-4 w-4" /> Delete Class
          </Button>
          <TeacherProfile />
        </div>
      </header>

      {/* Tabs */}
      <main className="p-6">
        <div className="flex gap-2 mb-6">
          <Button onClick={() => setActiveView("attendance")} variant={activeView === "attendance" ? "default" : "outline"}>
            <Users className="mr-1 h-4 w-4" /> Attendance
          </Button>
          <Button onClick={() => setActiveView("history")} variant={activeView === "history" ? "default" : "outline"}>
            <BarChart3 className="mr-1 h-4 w-4" /> History
          </Button>
          <Button onClick={() => setActiveView("analytics")} variant={activeView === "analytics" ? "default" : "outline"}>
            <Brain className="mr-1 h-4 w-4" /> AI Analytics
          </Button>
          <Button onClick={() => setActiveView("smartbot")} variant={activeView === "smartbot" ? "default" : "outline"}>
            SmartBot
          </Button>
          <Button onClick={() => setActiveView("scheduler")} variant={activeView === "scheduler" ? "default" : "outline"}>
            Smart Scheduler
          </Button>
          <Button
            onClick={() => setActiveView("midday-meal")}
            variant={activeView === "midday-meal" ? "default" : "outline"}
          >
            Mid-Day Meal
          </Button>
        </div>

        {activeView === "attendance" && (
          <>
            {currentSession ? (
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>
                    <Calendar className="inline-block mr-2" /> Active Session – {currentSession.topic}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Button onClick={handleSaveSession} className="bg-orange-500 text-white">
                    Save & Complete
                  </Button>
                  <Button variant="outline" onClick={() => setCurrentSession(null)} className="ml-2">
                    Cancel
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <AttendanceSessionForm onCreateSession={handleCreateSession} />
            )}

            {/* Search + Add */}
            <div className="flex gap-2 mb-4">
              <Input
                placeholder="Search students..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <AddStudentDialog
                onStudentAdded={handleAddStudent}
                existingRollNumbers={students.map((s) => s.rollNumber || "")}
              />
            </div>

            {/* Student Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {students
                .filter((s) =>
                  s.name.toLowerCase().includes(searchTerm.toLowerCase())
                )
                .map((student) => (
                  <StudentCard
                    key={student.id}
                    student={student}
                    isPresent={attendance[student.id] || false}
                    onAttendanceChange={handleAttendanceChange}
                    onDelete={async (studentId) => {
                      // Delete from DB (cascade handles enrollments + attendance)
                      await supabase.from("students").delete().eq("id", studentId);

                      // Update local state
                      setStudents((prev) => prev.filter((s) => s.id !== studentId));
                      setAttendance((prev) => {
                        const copy = { ...prev };
                        delete copy[studentId];
                        return copy;
                      });
                    }}

                    disabled={!currentSession}
                  />
                ))}
            </div>
          </>
        )}

        {activeView === "history" && <SessionHistory classId={classId} className={classData.name} />}
        {activeView === "analytics" && <AIAnalyticsDashboard classId={classId} sessions={sessions} students={students} />}
        {activeView === "smartbot" && <SmartBot classId={classId} />}
        {activeView === "scheduler" && <SmartScheduler />}
        {activeView === "midday-meal" && <MidDayMealDashboard />}




        <div className="mt-6">
          <Button onClick={handleExportData} variant="outline">
            <Download className="mr-2 h-4 w-4" /> Export CSV
          </Button>
          <Button onClick={() => router.push("/")} className="ml-2">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
        </div>

        <div className="mt-4 text-gray-600">
          <p>Total Students: {students.length}</p>
          <p>Attendance Rate: {attendanceRate}%</p>
        </div>
      </main>
    </div>
  )
}
