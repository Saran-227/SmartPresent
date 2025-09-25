// components/quick-actions.tsx
"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Download, ExternalLink, FileText, BarChart3, Settings, UserPlus, Bell } from "lucide-react"
import AddStudentDialog from "./add-student-dialog" // default export

interface QuickActionsProps {
  onExportCSV: () => void
  onExportGoogleSheets: () => void
  onAddStudent?: (student: { name: string }) => void // ✅ matches AddStudentDialog
  existingRollNumbers?: string[]
  className?: string
}

export function QuickActions({
  onExportCSV,
  onExportGoogleSheets,
  onAddStudent,
  existingRollNumbers = [],
  className,
}: QuickActionsProps) {
  const handleScheduleReminder = () => {
    const reminderTime = prompt("Enter reminder time (e.g., '10:00 AM tomorrow'):")
    if (reminderTime) {
      alert(`Reminder scheduled for: ${reminderTime}\n\n(Demo only)`)
    }
  }

  const handleGenerateReport = () => {
    const detailed = confirm("Generate detailed attendance report? OK = Detailed, Cancel = Summary")
    alert(detailed ? "Generating detailed report (demo)" : "Generating summary report (demo)")
  }

  const handleViewAnalytics = () => {
    alert("Switch to the 'AI Analytics' tab to view detailed insights.")
  }

  return (
    <Card className={`bg-white border-orange-200 ${className}`}>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg text-black">
          <Settings className="h-5 w-5 text-orange-500" />
          Quick Actions
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-1 gap-2">
          {/* Export Actions */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-600">Export Data</h4>
            <Button
              variant="outline"
              className="justify-start border-orange-200 hover:bg-orange-50 w-full bg-white text-black"
              onClick={onExportCSV}
            >
              <Download className="mr-2 h-4 w-4" />
              Export to CSV
            </Button>
            <Button
              variant="outline"
              className="justify-start border-orange-200 hover:bg-orange-50 w-full bg-white text-black"
              onClick={onExportGoogleSheets}
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              Open in Google Sheets
            </Button>
          </div>

          {/* Management Actions */}
          <div className="space-y-2 pt-2 border-t border-orange-200">
            <h4 className="text-sm font-medium text-gray-600">Class Management</h4>
            {onAddStudent ? (
              <AddStudentDialog
                onStudentAdded={onAddStudent}
                existingRollNumbers={existingRollNumbers}
                trigger={
                  <Button
                    variant="outline"
                    className="justify-start border-orange-200 hover:bg-orange-50 w-full bg-white text-black"
                  >
                    <UserPlus className="mr-2 h-4 w-4" />
                    Add Student
                  </Button>
                }
              />
            ) : (
              <Button
                variant="outline"
                className="justify-start border-orange-200 hover:bg-orange-50 w-full bg-white text-black"
                onClick={() => alert("Add student feature coming soon!")}
              >
                <UserPlus className="mr-2 h-4 w-4" />
                Add Student
              </Button>
            )}
            <Button
              variant="outline"
              className="justify-start border-orange-200 hover:bg-orange-50 w-full bg-white text-black"
              onClick={handleScheduleReminder}
            >
              <Bell className="mr-2 h-4 w-4" />
              Schedule Reminder
            </Button>
          </div>

          {/* Analytics Actions */}
          <div className="space-y-2 pt-2 border-t border-orange-200">
            <h4 className="text-sm font-medium text-gray-600">Reports & Analytics</h4>
            <Button
              variant="outline"
              className="justify-start border-orange-200 hover:bg-orange-50 w-full bg-white text-black"
              onClick={handleGenerateReport}
            >
              <FileText className="mr-2 h-4 w-4" />
              Generate Report
            </Button>
            <Button
              variant="outline"
              className="justify-start border-orange-200 hover:bg-orange-50 w-full bg-white text-black"
              onClick={handleViewAnalytics}
            >
              <BarChart3 className="mr-2 h-4 w-4" />
              View Analytics
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
