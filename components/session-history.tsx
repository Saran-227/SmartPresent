"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabaseClient"
import type { AttendanceSession } from "@/lib/types"

interface Props {
  classId: string
  className?: string
  sessions?: AttendanceSession[] // ✅ new prop
}

export default function SessionHistory({ classId, className, sessions: propSessions }: Props) {
  const [sessions, setSessions] = useState<AttendanceSession[]>(propSessions || [])
  const [loading, setLoading] = useState(true)

  const fetchSessions = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from("attendance_sessions")
      .select("id, session_date, topic, attendance_records (id, student_id, status)")
      .eq("class_id", classId)
      .order("session_date", { ascending: false })

    if (error) {
      console.error("Error fetching sessions:", error.message)
      setSessions([])
    } else {
      setSessions((data as AttendanceSession[]) || [])
    }

    setLoading(false)
  }

  useEffect(() => {
    if (propSessions && propSessions.length > 0) {
      setSessions(propSessions)
      setLoading(false)
    } else {
      fetchSessions()
    }
  }, [classId, propSessions])

  useEffect(() => {
    const listener = () => fetchSessions()
    window.addEventListener("refresh-sessions", listener)
    return () => window.removeEventListener("refresh-sessions", listener)
  }, [classId])

  if (loading) return <div>Loading history...</div>
  if (!sessions || sessions.length === 0) return <div>No sessions yet.</div>

  return (
    <div>
      <h3 className="font-semibold mb-2">History — {className || ""}</h3>
      <div className="space-y-3">
        {sessions.map((s) => (
          <div key={s.id} className="p-3 border rounded">
            <div className="flex justify-between">
              <div>
                <div className="font-medium">{s.topic || "Session"}</div>
                <div className="text-sm text-gray-600">
                  {new Date(s.session_date).toLocaleString()}
                </div>
              </div>
              <div className="text-sm text-gray-600">
                {s.attendance_records?.length || 0} records
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
