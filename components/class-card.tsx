"use client"

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Users, Calendar } from "lucide-react"

type Props = {
  classData: {
    id: string
    name: string
    subject?: string
    students?: any[] // you can type this better later
    createdAt?: string // mapped from created_at
  }
  onSelect: (id: string) => void
}

export function ClassCard({ classData, onSelect }: Props) {
  return (
    <Card
      className="dashboard-card cursor-pointer hover:shadow-lg transition"
      onClick={() => onSelect(classData.id)}
    >
      <CardHeader>
        <CardTitle className="text-lg font-bold">{classData.name}</CardTitle>
        <p className="text-sm text-muted-foreground">{classData.subject || "No subject"}</p>
      </CardHeader>
      <CardContent className="space-y-2 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4" />
          <span>{classData.students?.length ?? 0} Students</span>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          <span>
            Created{" "}
            {classData.createdAt
              ? new Date(classData.createdAt).toLocaleDateString()
              : "N/A"}
          </span>
        </div>
      </CardContent>
    </Card>
  )
}
