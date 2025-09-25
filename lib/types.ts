// lib/types.ts - CORRECTED VERSION
export interface Student {
  id: string
  name: string
  rollNumber: string  // This comes from enrollments.roll_number
  uid?: string
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

export interface AttendanceRecord {
  id: string
  session_id: string
  student_id: string
  student_name?: string  // Now this will be in the database
  status: "present" | "absent" | "late"
  method?: string
  recorded_at?: string | Date
  student?: {
    id: string
    name: string
    enrollments?: {
      roll_number: string
    }
  }
}

export interface AttendanceSession {
  id: string
  class_id: string
  session_date: string | Date
  topic?: string
  created_by?: string
  created_at?: string
  attendance_records?: AttendanceRecord[]
}