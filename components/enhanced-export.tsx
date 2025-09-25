"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Download, ExternalLink } from "lucide-react"
import type { AttendanceSession, Student } from "@/lib/types"
import { LocalStorage } from "@/lib/storage"

interface EnhancedExportProps {
  classId: string
  className: string
  students: Student[]
}

export function EnhancedExport({ classId, className, students }: EnhancedExportProps) {
  const [exportFormat, setExportFormat] = useState<"csv" | "pdf" | "excel">("csv")
  const [dateRange, setDateRange] = useState<"all" | "week" | "month">("all")
  const [includeStats, setIncludeStats] = useState(true)
  const [includeCharts, setIncludeCharts] = useState(false)
  const [isExporting, setIsExporting] = useState(false)

  const handleExport = async () => {
    setIsExporting(true)

    try {
      const sessions = LocalStorage.getAttendanceSessions(classId)
      let filteredSessions = sessions

      // Apply date filtering
      if (dateRange !== "all") {
        const now = new Date()
        const cutoffDate = new Date()

        if (dateRange === "week") {
          cutoffDate.setDate(now.getDate() - 7)
        } else if (dateRange === "month") {
          cutoffDate.setMonth(now.getMonth() - 1)
        }

        filteredSessions = sessions.filter((session) => new Date(session.date) >= cutoffDate)
      }

      if (exportFormat === "csv") {
        exportToCSV(filteredSessions)
      } else if (exportFormat === "pdf") {
        exportToPDF(filteredSessions)
      } else if (exportFormat === "excel") {
        exportToExcel(filteredSessions)
      }
    } finally {
      setIsExporting(false)
    }
  }

  const exportToCSV = (sessions: AttendanceSession[]) => {
    const headers = ["Date", "Topic", "Student Name", "Roll Number", "Status", "Method", "Marked At"]

    const rows = sessions.flatMap((session) =>
      session.attendance.map((record) => {
        const student = students.find((s) => s.id === record.studentId)
        return [
          new Date(session.date).toLocaleDateString(),
          session.topic,
          student?.name || "Unknown",
          student?.rollNumber || "N/A",
          record.status,
          record.method,
          new Date(record.markedAt).toLocaleString(),
        ]
      }),
    )

    if (includeStats) {
      rows.unshift([]) // Empty row
      rows.unshift(["ATTENDANCE STATISTICS"])
      rows.unshift(["Total Sessions", sessions.length.toString()])
      rows.unshift(["Total Students", students.length.toString()])

      const totalRecords = sessions.reduce((acc, s) => acc + s.attendance.length, 0)
      const presentRecords = sessions.reduce(
        (acc, s) => acc + s.attendance.filter((a) => a.status === "present").length,
        0,
      )
      const overallAttendance = totalRecords > 0 ? ((presentRecords / totalRecords) * 100).toFixed(1) : "0"

      rows.unshift(["Overall Attendance Rate", `${overallAttendance}%`])
      rows.unshift([]) // Empty row
    }

    const csvContent = [headers, ...rows].map((row) => row.join(",")).join("\n")
    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = URL.createObjectURL(blob)

    const link = document.createElement("a")
    link.href = url
    link.download = `${className}_attendance_${dateRange}_${new Date().toISOString().split("T")[0]}.csv`
    link.click()

    URL.revokeObjectURL(url)
  }

  const exportToPDF = (sessions: AttendanceSession[]) => {
    // Placeholder for PDF export - would integrate with jsPDF or similar
    alert("PDF export feature coming soon!")
  }

  const exportToExcel = (sessions: AttendanceSession[]) => {
    // Placeholder for Excel export - would integrate with SheetJS or similar
    alert("Excel export feature coming soon!")
  }

  const handleGoogleSheetsExport = () => {
    const sessions = LocalStorage.getAttendanceSessions(classId)

    // Generate comprehensive CSV data
    const headers = ["Date", "Topic", "Student Name", "Roll Number", "Status", "Method", "Marked At"]
    const rows = sessions.flatMap((session) =>
      session.attendance.map((record) => {
        const student = students.find((s) => s.id === record.studentId)
        return [
          new Date(session.date).toLocaleDateString(),
          session.topic,
          student?.name || "Unknown",
          student?.rollNumber || "N/A",
          record.status,
          record.method,
          new Date(record.markedAt).toLocaleString(),
        ]
      }),
    )

    // Add statistics if enabled
    if (includeStats) {
      rows.unshift([]) // Empty row
      rows.unshift(["=== ATTENDANCE STATISTICS ==="])
      rows.unshift(["Total Sessions", sessions.length.toString()])
      rows.unshift(["Total Students", students.length.toString()])

      const totalRecords = sessions.reduce((acc, s) => acc + s.attendance.length, 0)
      const presentRecords = sessions.reduce(
        (acc, s) => acc + s.attendance.filter((a) => a.status === "present").length,
        0,
      )
      const overallAttendance = totalRecords > 0 ? ((presentRecords / totalRecords) * 100).toFixed(1) : "0"

      rows.unshift(["Overall Attendance Rate", `${overallAttendance}%`])
      rows.unshift([]) // Empty row
      rows.unshift(["=== ATTENDANCE RECORDS ==="])
      rows.unshift([]) // Empty row
    }

    const csvContent = [headers, ...rows].map((row) => row.join(",")).join("\n")

    // Create downloadable CSV file
    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = URL.createObjectURL(blob)

    const link = document.createElement("a")
    link.href = url
    link.download = `${className}_attendance_for_google_sheets.csv`
    link.click()

    URL.revokeObjectURL(url)

    // Open Google Sheets import page
    setTimeout(() => {
      window.open("https://sheets.google.com/create", "_blank")
    }, 1000)
  }

  return (
    <Card className="bg-white border-orange-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-black">
          <Download className="h-5 w-5 text-orange-500" />
          Export Attendance Data
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Export Format */}
        <div className="space-y-2">
          <Label className="text-sm font-medium text-black">Export Format</Label>
          <Select value={exportFormat} onValueChange={(value: "csv" | "pdf" | "excel") => setExportFormat(value)}>
            <SelectTrigger className="bg-white border-orange-200 text-black">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-white border-orange-200">
              <SelectItem value="csv">CSV (Comma Separated)</SelectItem>
              <SelectItem value="pdf">PDF Report</SelectItem>
              <SelectItem value="excel">Excel Spreadsheet</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Date Range */}
        <div className="space-y-2">
          <Label className="text-sm font-medium text-black">Date Range</Label>
          <Select value={dateRange} onValueChange={(value: "all" | "week" | "month") => setDateRange(value)}>
            <SelectTrigger className="bg-white border-orange-200 text-black">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-white border-orange-200">
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="week">Last 7 Days</SelectItem>
              <SelectItem value="month">Last 30 Days</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Export Options */}
        <div className="space-y-3">
          <Label className="text-sm font-medium text-black">Include Additional Data</Label>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="include-stats"
                checked={includeStats}
                onCheckedChange={(checked) => setIncludeStats(checked as boolean)}
                className="border-orange-300 data-[state=checked]:bg-orange-500"
              />
              <Label htmlFor="include-stats" className="text-sm text-black">
                Attendance Statistics
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="include-charts"
                checked={includeCharts}
                onCheckedChange={(checked) => setIncludeCharts(checked as boolean)}
                className="border-orange-300 data-[state=checked]:bg-orange-500"
              />
              <Label htmlFor="include-charts" className="text-sm text-black">
                Charts & Graphs (PDF only)
              </Label>
            </div>
          </div>
        </div>

        {/* Export Buttons */}
        <div className="space-y-2">
          <Button
            onClick={handleExport}
            disabled={isExporting}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white"
          >
            {isExporting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Exporting...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Export {exportFormat.toUpperCase()}
              </>
            )}
          </Button>

          <Button
            variant="outline"
            onClick={handleGoogleSheetsExport}
            className="w-full border-orange-200 bg-white text-black hover:bg-orange-50"
          >
            <ExternalLink className="mr-2 h-4 w-4" />
            Export to Google Sheets
          </Button>
        </div>

        {/* Quick Stats */}
        <div className="pt-4 border-t border-orange-200">
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <div className="text-lg font-bold text-orange-500">
                {LocalStorage.getAttendanceSessions(classId).length}
              </div>
              <div className="text-xs text-gray-600">Total Sessions</div>
            </div>
            <div>
              <div className="text-lg font-bold text-orange-500">{students.length}</div>
              <div className="text-xs text-gray-600">Students</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
