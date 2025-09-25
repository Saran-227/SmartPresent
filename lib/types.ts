// lib/types.ts

export interface Student {
  id: string
  name: string
  rollNumber: string // 👈 always comes from enrollments
}

export interface Class {
  id: string
  name: string
  subject?: string
  code?: string
  teacher_id?: string
  created_at?: string
  students?: Student[]
}

// One attendance record, joined with student + enrollment
export interface AttendanceRecord {
  id: string
  session_id: string
  student_id: string
  status: "present" | "absent" | "late"
  method?: string
  recorded_at?: string | Date
  student?: {
    id: string
    name: string
    enrollments?: {
      roll_number: string
    }[]
  }
}

// Full session with nested attendance_records
export interface AttendanceSession {
  id: string
  class_id: string
  session_date: string | Date
  topic?: string
  created_by?: string
  created_at?: string
  attendance_records?: AttendanceRecord[]
}
