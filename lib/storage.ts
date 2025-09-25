// lib/storage.ts
import type { Class } from "./types"

export const LocalStorage = {
  getClasses(): Class[] {
    if (typeof window === "undefined") return []
    const data = localStorage.getItem("classes")
    return data ? (JSON.parse(data) as Class[]) : []
  },

  saveClasses(classes: Class[]) {
    if (typeof window === "undefined") return
    localStorage.setItem("classes", JSON.stringify(classes))
  },

  getTeacher: () => {
    if (typeof window === "undefined") return null
    const raw = localStorage.getItem("teacher")
    return raw ? JSON.parse(raw) : null
  },
  saveTeacher: (teacher: any) => {
    if (typeof window === "undefined") return
    localStorage.setItem("teacher", JSON.stringify(teacher))
  },
}
