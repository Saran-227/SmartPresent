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
import ManualRFIDInput from "@/components/manual-rfid-input"
import CSVUpload from "@/components/csv-upload"




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

      const initializeAttendance = async () => {
        const initialAttendance: Record<string, boolean> = {}

        // First, set all students to absent
        studentList.forEach((s: any) => (initialAttendance[s.id] = false))

        // Then, check if there's a session today and mark present students
        const today = new Date()
        const todayDateString = today.toISOString().split('T')[0]

        const { data: todaysSession } = await supabase
          .from("attendance_sessions")
          .select("id")
          .eq("class_id", classId)
          .gte("session_date", `${todayDateString}T00:00:00`)
          .lt("session_date", `${todayDateString}T23:59:59`)
          .single()

        if (todaysSession) {
          // Get today's attendance records
          const { data: todaysAttendance } = await supabase
            .from("attendance_records")
            .select("student_id, status")
            .eq("session_id", todaysSession.id)

          if (todaysAttendance) {
            todaysAttendance.forEach(record => {
              if (record.status === "present") {
                initialAttendance[record.student_id] = true
              }
            })
          }
        }

        setAttendance(initialAttendance)
      }

      await initializeAttendance()

      setIsLoading(false)
    }

    if (classId) fetchClassAndStudents()
  }, [classId])

  // ✅ Fetch sessions for history + analytics
  // In your useEffect that fetches sessions - Update the query
  useEffect(() => {
    if (!classId) return

    supabase
      .from("attendance_sessions")
      .select(`
      *,
      attendance_records(
        *,
        student:students(name, uid)
      )
    `)
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
    if (!currentSession || !classData) return;

    try {
      const sessionId = crypto.randomUUID()

      const { data: insertedSession, error: sessionError } = await supabase
        .from("attendance_sessions")
        .insert([{
          id: sessionId,
          class_id: classData.id,
          session_date: currentSession.session_date instanceof Date
            ? currentSession.session_date.toISOString()
            : currentSession.session_date,
          topic: currentSession.topic,
          created_by: classData.teacher_id || null,
        }])
        .select()
        .single();

      if (sessionError || !insertedSession) {
        console.error("session insert error", sessionError);
        alert("Failed to save session.");
        return;
      }

      // Create attendance records WITH STUDENT NAMES
      const recordsToInsert = Object.entries(attendance).map(([studentId, present]) => {
        const student = students.find(s => s.id === studentId)
        return {
          session_id: sessionId,
          student_id: studentId,
          student_name: student?.name || "Unknown",
          status: present ? "present" : "absent",
          method: "manual",
        }
      });

      const { error: recError } = await supabase
        .from("attendance_records")
        .insert(recordsToInsert);

      if (recError) {
        console.error("attendance records insert error", recError);
        alert("Attendance saved partially (records failed).");
        return;
      }

      // Reset UI and refresh history
      setCurrentSession(null);
      const reset: Record<string, boolean> = {}
      students.forEach((s) => (reset[s.id] = false));
      setAttendance(reset);
      alert("Session saved successfully!");

      // Refresh sessions immediately
      const { data: updatedSessions } = await supabase
        .from("attendance_sessions")
        .select(`
        *,
        attendance_records(
          *,
          student:students(name, uid)
        )
      `)
        .eq("class_id", classId)
        .order("session_date", { ascending: false });

      setSessions(updatedSessions || []);

    } catch (err) {
      console.error("Unexpected error saving session:", err);
      alert("An unexpected error occurred.");
    }
  };

  // In page.tsx - Add automatic session creation
  const ensureCurrentSession = async () => {
    if (currentSession) return currentSession

    // Create a new session for today if none exists
    const today = new Date()
    const sessionTopic = `RFID Session ${today.toLocaleDateString()}`

    const { data: existingSession, error } = await supabase
      .from("attendance_sessions")
      .select("*")
      .eq("class_id", classId)
      .gte("session_date", new Date(today.setHours(0, 0, 0, 0)).toISOString())
      .lt("session_date", new Date(today.setHours(23, 59, 59, 999)).toISOString())
      .single()

    if (existingSession) {
      setCurrentSession({
        session_date: new Date(existingSession.session_date),
        topic: existingSession.topic || sessionTopic
      })
      return existingSession
    }

    // Create new session
    const newSession = {
      session_date: today,
      topic: sessionTopic
    }

    setCurrentSession(newSession)
    return newSession
  }

  // Update handleRFIDScan to ensure session exists
  // In your page.tsx - REAL VERSION (reads from sheet)
  const handleRFIDScan = async () => {
    try {
      if (!currentSession) {
        alert("❌ Please start an attendance session first!")
        return
      }

      console.log("🔄 Fetching real RFID data from Google Sheet...")

      const res = await fetch("/api/fetch-rfid")
      const json = await res.json()

      console.log("📊 API Response:", json)

      if (!json.success) {
        throw new Error(json.error || "Unknown API error")
      }

      if (!json.data || json.data.length === 0) {
        alert("📭 No RFID data found in the sheet. Scan some cards first!")
        return
      }

      console.log("📋 Raw sheet data:", json.data)

      // Get recent scans (last 10 minutes)
      const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000)
      const recentScans = json.data.filter((record: any) => {
        try {
          // Try different possible timestamp fields
          const timestamp = record.Timestamp || record.INTime || record.Date
          if (!timestamp) return false

          const scanTime = new Date(timestamp)
          return scanTime > tenMinutesAgo && scanTime <= new Date()
        } catch (e) {
          return false
        }
      })

      console.log("⏰ Recent scans (last 10 min):", recentScans)

      if (recentScans.length === 0) {
        alert("⏰ No recent RFID scans found (last 10 minutes)")
        return
      }

      // Extract UIDs from recent scans
      const scannedUIDs = recentScans.map((scan: any) => {
        // Try different possible UID field names
        return scan.UID || scan.StudentID || scan.RFID || scan.CardID || scan.ID
      }).filter((uid: any) => uid != null).map((uid: any) => uid.toString().trim())

      console.log("🎫 Scanned UIDs:", scannedUIDs)

      if (scannedUIDs.length === 0) {
        alert("❌ No valid UIDs found in recent scans")
        return
      }

      // Fetch students with UIDs from Supabase
      const { data: studentsWithUID, error } = await supabase
        .from("students")
        .select("id, name, uid")
        .not("uid", "is", null)

      if (error) throw new Error(`Supabase error: ${error.message}`)

      console.log("👥 Students with UIDs from Supabase:", studentsWithUID)

      // Match UIDs
      const matchedStudents = studentsWithUID?.filter(student =>
        student.uid && scannedUIDs.includes(student.uid.toString().trim())
      ) || []

      console.log("✅ Matched students:", matchedStudents)

      if (matchedStudents.length === 0) {
        alert(`
❌ No matching students found!

Scanned UIDs: ${scannedUIDs.join(', ')}
Students in DB: ${studentsWithUID?.map(s => s.uid).join(', ') || 'None'}

Make sure:
1. Students have UIDs in Supabase
2. UIDs match exactly with RFID cards
      `)
        return
      }

      // Update attendance state
      setAttendance(prev => {
        const updated = { ...prev }
        matchedStudents.forEach(student => {
          updated[student.id] = true
          console.log(`✅ Marking present: ${student.name} (UID: ${student.uid})`)
        })
        return updated
      })

      alert(`✅ RFID Scan Successful! 
Marked ${matchedStudents.length} student(s) present:
${matchedStudents.map(s => `• ${s.name} (${s.uid})`).join('\n')}
    `)

    } catch (err: any) {
      console.error("❌ RFID Scan error:", err)
      alert("❌ RFID Scan failed: " + (err.message || "Unknown error"))
    }
  }


  // --- Add Student ---
  // --- Add Student ---
  // --- Add Student ---
  // In page.tsx - Update handleAddStudent function
  // In your page.tsx - REPLACE the existing handleAddStudent function with this:

  const handleAddStudent = async (newStudent: { name: string; uid?: string }) => {
    if (!classId) {
      alert("Class ID missing. Please reload the page.")
      return
    }

    try {
      // Generate random 5-digit roll number
      const randomRoll = Math.floor(10000 + Math.random() * 90000).toString()

      // Insert student with UID
      const { data: student, error: studentError } = await supabase
        .from("students")
        .insert([{
          name: newStudent.name,
          uid: newStudent.uid || null
        }])
        .select()
        .single()

      if (studentError) throw studentError

      // Link student to class with roll_number
      const { error: enrollmentError } = await supabase
        .from("enrollments")
        .insert([{
          class_id: classId,
          student_id: student.id,
          roll_number: randomRoll
        }])

      if (enrollmentError) throw enrollmentError

      // Update local state
      setStudents(prev => [
        ...prev,
        {
          id: student.id,
          name: student.name,
          rollNumber: randomRoll,
          uid: student.uid
        }
      ])

      setAttendance(prev => ({ ...prev, [student.id]: false }))

    } catch (err: any) {
      console.error("Error adding student:", err.message || err)
      alert("Failed to add student.")
    }
  }



  // REPLACE your existing handleCSVData function with this ENHANCED version:

  const handleCSVData = async (csvData: any[]) => {
    if (!classId) {
      alert("Class ID missing")
      return
    }

    try {
      let addedCount = 0
      let updatedCount = 0
      let markedPresentCount = 0
      let markedAbsentCount = 0

      // First, ensure we have a current session for today
      const today = new Date()
      const todayDateString = today.toISOString().split('T')[0]

      let currentSessionId = null
      let sessionTopic = `CSV Import Session - ${today.toLocaleDateString()}`

      // Check if session exists for today
      const { data: existingSession } = await supabase
        .from("attendance_sessions")
        .select("id, session_date, topic")
        .eq("class_id", classId)
        .gte("session_date", `${todayDateString}T00:00:00`)
        .lt("session_date", `${todayDateString}T23:59:59`)
        .single()

      if (existingSession) {
        currentSessionId = existingSession.id
        sessionTopic = existingSession.topic || sessionTopic
      } else {
        // Create new session for today (using UUID for id)
        const newSessionId = crypto.randomUUID()
        const { data: newSession, error: sessionError } = await supabase
          .from("attendance_sessions")
          .insert([{
            id: newSessionId,
            class_id: classId,
            session_date: today.toISOString(),
            topic: sessionTopic,
            created_by: classData?.teacher_id || null
          }])
          .select()
          .single()

        if (sessionError) throw sessionError
        currentSessionId = newSession.id
      }

      // Process each student from CSV
      for (const row of csvData) {
        const uid = row.UID?.trim()
        const firstName = row.FirstName?.trim()
        const lastName = row.LastName?.trim()
        const fullName = `${firstName} ${lastName}`.trim()
        const inTime = row.INTime?.trim()
        const outTime = row.OUTTime?.trim()

        if (!uid || !fullName) continue

        let studentId: string | null = null
        let isPresent = false

        // Check if student already exists with this UID
        const { data: existingStudent } = await supabase
          .from("students")
          .select("id, name, uid")
          .eq("uid", uid)
          .single()

        if (existingStudent) {
          studentId = existingStudent.id
          // Update existing student name if different
          if (existingStudent.name !== fullName) {
            await supabase
              .from("students")
              .update({ name: fullName })
              .eq("id", existingStudent.id)
          }
          updatedCount++
        } else {
          // Add new student (UUID will be auto-generated)
          const { data: newStudent, error: studentError } = await supabase
            .from("students")
            .insert([{
              name: fullName,
              uid: uid
            }])
            .select()
            .single()

          if (studentError) throw studentError

          studentId = newStudent.id

          // Generate roll number and enroll in class
          const randomRoll = Math.floor(10000 + Math.random() * 90000).toString()
          const { error: enrollmentError } = await supabase
            .from("enrollments")
            .insert([{
              class_id: classId,
              student_id: newStudent.id,
              roll_number: randomRoll
            }])

          if (enrollmentError) throw enrollmentError

          // Update local state
          setStudents(prev => [
            ...prev,
            {
              id: newStudent.id,
              name: newStudent.name,
              rollNumber: randomRoll,
              uid: newStudent.uid
            }
          ])

          addedCount++
        }

        // AUTOMATIC ATTENDANCE MARKING LOGIC
        if (studentId && currentSessionId) {
          const hasAttendance = inTime && inTime !== '' && inTime !== 'NULL' && inTime !== 'null'
          isPresent = hasAttendance;

          if (hasAttendance) {
            // Student has IN time → Mark PRESENT
            const { data: existingRecord } = await supabase
              .from("attendance_records")
              .select("id")
              .eq("session_id", currentSessionId)
              .eq("student_id", studentId)
              .single()

            if (!existingRecord) {
              // Create attendance record WITH STUDENT NAME
              const { error: attendanceError } = await supabase
                .from("attendance_records")
                .insert([{
                  session_id: currentSessionId,
                  student_id: studentId,
                  student_name: fullName,
                  status: "present",
                  method: "csv_import"
                }])

              if (attendanceError) {
                console.error("Attendance record error:", attendanceError)
              } else {
                markedPresentCount++
              }
            }
          } else {
            // Student has NO IN time → Mark ABSENT
            const { data: existingRecord } = await supabase
              .from("attendance_records")
              .select("id")
              .eq("session_id", currentSessionId)
              .eq("student_id", studentId)
              .single()

            if (!existingRecord) {
              const { error: attendanceError } = await supabase
                .from("attendance_records")
                .insert([{
                  session_id: currentSessionId,
                  student_id: studentId,
                  student_name: fullName,
                  status: "absent",
                  method: "csv_import"
                }])

              if (!attendanceError) {
                markedAbsentCount++
              }
            }
          }

          // Update local UI state immediately
          setAttendance(prev => ({
            ...prev,
            [studentId!]: isPresent
          }))
        }
      }

      // Refresh sessions to show updated attendance
      const { data: updatedSessions } = await supabase
        .from("attendance_sessions")
        .select(`
        *,
        attendance_records(
          *,
          student:students(name, uid)
        )
      `)
        .eq("class_id", classId)
        .order("session_date", { ascending: false })

      setSessions(updatedSessions || [])

      // Show comprehensive results
      alert(`✅ CSV Import Completed!
    
📊 Student Management:
• Added: ${addedCount} new students
• Updated: ${updatedCount} existing students

🎯 Attendance Marking:
• Present: ${markedPresentCount} students (with IN time)
• Absent: ${markedAbsentCount} students (no IN time)

💡 Session: "${sessionTopic}"

✅ Student names saved in attendance records!
    `)

    } catch (error: any) {
      console.error("CSV import error:", error)
      alert("❌ Error importing CSV: " + error.message)
    }
  }

  // 🔽 PASTE SAMPLE DATA FUNCTION HERE 🔽
  // REPLACE your handleAddSampleData function with this:

  const handleAddSampleData = async () => {
    if (!classId) {
      alert("Class ID missing")
      return
    }

    try {
      const sampleData = [
        {
          UID: "89C39994",
          FirstName: "Kanwar",
          LastName: "Aaryaman",
          Class: "CSE-AI",
          INTime: "2025-09-25 23:40:56",  // Has IN time → PRESENT
          OUTTime: "2025-09-25 23:43:23"
        },
        {
          UID: "99AC9B94",
          FirstName: "Sameer",
          LastName: "Kumar",
          Class: "CSE-AI",
          INTime: "2025-09-25 23:43:55",  // Has IN time → PRESENT
          OUTTime: "2025-09-25 23:44:05"
        },
        {
          UID: "29D28754",
          FirstName: "Saranjeet",
          LastName: "Singh",
          Class: "CSE-AI",
          INTime: "",  // NO IN time → ABSENT
          OUTTime: ""
        }
      ]

      let addedCount = 0
      let markedPresentCount = 0
      let markedAbsentCount = 0

      // Create or get today's session
      const today = new Date()
      const todayDateString = today.toISOString().split('T')[0]

      const { data: existingSession } = await supabase
        .from("attendance_sessions")
        .select("id")
        .eq("class_id", classId)
        .gte("session_date", `${todayDateString}T00:00:00`)
        .lt("session_date", `${todayDateString}T23:59:59`)
        .single()

      let sessionId = existingSession?.id

      if (!sessionId) {
        const { data: newSession, error: sessionError } = await supabase
          .from("attendance_sessions")
          .insert([{
            class_id: classId,
            session_date: today.toISOString(),
            topic: `Sample Data Session - ${today.toLocaleDateString()}`,
            created_by: classData?.teacher_id || null
          }])
          .select()
          .single()

        if (sessionError) throw sessionError
        sessionId = newSession.id
      }

      // Process sample data
      for (const studentData of sampleData) {
        const uid = studentData.UID
        const fullName = `${studentData.FirstName} ${studentData.LastName}`
        const hasAttendance = studentData.INTime && studentData.INTime !== ''

        // Check if student already exists
        const { data: existingStudent } = await supabase
          .from("students")
          .select("id, uid")
          .eq("uid", uid)
          .single()

        let studentId = existingStudent?.id

        if (!existingStudent) {
          const randomRoll = Math.floor(10000 + Math.random() * 90000).toString()

          // Insert new student
          const { data: newStudent, error: studentError } = await supabase
            .from("students")
            .insert([{ name: fullName, uid: uid }])
            .select()
            .single()

          if (studentError) throw studentError

          studentId = newStudent.id

          // Enroll in class
          const { error: enrollmentError } = await supabase
            .from("enrollments")
            .insert([{
              class_id: classId,
              student_id: newStudent.id,
              roll_number: randomRoll
            }])

          if (enrollmentError) throw enrollmentError

          // Update local state
          setStudents(prev => [
            ...prev,
            {
              id: newStudent.id,
              name: newStudent.name,
              rollNumber: randomRoll,
              uid: newStudent.uid
            }
          ])

          setAttendance(prev => ({ ...prev, [newStudent.id]: false }))
          addedCount++
        }

        // Mark attendance based on IN time
        if (studentId && sessionId) {
          const status = hasAttendance ? "present" : "absent"

          const { error: attendanceError } = await supabase
            .from("attendance_records")
            .insert([{
              session_id: sessionId,
              student_id: studentId,
              status: status,
              method: "sample_data"
            }])

          if (!attendanceError) {
            if (hasAttendance) {
              markedPresentCount++
              // Update UI for current class students
              if (students.some(s => s.id === studentId)) {
                setAttendance(prev => ({ ...prev, [studentId!]: true }))
              }
            } else {
              markedAbsentCount++
            }
          }
        }
      }

      // Refresh sessions
      const { data: updatedSessions } = await supabase
        .from("attendance_sessions")
        .select("*, attendance_records(*)")
        .eq("class_id", classId)
        .order("session_date", { ascending: false })

      setSessions(updatedSessions || [])

      alert(`✅ Sample Data Imported!

👥 Students: ${addedCount} added
📊 Attendance: ${markedPresentCount} present, ${markedAbsentCount} absent

💡 Saranjeet was marked absent (no IN time in sample data)
    `)

    } catch (error: any) {
      console.error("Sample data error:", error)
      alert("❌ Error adding sample data: " + error.message)
    }
  }
  // 🔼 END OF SAMPLE DATA FUNCTION 🔼



  // --- Delete Class ---
  const handleDeleteClass = async () => {
    if (!classData) return
    await supabase.from("classes").delete().eq("id", classId)
    router.push("/")
  }

  // --- Export Data ---
  // In your page.tsx - Update handleExportData function
  const handleExportData = async () => {
    const { data: sessions } = await supabase
      .from("attendance_sessions")
      .select("*, attendance_records(*)")
      .eq("class_id", classId)

    // Use student_name from attendance_records instead of joining with students
    const headers = ["Date", "Topic", "Student Name", "Student ID", "Status", "Method", "Session ID"]

    const rows = sessions?.flatMap((s: any) =>
      s.attendance_records.map((r: any) => [
        s.session_date,
        s.topic,
        r.student_name || "Unknown", // 🔥 USE STUDENT_NAME
        r.student_id,
        r.status,
        r.method,
        s.id
      ])
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
                  {/* Manual RFID Input */}
                  <ManualRFIDInput
                    onUIDSubmit={(uid) => {
                      const student = students.find(s => s.uid === uid)
                      if (student) {
                        handleAttendanceChange(student.id, true)
                        // Show success message
                        const event = new CustomEvent('show-toast', {
                          detail: { message: `✅ ${student.name} marked present!`, type: 'success' }
                        })
                        window.dispatchEvent(event)
                      }
                    }}
                    students={students}
                    disabled={!currentSession}
                  />

                  {/* CSV Upload Section */}
                  <CSVUpload
                    onDataProcessed={handleCSVData}
                    onAddSampleData={handleAddSampleData}
                    students={students}
                  />

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

        {activeView === "history" && (
          <SessionHistory
            classId={classId}
            className={classData.name}
            sessions={sessions} // ✅ Pass sessions here
          />
        )}

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
