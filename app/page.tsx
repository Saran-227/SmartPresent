"use client"


import { Badge } from "@/components/ui/badge"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { TeacherProfile } from "@/components/teacher-profile"
import { ClassCard } from "@/components/class-card"
import AddClassDialog from "@/components/add-class-dialog"
import { Search, Plus, GraduationCap } from "lucide-react"
import { LocalStorage } from "@/lib/storage"
import { supabase } from "@/lib/supabaseClient"
import type { Class } from "@/lib/types"

export default function HomePage() {
  const [classes, setClasses] = useState<Class[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  // Fetch classes from Supabase
  useEffect(() => {
    const fetchClasses = async () => {
      setIsLoading(true)
      const { data, error } = await supabase.from("classes").select("*")

      if (error) {
        console.error("Error fetching classes:", error.message)
      } else if (data) {
        const mapped = data.map((cls: any) => ({
          ...cls,
          createdAt: cls.created_at, // map snake_case → camelCase
          students: cls.students || [], // fallback for now
        }))
        setClasses(mapped)
        LocalStorage.saveClasses(mapped) // cache for offline
      }

      setIsLoading(false)
    }

    fetchClasses()
  }, [])

  const filteredClasses = classes.filter(
    (cls) =>
      cls.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (cls.subject?.toLowerCase() || "").includes(searchTerm.toLowerCase())
  )

  const handleClassSelect = (classId: string) => {
    router.push(`/class/${classId}`)
  }

  const handleClassAdded = (newClass: Class) => {
    setClasses((prev) => [...prev, newClass])
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading SmartPresent...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="dashboard-header sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <GraduationCap className="h-8 w-8 text-primary" />
                <h1 className="text-2xl font-bold text-foreground">SmartPresent</h1>
              </div>
              <Badge
                variant="secondary"
                className="bg-primary/10 text-primary border-primary/20 hidden sm:inline-flex"
              >
                Teacher Dashboard
              </Badge>
            </div>
            <TeacherProfile />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">
            Welcome back, {LocalStorage.getTeacher()?.name ? LocalStorage.getTeacher()!.name.split(" ")[0] : "Teacher"}

          </h2>

          <p className="text-muted-foreground text-lg">
            Manage your classes and track student attendance with ease.
          </p>
        </div>

        {/* Search + Actions */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search classes by name or subject..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-input border-border"
            />
          </div>
          <AddClassDialog onClassAdded={handleClassAdded} />
        </div>

        {/* Classes Grid */}
        {filteredClasses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredClasses.map((classData) => (
              <ClassCard
                key={classData.id}
                classData={classData}
                onSelect={handleClassSelect}
              />
            ))}
          </div>
        ) : (
          <Card className="dashboard-card text-center py-12">
            <CardContent>
              <GraduationCap className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <CardTitle className="text-xl mb-2">
                {searchTerm ? "No classes found" : "No classes yet"}
              </CardTitle>
              <p className="text-muted-foreground mb-6">
                {searchTerm
                  ? "Try adjusting your search terms."
                  : "Get started by creating your first class."}
              </p>
              {!searchTerm && (
                <AddClassDialog
                  onClassAdded={handleClassAdded}
                  trigger={
                    <Button className="professional-button">
                      <Plus className="mr-2 h-4 w-4" />
                      Create Your First Class
                    </Button>
                  }
                />
              )}
            </CardContent>
          </Card>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8">
          <Card className="dashboard-card">
            <CardContent className="p-6 text-center">
              <div className="text-2xl font-bold text-primary">{classes.length}</div>
              <div className="text-sm text-muted-foreground">Total Classes</div>
            </CardContent>
          </Card>
          <Card className="dashboard-card">
            <CardContent className="p-6 text-center">
              <div className="text-2xl font-bold text-primary">
                {classes.reduce((acc, cls) => acc + (cls.students?.length || 0), 0)}
              </div>
              <div className="text-sm text-muted-foreground">Total Students</div>
            </CardContent>
          </Card>
          <Card className="dashboard-card">
            <CardContent className="p-6 text-center">
              <div className="text-2xl font-bold text-primary">0</div>
              <div className="text-sm text-muted-foreground">Sessions Today</div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
