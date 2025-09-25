"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { User, Settings, LogOut, Edit, Mail, Award as IdCard, Calendar, Award } from "lucide-react"
import { LocalStorage } from "@/lib/storage"
import { AuthService } from "@/lib/auth"

export function TeacherProfile() {
  const [teacher, setTeacher] = useState(() => {
    const authUser = AuthService.getCurrentUser()
    if (authUser) {
      return {
        name: authUser.name,
        email: authUser.email,
        employeeId: authUser.collegeUID,
      }
    }
    return LocalStorage.getTeacher()
  })

  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState({
    name: teacher?.name || "",
    email: teacher?.email || "",
    employeeId: teacher?.employeeId || "",
  })

  const getInitials = (name: string) => {
    if (!name) return "T"
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
  }

  const handleSaveProfile = () => {
    try {
      if (!editForm.name.trim() || !editForm.email.trim()) {
        console.log("[v0] Validation failed: Name and email are required")
        return
      }

      const updatedTeacher = {
        ...teacher,
        name: editForm.name.trim(),
        email: editForm.email.trim(),
        employeeId: editForm.employeeId.trim(),
      }

      setTeacher(updatedTeacher)
      setIsEditing(false)

      LocalStorage.saveTeacher(updatedTeacher)
      console.log("[v0] Profile updated successfully")
    } catch (error) {
      console.error("[v0] Error saving profile:", error)
    }
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
    setEditForm({
      name: teacher?.name || "",
      email: teacher?.email || "",
      employeeId: teacher?.employeeId || "",
    })
  }

  const handleInputChange = (field: string, value: string) => {
    setEditForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleLogout = () => {
    AuthService.logout()
    window.location.reload()
  }

  const ProfileDialog = () => (
    <Dialog>
      <DialogTrigger asChild>
        <DropdownMenuItem className="cursor-pointer" onSelect={(e) => e.preventDefault()}>
          <User className="mr-2 h-4 w-4" />
          <span>View Profile</span>
        </DropdownMenuItem>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            Teacher Profile
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          {/* Profile Header */}
          <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
            <Avatar className="h-16 w-16 border-2 border-primary/20">
              <AvatarFallback className="bg-primary text-primary-foreground font-bold text-lg">
                {getInitials(teacher?.name || "")}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h3 className="font-semibold text-lg">{teacher?.name || "Teacher"}</h3>
              <p className="text-sm text-muted-foreground">{teacher?.email || "No email"}</p>
              <Badge variant="secondary" className="mt-1 bg-primary/10 text-primary border-primary/20">
                Active Teacher
              </Badge>
            </div>
          </div>

          {/* Profile Details */}
          {isEditing ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Full Name *</Label>
                <Input
                  id="edit-name"
                  value={editForm.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  className="bg-input border-border"
                  placeholder="Enter your full name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-email">Email Address *</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={editForm.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  className="bg-input border-border"
                  placeholder="Enter your email"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-id">Employee ID</Label>
                <Input
                  id="edit-id"
                  value={editForm.employeeId}
                  onChange={(e) => handleInputChange("employeeId", e.target.value)}
                  className="bg-input border-border"
                  placeholder="Enter your employee ID"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={handleSaveProfile}
                  className="flex-1 professional-button"
                  disabled={!editForm.name.trim() || !editForm.email.trim()}
                >
                  Save Changes
                </Button>
                <Button variant="outline" onClick={handleCancelEdit} className="flex-1 bg-transparent">
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="text-sm font-medium">Email</div>
                    <div className="text-sm text-muted-foreground">{teacher?.email || "Not set"}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                  <IdCard className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="text-sm font-medium">College UID</div>
                    <div className="text-sm text-muted-foreground">{teacher?.employeeId || "Not set"}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="text-sm font-medium">Member Since</div>
                    <div className="text-sm text-muted-foreground">January 2024</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                  <Award className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="text-sm font-medium">Department</div>
                    <div className="text-sm text-muted-foreground">Mathematics & Science</div>
                  </div>
                </div>
              </div>
              <Button onClick={() => setIsEditing(true)} className="w-full" variant="outline">
                <Edit className="mr-2 h-4 w-4" />
                Edit Profile
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full hover:bg-secondary">
          <Avatar className="h-10 w-10 border-2 border-primary/20">
            <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
              {getInitials(teacher?.name || "")}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-64" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{teacher?.name || "Teacher"}</p>
            <p className="text-xs leading-none text-muted-foreground">{teacher?.email || "No email"}</p>
            <p className="text-xs leading-none text-muted-foreground">UID: {teacher?.employeeId || "Not set"}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <ProfileDialog />
        <DropdownMenuItem className="cursor-pointer">
          <Settings className="mr-2 h-4 w-4" />
          <span>Preferences</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="cursor-pointer text-destructive focus:text-destructive" onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>Sign Out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
