"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { AuthService } from "@/lib/auth"
import { AuthDialog } from "@/components/auth-dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { GraduationCap } from "lucide-react"

interface AuthWrapperProps {
  children: React.ReactNode
}

export function AuthWrapper({ children }: AuthWrapperProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check authentication status on mount
    const checkAuth = () => {
      const authState = AuthService.getAuthState()
      setIsAuthenticated(authState.isAuthenticated)
      setIsLoading(false)
    }

    checkAuth()
  }, [])

  const handleAuthSuccess = () => {
    setIsAuthenticated(true)
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

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <GraduationCap className="h-8 w-8 text-primary" />
              <h1 className="text-2xl font-bold">SmartPresent</h1>
            </div>
            <CardTitle>Welcome to SmartPresent</CardTitle>
            <p className="text-muted-foreground">Professional attendance management system for educators</p>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-sm text-muted-foreground mb-6">
              Please sign in to access your teacher dashboard and manage your classes.
            </p>
            <AuthDialog onAuthSuccess={handleAuthSuccess} />
          </CardContent>
        </Card>
      </div>
    )
  }

  return <>{children}</>
}
